#!/usr/bin/env python3
"""
Security Configuration System - Updated Cost Analysis
Calculates average cost per SUCCESSFUL Step Functions execution using Claude 4 pricing
"""

import json
from datetime import datetime, timedelta

# AWS Pricing (US East 1 - October 2025)
PRICING = {
    'step_functions': {
        'state_transitions': 0.000025,  # per state transition
    },
    'lambda': {
        'requests': 0.0000002,          # per request
        'gb_seconds': 0.0000166667,     # per GB-second
    },
    'bedrock': {
        'claude_4': {
            # Claude 4 pricing (estimated based on pattern - actual may be higher)
            'input_tokens': 0.015 / 1000,   # per 1K input tokens (5x Claude 3.5 Sonnet)
            'output_tokens': 0.075 / 1000   # per 1K output tokens (5x Claude 3.5 Sonnet)
        },
        'claude_3_5_sonnet': {
            'input_tokens': 0.003 / 1000,   # per 1K input tokens
            'output_tokens': 0.015 / 1000   # per 1K output tokens
        }
    },
    'dynamodb': {
        'read_request_units': 0.00000025,  # per RRU
        'write_request_units': 0.00000125, # per WRU
    },
    's3': {
        'put_requests': 0.0005,         # per 1000 PUT requests
        'get_requests': 0.0004          # per 1000 GET requests
    }
}

# System Architecture Analysis (same as before)
LAMBDA_FUNCTIONS = {
    'SecurityProfileProcessor': {
        'memory_mb': 128,
        'avg_duration_ms': 5000,
        'invocations_per_execution': 1
    },
    'AWSServiceDocumentationManager': {
        'memory_mb': 1024,
        'avg_duration_ms': 90000,  # 1.5 minutes
        'invocations_per_execution': 1
    },
    'AnalyzeSecurityRequirements': {
        'memory_mb': 1024,
        'avg_duration_ms': 50000,  # 50 seconds
        'invocations_per_execution': 1
    },
    'GenerateSecurityControls': {
        'memory_mb': 1024,
        'avg_duration_ms': 195000, # 3.25 minutes
        'invocations_per_execution': 1
    },
    'GenerateIaCTemplate': {
        'memory_mb': 1024,
        'avg_duration_ms': 37000,  # 37 seconds
        'invocations_per_execution': 1
    },
    'GenerateServiceProfile': {
        'memory_mb': 1024,
        'avg_duration_ms': 20000,  # 20 seconds
        'invocations_per_execution': 1
    },
    'GenerateIAMModel': {
        'memory_mb': 1024,
        'avg_duration_ms': 380000, # 6.3 minutes
        'invocations_per_execution': 1
    }
}

# Bedrock Usage Estimates (using Claude 4)
BEDROCK_USAGE = {
    'AnalyzeSecurityRequirements': {
        'model': 'claude_4',
        'input_tokens': 15000,   # Large security profile + service docs
        'output_tokens': 8000    # Detailed analysis
    },
    'GenerateSecurityControls': {
        'model': 'claude_4',
        'input_tokens': 20000,   # Analysis + requirements
        'output_tokens': 12000   # Multiple security controls
    },
    'GenerateIaCTemplate': {
        'model': 'claude_4',
        'input_tokens': 10000,   # Security controls + templates
        'output_tokens': 5000    # IaC templates
    },
    'GenerateServiceProfile': {
        'model': 'claude_4',
        'input_tokens': 8000,    # Service documentation
        'output_tokens': 4000    # Service profile
    },
    'GenerateIAMModel': {
        'model': 'claude_4',
        'input_tokens': 12000,   # Service actions + requirements
        'output_tokens': 6000    # IAM models
    }
}

# Execution Success Rate Analysis
EXECUTION_STATS = {
    'total_executions': 10,
    'successful_executions': 4,
    'success_rate': 0.4,  # 40% success rate
    'failed_executions': 6,
    'avg_successful_duration_minutes': 18.5  # Based on actual successful executions
}

# DynamoDB and S3 usage (same as before)
DYNAMODB_USAGE = {
    'read_requests': 50,
    'write_requests': 25,
}

S3_USAGE = {
    'put_requests': 15,
    'get_requests': 10,
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
    """Calculate Bedrock cost for AI function using Claude 4"""
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
        'total_cost': read_cost + write_cost
    }

