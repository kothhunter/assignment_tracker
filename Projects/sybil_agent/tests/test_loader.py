# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: 2024 Projected Journal

"""
Unit tests for the loader module.

Tests the workbook loading and parsing functionality.
"""

import pytest
import pandas as pd
from pathlib import Path
import tempfile
import os

from src.core.loader import load_workbook, load_all_workbooks
from src.core.errors import SchemaError


class TestLoadWorkbook:
    """Test cases for load_workbook function."""
    
    def test_load_workbook_file_not_found(self):
        """Test that load_workbook raises SchemaError for non-existent file."""
        with pytest.raises(SchemaError, match="File not found"):
            load_workbook("non_existent_file.xlsx")
    
    def test_load_workbook_empty_file(self):
        """Test handling of empty workbook files."""
        # Create a temporary empty Excel file
        with tempfile.NamedTemporaryFile(suffix='.xlsx', delete=False) as temp_file:
            temp_path = temp_file.name
            
        try:
            # Create an empty Excel file
            empty_df = pd.DataFrame()
            empty_df.to_excel(temp_path, index=False)
            
            # Test that it raises SchemaError for empty workbook
            with pytest.raises(SchemaError, match="Empty workbook"):
                load_workbook(temp_path)
                
        finally:
            # Clean up
            if os.path.exists(temp_path):
                os.unlink(temp_path)
    
    def test_load_workbook_success(self):
        """Test successful loading of a valid workbook."""
        # Create a temporary Excel file with data
        with tempfile.NamedTemporaryFile(suffix='.xlsx', delete=False) as temp_file:
            temp_path = temp_file.name
            
        try:
            # Create a simple test DataFrame
            test_data = pd.DataFrame({
                'Column1': [1, 2, 3],
                'Column2': ['A', 'B', 'C']
            })
            test_data.to_excel(temp_path, index=False)
            
            # Test successful loading
            result_df = load_workbook(temp_path)
            
            # Verify the data was loaded correctly
            assert not result_df.empty
            assert len(result_df) == 3
            assert 'Column1' in result_df.columns
            assert 'Column2' in result_df.columns
            
        finally:
            # Clean up
            if os.path.exists(temp_path):
                os.unlink(temp_path)


class TestLoadAllWorkbooks:
    """Test cases for load_all_workbooks function."""
    
    def test_load_all_workbooks_missing_file(self):
        """Test that load_all_workbooks raises SchemaError when any file is missing."""
        with pytest.raises(SchemaError):
            load_all_workbooks(
                "non_existent_bs.xlsx",
                "non_existent_gaap.xlsx", 
                "non_existent_cf.xlsx",
                "non_existent_ap.xlsx"
            )
    
    def test_load_all_workbooks_placeholder(self):
        """Placeholder test for full workbook loading - will be implemented later."""
        # TODO: Create test Excel files with proper schemas
        # TODO: Test successful loading of all four workbooks
        # TODO: Verify DataBundle is created correctly
        pass 