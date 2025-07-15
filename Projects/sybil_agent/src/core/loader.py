# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: 2024 Projected Journal

"""
Workbook loading utilities for the Projected Journal package.

This module provides functions to load and parse the four input workbooks:
- Beginning Balance Sheet (fixed schema)
- GAAP Mapping (fixed schema)  
- Cashflow Mapping (fixed schema)
- AP Cash Grid (flexible schema - auto-detection required)
"""

import pandas as pd
from typing import Dict, Any, List
from pathlib import Path

from .errors import SchemaError, Error
from .models import DataBundle, BeginningBS, GAAPMapping, CashflowMapping, APGridEvent


def load_workbook(path: str, sheet_name: str = None) -> pd.DataFrame:
    """
    Load an Excel workbook and return as DataFrame.
    
    Args:
        path: Path to the Excel file
        sheet_name: Optional sheet name (defaults to first sheet)
        
    Returns:
        pandas DataFrame containing the workbook data
        
    Raises:
        SchemaError: If file cannot be read or is empty
    """
    try:
        file_path = Path(path)
        if not file_path.exists():
            raise SchemaError(f"File not found: {path}")
            
        # Load the Excel file
        if sheet_name:
            df = pd.read_excel(path, sheet_name=sheet_name)
        else:
            df = pd.read_excel(path)
            
        if df.empty:
            raise SchemaError(f"Empty workbook: {path}")
            
        return df
        
    except Exception as e:
        if isinstance(e, SchemaError):
            raise
        raise SchemaError(f"Failed to load workbook {path}: {str(e)}")


def load_beginning_bs(path: str) -> List[BeginningBS]:
    """
    Load Beginning Balance Sheet workbook.
    
    Args:
        path: Path to Beginning BS.xlsx
        
    Returns:
        List of BeginningBS objects
        
    Raises:
        SchemaError: If schema validation fails
    """
    df = load_workbook(path)
    
    # TODO: Validate required columns are present
    # TODO: Parse and validate data according to BeginningBS schema
    # TODO: Check that Balance Sheet is balanced (Assets = Liabilities + Equity)
    
    # Placeholder implementation
    return []


def load_gaap_mapping(path: str) -> List[GAAPMapping]:
    """
    Load GAAP Mapping workbook.
    
    Args:
        path: Path to GAAP Mapping.xlsx
        
    Returns:
        List of GAAPMapping objects
        
    Raises:
        SchemaError: If schema validation fails
    """
    df = load_workbook(path)
    
    # TODO: Validate required columns are present
    # TODO: Parse and validate data according to GAAPMapping schema
    
    # Placeholder implementation
    return []


def load_cashflow_mapping(path: str) -> List[CashflowMapping]:
    """
    Load Cashflow Mapping workbook.
    
    Args:
        path: Path to Cashflow Mapping.xlsx
        
    Returns:
        List of CashflowMapping objects
        
    Raises:
        SchemaError: If schema validation fails
    """
    df = load_workbook(path)
    
    # TODO: Validate required columns are present
    # TODO: Parse and validate data according to CashflowMapping schema
    
    # Placeholder implementation
    return []


def load_ap_cash_grid(path: str) -> List[APGridEvent]:
    """
    Load AP Cash Grid workbook with flexible schema auto-detection.
    
    Args:
        path: Path to AP Cash Grid.xlsx
        
    Returns:
        List of APGridEvent objects
        
    Raises:
        SchemaError: If auto-detection fails or required fields missing
    """
    df = load_workbook(path)
    
    # TODO: Auto-detect column mapping for flexible schema
    # TODO: Must identify at minimum: date, description, amount, DCFlag columns
    # TODO: Parse and validate data according to APGridEvent schema
    # TODO: Apply normalization rules from cash-grid-normaliser
    
    # Placeholder implementation
    return []


def load_all_workbooks(bs_path: str, gaap_path: str, cf_path: str, ap_path: str) -> DataBundle:
    """
    Load all four workbooks and return as DataBundle.
    
    Args:
        bs_path: Path to Beginning BS.xlsx
        gaap_path: Path to GAAP Mapping.xlsx
        cf_path: Path to Cashflow Mapping.xlsx
        ap_path: Path to AP Cash Grid.xlsx
        
    Returns:
        DataBundle containing all loaded data
        
    Raises:
        SchemaError: If any workbook fails to load or validate
    """
    try:
        beginning_bs = load_beginning_bs(bs_path)
        gaap_mapping = load_gaap_mapping(gaap_path)
        cashflow_mapping = load_cashflow_mapping(cf_path)
        ap_grid_events = load_ap_cash_grid(ap_path)
        
        return DataBundle(
            beginning_bs=beginning_bs,
            gaap_mapping=gaap_mapping,
            cashflow_mapping=cashflow_mapping,
            ap_grid_events=ap_grid_events
        )
        
    except Exception as e:
        if isinstance(e, SchemaError):
            raise
        raise SchemaError(f"Failed to load workbooks: {str(e)}") 