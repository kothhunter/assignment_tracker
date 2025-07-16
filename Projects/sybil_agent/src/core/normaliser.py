# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: 2024 Projected Journal

"""
Data normalization utilities for the Projected Journal package.

This module handles the normalization of the AP Cash Grid data which has a 
flexible schema requiring auto-detection and standardization.
"""

import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional, Literal
from datetime import date
from decimal import Decimal
import re

from .errors import SchemaError, Error, UnsupportedGridFormat
from .models import APGridEvent


def normalise_cash_grid(df_raw: pd.DataFrame, sheet_name: str = None) -> pd.DataFrame:
    """
    Normalize AP Cash Grid data from flexible schema to canonical format.
    
    Converts any AP/AR grid format into a canonical table with columns:
    - txn_type: enum {"AP","AR"} 
    - counterparty: str (customer/vendor name; "Unknown" if missing)
    - scheduled_date: date (when cash is expected to move)
    - amount: Decimal (positive numbers only)
    - line_source: str (original column/row reference for debugging)
    
    Args:
        df_raw: Raw DataFrame from AP Cash Grid workbook
        sheet_name: Optional sheet/tab name for txn_type inference
        
    Returns:
        Normalized DataFrame with canonical columns
        
    Raises:
        UnsupportedGridFormat: If grid format cannot be auto-detected
        SchemaError: If required data cannot be extracted
    """
    
    if df_raw.empty:
        raise SchemaError("Cannot normalize empty AP Cash Grid")
    
    # Step 1: Detect layout
    layout_type = _detect_grid_layout(df_raw)
    
    # Step 2: Process based on layout type
    if layout_type == "longwave":
        df_normalized = _process_longwave_grid(df_raw)
    elif layout_type == "simple_list":
        df_normalized = _process_simple_list(df_raw)
    else:
        raise UnsupportedGridFormat(f"Unsupported grid layout: {layout_type}")
    
    # Step 3: Infer transaction type
    df_normalized['txn_type'] = _infer_transaction_type(df_normalized, sheet_name)
    
    # Step 4: Normalize sign (make all amounts positive)
    df_normalized['amount'] = df_normalized['amount'].abs()
    
    # Step 5: Clean up data
    df_normalized = _cleanup_normalized_data(df_normalized)
    
    return df_normalized


def _detect_grid_layout(df: pd.DataFrame) -> str:
    """
    Detect the layout type of the AP/AR grid.
    
    Args:
        df: Raw DataFrame to analyze
        
    Returns:
        Layout type: "longwave", "simple_list", or "unknown"
    """
    # Count numeric columns
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    
    # Check for exactly 13 numeric columns (longwave pattern)
    if len(numeric_cols) == 13:
        return "longwave"
    
    # Check for simple list pattern (Date + Amount columns)
    date_cols = _find_date_columns(df)
    amount_cols = _find_amount_columns(df)
    
    if len(date_cols) >= 1 and len(amount_cols) >= 1:
        return "simple_list"
    
    return "unknown"


def _find_date_columns(df: pd.DataFrame) -> List[str]:
    """Find columns that likely contain dates."""
    date_patterns = [
        r'date', r'due', r'schedule', r'payment_date', r'cash_date',
        r'invoice_date', r'bill_date', r'txn_date', r'transaction_date'
    ]
    
    date_cols = []
    for col in df.columns:
        col_lower = str(col).lower()
        # First check name patterns
        if any(re.search(pattern, col_lower) for pattern in date_patterns):
            date_cols.append(col)
        # Only check for date-like values if name suggests it's a date
        elif 'date' in col_lower and _column_contains_dates(df[col]):
            date_cols.append(col)
    
    return date_cols


