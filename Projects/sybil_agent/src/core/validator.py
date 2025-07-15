# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: 2024 Projected Journal

"""
Validation utilities for the Projected Journal package.

This module provides comprehensive validation for all workbook data including
schema validation, mapping coverage checks, and business rule validation.
"""

from typing import List, Set, Dict
from decimal import Decimal

from .errors import Error, SchemaError, MappingConflict
from .models import DataBundle, COLUMNS_17_FIXED_SCHEMA, MANDATORY_CURRENCY


def validate_all(bundle: DataBundle) -> List[Error]:
    """
    Perform comprehensive validation on all loaded workbook data.
    
    Args:
        bundle: DataBundle containing all workbook data
        
    Returns:
        List of Error objects (empty if all validation passes)
        
    Raises:
        SchemaError: For critical schema violations
        MappingConflict: For mapping coverage issues
    """
    errors = []
    
    # Validate individual workbook schemas
    errors.extend(validate_beginning_bs_schema(bundle.beginning_bs))
    errors.extend(validate_gaap_mapping_schema(bundle.gaap_mapping))
    errors.extend(validate_cashflow_mapping_schema(bundle.cashflow_mapping))
    errors.extend(validate_ap_grid_schema(bundle.ap_grid_events))
    
    # Validate business rules
    errors.extend(validate_balance_sheet_balanced(bundle.beginning_bs))
    errors.extend(validate_mapping_coverage(bundle))
    errors.extend(validate_currency_consistency(bundle))
    
    return errors


def validate_beginning_bs_schema(beginning_bs: List) -> List[Error]:
    """
    Validate Beginning Balance Sheet schema and business rules.
    
    Args:
        beginning_bs: List of BeginningBS objects
        
    Returns:
        List of validation errors
    """
    errors = []
    
    # TODO: Implement Beginning BS validation:
    # - Check all required columns present
    # - Validate account codes format
    # - Ensure balance precision (Decimal 18,2)
    # - Validate account types (Asset, Liability, Equity)
    
    return errors


def validate_gaap_mapping_schema(gaap_mapping: List) -> List[Error]:
    """
    Validate GAAP Mapping schema.
    
    Args:
        gaap_mapping: List of GAAPMapping objects
        
    Returns:
        List of validation errors
    """
    errors = []
    
    # TODO: Implement GAAP mapping validation:
    # - Check all required columns present
    # - Validate normal_balance values ('D' or 'C')
    # - Check for duplicate account mappings
    # - Validate account type classifications
    
    return errors


def validate_cashflow_mapping_schema(cashflow_mapping: List) -> List[Error]:
    """
    Validate Cashflow Mapping schema.
    
    Args:
        cashflow_mapping: List of CashflowMapping objects
        
    Returns:
        List of validation errors
    """
    errors = []
    
    # TODO: Implement Cashflow mapping validation:
    # - Check all required columns present
    # - Validate cash flow section names
    # - Check for duplicate mappings
    # - Ensure all GAAP accounts have cash flow mappings
    
    return errors


def validate_ap_grid_schema(ap_grid_events: List) -> List[Error]:
    """
    Validate AP Grid Events schema.
    
    Args:
        ap_grid_events: List of APGridEvent objects
        
    Returns:
        List of validation errors
    """
    errors = []
    
    if not ap_grid_events:
        errors.append(Error(
            file="AP Cash Grid.xlsx",
            row=None,
            issue="No AP grid events found",
            hint="Ensure the AP Cash Grid workbook contains transaction data"
        ))
        return errors
    
    # TODO: Implement AP grid validation:
    # - Validate DCFlag values ('D' or 'C' case sensitive)
    # - Check amount precision (Decimal 18,2) and positive values
    # - Validate date formats
    # - Check required fields presence
    
    return errors


def validate_balance_sheet_balanced(beginning_bs: List) -> List[Error]:
    """
    Validate that the Beginning Balance Sheet is balanced.
    Assets = Liabilities + Equity
    
    Args:
        beginning_bs: List of BeginningBS objects
        
    Returns:
        List of validation errors
    """
    errors = []
    
    if not beginning_bs:
        return errors
    
    # TODO: Implement balance sheet validation:
    # - Calculate total assets
    # - Calculate total liabilities
    # - Calculate total equity  
    # - Verify Assets = Liabilities + Equity
    # - Add error if imbalanced with specific amounts
    
    return errors


def validate_mapping_coverage(bundle: DataBundle) -> List[Error]:
    """
    Validate that all GL accounts can be mapped to both GAAP and Cash-Flow buckets.
    
    Args:
        bundle: DataBundle containing all workbook data
        
    Returns:
        List of validation errors
    """
    errors = []
    
    # TODO: Implement mapping coverage validation:
    # - Extract all GAAP accounts from AP grid and Beginning BS
    # - Check each account exists in GAAP Mapping
    # - Check each account exists in Cashflow Mapping
    # - Add specific errors for missing mappings with hints
    
    return errors


def validate_currency_consistency(bundle: DataBundle) -> List[Error]:
    """
    Validate that all monetary values use the mandatory USD currency.
    
    Args:
        bundle: DataBundle containing all workbook data
        
    Returns:
        List of validation errors
    """
    errors = []
    
    # TODO: Implement currency validation:
    # - Check all amounts are in USD
    # - Validate no multi-currency data present
    # - Add errors for any non-USD values found
    
    return errors


def validate_dcflag_values(dc_flags: List[str]) -> List[Error]:
    """
    Validate DCFlag values are exactly 'D' or 'C' (case sensitive).
    
    Args:
        dc_flags: List of DCFlag string values
        
    Returns:
        List of validation errors
    """
    errors = []
    
    for i, dc_flag in enumerate(dc_flags):
        if dc_flag not in ['D', 'C']:
            errors.append(Error(
                file="AP Cash Grid.xlsx",
                row=i + 2,  # Assuming header row + 1-based indexing
                issue=f"Invalid DCFlag value: '{dc_flag}'",
                hint="DCFlag must be exactly 'D' or 'C' (case sensitive)"
            ))
    
    return errors


def validate_amount_precision(amounts: List[Decimal]) -> List[Error]:
    """
    Validate amounts have correct precision (Decimal 18,2) and are positive.
    
    Args:
        amounts: List of Decimal amount values
        
    Returns:
        List of validation errors
    """
    errors = []
    
    for i, amount in enumerate(amounts):
        # Check precision (max 2 decimal places)
        if amount.as_tuple().exponent < -2:
            errors.append(Error(
                file="AP Cash Grid.xlsx", 
                row=i + 2,
                issue=f"Amount has too many decimal places: {amount}",
                hint="Amounts must have maximum 2 decimal places"
            ))
        
        # Check positive value
        if amount <= 0:
            errors.append(Error(
                file="AP Cash Grid.xlsx",
                row=i + 2, 
                issue=f"Amount must be positive: {amount}",
                hint="All amounts must be positive; sign is inferred from DCFlag"
            ))
    
    return errors


def validate_required_columns(columns: List[str], required: List[str], file_name: str) -> List[Error]:
    """
    Validate that all required columns are present in the workbook.
    
    Args:
        columns: List of actual column names found
        required: List of required column names
        file_name: Name of the file being validated
        
    Returns:
        List of validation errors
    """
    errors = []
    missing_columns = set(required) - set(columns)
    
    for missing_col in missing_columns:
        errors.append(Error(
            file=file_name,
            row=1,  # Header row
            issue=f"Required column missing: '{missing_col}'",
            hint=f"Add '{missing_col}' column to the workbook header"
        ))
    
    return errors 