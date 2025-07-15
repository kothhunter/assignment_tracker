# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: 2024 Projected Journal

"""
Pydantic models for workbook schemas and data validation.

This module defines the data models for the four input workbooks used in the
Projected Journal generation process.
"""

from typing import Optional, Literal, List
from decimal import Decimal
from datetime import datetime, date
from pydantic import BaseModel, Field, field_validator, ConfigDict


# Constants from validation rules
COLUMNS_17_FIXED_SCHEMA = [
    "JournalID", "TxnID", "TxnDate", "CashDate",
    "DCFlag", "GAAPAccount", "CashFlowSection",
    "Department", "Product", "CustomerID", "VendorID",
    "Location", "Class", "Amount", "CurrencyCode",
    "CreatedAt", "UpdatedAt",
]

MANDATORY_CURRENCY = "USD"


class BeginningBS(BaseModel):
    """Beginning Balance Sheet entry model."""
    
    account: str = Field(..., description="GL Account code")
    description: str = Field(..., description="Account description")
    balance: Decimal = Field(..., description="Opening balance amount")
    account_type: Literal["Asset", "Liability", "Equity"] = Field(..., description="Account classification")
    
    @field_validator('balance')
    @classmethod
    def validate_balance_precision(cls, v):
        """Ensure balance has maximum 2 decimal places."""
        if v.as_tuple().exponent < -2:
            raise ValueError('Balance must have maximum 2 decimal places')
        return v


class GAAPMapping(BaseModel):
    """GAAP account mapping model."""
    
    gaap_account: str = Field(..., description="GAAP account code")
    description: str = Field(..., description="Account description")
    account_type: str = Field(..., description="Account type classification")
    normal_balance: Literal["D", "C"] = Field(..., description="Normal balance (Debit/Credit)")
    
    @field_validator('normal_balance')
    @classmethod
    def validate_normal_balance(cls, v):
        """Ensure normal balance is 'D' or 'C'."""
        if v not in ['D', 'C']:
            raise ValueError("Normal balance must be 'D' or 'C'")
        return v


class CashflowMapping(BaseModel):
    """Cash flow mapping model."""
    
    gaap_account: str = Field(..., description="GAAP account code")
    cash_flow_section: str = Field(..., description="Cash flow statement section")
    description: str = Field(..., description="Mapping description")


class APGridEvent(BaseModel):
    """Accounts Payable grid event model (flexible schema)."""
    
    # Core required fields that must be auto-detected
    transaction_date: date = Field(..., description="Transaction date")
    description: str = Field(..., description="Transaction description") 
    amount: Decimal = Field(..., gt=0, description="Transaction amount (positive)")
    dc_flag: Literal["D", "C"] = Field(..., description="Debit/Credit flag")
    
    # Optional fields that may be present
    vendor_id: Optional[str] = Field(None, description="Vendor identifier")
    department: Optional[str] = Field(None, description="Department code")
    location: Optional[str] = Field(None, description="Location code")
    reference: Optional[str] = Field(None, description="Reference number")
    
    @field_validator('amount')
    @classmethod
    def validate_amount_precision(cls, v):
        """Ensure amount has maximum 2 decimal places and is positive."""
        if v.as_tuple().exponent < -2:
            raise ValueError('Amount must have maximum 2 decimal places')
        return v
    
    @field_validator('dc_flag')
    @classmethod
    def validate_dc_flag(cls, v):
        """Ensure DCFlag is 'D' or 'C' (case sensitive)."""
        if v not in ['D', 'C']:
            raise ValueError("DCFlag must be 'D' or 'C' (case sensitive)")
        return v


class DataBundle(BaseModel):
    """Container for all loaded workbook data."""
    
    beginning_bs: List[BeginningBS]
    gaap_mapping: List[GAAPMapping]
    cashflow_mapping: List[CashflowMapping]
    ap_grid_events: List[APGridEvent]
    
    model_config = ConfigDict(arbitrary_types_allowed=True) 