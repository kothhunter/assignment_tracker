# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: 2024 Projected Journal

"""
Unit tests for the validator module.

Tests the validation functionality for workbook schemas and business rules.
"""

import pytest
from decimal import Decimal

from src.core.validator import validate_dcflag_values, validate_amount_precision, validate_required_columns
from src.core.errors import Error
from src.core.models import DataBundle


class TestValidateDCFlagValues:
    """Test cases for DCFlag validation."""
    
    def test_valid_dcflag_values(self):
        """Test that valid DCFlag values pass validation."""
        valid_flags = ['D', 'C', 'D', 'C']
        errors = validate_dcflag_values(valid_flags)
        assert len(errors) == 0
    
    def test_invalid_dcflag_values(self):
        """Test that invalid DCFlag values raise errors."""
        invalid_flags = ['d', 'c', 'X', '1', 'debit']
        errors = validate_dcflag_values(invalid_flags)
        
        # Should have one error for each invalid flag
        assert len(errors) == 5
        
        # Check first error details
        assert errors[0].file == "AP Cash Grid.xlsx"
        assert errors[0].row == 2  # First data row (header + 1)
        assert "Invalid DCFlag value: 'd'" in errors[0].issue
        assert "must be exactly 'D' or 'C'" in errors[0].hint
    
    def test_empty_dcflag_list(self):
        """Test validation of empty DCFlag list."""
        errors = validate_dcflag_values([])
        assert len(errors) == 0


class TestValidateAmountPrecision:
    """Test cases for amount precision validation."""
    
    def test_valid_amounts(self):
        """Test that valid amounts pass validation."""
        valid_amounts = [
            Decimal('100.00'),
            Decimal('50.5'),
            Decimal('1000'),
            Decimal('0.01')
        ]
        errors = validate_amount_precision(valid_amounts)
        assert len(errors) == 0
    
    def test_invalid_precision(self):
        """Test that amounts with too many decimal places raise errors."""
        invalid_amounts = [Decimal('100.123')]  # 3 decimal places
        errors = validate_amount_precision(invalid_amounts)
        
        assert len(errors) == 1
        assert "too many decimal places" in errors[0].issue
        assert "maximum 2 decimal places" in errors[0].hint
    
    def test_negative_amounts(self):
        """Test that negative amounts raise errors."""
        negative_amounts = [Decimal('-100.00'), Decimal('0')]
        errors = validate_amount_precision(negative_amounts)
        
        assert len(errors) == 2
        assert "must be positive" in errors[0].issue
        assert "must be positive" in errors[1].issue
    
    def test_mixed_valid_invalid_amounts(self):
        """Test validation with mix of valid and invalid amounts."""
        mixed_amounts = [
            Decimal('100.00'),    # Valid
            Decimal('-50.00'),    # Invalid (negative)
            Decimal('25.123'),    # Invalid (too many decimals)
            Decimal('75.50')      # Valid
        ]
        errors = validate_amount_precision(mixed_amounts)
        
        # Should have 2 errors (for the 2 invalid amounts)
        assert len(errors) == 2


class TestValidateRequiredColumns:
    """Test cases for required column validation."""
    
    def test_all_columns_present(self):
        """Test when all required columns are present."""
        actual_columns = ['Date', 'Description', 'Amount', 'DCFlag']
        required_columns = ['Date', 'Description', 'Amount', 'DCFlag']
        
        errors = validate_required_columns(actual_columns, required_columns, "test.xlsx")
        assert len(errors) == 0
    
    def test_missing_required_columns(self):
        """Test when required columns are missing."""
        actual_columns = ['Date', 'Amount']  # Missing Description and DCFlag
        required_columns = ['Date', 'Description', 'Amount', 'DCFlag']
        
        errors = validate_required_columns(actual_columns, required_columns, "test.xlsx")
        
        # Should have 2 errors for missing columns
        assert len(errors) == 2
        
        # Check that both missing columns are reported
        missing_columns = {error.issue.split("'")[1] for error in errors}
        assert 'Description' in missing_columns
        assert 'DCFlag' in missing_columns
        
        # Check error details
        assert all(error.file == "test.xlsx" for error in errors)
        assert all(error.row == 1 for error in errors)  # Header row
        assert all("Required column missing" in error.issue for error in errors)
    
    def test_extra_columns_allowed(self):
        """Test that extra columns beyond required ones are allowed."""
        actual_columns = ['Date', 'Description', 'Amount', 'DCFlag', 'ExtraColumn']
        required_columns = ['Date', 'Description', 'Amount', 'DCFlag']
        
        errors = validate_required_columns(actual_columns, required_columns, "test.xlsx")
        assert len(errors) == 0


class TestValidateAllPlaceholder:
    """Placeholder tests for comprehensive validation."""
    
    def test_validate_all_placeholder(self):
        """Placeholder test for validate_all function - will be implemented later."""
        # TODO: Create test DataBundle with sample data
        # TODO: Test validate_all with valid data (should return empty errors list)
        # TODO: Test validate_all with invalid data (should return specific errors)
        # TODO: Test schema validation for each workbook type
        # TODO: Test business rule validation (balanced BS, mapping coverage, etc.)
        pass 