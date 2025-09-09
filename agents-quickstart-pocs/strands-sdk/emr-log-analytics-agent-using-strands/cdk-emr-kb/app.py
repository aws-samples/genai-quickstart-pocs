#!/usr/bin/env python3
import os
import sys

from aws_cdk import Environment
import aws_cdk as cdk

# Import stacks
from cdk_emr_kb.vpc_stack import VpcStack
from cdk_emr_kb.redshift_stack import RedshiftStack
from cdk_emr_kb.bedrock_stack import BedrockStack
from cdk_emr_kb.data_stack import DataStack

# Import configuration utility
from cdk_emr_kb.utils.config import get_env_config


def main():
    app = cdk.App()

    try:
        # Get environment name from context or use default
        env_name = app.node.try_get_context("env") or "dev"

        # Get environment configuration
        env_config = get_env_config(app, env_name)

        # Create CDK environment
        env = Environment(
            account=os.environ.get("CDK_DEFAULT_ACCOUNT"),
            region=os.environ.get("CDK_DEFAULT_REGION"),
        )

        # Print environment information
        print(f"Deploying to environment: {env_name}")
        print(f"Account: {env.account}")
        print(f"Region: {env.region}")

        # Create stacks
        vpc_stack = VpcStack(app, f"EmrKb-VpcStack-{env_name}", env_config, env=env)

        data_stack = DataStack(app, f"EmrKb-DataStack-{env_name}", env_config, env=env)

        redshift_stack = RedshiftStack(
            app, f"EmrKb-RedshiftStack-{env_name}",
            vpc=vpc_stack.vpc,
            security_group=vpc_stack.security_groups["redshift"],
            config=env_config,
            s3_bucket=data_stack.bucket,
            env=env
        )

        # Use the workgroup ARN attribute
        # This will contain the properly formatted ARN with the UUID
        workgroup_arn = redshift_stack.workgroup.attr_workgroup_workgroup_arn

        bedrock_stack = BedrockStack(
            app, f"EmrKb-BedrockStack-{env_name}",
            workgroup_arn=workgroup_arn,
            glue_database=data_stack.database.database_input.name,
            s3_bucket=data_stack.bucket,
            config=env_config,
            env=env
        )

        # Add dependencies
        redshift_stack.add_dependency(vpc_stack)
        bedrock_stack.add_dependency(redshift_stack)
        bedrock_stack.add_dependency(data_stack)

        # Add tags to all stacks
        cdk.Tags.of(app).add("Project", "EMR-KB")
        cdk.Tags.of(app).add("Environment", env_name.capitalize())

    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

    app.synth()


if __name__ == "__main__":
    main()
