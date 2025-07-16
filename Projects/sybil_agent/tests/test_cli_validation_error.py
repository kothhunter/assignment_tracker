# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: 2024 Projected Journal

"""
CLI validation error tests.

Tests that the CLI properly handles validation errors and outputs correct JSON format.
"""

import pytest
import subprocess
import sys
import json
from pathlib import Path
import tempfile
import shutil
import pandas as pd
from datetime import datetime


class TestCLIValidationError:
    """Test cases for CLI validation error handling."""
    
    def setup_method(self):
        """Set up test fixtures with sample Excel files."""
        # Create temporary directory
        self.temp_dir = Path(tempfile.mkdtemp())
        self.data_dir = self.temp_dir / "data"
        self.out_dir = self.temp_dir / "out"
        self.data_dir.mkdir()
        self.out_dir.mkdir()
        
        # Create valid sample files
        self._create_valid_files()
        
        # Create invalid GAAP mapping for error testing
        self._create_invalid_gaap_mapping()
    
    def teardown_method(self):
        """Clean up test fixtures."""
        if self.temp_dir.exists():
            shutil.rmtree(self.temp_dir)
    
    def _create_valid_files(self):
        """Create valid sample files for testing."""
        # Beginning Balance Sheet
        bs_data = pd.DataFrame([
            {"Account": "1000", "Description": "Cash", "Balance": 10000.00, "Type": "Asset"},
            {"Account": "1200", "Description": "Accounts Receivable", "Balance": 5000.00, "Type": "Asset"},
            {"Account": "2000", "Description": "Accounts Payable", "Balance": -3000.00, "Type": "Liability"},
            {"Account": "3000", "Description": "Equity", "Balance": -12000.00, "Type": "Equity"},
        ])
        bs_path = self.data_dir / "Beginning Balance Sheet.xlsx"
        bs_data.to_excel(bs_path, index=False)
        
        # Valid GAAP Mapping (for comparison)
        gaap_data = pd.DataFrame([
            {"GAAPAccount": "1000", "GAAPSection": "Cash and Cash Equivalents", "GAAPCategory": "Current Assets"},
            {"GAAPAccount": "1200", "GAAPSection": "Accounts Receivable", "GAAPCategory": "Current Assets"},
            {"GAAPAccount": "2000", "GAAPSection": "Accounts Payable", "GAAPCategory": "Current Liabilities"},
            {"GAAPAccount": "3000", "GAAPSection": "Retained Earnings", "GAAPCategory": "Equity"},
        ])
        gaap_path = self.data_dir / "GAAP Mapping Valid.xlsx"
        gaap_data.to_excel(gaap_path, index=False)
        
        # Cashflow Mapping
        cf_data = pd.DataFrame([
            {"Account": "1000", "CashFlowSection": "Operating", "CashFlowCategory": "Cash Receipts"},
            {"Account": "1200", "CashFlowSection": "Operating", "CashFlowCategory": "Cash Receipts"},
            {"Account": "2000", "CashFlowSection": "Operating", "CashFlowCategory": "Cash Payments"},
            {"Account": "3000", "CashFlowSection": "Financing", "CashFlowCategory": "Equity Changes"},
        ])
        cf_path = self.data_dir / "Cashflow Mapping.xlsx"
        cf_data.to_excel(cf_path, index=False)
        
        # AP Cash Grid (references account 5200 which will be missing from bad GAAP mapping)
        ap_data = pd.DataFrame([
            {"Date": datetime(2024, 1, 7), "Description": "Missing Account Payment", "Amount": -1000.00, "Account": "5200"},
            {"Date": datetime(2024, 1, 14), "Description": "Valid Account Payment", "Amount": -1500.00, "Account": "2000"},
        ])
        ap_path = self.data_dir / "AP Cash Grid.xlsx"
        ap_data.to_excel(ap_path, index=False)
    
    def _create_invalid_gaap_mapping(self):
        """Create an invalid GAAP mapping that's missing account 5200."""
        # This mapping is missing account 5200 that's referenced in the AP Cash Grid
        bad_gaap_data = pd.DataFrame([
            {"GAAPAccount": "1000", "GAAPSection": "Cash and Cash Equivalents", "GAAPCategory": "Current Assets"},
            {"GAAPAccount": "1200", "GAAPSection": "Accounts Receivable", "GAAPCategory": "Current Assets"},
            {"GAAPAccount": "2000", "GAAPSection": "Accounts Payable", "GAAPCategory": "Current Liabilities"},
            {"GAAPAccount": "3000", "GAAPSection": "Retained Earnings", "GAAPCategory": "Equity"},
            # Missing 5200 - this should cause a MappingConflict
        ])
        bad_gaap_path = self.data_dir / "GAAP Mapping Bad.xlsx"
        bad_gaap_data.to_excel(bad_gaap_path, index=False)
    
    def test_mapping_conflict_json_output(self):
        """Test that MappingConflict produces proper JSON error output."""
        output_path = self.out_dir / "should_not_exist.xlsx"
        
        project_root = Path(__file__).parent.parent
        result = subprocess.run([
            sys.executable, "-m", "src",
            "--ap-grid", str(self.data_dir / "AP Cash Grid.xlsx"),
            "--bs", str(self.data_dir / "Beginning Balance Sheet.xlsx"),
            "--gaap-map", str(self.data_dir / "GAAP Mapping Bad.xlsx"),  # Bad mapping
            "--cf-map", str(self.data_dir / "Cashflow Mapping.xlsx"),
            "--out", str(output_path)
        ], capture_output=True, text=True, cwd=project_root)
        
        # Should fail with non-zero exit code
        assert result.returncode == 1
        
        # Should not create output file
        assert not output_path.exists()
        
        # Parse JSON from stderr
        try:
            error_data = json.loads(result.stderr)
        except json.JSONDecodeError:
            pytest.fail(f"Expected valid JSON in stderr, got: {result.stderr}")
        
        # Verify JSON structure
        assert "status" in error_data
        assert error_data["status"] == "error"
        assert "errors" in error_data
        assert isinstance(error_data["errors"], list)
        assert len(error_data["errors"]) > 0
        
        # Check error details
        error = error_data["errors"][0]
        assert "type" in error
        assert "message" in error
        assert "suggestion" in error
        
        # Should be a MappingConflict type error
        assert error["type"] == "MappingConflict"
        assert "5200" in error["message"] or "mapping" in error["message"].lower()
    
    def test_schema_error_json_output(self):
        """Test that SchemaError produces proper JSON error output."""
        # Create a completely malformed Excel file
        malformed_data = pd.DataFrame([
            {"WrongColumn": "Value1"},
            {"WrongColumn": "Value2"},
        ])
        malformed_path = self.data_dir / "Malformed BS.xlsx"
        malformed_data.to_excel(malformed_path, index=False)
        
        output_path = self.out_dir / "should_not_exist.xlsx"
        
        project_root = Path(__file__).parent.parent
        result = subprocess.run([
            sys.executable, "-m", "src",
            "--ap-grid", str(self.data_dir / "AP Cash Grid.xlsx"),
            "--bs", str(malformed_path),  # Malformed file
            "--gaap-map", str(self.data_dir / "GAAP Mapping Valid.xlsx"),
            "--cf-map", str(self.data_dir / "Cashflow Mapping.xlsx"),
            "--out", str(output_path)
        ], capture_output=True, text=True, cwd=project_root)
        
        # Should fail with non-zero exit code
        assert result.returncode == 1
        
        # Should not create output file
        assert not output_path.exists()
        
        # Parse JSON from stderr
        try:
            error_data = json.loads(result.stderr)
        except json.JSONDecodeError:
            pytest.fail(f"Expected valid JSON in stderr, got: {result.stderr}")
        
        # Verify JSON structure
        assert "status" in error_data
        assert error_data["status"] == "error"
        assert "errors" in error_data
        assert isinstance(error_data["errors"], list)
        assert len(error_data["errors"]) > 0
        
        # Check error details
        error = error_data["errors"][0]
        assert "type" in error
        assert "message" in error
        assert "suggestion" in error
        
        # Should be a SchemaError type error
        assert error["type"] == "SchemaError"
    
    def test_unexpected_error_json_output(self):
        """Test that unexpected errors produce proper JSON error output."""
        # Use a directory path instead of file path to trigger an unexpected error
        output_path = self.out_dir / "should_not_exist.xlsx"
        
        project_root = Path(__file__).parent.parent
        result = subprocess.run([
            sys.executable, "-m", "src",
            "--ap-grid", str(self.data_dir),  # Directory instead of file
            "--bs", str(self.data_dir / "Beginning Balance Sheet.xlsx"),
            "--gaap-map", str(self.data_dir / "GAAP Mapping Valid.xlsx"),
            "--cf-map", str(self.data_dir / "Cashflow Mapping.xlsx"),
            "--out", str(output_path)
        ], capture_output=True, text=True, cwd=project_root)
        
        # Should fail with non-zero exit code
        assert result.returncode == 1
        
        # Should not create output file
        assert not output_path.exists()
        
        # Parse JSON from stderr
        try:
            error_data = json.loads(result.stderr)
        except json.JSONDecodeError:
            pytest.fail(f"Expected valid JSON in stderr, got: {result.stderr}")
        
        # Verify JSON structure for unexpected error
        assert "status" in error_data
        assert error_data["status"] == "error"
        assert "errors" in error_data
        assert isinstance(error_data["errors"], list)
        assert len(error_data["errors"]) > 0
        
        # Check error details
        error = error_data["errors"][0]
        assert "type" in error
        assert "message" in error
        assert "suggestion" in error
        
        # Should be an UnexpectedError
        assert error["type"] == "UnexpectedError"
        assert "Check input files and try again" in error["suggestion"]
    
    def test_json_error_format_completeness(self):
        """Test that JSON error format contains all required fields."""
        output_path = self.out_dir / "should_not_exist.xlsx"
        
        project_root = Path(__file__).parent.parent
        result = subprocess.run([
            sys.executable, "-m", "src",
            "--ap-grid", str(self.data_dir / "AP Cash Grid.xlsx"),
            "--bs", str(self.data_dir / "Beginning Balance Sheet.xlsx"),
            "--gaap-map", str(self.data_dir / "GAAP Mapping Bad.xlsx"),
            "--cf-map", str(self.data_dir / "Cashflow Mapping.xlsx"),
            "--out", str(output_path)
        ], capture_output=True, text=True, cwd=project_root)
        
        # Parse JSON
        error_data = json.loads(result.stderr)
        
        # Check top-level structure
        required_top_level = ["status", "errors"]
        for field in required_top_level:
            assert field in error_data, f"Missing required field: {field}"
        
        # Check error object structure
        assert len(error_data["errors"]) > 0, "Should have at least one error"
        
        for error in error_data["errors"]:
            required_error_fields = ["type", "message", "suggestion"]
            for field in required_error_fields:
                assert field in error, f"Missing required error field: {field}"
                assert error[field], f"Field {field} should not be empty"
        
        # Verify that it's valid JSON (no parsing errors)
        json_string = json.dumps(error_data)
        assert len(json_string) > 0
        
        # Verify it can be round-tripped
        reparsed = json.loads(json_string)
        assert reparsed == error_data 