def calculate_s3_cost():
    """Calculate S3 cost per execution"""
    put_cost = (S3_USAGE['put_requests'] / 1000) * PRICING['s3']['put_requests']
    get_cost = (S3_USAGE['get_requests'] / 1000) * PRICING['s3']['get_requests']
    
    return {
        'put_cost': put_cost,
        'get_cost': get_cost,
        'total_cost': put_cost + get_cost
    }

def generate_updated_cost_report():
    """Generate comprehensive cost analysis report with Claude 4 and success rate"""
    print("=" * 80)
    print("SECURITY CONFIGURATION SYSTEM - UPDATED COST ANALYSIS")
    print("=" * 80)
    print(f"Analysis Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Account: 992382514659")
    print(f"Region: us-east-1")
    print(f"Model: Claude 4 (us.anthropic.claude-sonnet-4-20250514-v1:0)")
    print()
    
    # Execution Success Rate Analysis
    print("EXECUTION SUCCESS RATE ANALYSIS")
    print("-" * 50)
    print(f"Total Recent Executions: {EXECUTION_STATS['total_executions']}")
    print(f"Successful Executions: {EXECUTION_STATS['successful_executions']}")
    print(f"Failed/Timeout Executions: {EXECUTION_STATS['failed_executions']}")
    print(f"Success Rate: {EXECUTION_STATS['success_rate']*100:.1f}%")
    print(f"Average Successful Duration: {EXECUTION_STATS['avg_successful_duration_minutes']:.1f} minutes")
    print()
    
    # Lambda Costs
    print("LAMBDA FUNCTION COSTS PER SUCCESSFUL EXECUTION")
    print("-" * 50)
    lambda_total = 0
    
    for func_name, config in LAMBDA_FUNCTIONS.items():
        cost_detail = calculate_lambda_cost(func_name, config)
        lambda_total += cost_detail['total_cost']
        
        print(f"{func_name}:")
        print(f"  Duration: {cost_detail['duration_seconds']:.1f}s")
        print(f"  Total Cost: ${cost_detail['total_cost']:.8f}")
        print()
    
    print(f"TOTAL LAMBDA COST: ${lambda_total:.6f}")
    print()
    
    # Bedrock Costs with Claude 4
    print("BEDROCK AI COSTS PER SUCCESSFUL EXECUTION (CLAUDE 4)")
    print("-" * 50)
    bedrock_total = 0
    
    for func_name, usage in BEDROCK_USAGE.items():
        cost_detail = calculate_bedrock_cost(func_name, usage)
        bedrock_total += cost_detail['total_cost']
        
        print(f"{func_name}:")
        print(f"  Input Tokens: {usage['input_tokens']:,}")
        print(f"  Output Tokens: {usage['output_tokens']:,}")
        print(f"  Input Cost: ${cost_detail['input_cost']:.6f}")
        print(f"  Output Cost: ${cost_detail['output_cost']:.6f}")
        print(f"  Total Cost: ${cost_detail['total_cost']:.6f}")
        print()
    
    print(f"TOTAL BEDROCK COST: ${bedrock_total:.6f}")
    print()
    
    # Other service costs
    sf_cost = calculate_step_functions_cost()
    ddb_cost = calculate_dynamodb_cost()
    s3_cost = calculate_s3_cost()
    
    print("OTHER SERVICE COSTS PER SUCCESSFUL EXECUTION")
    print("-" * 50)
    print(f"Step Functions: ${sf_cost['cost']:.8f}")
    print(f"DynamoDB: ${ddb_cost['total_cost']:.8f}")
    print(f"S3: ${s3_cost['total_cost']:.8f}")
    print()
    
    # Cost per successful execution
    successful_execution_cost = lambda_total + bedrock_total + sf_cost['cost'] + ddb_cost['total_cost'] + s3_cost['total_cost']
    
    print("COST SUMMARY PER SUCCESSFUL EXECUTION")
    print("=" * 50)
    print(f"Lambda Functions:     ${lambda_total:.6f} ({lambda_total/successful_execution_cost*100:.1f}%)")
    print(f"Bedrock AI (Claude 4): ${bedrock_total:.6f} ({bedrock_total/successful_execution_cost*100:.1f}%)")
    print(f"Step Functions:       ${sf_cost['cost']:.6f} ({sf_cost['cost']/successful_execution_cost*100:.1f}%)")
    print(f"DynamoDB:            ${ddb_cost['total_cost']:.6f} ({ddb_cost['total_cost']/successful_execution_cost*100:.1f}%)")
    print(f"S3:                  ${s3_cost['total_cost']:.6f} ({s3_cost['total_cost']/successful_execution_cost*100:.1f}%)")
    print("-" * 50)
    print(f"COST PER SUCCESSFUL EXECUTION: ${successful_execution_cost:.6f}")
    print()
    
    # Effective cost considering failures
    effective_cost_per_attempt = successful_execution_cost / EXECUTION_STATS['success_rate']
    
    print("EFFECTIVE COST ANALYSIS (INCLUDING FAILURES)")
    print("=" * 50)
    print(f"Cost per successful execution: ${successful_execution_cost:.6f}")
    print(f"Success rate: {EXECUTION_STATS['success_rate']*100:.1f}%")
    print(f"EFFECTIVE COST PER ATTEMPT: ${effective_cost_per_attempt:.6f}")
    print(f"Waste due to failures: ${effective_cost_per_attempt - successful_execution_cost:.6f} ({((effective_cost_per_attempt - successful_execution_cost)/effective_cost_per_attempt)*100:.1f}%)")
    print()
    
    # Monthly projections based on successful executions
    print("MONTHLY COST PROJECTIONS (SUCCESSFUL EXECUTIONS)")
    print("-" * 50)
    executions_scenarios = [10, 50, 100, 500, 1000]
    
    for executions in executions_scenarios:
        monthly_cost_successful = successful_execution_cost * executions
        monthly_cost_with_failures = effective_cost_per_attempt * executions
        print(f"{executions:4d} successful executions: ${monthly_cost_successful:.2f}")
        print(f"     (with {EXECUTION_STATS['success_rate']*100:.0f}% success rate): ${monthly_cost_with_failures:.2f}")
        print()
    
    # Cost comparison with Claude 3.5 Sonnet
    print("COST COMPARISON: CLAUDE 4 vs CLAUDE 3.5 SONNET")
    print("-" * 50)
    
    # Calculate Claude 3.5 Sonnet cost
    claude_35_bedrock_cost = 0
    for func_name, usage in BEDROCK_USAGE.items():
        input_cost = usage['input_tokens'] * PRICING['bedrock']['claude_3_5_sonnet']['input_tokens']
        output_cost = usage['output_tokens'] * PRICING['bedrock']['claude_3_5_sonnet']['output_tokens']
        claude_35_bedrock_cost += input_cost + output_cost
    
    claude_35_total = lambda_total + claude_35_bedrock_cost + sf_cost['cost'] + ddb_cost['total_cost'] + s3_cost['total_cost']
    
    print(f"Claude 4 (current):      ${successful_execution_cost:.6f}")
    print(f"Claude 3.5 Sonnet:       ${claude_35_total:.6f}")
    print(f"Difference:              ${successful_execution_cost - claude_35_total:.6f}")
    print(f"Claude 4 is {((successful_execution_cost/claude_35_total - 1)*100):.1f}% more expensive")
    print()
    
    # Optimization recommendations
    print("COST OPTIMIZATION RECOMMENDATIONS")
    print("-" * 50)
    print("1. IMMEDIATE - Improve Success Rate:")
    print(f"   - Current waste: ${effective_cost_per_attempt - successful_execution_cost:.6f} per attempt")
    print(f"   - Fix timeout issues to improve from {EXECUTION_STATS['success_rate']*100:.0f}% to 80% success rate")
    print(f"   - Potential savings: ${effective_cost_per_attempt - (successful_execution_cost/0.8):.6f} per attempt")
    print()
    print("2. MODEL OPTIMIZATION:")
    print(f"   - Switch to Claude 3.5 Sonnet: Save ${successful_execution_cost - claude_35_total:.6f} per execution")
    print(f"   - Use Claude 3 Haiku for simple tasks: Additional 75% savings on those tasks")
    print()
    print("3. RELIABILITY IMPROVEMENTS:")
    print("   - Implement pagination for large parameter sets")
    print("   - Add retry logic with exponential backoff")
    print("   - Increase Step Functions timeout to 60 minutes")
    print("   - Consider SQS integration for better reliability")
    
    return {
        'cost_per_successful_execution': successful_execution_cost,
        'effective_cost_per_attempt': effective_cost_per_attempt,
        'success_rate': EXECUTION_STATS['success_rate'],
        'claude_4_bedrock_cost': bedrock_total,
        'claude_35_alternative_cost': claude_35_total,
        'potential_savings_claude_35': successful_execution_cost - claude_35_total
    }

if __name__ == "__main__":
    generate_updated_cost_report()
