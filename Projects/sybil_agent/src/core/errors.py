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


class ValidationError(Exception):
    """Base class for all validation errors."""
    
    def __init__(self, message: str, errors: Optional[List[Error]] = None):
        super().__init__(message)
        self.errors = errors or []


class SchemaError(ValidationError):
    """Raised when a workbook doesn't match the expected schema."""
    pass


class MappingConflict(ValidationError):
    """Raised when GL accounts cannot be mapped to GAAP or Cash-Flow buckets."""
    
    def __init__(self, message: str, errors: Optional[List[Error]] = None):
        super().__init__(message)
        self.errors = errors or []


class UnsupportedGridFormat(ValidationError):
    """Raised when the AP/AR grid format cannot be auto-detected or normalized."""
    pass


class BalanceError(ValidationError):
    """Raised when Beginning Balance Sheet does not balance."""
    pass


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


def format_error_json(exception: ValidationError) -> str:
    """
    Format a ValidationError as JSON for CLI output.
    
    Args:
        exception: ValidationError instance to format
        
    Returns:
        JSON string with status and errors array
    """
    error_data = {
        "status": "error",
        "errors": []
    }
    
    if hasattr(exception, 'errors') and exception.errors:
        for error in exception.errors:
            error_data["errors"].append({
                "type": exception.__class__.__name__,
                "message": error.issue,
                "suggestion": error.hint
            })
    else:
        error_data["errors"].append({
            "type": exception.__class__.__name__,
            "message": str(exception),
            "suggestion": "Check input data and try again."
        })
    
    return json.dumps(error_data, indent=2) 