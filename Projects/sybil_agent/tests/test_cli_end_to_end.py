# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: 2024 Projected Journal

"""
End-to-end tests for the CLI module.

Tests the complete CLI workflow using subprocess with actual Excel files.
"""

import pytest
import subprocess
import sys
from pathlib import Path
import tempfile
import shutil
import pandas as pd
from decimal import Decimal
from datetime import datetime

from src.core.models import COLUMNS_17_FIXED_SCHEMA


class TestCLIEndToEnd:
    """Test cases for complete CLI workflow."""
    
    def setup_method(self):
        """Set up test fixtures with sample Excel files."""
        # Create temporary directory
        self.temp_dir = Path(tempfile.mkdtemp())
        self.data_dir = self.temp_dir / "data"
        self.out_dir = self.temp_dir / "out"
        self.data_dir.mkdir()
        self.out_dir.mkdir()
        
        # Create sample Beginning Balance Sheet
        self._create_beginning_bs()
        
        # Create sample GAAP Mapping
        self._create_gaap_mapping()
        
        # Create sample Cashflow Mapping
        self._create_cashflow_mapping()
        
        # Create sample AP Cash Grid
        self._create_ap_cash_grid()
    
    def teardown_method(self):
        """Clean up test fixtures."""
        if self.temp_dir.exists():
            shutil.rmtree(self.temp_dir)
    
    def _create_beginning_bs(self):
        """Create a valid Beginning Balance Sheet Excel file."""
        bs_data = pd.DataFrame([
            {"Account": "1000", "Description": "Cash", "Balance": 10000.00, "Type": "Asset"},
            {"Account": "1200", "Description": "Accounts Receivable", "Balance": 5000.00, "Type": "Asset"},
            {"Account": "2000", "Description": "Accounts Payable", "Balance": -3000.00, "Type": "Liability"},
            {"Account": "3000", "Description": "Equity", "Balance": -12000.00, "Type": "Equity"},
        ])
        bs_path = self.data_dir / "Beginning Balance Sheet.xlsx"
        bs_data.to_excel(bs_path, index=False)
    
    def _create_gaap_mapping(self):
        """Create a valid GAAP Mapping Excel file."""
        gaap_data = pd.DataFrame([
            {"GAAPAccount": "1000", "GAAPSection": "Cash and Cash Equivalents", "GAAPCategory": "Current Assets"},
            {"GAAPAccount": "1200", "GAAPSection": "Accounts Receivable", "GAAPCategory": "Current Assets"},
            {"GAAPAccount": "2000", "GAAPSection": "Accounts Payable", "GAAPCategory": "Current Liabilities"},
            {"GAAPAccount": "3000", "GAAPSection": "Retained Earnings", "GAAPCategory": "Equity"},
        ])
        gaap_path = self.data_dir / "GAAP Mapping.xlsx"
        gaap_data.to_excel(gaap_path, index=False)
    
    def _create_cashflow_mapping(self):
        """Create a valid Cashflow Mapping Excel file."""
        cf_data = pd.DataFrame([
            {"Account": "1000", "CashFlowSection": "Operating", "CashFlowCategory": "Cash Receipts"},
            {"Account": "1200", "CashFlowSection": "Operating", "CashFlowCategory": "Cash Receipts"},
            {"Account": "2000", "CashFlowSection": "Operating", "CashFlowCategory": "Cash Payments"},
            {"Account": "3000", "CashFlowSection": "Financing", "CashFlowCategory": "Equity Changes"},
        ])
        cf_path = self.data_dir / "Cashflow Mapping.xlsx"
        cf_data.to_excel(cf_path, index=False)
    
    def _create_ap_cash_grid(self):
        """Create a valid AP Cash Grid Excel file."""
        # Create a simple list format (Date + Amount columns)
        ap_data = pd.DataFrame([
            {"Date": datetime(2024, 1, 7), "Description": "Vendor Payment 1", "Amount": -1000.00},
            {"Date": datetime(2024, 1, 14), "Description": "Vendor Payment 2", "Amount": -1500.00},
            {"Date": datetime(2024, 1, 21), "Description": "Customer Receipt 1", "Amount": 2000.00},
            {"Date": datetime(2024, 1, 28), "Description": "Customer Receipt 2", "Amount": 2500.00},
        ])
        ap_path = self.data_dir / "AP Cash Grid.xlsx"
        ap_data.to_excel(ap_path, index=False)
    
    def test_cli_success_case(self):
        """Test successful CLI execution with valid inputs."""
        output_path = self.out_dir / "Projected_Journal.xlsx"
        
        # Run CLI via subprocess from project root
        project_root = Path(__file__).parent.parent  # Go up from tests/ to project root
        result = subprocess.run([
            sys.executable, "-m", "src",
            "--ap-grid", str(self.data_dir / "AP Cash Grid.xlsx"),
            "--bs", str(self.data_dir / "Beginning Balance Sheet.xlsx"),
            "--gaap-map", str(self.data_dir / "GAAP Mapping.xlsx"),
            "--cf-map", str(self.data_dir / "Cashflow Mapping.xlsx"),
            "--out", str(output_path)
        ], capture_output=True, text=True, cwd=project_root)
        
        # Verify successful execution
        assert result.returncode == 0, f"CLI failed with stderr: {result.stderr}"
        
        # Verify output file was created
        assert output_path.exists(), "Output Excel file was not created"
        
        # Verify output file structure
        result_df = pd.read_excel(output_path)
        assert list(result_df.columns) == COLUMNS_17_FIXED_SCHEMA
        assert len(result_df) > 0, "Output journal should contain entries"
        
        # Check success message in stdout
        assert "Successfully generated journal" in result.stdout
        assert "Journal contains" in result.stdout
    
    def test_cli_verbose_mode(self):
        """Test CLI with verbose logging enabled."""
        output_path = self.out_dir / "Projected_Journal_Verbose.xlsx"
        
        project_root = Path(__file__).parent.parent
        result = subprocess.run([
            sys.executable, "-m", "src",
            "--ap-grid", str(self.data_dir / "AP Cash Grid.xlsx"),
            "--bs", str(self.data_dir / "Beginning Balance Sheet.xlsx"),
            "--gaap-map", str(self.data_dir / "GAAP Mapping.xlsx"),
            "--cf-map", str(self.data_dir / "Cashflow Mapping.xlsx"),
            "--out", str(output_path),
            "--verbose"
        ], capture_output=True, text=True, cwd=project_root)
        
        # Should still succeed
        assert result.returncode == 0
        assert output_path.exists()
        
        # Verbose mode should include more detailed logging in stderr
        # (our logger outputs to stderr)
        assert len(result.stderr) > 0, "Verbose mode should produce log output"
    
    def test_cli_missing_input_file(self):
        """Test CLI behavior when input file is missing."""
        output_path = self.out_dir / "should_not_exist.xlsx"
        
        project_root = Path(__file__).parent.parent
        result = subprocess.run([
            sys.executable, "-m", "src",
            "--ap-grid", str(self.data_dir / "NonExistent.xlsx"),  # This file doesn't exist
            "--bs", str(self.data_dir / "Beginning Balance Sheet.xlsx"),
            "--gaap-map", str(self.data_dir / "GAAP Mapping.xlsx"),
            "--cf-map", str(self.data_dir / "Cashflow Mapping.xlsx"),
            "--out", str(output_path)
        ], capture_output=True, text=True, cwd=project_root)
        
        # Should fail with non-zero exit code
        assert result.returncode == 1
        
        # Should not create output file
        assert not output_path.exists()
        
        # Should show error message about missing file
        assert "Input file not found" in result.stderr
    
    def test_cli_help_message(self):
        """Test that CLI shows help message with --help."""
        project_root = Path(__file__).parent.parent
        result = subprocess.run([
            sys.executable, "-m", "src", "--help"
        ], capture_output=True, text=True, cwd=project_root)
        
        # Should succeed and show help
        assert result.returncode == 0
        assert "Generate projected journal from input workbooks" in result.stdout
        assert "--ap-grid" in result.stdout
        assert "--bs" in result.stdout
        assert "--gaap-map" in result.stdout
        assert "--cf-map" in result.stdout
        assert "--out" in result.stdout
        assert "--verbose" in result.stdout
    
    def test_output_directory_creation(self):
        """Test that CLI creates output directory if it doesn't exist."""
        nested_output_path = self.temp_dir / "deep" / "nested" / "path" / "Journal.xlsx"
        
        # Directory doesn't exist yet
        assert not nested_output_path.parent.exists()
        
        project_root = Path(__file__).parent.parent
        result = subprocess.run([
            sys.executable, "-m", "src",
            "--ap-grid", str(self.data_dir / "AP Cash Grid.xlsx"),
            "--bs", str(self.data_dir / "Beginning Balance Sheet.xlsx"),
            "--gaap-map", str(self.data_dir / "GAAP Mapping.xlsx"),
            "--cf-map", str(self.data_dir / "Cashflow Mapping.xlsx"),
            "--out", str(nested_output_path)
        ], capture_output=True, text=True, cwd=project_root)
        
        # Should succeed
        assert result.returncode == 0
        
        # Output directory and file should be created
        assert nested_output_path.parent.exists()
        assert nested_output_path.exists() 