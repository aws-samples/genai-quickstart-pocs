# Scripts Directory

Development utilities and tools for the Security Configuration System. These scripts are **NOT deployed** to production.

## Core Utilities

### `download_outputs.py` ✅
Downloads S3 outputs to local `tests/output` directory for analysis.
```bash
./download_outputs.py [--service SERVICE_NAME]
```

## Config Rules Management

### `config-rules/` ✅
- `load_config_rules.py` - Loads AWS Config managed rules from AWS API to DynamoDB table
- `aws_config_managed_rules.json` - AWS Config managed rules data for compliance mapping

Usage:
```bash
cd config-rules
./load_config_rules.py
```

## Validation Tools

### `output-validation/` ✅
- `validate_service.sh` - Validates generated outputs for a specific service
- `validation_prompt.txt` - Template for validation prompts

Usage:
```bash
cd output-validation
./validate_service.sh ACM
```

## Service Mapping Tools

### `service-mapping/` ✅
- `extract_service_mappings.py` - Scrapes AWS documentation to generate service mappings
- `aws_service_mappings.json` - Generated service mapping data

Usage:
```bash
cd service-mapping
python3 extract_service_mappings.py
```

## Final Structure
```
scripts/
├── README.md                                   # ✅ Documentation
├── download_outputs.py                        # ✅ Core utility
├── config-rules/
│   ├── load_config_rules.py                  # ✅ Config rules loader
│   └── aws_config_managed_rules.json         # ✅ Config rules data
├── output-validation/
│   ├── validate_service.sh                   # ✅ Validation tool
│   └── validation_prompt.txt                 # ✅ Template
└── service-mapping/
    ├── extract_service_mappings.py           # ✅ AWS doc scraper
    └── aws_service_mappings.json            # ✅ Generated data
```
