FROM python:3.12-slim

WORKDIR /app

# Copy requirements first to leverage Docker cache
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Create the analysis_results directory
RUN mkdir -p sample_data/analysis_results

# Expose the port Streamlit runs on
EXPOSE 8501

# Set environment variables
ENV BYPASS_TOOL_CONSENT=True
ENV STRANDS_TOOL_CONSOLE_MODE=enabled

# Command to run the application
CMD ["streamlit", "run", "app.py", "--server.address", "0.0.0.0"]