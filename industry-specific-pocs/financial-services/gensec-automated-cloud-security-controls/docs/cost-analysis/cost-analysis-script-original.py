#!/usr/bin/env python3
"""
Security Configuration System - Cost Analysis
Calculates average cost per Step Functions execution based on current deployment
"""

import json
from datetime import datetime, timedelta

# AWS Pricing (US East 1 - as of October 2025)
PRICING = {
    'step_functions': {
        'state_transitions': 0.000025,  # per state transition
        'standard_workflow': 0.025      # per 1000 state transitions
    },
    'lambda': {
        'requests': 0.0000002,          # per request
        'gb_seconds': 0.0000166667,     # per GB-second
        'duration_ms': 0.0000000167     # per 100ms
    },
    'bedrock': {
        'claude_3_5_sonnet': {
            'input_tokens': 0.003 / 1000,   # per 1K input tokens
            'output_tokens': 0.015 / 1000   # per 1K output tokens
        },
        'claude_3_haiku': {
            'input_tokens': 0.00025 / 1000, # per 1K input tokens
            'output_tokens': 0.00125 / 1000 # per 1K output tokens
        }
    },
    'dynamodb': {
        'read_request_units': 0.00000025,  # per RRU
        'write_request_units': 0.00000125, # per WRU
        'storage_gb_month': 0.25           # per GB-month
    },
    's3': {
        'standard_storage': 0.023,      # per GB-month
        'put_requests': 0.0005,         # per 1000 PUT requests
        'get_requests': 0.0004          # per 1000 GET requests
    }
}

# System Architecture Analysis
LAMBDA_FUNCTIONS = {
    'SecurityProfileProcessor': {
        'memory_mb': 128,
        'timeout_seconds': 180,
        'avg_duration_ms': 5000,
        'invocations_per_execution': 1
    },
    'AWSServiceDocumentationManager': {
        'memory_mb': 1024,
        'timeout_seconds': 900,
        'avg_duration_ms': 90000,  # 1.5 minutes based on execution
        'invocations_per_execution': 1
    },
    'AnalyzeSecurityRequirements': {
        'memory_mb': 1024,
        'timeout_seconds': 900,
        'avg_duration_ms': 50000,  # 50 seconds based on execution
        'invocations_per_execution': 1
    },
    'GenerateSecurityControls': {
        'memory_mb': 1024,
        'timeout_seconds': 900,
        'avg_duration_ms': 195000, # 3.25 minutes based on execution
        'invocations_per_execution': 1
    },
    'GenerateIaCTemplate': {
        'memory_mb': 1024,
        'timeout_seconds': 900,
        'avg_duration_ms': 37000,  # 37 seconds based on execution
        'invocations_per_execution': 1
    },
    'GenerateServiceProfile': {
        'memory_mb': 1024,
        'timeout_seconds': 900,
        'avg_duration_ms': 20000,  # 20 seconds based on execution
        'invocations_per_execution': 1
    },
    'GenerateIAMModel': {
        'memory_mb': 1024,
        'timeout_seconds': 900,
        'avg_duration_ms': 380000, # 6.3 minutes based on execution
        'invocations_per_execution': 1
    }
}

# Bedrock Usage Estimates (based on typical AI workloads)
BEDROCK_USAGE = {
    'AnalyzeSecurityRequirements': {
        'model': 'claude_3_5_sonnet',
        'input_tokens': 15000,   # Large security profile + service docs
        'output_tokens': 8000    # Detailed analysis
    },
    'GenerateSecurityControls': {
        'model': 'claude_3_5_sonnet',
        'input_tokens': 20000,   # Analysis + requirements
        'output_tokens': 12000   # Multiple security controls
    },
    'GenerateIaCTemplate': {
        'model': 'claude_3_5_sonnet',
        'input_tokens': 10000,   # Security controls + templates
        'output_tokens': 5000    # IaC templates
    },
    'GenerateServiceProfile': {
        'model': 'claude_3_5_sonnet',
        'input_tokens': 8000,    # Service documentation
        'output_tokens': 4000    # Service profile
    },
    'GenerateIAMModel': {
        'model': 'claude_3_5_sonnet',
        'input_tokens': 12000,   # Service actions + requirements
        'output_tokens': 6000    # IAM models
    }
}

# DynamoDB Usage Estimates
DYNAMODB_USAGE = {
    'read_requests': 50,    # Reading service docs, configs, etc.
    'write_requests': 25,   # Writing results, tracking
    'data_size_kb': 500     # Per execution data storage
}

# S3 Usage Estimates
S3_USAGE = {
    'put_requests': 15,     # Storing outputs, docs
    'get_requests': 10,     # Reading inputs, configs
    'data_size_mb': 5       # Per execution storage
}

