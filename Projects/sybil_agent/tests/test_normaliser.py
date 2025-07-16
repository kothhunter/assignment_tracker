# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: 2024 Projected Journal

"""
Unit tests for the normaliser module.

Tests the cash grid normalization functionality including layout detection,
longwave processing, simple list processing, and transaction type inference.
"""

import pytest
import pandas as pd
import numpy as np
from datetime import date, timedelta
from decimal import Decimal

from src.core.normaliser import (
    normalise_cash_grid, 
    _detect_grid_layout,
    _find_date_columns,
    _find_amount_columns,
    _process_longwave_grid,
    _process_simple_list,
    _infer_transaction_type,
    _cleanup_normalized_data
)
from src.core.errors import UnsupportedGridFormat, SchemaError


class TestDetectGridLayout:
    """Test cases for grid layout detection."""
    
    def test_detect_longwave_layout(self):
        """Test detection of longwave grid with exactly 13 numeric columns."""
        # Create test data with 13 numeric columns + 1 text column
        data = {
            'Vendor': ['ABC Corp', 'DEF Inc', 'GHI Ltd'],
            **{f'Week_{i}': [100 * i, 200 * i, 300 * i] for i in range(1, 14)}
        }
        df = pd.DataFrame(data)
        
        layout = _detect_grid_layout(df)
        assert layout == "longwave"
    
    def test_detect_simple_list_layout(self):
        """Test detection of simple list format."""
        df = pd.DataFrame({
            'Date': ['2024-01-01', '2024-01-02', '2024-01-03'],
            'Vendor': ['ABC Corp', 'DEF Inc', 'GHI Ltd'],
            'Amount': [1000, 2000, 3000]
        })
        
        layout = _detect_grid_layout(df)
        assert layout == "simple_list"
    
    def test_detect_unknown_layout(self):
        """Test detection of unknown layout."""
        df = pd.DataFrame({
            'Random_Col1': ['A', 'B', 'C'],
            'Random_Col2': ['X', 'Y', 'Z']
        })
        
        layout = _detect_grid_layout(df)
        assert layout == "unknown"


class TestColumnDetection:
    """Test cases for column detection utilities."""
    
    def test_find_date_columns_by_name(self):
        """Test finding date columns by name patterns."""
        df = pd.DataFrame({
            'Payment_Date': ['2024-01-01', '2024-01-02'],
            'Due_Date': ['2024-01-15', '2024-01-16'],
            'Amount': [1000, 2000],
            'Description': ['Payment 1', 'Payment 2']
        })
        
        date_cols = _find_date_columns(df)
        assert 'Payment_Date' in date_cols
        assert 'Due_Date' in date_cols
        assert len(date_cols) >= 2
    
    def test_find_amount_columns_by_name(self):
        """Test finding amount columns by name patterns."""
        df = pd.DataFrame({
            'Date': ['2024-01-01', '2024-01-02'],
            'Amount': [1000, 2000],
            'Total_Value': [1500, 2500],
            'Description': ['Payment 1', 'Payment 2']
        })
        
        amount_cols = _find_amount_columns(df)
        assert 'Amount' in amount_cols
        assert 'Total_Value' in amount_cols
    
    def test_find_amount_columns_by_numeric_type(self):
        """Test finding amount columns by numeric data type."""
        df = pd.DataFrame({
            'Date': ['2024-01-01', '2024-01-02'],
            'NumericCol1': [1000, 2000],
            'NumericCol2': [1500.50, 2500.75],
            'Description': ['Payment 1', 'Payment 2']
        })
        
        amount_cols = _find_amount_columns(df)
        assert 'NumericCol1' in amount_cols
        assert 'NumericCol2' in amount_cols


