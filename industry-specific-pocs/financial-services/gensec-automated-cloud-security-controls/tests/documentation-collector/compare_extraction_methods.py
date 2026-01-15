#!/usr/bin/env python3

import sys
import os
import json
import time

# Add both lambda function paths
sys.path.append('../lambda/AWSServiceDocumentationManager')
sys.path.append('../lambda/AWSServiceDocumentationManagerAI')

# Mock environment variables
os.environ['DOCUMENTATION_BUCKET'] = 'test-bucket'
os.environ['DYNAMODB_TABLE_SERVICE_ACTIONS'] = 'test-actions'
os.environ['DYNAMODB_TABLE_SERVICE_PARAMETERS'] = 'test-parameters'
os.environ['DYNAMODB_TABLE_SERVICE_INVENTORY'] = 'test-inventory'

def compare_extraction_methods(service_id):
    """Compare traditional HTML parsing vs AI extraction"""
    print(f"\n{'='*60}")
    print(f"COMPARING EXTRACTION METHODS FOR: {service_id.upper()}")
    print(f"{'='*60}")
    
    results = {}
    
    # Test Traditional Method
    print(f"\n--- Traditional HTML Parsing ---")
    try:
        from lambda_function import AWSServiceDocumentationCollector
        
        collector_traditional = AWSServiceDocumentationCollector()
        collector_traditional.dynamodb = None
        collector_traditional.s3 = None
        
        start_time = time.time()
        actions_traditional = collector_traditional.collect_service_actions(service_id)
        traditional_time = time.time() - start_time
        
        results['traditional'] = {
            'actions_count': len(actions_traditional),
            'time_taken': traditional_time,
            'success': len(actions_traditional) > 0,
            'sample_actions': [a['action_name'] for a in actions_traditional[:3]] if actions_traditional else []
        }
        
        print(f"Actions found: {len(actions_traditional)}")
        print(f"Time taken: {traditional_time:.2f}s")
        if actions_traditional:
            print(f"Sample actions: {', '.join(results['traditional']['sample_actions'])}")
        
    except Exception as e:
        print(f"Traditional method failed: {str(e)}")
        results['traditional'] = {'error': str(e), 'success': False}
    
    # Test AI Method (mock - would need actual Bedrock access)
    print(f"\n--- AI-Powered Extraction (Simulated) ---")
    try:
        # This would normally use Bedrock, but we'll simulate the structure
        print("Note: AI method requires Bedrock access - showing expected structure")
        
        # Simulate what AI extraction would return
        simulated_ai_result = [
            {
                'action_name': 'CreateTopic',
                'service_action': f'{service_id.lower()}:CreateTopic',
                'description': 'Creates a new topic',
                'accessLevel': 'Write',
                'resource_types': ['topic'],
                'condition_keys': [],
                'dependent_actions': [],
                'extraction_method': 'ai_bedrock'
            }
        ]
        
        results['ai'] = {
            'actions_count': len(simulated_ai_result),
            'time_taken': 2.5,  # Estimated
            'success': True,
            'sample_actions': [a['action_name'] for a in simulated_ai_result],
            'note': 'Simulated - requires Bedrock access'
        }
        
        print(f"Expected actions: {len(simulated_ai_result)} (simulated)")
        print(f"Expected time: ~2.5s")
        print(f"Sample structure: {json.dumps(simulated_ai_result[0], indent=2)}")
        
    except Exception as e:
        print(f"AI method simulation failed: {str(e)}")
        results['ai'] = {'error': str(e), 'success': False}
    
    return results

def main():
    """Compare both methods for multiple services"""
    services = ['sns', 'ec2', 's3']
    
    all_results = {}
    
    for service in services:
        all_results[service] = compare_extraction_methods(service)
    
    # Summary
    print(f"\n{'='*60}")
    print("COMPARISON SUMMARY")
    print(f"{'='*60}")
    
    print(f"{'Service':<10} | {'Traditional':<15} | {'AI Method':<15} | {'Speed Comparison'}")
    print("-" * 70)
    
    for service, results in all_results.items():
        trad_status = "✓" if results.get('traditional', {}).get('success') else "✗"
        trad_count = results.get('traditional', {}).get('actions_count', 0)
        trad_time = results.get('traditional', {}).get('time_taken', 0)
        
        ai_status = "✓ (sim)" if results.get('ai', {}).get('success') else "✗"
        ai_count = results.get('ai', {}).get('actions_count', 0)
        ai_time = results.get('ai', {}).get('time_taken', 0)
        
        speed_comparison = "AI slower" if ai_time > trad_time else "AI faster"
        
        print(f"{service.upper():<10} | {trad_status} {trad_count:<10} | {ai_status} {ai_count:<10} | {speed_comparison}")
    
    print(f"\n{'='*60}")
    print("PROS AND CONS")
    print(f"{'='*60}")
    
    print("\nTraditional HTML Parsing:")
    print("  ✓ Fast execution")
    print("  ✓ No AI costs")
    print("  ✓ Deterministic results")
    print("  ✗ Brittle to HTML changes")
    print("  ✗ Complex parsing logic")
    print("  ✗ Requires manual updates")
    
    print("\nAI-Powered Extraction:")
    print("  ✓ Robust to format changes")
    print("  ✓ Handles complex structures")
    print("  ✓ Self-adapting")
    print("  ✓ Better error handling")
    print("  ✗ Slower execution")
    print("  ✗ AI inference costs")
    print("  ✗ Potential for hallucination")

if __name__ == "__main__":
    main()