def calculate_lambda_cost(function_name, config):
    """Calculate cost for a single Lambda function execution"""
    memory_gb = config['memory_mb'] / 1024
    duration_seconds = config['avg_duration_ms'] / 1000
    gb_seconds = memory_gb * duration_seconds
    
    request_cost = PRICING['lambda']['requests'] * config['invocations_per_execution']
    compute_cost = PRICING['lambda']['gb_seconds'] * gb_seconds * config['invocations_per_execution']
    
    return {
        'function': function_name,
        'request_cost': request_cost,
        'compute_cost': compute_cost,
        'total_cost': request_cost + compute_cost,
        'duration_seconds': duration_seconds,
        'memory_gb': memory_gb
    }

def calculate_bedrock_cost(function_name, usage):
    """Calculate Bedrock cost for AI function"""
    model_pricing = PRICING['bedrock'][usage['model']]
    
    input_cost = usage['input_tokens'] * model_pricing['input_tokens']
    output_cost = usage['output_tokens'] * model_pricing['output_tokens']
    
    return {
        'function': function_name,
        'model': usage['model'],
        'input_cost': input_cost,
        'output_cost': output_cost,
        'total_cost': input_cost + output_cost,
        'input_tokens': usage['input_tokens'],
        'output_tokens': usage['output_tokens']
    }

def calculate_step_functions_cost():
    """Calculate Step Functions workflow cost"""
    # Based on workflow: 6 Lambda invocations + state transitions
    state_transitions = 8  # Start, 6 Lambda states, End
    cost = state_transitions * PRICING['step_functions']['state_transitions']
    
    return {
        'state_transitions': state_transitions,
        'cost': cost
    }

def calculate_dynamodb_cost():
    """Calculate DynamoDB cost per execution"""
    read_cost = DYNAMODB_USAGE['read_requests'] * PRICING['dynamodb']['read_request_units']
    write_cost = DYNAMODB_USAGE['write_requests'] * PRICING['dynamodb']['write_request_units']
    
    return {
        'read_cost': read_cost,
        'write_cost': write_cost,
        'total_cost': read_cost + write_cost,
        'read_requests': DYNAMODB_USAGE['read_requests'],
        'write_requests': DYNAMODB_USAGE['write_requests']
    }

def calculate_s3_cost():
    """Calculate S3 cost per execution"""
    put_cost = (S3_USAGE['put_requests'] / 1000) * PRICING['s3']['put_requests']
    get_cost = (S3_USAGE['get_requests'] / 1000) * PRICING['s3']['get_requests']
    
    return {
        'put_cost': put_cost,
        'get_cost': get_cost,
        'total_cost': put_cost + get_cost,
        'put_requests': S3_USAGE['put_requests'],
        'get_requests': S3_USAGE['get_requests']
    }

