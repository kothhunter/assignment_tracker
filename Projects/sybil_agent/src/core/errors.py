# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: 2024 Projected Journal

"""
Error handling and reporting for the Projected Journal package.

This module defines custom exceptions for schema validation and mapping conflicts,
and provides structured error reporting functionality.
"""

from typing import Any, Dict, List, Optional
from dataclasses import dataclass
import json


@dataclass
class Error:
    """Represents a validation or mapping error."""
    file: str
    row: Optional[int]
    issue: str
    hint: str


class SchemaError(Exception):
    """Raised when a workbook doesn't match the expected schema."""
    
    def __init__(self, message: str, errors: Optional[List[Error]] = None):
        super().__init__(message)
        self.errors = errors or []


class MappingConflict(Exception):
    """Raised when GL accounts cannot be mapped to GAAP or Cash-Flow buckets."""
    
    def __init__(self, message: str, errors: Optional[List[Error]] = None):
        super().__init__(message)
        self.errors = errors or []


def report(errors: List[Error]) -> List[Dict[str, Any]]:
    """
    Generate structured error reports in JSON format.
    
    Args:
        errors: List of Error objects to report
        
    Returns:
        List of dictionaries containing error details in the required format:
        {
            "file": "GAAP Mapping.xlsx",
            "row": 42,
            "issue": "GAAPAccount 5100 missing in mapping",
            "hint": "Add 5100-COGS to mapping or correct the AP grid reference."
        }
    """
    return [
        {
            "file": error.file,
            "row": error.row,
            "issue": error.issue,
            "hint": error.hint
        }
        for error in errors
    ] 