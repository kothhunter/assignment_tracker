# Projected Journal

A Python 3.12 package that ingests four workbooks, normalizes data, and writes a 17-column USD Journal covering exactly 13 weeks.

## Overview

This package processes four input workbooks:
- **Beginning BS.xlsx** – fixed schema
- **GAAP Mapping.xlsx** – fixed schema  
- **Cashflow Mapping.xlsx** – fixed schema
- **AP Cash Grid.xlsx** – flexible schema (auto-detection required)

## Installation

```bash
pip install -r requirements.txt
```

## Usage

### Command Line Interface

```bash
python -m src.cli \
  --bs "Beginning Balance Sheet.xlsx" \
  --gaap "GAAP Mapping.xlsx" \
  --cf "Cashflow Mapping.xlsx" \
  --ap "AP Cash Grid.xlsx" \
  --out "Journal.xlsx"
```

### Python API

```python
from src.core.loader import load_all_workbooks
from src.core.validator import validate_all
from src.core.generator import build_projected_journal

# Load workbooks
bundle = load_all_workbooks(bs_path, gaap_path, cf_path, ap_path)

# Validate data
errors = validate_all(bundle)
if errors:
    # Handle validation errors
    pass

# Generate journal
journal_df = build_projected_journal(bundle)
journal_df.to_excel("output_journal.xlsx", index=False)
```

## Development

### Running Tests

```bash
pytest tests/
```

### Project Structure

```
src/
├── core/
│   ├── __init__.py
│   ├── models.py       # Pydantic models for fixed schemas
│   ├── loader.py       # Utilities to read the 4 workbooks
│   ├── normaliser.py   # Cash-grid normalization
│   ├── validator.py    # Schema + mapping checks
│   ├── generator.py    # Build projected journal
│   └── errors.py       # Error handling and reporting
├── cli.py              # Simple CLI wrapper
tests/
├── test_loader.py
└── test_validator.py
```

## Requirements

- Python 3.12 only
- Libraries: pandas, openpyxl, pydantic, python-dateutil
- Output: Single 17-column Journal.xlsx (USD) covering exactly 13 weeks

## Error Handling

The package validates:
- Column presence for all fixed schemas
- DCFlag values ('D' or 'C' case sensitive)
- Amount precision (Decimal 18,2) and positive values
- GAAP account mapping coverage
- Cash-Flow mapping coverage (allows "Unscheduled Cash" bucket)
- Beginning Balance Sheet balance validation

## License

MIT License - see SPDX headers in source files. 