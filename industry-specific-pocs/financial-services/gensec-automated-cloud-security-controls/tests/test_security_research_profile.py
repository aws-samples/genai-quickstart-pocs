"""
Test Security Research Profile Generation

Note: This test file uses assert statements for test validation, which is appropriate
and safe in testing contexts. # nosec B101
"""
import json
import sys
import os

# Add lambda directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lambda', 'GenerateServiceProfile'))

def test_prompt_structure():
    """Test that the prompt structure is correct"""
    from lambda_function import create_security_research_profile_prompt
    
    # Mock data
    service_name = "AWS Systems Manager"
    iam_model = {
        "serviceName": "SSM",
        "actions": [
            {"action_name": "CreateDocument", "description": "Create SSM document"},
            {"action_name": "GetParameter", "description": "Get parameter value"}
        ]
    }
    business_use_cases = {
        "purpose": "Centralized operational data management",
        "scope": "Parameter stores and automation",
        "use_cases": [
            {
                "persona": "DevOps Engineer",
                "identity_type": "Human",
                "activities": ["Manage parameters", "Run automation"]
            }
        ],
        "constraints": "Max 10,000 parameters per region"
    }
    validated_actions = [
        {"action_name": "CreateDocument", "description": "Create SSM document", "accessLevel": "Write"},
        {"action_name": "GetParameter", "description": "Get parameter value", "accessLevel": "Read"}
    ]
    validated_parameters = []
    
    # Create prompt
    prompt = create_security_research_profile_prompt(
        service_name,
        iam_model,
        business_use_cases,
        validated_actions,
        validated_parameters
    )
    
    # Verify prompt structure
    assert "prompt" in prompt  # nosec B101 - assert statements are appropriate in test files
    assert "Security Research Profile" in prompt["prompt"]  # nosec B101 - assert statements are appropriate in test files
    assert service_name in prompt["prompt"]  # nosec B101 - assert statements are appropriate in test files
    assert "Q1:" in prompt["prompt"]  # nosec B101 - assert statements are appropriate in test files
    assert "Data Protection" in prompt["prompt"]  # nosec B101 - assert statements are appropriate in test files
    assert "Network Controls" in prompt["prompt"]  # nosec B101 - assert statements are appropriate in test files
    assert "Access Controls" in prompt["prompt"]  # nosec B101 - assert statements are appropriate in test files
    
    print("✓ Prompt structure test passed")
    print(f"\nPrompt length: {len(prompt['prompt'])} characters")
    print("\nPrompt preview (first 500 chars):")
    print(prompt["prompt"][:500])

if __name__ == "__main__":
    test_prompt_structure()