class TestLongwaveProcessing:
    """Test cases for longwave grid processing."""
    
    def test_process_longwave_grid_basic(self):
        """Test basic longwave grid processing."""
        # Create test longwave data
        data = {
            'Vendor': ['ABC Corp', 'DEF Inc'],
            **{f'Week_{i}': [100 * i if i <= 3 else 0, 200 * i if i <= 2 else 0] 
               for i in range(1, 14)}
        }
        df = pd.DataFrame(data)
        
        result = _process_longwave_grid(df)
        
        # Check required columns are present
        required_cols = ['counterparty', 'scheduled_date', 'amount', 'line_source']
        assert all(col in result.columns for col in required_cols)
        
        # Check that zero amounts are filtered out
        assert all(result['amount'] != 0)
        
        # Check counterparty mapping
        assert 'ABC Corp' in result['counterparty'].values
        assert 'DEF Inc' in result['counterparty'].values
    
    def test_process_longwave_grid_no_text_column(self):
        """Test longwave processing fails without text column."""
        # Create data with only numeric columns
        data = {f'Week_{i}': [100 * i, 200 * i] for i in range(1, 14)}
        df = pd.DataFrame(data)
        
        with pytest.raises(UnsupportedGridFormat, match="text column for counterparty"):
            _process_longwave_grid(df)


class TestSimpleListProcessing:
    """Test cases for simple list processing."""
    
    def test_process_simple_list_basic(self):
        """Test basic simple list processing."""
        df = pd.DataFrame({
            'Payment_Date': ['2024-01-01', '2024-01-02', '2024-01-03'],
            'Vendor_Name': ['ABC Corp', 'DEF Inc', 'GHI Ltd'],
            'Amount_USD': [1000, -2000, 3000]
        })
        
        result = _process_simple_list(df)
        
        # Check required columns
        required_cols = ['counterparty', 'scheduled_date', 'amount', 'line_source']
        assert all(col in result.columns for col in required_cols)
        
        # Check data types
        assert all(isinstance(d, date) for d in result['scheduled_date'])
        assert all(pd.api.types.is_numeric_dtype(type(amt)) for amt in result['amount'])
        
        # Check counterparty mapping
        assert 'ABC Corp' in result['counterparty'].values
        assert 'DEF Inc' in result['counterparty'].values
    
    def test_process_simple_list_no_counterparty(self):
        """Test simple list processing without counterparty column."""
        df = pd.DataFrame({
            'Date': ['2024-01-01', '2024-01-02'],
            'Amount': [1000, 2000]
        })
        
        result = _process_simple_list(df)
        
        # Should default to 'Unknown'
        assert all(result['counterparty'] == 'Unknown')
    
    def test_process_simple_list_missing_date_column(self):
        """Test simple list processing fails without date column."""
        df = pd.DataFrame({
            'Description': ['Payment 1', 'Payment 2'],
            'Amount': [1000, 2000]
        })
        
        with pytest.raises(UnsupportedGridFormat, match="date column"):
            _process_simple_list(df)
    
    def test_process_simple_list_missing_amount_column(self):
        """Test simple list processing fails without amount column."""
        df = pd.DataFrame({
            'Date': ['2024-01-01', '2024-01-02'],
            'Description': ['Payment 1', 'Payment 2']
        })
        
        with pytest.raises(UnsupportedGridFormat, match="amount column"):
            _process_simple_list(df)


class TestTransactionTypeInference:
    """Test cases for transaction type inference."""
    
    def test_infer_type_from_sheet_name_ap(self):
        """Test inferring AP from sheet name."""
        df = pd.DataFrame({'amount': [1000, -2000, 3000]})
        
        result = _infer_transaction_type(df, "Accounts_Payable")
        assert all(result == 'AP')
        
        result = _infer_transaction_type(df, "AP_Schedule")
        assert all(result == 'AP')
    
    def test_infer_type_from_sheet_name_ar(self):
        """Test inferring AR from sheet name."""
        df = pd.DataFrame({'amount': [1000, -2000, 3000]})
        
        result = _infer_transaction_type(df, "Accounts_Receivable")
        assert all(result == 'AR')
        
        result = _infer_transaction_type(df, "AR_Aging")
        assert all(result == 'AR')
    
    def test_infer_type_from_amount_signs(self):
        """Test inferring type from amount signs."""
        df = pd.DataFrame({'amount': [1000, -2000, 3000, -500]})
        
        result = _infer_transaction_type(df)
        
        # Positive amounts should be AR, negative should be AP
        assert result.iloc[0] == 'AR'  # 1000
        assert result.iloc[1] == 'AP'  # -2000
        assert result.iloc[2] == 'AR'  # 3000
        assert result.iloc[3] == 'AP'  # -500