def _find_amount_columns(df: pd.DataFrame) -> List[str]:
    """Find columns that likely contain monetary amounts."""
    amount_patterns = [
        r'amount', r'value', r'total', r'sum', r'balance',
        r'cash', r'dollar', r'usd', r'price'
    ]
    
    # Exclude date-like columns
    date_exclusion_patterns = [r'date', r'time', r'day', r'month', r'year']
    
    amount_cols = []
    for col in df.columns:
        col_lower = str(col).lower()
        
        # Skip if it looks like a date column
        if any(re.search(pattern, col_lower) for pattern in date_exclusion_patterns):
            continue
            
        if any(re.search(pattern, col_lower) for pattern in amount_patterns):
            amount_cols.append(col)
        # Also check if column is numeric
        elif pd.api.types.is_numeric_dtype(df[col]):
            amount_cols.append(col)
    
    return amount_cols


def _column_contains_dates(series: pd.Series) -> bool:
    """Check if a series contains date-like values."""
    try:
        # Try to convert a sample to dates
        sample = series.dropna().head(10)
        if len(sample) == 0:
            return False
        
        pd.to_datetime(sample, errors='raise')
        return True
    except:
        return False


def _process_longwave_grid(df: pd.DataFrame) -> pd.DataFrame:
    """
    Process long-wave grid format (13 numeric columns representing time periods).
    
    Args:
        df: DataFrame with longwave layout
        
    Returns:
        Normalized DataFrame with canonical columns
    """
    # Identify the counterparty column (usually first non-numeric column)
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    non_numeric_cols = [col for col in df.columns if col not in numeric_cols]
    
    if not non_numeric_cols:
        raise UnsupportedGridFormat("Longwave grid must have at least one text column for counterparty")
    
    counterparty_col = non_numeric_cols[0]
    
    # Melt the numeric columns into rows
    id_vars = [counterparty_col]
    value_vars = numeric_cols[:13]  # Take first 13 numeric columns
    
    df_melted = df.melt(
        id_vars=id_vars,
        value_vars=value_vars,
        var_name='period_column',
        value_name='amount'
    )
    
    # Remove zero/null amounts
    df_melted = df_melted[df_melted['amount'].notna()]
    df_melted = df_melted[df_melted['amount'] != 0]
    
    # Convert period columns to dates (assume weekly periods starting from today)
    base_date = pd.Timestamp.now().date()
    period_mapping = {col: base_date + pd.Timedelta(weeks=i) 
                     for i, col in enumerate(value_vars)}
    
    df_melted['scheduled_date'] = df_melted['period_column'].map(period_mapping)
    
    # Create line source for debugging
    df_melted['line_source'] = (
        df_melted.index.astype(str) + ':' + 
        df_melted['period_column'].astype(str)
    )
    
    # Rename and select final columns
    result = df_melted.rename(columns={counterparty_col: 'counterparty'})
    result = result[['counterparty', 'scheduled_date', 'amount', 'line_source']].copy()
    
    return result


def _process_simple_list(df: pd.DataFrame) -> pd.DataFrame:
    """
    Process simple list format (Date + Amount columns).
    
    Args:
        df: DataFrame with simple list layout
        
    Returns:
        Normalized DataFrame with canonical columns
    """
    date_cols = _find_date_columns(df)
    amount_cols = _find_amount_columns(df)
    
    if not date_cols:
        raise UnsupportedGridFormat("Simple list format requires at least one date column")
    if not amount_cols:
        raise UnsupportedGridFormat("Simple list format requires at least one amount column")
    
    # Use first date and amount columns
    date_col = date_cols[0]
    amount_col = amount_cols[0]
    
    # Find counterparty column (description, vendor, customer, etc.)
    counterparty_patterns = [
        r'vendor', r'customer', r'counterparty', r'party',
        r'description', r'memo', r'details', r'name', r'company'
    ]
    
    counterparty_col = None
    for col in df.columns:
        col_lower = str(col).lower().replace('_', ' ')  # Handle underscores
        if any(re.search(pattern, col_lower) for pattern in counterparty_patterns):
            counterparty_col = col
            break
    
    # Create result DataFrame
    result = pd.DataFrame()
    result['scheduled_date'] = pd.to_datetime(df[date_col]).dt.date
    result['amount'] = pd.to_numeric(df[amount_col], errors='coerce')
    
    if counterparty_col:
        result['counterparty'] = df[counterparty_col].astype(str)
    else:
        result['counterparty'] = 'Unknown'
    
    # Create line source
    result['line_source'] = df.index.astype(str) + ':' + date_col + '+' + amount_col
    
    # Remove rows with missing data
    result = result.dropna(subset=['scheduled_date', 'amount'])
    result = result[result['amount'] != 0]
    
    return result


