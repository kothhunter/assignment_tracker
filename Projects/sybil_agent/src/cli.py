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
from .core.normaliser import normalise_cash_grid
from .core.validator import validate_all
from .core.generator import build_projected_journal
from .core.exporter import write_excel
from .core.errors import ValidationError, format_error_json
from .core.logging import get_logger


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Generate projected journal from input workbooks",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Example usage:
  python -m sybil_cli \\
    --ap-grid data/AP Cash Grid.xlsx \\
    --bs data/Beginning Balance Sheet.xlsx \\
    --gaap-map data/GAAP Mapping.xlsx \\
    --cf-map data/Cashflow Mapping.xlsx \\
    --out out/Projected_Journal.xlsx
        """
    )
    
    parser.add_argument(
        "--ap-grid", 
        required=True,
        help="Path to AP Cash Grid.xlsx"
    )
    parser.add_argument(
        "--bs",
        required=True, 
        help="Path to Beginning Balance Sheet.xlsx"
    )
    parser.add_argument(
        "--gaap-map",
        required=True,
        help="Path to GAAP Mapping.xlsx"
    )
    parser.add_argument(
        "--cf-map",
        required=True,
        help="Path to Cashflow Mapping.xlsx"
    )
    parser.add_argument(
        "--out",
        required=True,
        help="Output path for generated Projected_Journal.xlsx"
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Enable verbose logging"
    )
    
    args = parser.parse_args()
    
    # Configure logging
    log_level = "INFO" if args.verbose else "WARNING"
    logger = get_logger(__name__, log_level)
    
    try:
        # Validate input files exist
        input_files = {
            "AP Cash Grid": args.ap_grid,
            "Beginning Balance Sheet": args.bs,
            "GAAP Mapping": args.gaap_map,
            "Cashflow Mapping": args.cf_map
        }
        
        for file_type, file_path in input_files.items():
            if not Path(file_path).exists():
                error_msg = f"Input file not found: {file_path}"
                logger.error(error_msg)
                print(f"Error: {error_msg}", file=sys.stderr)
                sys.exit(1)
        
        logger.info("Starting projected journal generation")
        
        # Pipeline Step 1: Load all workbooks (includes normalization)
        logger.info("Loading workbooks...")
        bundle = load_all_workbooks(args.bs, args.gaap_map, args.cf_map, args.ap_grid)
        
        # Pipeline Step 2: Validate all data
        logger.info("Validating data...")
        validate_all(bundle)
        
        # Pipeline Step 3: Generate projected journal
        logger.info("Generating projected journal...")
        journal = build_projected_journal(bundle)
        
        # Pipeline Step 5: Export to Excel
        logger.info(f"Exporting to {args.out}...")
        output_path = Path(args.out)
        write_excel(journal, output_path)
        
        logger.info(f"Successfully generated journal: {args.out}")
        logger.info(f"Journal contains {len(journal)} entries")
        print(f"Successfully generated journal: {args.out}")
        print(f"Journal contains {len(journal)} entries")
        
    except ValidationError as e:
        logger.error(f"Validation error: {e}")
        error_json = format_error_json(e)
        print(error_json, file=sys.stderr)
        sys.exit(1)
        
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        # For unexpected errors, create a minimal JSON response
        error_data = {
            "status": "error",
            "errors": [{
                "type": "UnexpectedError",
                "message": str(e),
                "suggestion": "Check input files and try again. Enable --verbose for more details."
            }]
        }
        import json
        print(json.dumps(error_data, indent=2), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main() 