from strands.models import BedrockModel

def get_model_config() -> BedrockModel:
    model_config = BedrockModel(
        model_id = "us.anthropic.claude-3-7-sonnet-20250219-v1:0",
        region_name = "us-west-2",
        streaming = True
    )

    return model_config