def _infer_transaction_type(df: pd.DataFrame, sheet_name: str = None) -> pd.Series:
    """
    Infer transaction type (AP or AR) from sheet name or amount signs.
    
    Args:
        df: DataFrame with amount column
        sheet_name: Optional sheet/tab name
        
    Returns:
        Series with transaction types
    """
    if sheet_name:
        sheet_lower = sheet_name.lower()
        if 'payable' in sheet_lower or 'ap' in sheet_lower:
            return pd.Series('AP', index=df.index)
        elif 'receivable' in sheet_lower or 'ar' in sheet_lower:
            return pd.Series('AR', index=df.index)
    
    # Fallback: use amount signs
    # Positive amounts = AR (money coming in)
    # Negative amounts = AP (money going out)
    return df['amount'].apply(lambda x: 'AR' if x >= 0 else 'AP')


def _cleanup_normalized_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Clean up and finalize normalized data.
    
    Args:
        df: DataFrame to clean
        
    Returns:
        Cleaned DataFrame
    """
    df = df.copy()
    
    # Fill missing counterparty with "Unknown"
    df['counterparty'] = df['counterparty'].fillna('Unknown')
    df.loc[df['counterparty'] == '', 'counterparty'] = 'Unknown'
    
    # Remove rows with zero amounts
    df = df[df['amount'] != 0]
    
    # Convert amount to Decimal
    df['amount'] = df['amount'].apply(lambda x: Decimal(str(x)).quantize(Decimal('0.01')))
    
    # Ensure required columns are present
    required_cols = ['txn_type', 'counterparty', 'scheduled_date', 'amount', 'line_source']
    missing_cols = set(required_cols) - set(df.columns)
    if missing_cols:
        raise SchemaError(f"Missing required columns after normalization: {missing_cols}")
    
    return df[required_cols]


def auto_detect_columns(df: pd.DataFrame) -> Dict[str, str]:
    """
    Auto-detect column mappings for flexible AP Cash Grid schema.
    
    Args:
        df: Raw DataFrame to analyze
        
    Returns:
        Dictionary mapping standard field names to detected column names
        
    TODO: Implement column detection logic:
    - Use fuzzy matching and pattern recognition
    - Look for common column name variations
    - Analyze data types and content patterns
    - Return mapping like: {'date': 'Transaction Date', 'amount': 'Amount', ...}
    """
    column_mapping = {}
    
    # TODO: Implement auto-detection algorithm
    
    return column_mapping


def infer_dc_flag(df: pd.DataFrame, amount_col: str) -> pd.Series:
    """
    Infer DCFlag values when not explicitly provided.
    
    Args:
        df: DataFrame containing amount data
        amount_col: Name of the amount column
        
    Returns:
        Series of 'D' or 'C' values
        
    Raises:
        SchemaError: If DCFlag cannot be reliably inferred
        
    TODO: Implement DCFlag inference logic:
    - Check for negative amounts (typically Credits)
    - Look for contextual clues in description fields
    - Apply business logic based on transaction types
    - Validate inference confidence before returning
    """
    
    # TODO: Implement inference algorithm
    # For now, raise error to indicate manual DCFlag is required
    raise SchemaError("DCFlag inference not yet implemented - DCFlag column is required")


def validate_normalized_data(df: pd.DataFrame) -> List[Error]:
    """
    Validate normalized cash grid data meets requirements.
    
    Args:
        df: Normalized DataFrame to validate
        
    Returns:
        List of validation errors (empty if valid)
    """
    errors = []
    
    # TODO: Implement validation checks:
    # - All required columns present
    # - Date values are valid dates
    # - Amount values are positive decimals
    # - DCFlag values are exactly 'D' or 'C'
    # - No missing values in required fields
    
    return errors 