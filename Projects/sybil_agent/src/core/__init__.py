# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: 2024 Projected Journal

"""
Core module for the Projected Journal package.

This module provides the main functionality for ingesting four workbooks,
normalizing data, and generating a 17-column USD Journal covering 13 weeks.
"""

__version__ = "0.1.0"

from .models import BeginningBS, GAAPMapping, CashflowMapping, APGridEvent
from .errors import MappingConflict, SchemaError, report
from .loader import load_workbook
from .validator import validate_all
from .generator import build_projected_journal
from .normaliser import normalise_cash_grid

__all__ = [
    "BeginningBS",
    "GAAPMapping", 
    "CashflowMapping",
    "APGridEvent",
    "MappingConflict",
    "SchemaError",
    "report",
    "load_workbook",
    "validate_all",
    "build_projected_journal",
    "normalise_cash_grid",
] 