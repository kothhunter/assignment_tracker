# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: 2024 Projected Journal

"""
Projected Journal package.

A Python 3.12 package that ingests four workbooks, normalizes data, and writes 
a 17-column USD Journal covering 13 weeks.
"""

__version__ = "0.1.0"
__author__ = "Projected Journal Team"
__email__ = "team@projectedjournal.com"
__description__ = "Generate projected financial journals from Excel workbooks"

from .core import (
    BeginningBS,
    GAAPMapping, 
    CashflowMapping,
    APGridEvent,
    MappingConflict,
    SchemaError,
    report,
    load_workbook,
    validate_all,
    build_projected_journal,
    normalise_cash_grid,
)

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