class TestDataCleanup:
    """Test cases for data cleanup functionality."""
    
    def test_cleanup_normalized_data(self):
        """Test cleanup of normalized data."""
        df = pd.DataFrame({
            'txn_type': ['AP', 'AR', 'AP'],
            'counterparty': ['ABC Corp', None, ''],
            'scheduled_date': [date(2024, 1, 1), date(2024, 1, 2), date(2024, 1, 3)],
            'amount': [1000.123, 0, 2500.67],
            'line_source': ['1:col1', '2:col2', '3:col3']
        })
        
        result = _cleanup_normalized_data(df)
        
        # Check zero amounts are removed
        assert len(result) == 2  # Should remove the zero amount row
        assert 0 not in result['amount'].values
        
        # Check counterparty cleanup on remaining rows
        # After filtering, we should have rows 0 and 2 (original indices)
        # Row 1 (with None counterparty) was removed due to zero amount
        assert result['counterparty'].iloc[0] == 'ABC Corp'  # Original row 0
        assert result['counterparty'].iloc[1] == 'Unknown'   # Original row 2 ('' -> Unknown)
        
        # Check amount conversion to Decimal
        assert all(isinstance(amt, Decimal) for amt in result['amount'])
        assert result['amount'].iloc[0] == Decimal('1000.12')  # Rounded to 2 decimals


class TestNormaliseCashGrid:
    """Test cases for the main normalise_cash_grid function."""
    
    def test_normalise_longwave_grid(self):
        """Test normalizing longwave grid format."""
        data = {
            'Vendor': ['ABC Corp', 'DEF Inc'],
            **{f'Week_{i}': [100 * i if i <= 3 else 0, 200 * i if i <= 2 else 0] 
               for i in range(1, 14)}
        }
        df = pd.DataFrame(data)
        
        result = normalise_cash_grid(df, sheet_name="AP_Schedule")
        
        # Check canonical columns
        expected_cols = {'txn_type', 'counterparty', 'scheduled_date', 'amount', 'line_source'}
        assert expected_cols.issubset(set(result.columns))
        
        # Check all amounts are positive
        assert all(result['amount'] > 0)
        
        # Check transaction type inference
        assert all(result['txn_type'] == 'AP')
    
    def test_normalise_simple_list(self):
        """Test normalizing simple list format."""
        df = pd.DataFrame({
            'Date': ['2024-01-01', '2024-01-02', '2024-01-03'],
            'Vendor': ['ABC Corp', 'DEF Inc', 'GHI Ltd'],
            'Amount': [1000, -2000, 3000]
        })
        
        result = normalise_cash_grid(df, sheet_name="AR_Aging")
        
        # Check canonical columns
        expected_cols = {'txn_type', 'counterparty', 'scheduled_date', 'amount', 'line_source'}
        assert expected_cols.issubset(set(result.columns))
        
        # Check all amounts are positive (signs normalized)
        assert all(result['amount'] > 0)
        
        # Check transaction type
        assert all(result['txn_type'] == 'AR')
    
    def test_normalise_empty_dataframe(self):
        """Test normalizing empty DataFrame raises error."""
        df = pd.DataFrame()
        
        with pytest.raises(SchemaError, match="empty AP Cash Grid"):
            normalise_cash_grid(df)
    
    def test_normalise_unsupported_format(self):
        """Test normalizing unsupported format raises error."""
        df = pd.DataFrame({
            'Random_Col1': ['A', 'B', 'C'],
            'Random_Col2': ['X', 'Y', 'Z']
        })
        
        with pytest.raises(UnsupportedGridFormat):
            normalise_cash_grid(df)
    
    def test_longwave_normalises(self):
        """Test that longwave format normalizes correctly (as specified in requirements)."""
        # Create a proper longwave test case
        data = {
            'Vendor': ['Supplier A', 'Supplier B', 'Supplier C'],
            **{f'Week_{i}': [1000 if i == 1 else 0, 2000 if i == 2 else 0, 3000 if i == 3 else 0] 
               for i in range(1, 14)}
        }
        df_raw = pd.DataFrame(data)
        
        df = normalise_cash_grid(df_raw, sheet_name="accounts_payable")
        
        # Check required columns are present
        assert {"txn_type", "scheduled_date", "amount"}.issubset(df.columns)
        
        # Check all amounts are positive
        assert df.amount.min() > 0
        
        # Check transaction types
        assert all(df['txn_type'] == 'AP')
        
        # Check we have the expected number of non-zero entries
        assert len(df) == 3  # One non-zero entry per vendor 