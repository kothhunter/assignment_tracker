# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: 2024 Projected Journal

"""
Command-line interface for the Projected Journal package.

This module provides a simple CLI wrapper for generating projected journals
from the four input workbooks.
"""

import argparse
import sys
from pathlib import Path
import pandas as pd

from .core.loader import load_all_workbooks
from .core.validator import validate_all
from .core.generator import build_projected_journal
from .core.errors import SchemaError, MappingConflict, report


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Generate projected journal from input workbooks",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Example usage:
  python -m projected_journal.cli \\
    --bs "Beginning Balance Sheet.xlsx" \\
    --gaap "GAAP Mapping.xlsx" \\
    --cf "Cashflow Mapping.xlsx" \\
    --ap "AP Cash Grid.xlsx" \\
    --out "Journal.xlsx"
        """
    )
    
    parser.add_argument(
        "--bs", 
        required=True,
        help="Path to Beginning Balance Sheet.xlsx"
    )
    parser.add_argument(
        "--gaap",
        required=True, 
        help="Path to GAAP Mapping.xlsx"
    )
    parser.add_argument(
        "--cf",
        required=True,
        help="Path to Cashflow Mapping.xlsx"
    )
    parser.add_argument(
        "--ap",
        required=True,
        help="Path to AP Cash Grid.xlsx"
    )
    parser.add_argument(
        "--out",
        required=True,
        help="Output path for generated Journal.xlsx"
    )
    parser.add_argument(
        "--validate-only",
        action="store_true",
        help="Only validate inputs without generating journal"
    )
    
    args = parser.parse_args()
    
    try:
        # Validate input files exist
        for file_path in [args.bs, args.gaap, args.cf, args.ap]:
            if not Path(file_path).exists():
                print(f"Error: File not found: {file_path}", file=sys.stderr)
                sys.exit(1)
        
        # Load all workbooks
        print("Loading workbooks...")
        bundle = load_all_workbooks(args.bs, args.gaap, args.cf, args.ap)
        
        # Validate loaded data
        print("Validating data...")
        validation_errors = validate_all(bundle)
        
        if validation_errors:
            print("Validation errors found:", file=sys.stderr)
            error_reports = report(validation_errors)
            for error_report in error_reports:
                print(f"  {error_report['file']}:{error_report['row']} - {error_report['issue']}", file=sys.stderr)
                print(f"    Hint: {error_report['hint']}", file=sys.stderr)
            sys.exit(1)
        
        print("Validation passed!")
        
        if args.validate_only:
            print("Validation-only mode: exiting without generating journal.")
            sys.exit(0)
        
        # Generate projected journal
        print("Generating projected journal...")
        journal_df = build_projected_journal(bundle)
        
        # Write output
        print(f"Writing journal to {args.out}...")
        journal_df.to_excel(args.out, index=False)
        
        print(f"Successfully generated journal: {args.out}")
        print(f"Journal contains {len(journal_df)} entries")
        
    except SchemaError as e:
        print(f"Schema error: {e}", file=sys.stderr)
        if hasattr(e, 'errors') and e.errors:
            error_reports = report(e.errors)
            for error_report in error_reports:
                print(f"  {error_report['file']}:{error_report['row']} - {error_report['issue']}", file=sys.stderr)
        sys.exit(1)
        
    except MappingConflict as e:
        print(f"Mapping conflict: {e}", file=sys.stderr)
        if hasattr(e, 'errors') and e.errors:
            error_reports = report(e.errors)
            for error_report in error_reports:
                print(f"  {error_report['file']}:{error_report['row']} - {error_report['issue']}", file=sys.stderr)
        sys.exit(1)
        
    except Exception as e:
        print(f"Unexpected error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main() 