# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: 2024 Projected Journal

"""
Tests for the exporter module.

Tests the Excel export functionality including round-trip testing.
"""

import pytest
import pandas as pd
from pathlib import Path
import tempfile
import shutil
from decimal import Decimal
from datetime import datetime

from src.core.exporter import write_excel
from src.core.models import COLUMNS_17_FIXED_SCHEMA


class TestExporter:
    """Test cases for Excel export functionality."""
    
    def setup_method(self):
        """Set up test fixtures."""
        # Create temporary directory
        self.temp_dir = Path(tempfile.mkdtemp())
        
        # Sample journal data matching the 17-column schema
        self.sample_journal = pd.DataFrame([
            {
                "JournalID": "J001",
                "TxnID": "T001", 
                "TxnDate": datetime(2024, 1, 1),
                "CashDate": datetime(2024, 1, 1),
                "DCFlag": "D",
                "GAAPAccount": "1200",
                "CashFlowSection": "Operating",
                "Department": "Sales",
                "Product": "Widget A",
                "CustomerID": "C001",
                "VendorID": "",
                "Location": "HQ",
                "Class": "Revenue",
                "Amount": Decimal("1000.00"),
                "CurrencyCode": "USD",
                "CreatedAt": datetime.now(),
                "UpdatedAt": datetime.now(),
            },
            {
                "JournalID": "J002",
                "TxnID": "T002",
                "TxnDate": datetime(2024, 1, 2), 
                "CashDate": datetime(2024, 1, 2),
                "DCFlag": "C",
                "GAAPAccount": "2000",
                "CashFlowSection": "Operating",
                "Department": "Admin",
                "Product": "Service B",
                "CustomerID": "",
                "VendorID": "V001",
                "Location": "Branch",
                "Class": "Expense",
                "Amount": Decimal("500.00"),
                "CurrencyCode": "USD",
                "CreatedAt": datetime.now(),
                "UpdatedAt": datetime.now(),
            }
        ], columns=COLUMNS_17_FIXED_SCHEMA)
    
    def teardown_method(self):
        """Clean up test fixtures."""
        if self.temp_dir.exists():
            shutil.rmtree(self.temp_dir)
    
    def test_write_excel_basic(self):
        """Test basic Excel export functionality."""
        output_path = self.temp_dir / "test_journal.xlsx"
        
        write_excel(self.sample_journal, output_path)
        
        # Verify file was created
        assert output_path.exists()
        assert output_path.suffix == ".xlsx"
    
    def test_write_excel_creates_directory(self):
        """Test that write_excel creates output directory if it doesn't exist."""
        output_path = self.temp_dir / "subdir" / "test_journal.xlsx"
        
        # Directory doesn't exist yet
        assert not output_path.parent.exists()
        
        write_excel(self.sample_journal, output_path)
        
        # Directory and file should now exist
        assert output_path.parent.exists()
        assert output_path.exists()
    
    def test_round_trip_dataframe(self):
        """Test round-trip: DataFrame → xlsx → DataFrame."""
        output_path = self.temp_dir / "test_journal.xlsx"
        
        # Export to Excel
        write_excel(self.sample_journal, output_path, sheet_name="TestJournal")
        
        # Read back from Excel
        result_df = pd.read_excel(output_path, sheet_name="TestJournal")
        
        # Verify column structure
        assert list(result_df.columns) == COLUMNS_17_FIXED_SCHEMA
        assert len(result_df) == len(self.sample_journal)
        
        # Verify specific data (allowing for type conversions)
        assert result_df.iloc[0]["JournalID"] == "J001"
        assert result_df.iloc[0]["DCFlag"] == "D"
        assert result_df.iloc[1]["JournalID"] == "J002"
        assert result_df.iloc[1]["VendorID"] == "V001"
        
        # Verify numeric data
        assert float(result_df.iloc[0]["Amount"]) == 1000.00
        assert float(result_df.iloc[1]["Amount"]) == 500.00
    
    def test_empty_dataframe_error(self):
        """Test that empty DataFrame raises ValueError."""
        empty_df = pd.DataFrame(columns=COLUMNS_17_FIXED_SCHEMA)
        output_path = self.temp_dir / "empty.xlsx"
        
        with pytest.raises(ValueError, match="Cannot export empty DataFrame"):
            write_excel(empty_df, output_path)
    
    def test_custom_sheet_name(self):
        """Test export with custom sheet name."""
        output_path = self.temp_dir / "custom_sheet.xlsx"
        custom_sheet_name = "ProjectedJournal"
        
        write_excel(self.sample_journal, output_path, sheet_name=custom_sheet_name)
        
        # Verify sheet name
        excel_file = pd.ExcelFile(output_path)
        assert custom_sheet_name in excel_file.sheet_names
        assert len(excel_file.sheet_names) == 1
    
    def test_large_dataset(self):
        """Test export with larger dataset for performance."""
        # Create larger dataset
        large_data = []
        for i in range(1000):
            row = self.sample_journal.iloc[0].copy()
            row["JournalID"] = f"J{i+1:04d}"
            row["TxnID"] = f"T{i+1:04d}"
            row["Amount"] = Decimal(f"{100 + i}.00")
            large_data.append(row)
        
        large_df = pd.DataFrame(large_data)
        output_path = self.temp_dir / "large_journal.xlsx"
        
        # Should not raise any errors
        write_excel(large_df, output_path)
        
        # Verify file size and contents
        assert output_path.exists()
        assert output_path.stat().st_size > 0
        
        # Spot check the data
        result_df = pd.read_excel(output_path)
        assert len(result_df) == 1000
        assert result_df.iloc[999]["JournalID"] == "J1000" 