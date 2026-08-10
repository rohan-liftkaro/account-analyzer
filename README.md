# Bank Statement Analyzer — Multi-FY Edition

Analyze **all Financial Years** of bank statements and generate comprehensive summary reports in Excel and CSV formats.

## Features

- **Multi-format Input**: Reads CSV and Excel (.xlsx/.xls) bank statements
- **Smart Column Detection**: Auto-detects column headers regardless of bank format
- **Auto-Categorization**: 19+ categories (Salary, EMI, Rent, Food, Shopping, UPI, etc.)
- **Multi-FY Analysis**: Full financial year breakdown (April–March) for all FYs in your data
- **Rich Reports**: Multi-sheet Excel with styling + flat CSV files
- **Console Dashboard**: Beautiful CLI output with tables

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run with sample data (generates + analyzes)
npm run demo

# 3. Or place your real statements in data/input/ and run:
npm run analyze
```

## Usage

```bash
# Basic usage
node src/index.js --input ./data/input --output ./output

# Excel only
node src/index.js -i ./data/input -o ./output --format excel

# CSV only
node src/index.js -i ./data/input -o ./output --format csv

# Both formats (default)
node src/index.js -i ./data/input -o ./output --format both
```

## Input Format

Place your bank statement files (`.csv`, `.xlsx`, `.xls`) in the `data/input/` folder.

The parser auto-detects these column names:

| Field | Accepted Headers |
|-------|-----------------|
| Date | date, txn date, transaction date, value date, posting date |
| Description | description, narration, particulars, remarks, details |
| Debit | debit, withdrawal, debit amount, dr |
| Credit | credit, deposit, credit amount, cr |
| Balance | balance, closing balance, running balance |

> Works with statements from SBI, HDFC, ICICI, Axis, Kotak, and most Indian banks.

## Output Reports

### Excel Report (multi-sheet)
| Sheet | Content |
|-------|---------|
| Dashboard | Overall summary, top categories |
| FY Comparison | Side-by-side FY stats |
| Category Analysis | Category-wise spend breakdown |
| Monthly Trends | Month-by-month credit/debit |
| YoY Growth | Year-over-year growth rates |
| FY20XX-XX | Per-FY detail with category breakdown |

### CSV Reports
- `fy_comparison.csv` — FY summary comparison
- `category_summary.csv` — Category-wise totals
- `monthly_trends.csv` — Monthly credit/debit trends
- `yoy_growth.csv` — Year-over-year changes
- `all_transactions.csv` — All categorized transactions

## Project Structure

```
Summary/
├── package.json
├── src/
│   ├── index.js                  # CLI entry point
│   ├── generateSampleData.js     # Sample data generator
│   ├── parser/
│   │   ├── csvParser.js          # CSV file reader
│   │   └── excelParser.js        # Excel file reader
│   ├── analyzer/
│   │   ├── categorizer.js        # Transaction categorizer
│   │   ├── fyAnalyzer.js         # FY aggregation engine
│   │   └── summaryEngine.js      # Master summary builder
│   ├── reporter/
│   │   ├── excelReporter.js      # Excel report generator
│   │   └── csvReporter.js        # CSV report generator
│   ├── config/
│   │   └── categories.js         # Category keyword rules
│   └── utils/
│       ├── dateUtils.js          # FY date utilities
│       └── formatUtils.js        # Currency formatting
├── data/input/                   # Place bank statements here
└── output/                       # Generated reports
```

## Customizing Categories

Edit `src/config/categories.js` to add/modify transaction categories and their matching keywords.

## Tech Stack

- **Runtime**: Node.js
- **Excel I/O**: ExcelJS
- **CSV I/O**: csv-parser + fast-csv
- **CLI**: Commander.js + Chalk + cli-table3

## Financial Year Convention

Indian FY: **April 1 to March 31**
- FY 2024-25 = April 1, 2024 → March 31, 2025
