#!/bin/bash

if [ $# -eq 0 ]; then
    echo "Usage: $0 <service_name> [source_path] [output_path]"
    echo "Example: $0 ACM"
    echo "Example: $0 ACM ../../tests/output ../../tests/output"
    exit 1
fi

SERVICE_NAME="$1"
SOURCE_PATH="${2:-../../tests/output}"
OUTPUT_PATH="${3:-../../tests/output}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROMPT_FILE="$SCRIPT_DIR/validation_prompt.txt"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

if [ ! -f "$PROMPT_FILE" ]; then
    echo "Error: Prompt file not found at $PROMPT_FILE"
    exit 1
fi

# Read the prompt template and replace placeholders
PROMPT=$(cat "$PROMPT_FILE" | sed "s/\[SERVICE_NAME\]/$SERVICE_NAME/g" | sed "s|\[SOURCE_PATH\]|$SOURCE_PATH|g" | sed "s|\[OUTPUT_PATH\]|$OUTPUT_PATH|g" | sed "s/\[CURRENT_TIMESTAMP\]/$(date)/g" | sed "s/\[TIMESTAMP\]/$TIMESTAMP/g")

# Call Q CLI with the processed prompt
echo "Validating outputs for service: $SERVICE_NAME"
echo "Source path: $SOURCE_PATH"
echo "Output path: $OUTPUT_PATH"
echo "Generated prompt will be sent to Q CLI..."
echo

q chat --trust-all-tools --no-interactive "$PROMPT"