def generate_cost_report():
    """Generate comprehensive cost analysis report"""
    print("=" * 80)
    print("SECURITY CONFIGURATION SYSTEM - COST ANALYSIS")
    print("=" * 80)
    print(f"Analysis Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Account: 992382514659")
    print(f"Region: us-east-1")
    print()
    
    # Lambda Costs
    print("LAMBDA FUNCTION COSTS PER EXECUTION")
    print("-" * 50)
    lambda_total = 0
    lambda_details = []
    
    for func_name, config in LAMBDA_FUNCTIONS.items():
        cost_detail = calculate_lambda_cost(func_name, config)
        lambda_details.append(cost_detail)
        lambda_total += cost_detail['total_cost']
        
        print(f"{func_name}:")
        print(f"  Memory: {config['memory_mb']} MB")
        print(f"  Duration: {cost_detail['duration_seconds']:.1f}s")
        print(f"  Request Cost: ${cost_detail['request_cost']:.8f}")
        print(f"  Compute Cost: ${cost_detail['compute_cost']:.8f}")
        print(f"  Total Cost: ${cost_detail['total_cost']:.8f}")
        print()
    
    print(f"TOTAL LAMBDA COST: ${lambda_total:.6f}")
    print()
    
    # Bedrock Costs
    print("BEDROCK AI COSTS PER EXECUTION")
    print("-" * 50)
    bedrock_total = 0
    bedrock_details = []
    
    for func_name, usage in BEDROCK_USAGE.items():
        cost_detail = calculate_bedrock_cost(func_name, usage)
        bedrock_details.append(cost_detail)
        bedrock_total += cost_detail['total_cost']
        
        print(f"{func_name}:")
        print(f"  Model: {usage['model']}")
        print(f"  Input Tokens: {usage['input_tokens']:,}")
        print(f"  Output Tokens: {usage['output_tokens']:,}")
        print(f"  Input Cost: ${cost_detail['input_cost']:.6f}")
        print(f"  Output Cost: ${cost_detail['output_cost']:.6f}")
        print(f"  Total Cost: ${cost_detail['total_cost']:.6f}")
        print()
    
    print(f"TOTAL BEDROCK COST: ${bedrock_total:.6f}")
    print()
    
    # Step Functions Cost
    print("STEP FUNCTIONS COST PER EXECUTION")
    print("-" * 50)
    sf_cost = calculate_step_functions_cost()
    print(f"State Transitions: {sf_cost['state_transitions']}")
    print(f"Cost: ${sf_cost['cost']:.8f}")
    print()
    
    # DynamoDB Cost
    print("DYNAMODB COST PER EXECUTION")
    print("-" * 50)
    ddb_cost = calculate_dynamodb_cost()
    print(f"Read Requests: {ddb_cost['read_requests']}")
    print(f"Write Requests: {ddb_cost['write_requests']}")
    print(f"Read Cost: ${ddb_cost['read_cost']:.8f}")
    print(f"Write Cost: ${ddb_cost['write_cost']:.8f}")
    print(f"Total Cost: ${ddb_cost['total_cost']:.8f}")
    print()
    
    # S3 Cost
    print("S3 COST PER EXECUTION")
    print("-" * 50)
    s3_cost = calculate_s3_cost()
    print(f"PUT Requests: {s3_cost['put_requests']}")
    print(f"GET Requests: {s3_cost['get_requests']}")
    print(f"PUT Cost: ${s3_cost['put_cost']:.8f}")
    print(f"GET Cost: ${s3_cost['get_cost']:.8f}")
    print(f"Total Cost: ${s3_cost['total_cost']:.8f}")
    print()
    
    # Total Cost Summary
    print("COST SUMMARY PER EXECUTION")
    print("=" * 50)
    total_cost = lambda_total + bedrock_total + sf_cost['cost'] + ddb_cost['total_cost'] + s3_cost['total_cost']
    
    print(f"Lambda Functions:     ${lambda_total:.6f} ({lambda_total/total_cost*100:.1f}%)")
    print(f"Bedrock AI:          ${bedrock_total:.6f} ({bedrock_total/total_cost*100:.1f}%)")
    print(f"Step Functions:      ${sf_cost['cost']:.6f} ({sf_cost['cost']/total_cost*100:.1f}%)")
    print(f"DynamoDB:            ${ddb_cost['total_cost']:.6f} ({ddb_cost['total_cost']/total_cost*100:.1f}%)")
    print(f"S3:                  ${s3_cost['total_cost']:.6f} ({s3_cost['total_cost']/total_cost*100:.1f}%)")
    print("-" * 50)
    print(f"TOTAL PER EXECUTION: ${total_cost:.6f}")
    print()
    
    # Monthly Projections
    print("MONTHLY COST PROJECTIONS")
    print("-" * 50)
    executions_scenarios = [10, 50, 100, 500, 1000]
    
    for executions in executions_scenarios:
        monthly_cost = total_cost * executions
        print(f"{executions:4d} executions/month: ${monthly_cost:.2f}")
    
    print()
    
    # Execution Time Analysis
    print("EXECUTION TIME ANALYSIS")
    print("-" * 50)
    total_duration = sum(config['avg_duration_ms'] for config in LAMBDA_FUNCTIONS.values()) / 1000
    print(f"Total Lambda Duration: {total_duration:.1f} seconds ({total_duration/60:.1f} minutes)")
    print(f"Workflow Duration: ~18 minutes (based on successful execution)")
    print(f"Parallel Processing: Some functions run in parallel")
    print()
    
    # Cost Optimization Recommendations
    print("COST OPTIMIZATION RECOMMENDATIONS")
    print("-" * 50)
    print("1. Bedrock Model Optimization:")
    print("   - Consider Claude 3 Haiku for simpler tasks (75% cost reduction)")
    print("   - Implement prompt optimization to reduce token usage")
    print()
    print("2. Lambda Optimization:")
    print("   - Monitor actual memory usage and right-size functions")
    print("   - Consider ARM-based Graviton2 processors (20% cost reduction)")
    print()
    print("3. DynamoDB Optimization:")
    print("   - Use on-demand billing for variable workloads")
    print("   - Implement efficient query patterns")
    print()
    print("4. S3 Optimization:")
    print("   - Use S3 Intelligent Tiering for long-term storage")
    print("   - Implement lifecycle policies for old outputs")
    print()
    
    return {
        'total_cost_per_execution': total_cost,
        'lambda_cost': lambda_total,
        'bedrock_cost': bedrock_total,
        'step_functions_cost': sf_cost['cost'],
        'dynamodb_cost': ddb_cost['total_cost'],
        's3_cost': s3_cost['total_cost'],
        'execution_duration_seconds': total_duration
    }

if __name__ == "__main__":
    generate_cost_report()
