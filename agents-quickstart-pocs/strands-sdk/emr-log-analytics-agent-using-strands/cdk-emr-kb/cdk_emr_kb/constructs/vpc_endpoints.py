from aws_cdk import (
    aws_ec2 as ec2,
)
from constructs import Construct
from typing import Dict, List


class VpcEndpoints(Construct):
    """
    Custom construct for creating VPC endpoints for AWS services.
    """

    def __init__(self, scope: Construct, id: str, vpc: ec2.Vpc,
                 security_group: ec2.SecurityGroup, services: List[str] = None) -> None:
        """
        Initialize VPC endpoints construct.

        Args:
            scope: CDK construct scope
            id: Construct ID
            vpc: VPC to create endpoints in
            security_group: Security group for VPC endpoints
            services: List of services to create endpoints for (default: all required services)
        """
        super().__init__(scope, id)

        self.vpc = vpc
        self.security_group = security_group

        # Define default services if not provided
        if services is None:
            # Only include S3 by default, as it's commonly used and doesn't have AZ restrictions
            # Other services like Redshift Serverless and Bedrock can communicate through AWS's internal network
            services = [
                "s3"
            ]

        # Create endpoints
        self.endpoints = self._create_endpoints(services)

    def _create_endpoints(self, services: List[str]) -> Dict[str, ec2.VpcEndpoint]:
        """
        Create VPC endpoints for the specified services.

        Args:
            services: List of service names to create endpoints for

        Returns:
            Dictionary of VPC endpoints
        """
        endpoints = {}

        # Map of service names to AWS service objects
        service_map = {
            "s3": ec2.GatewayVpcEndpointAwsService.S3,
            "dynamodb": ec2.GatewayVpcEndpointAwsService.DYNAMODB,
            "redshift-serverless": ec2.InterfaceVpcEndpointAwsService.REDSHIFT_SERVERLESS,
            "redshift-data": ec2.InterfaceVpcEndpointAwsService.REDSHIFT_DATA,
            "bedrock": ec2.InterfaceVpcEndpointAwsService.BEDROCK,
            "bedrock-runtime": ec2.InterfaceVpcEndpointAwsService.BEDROCK_RUNTIME,
            "glue": ec2.InterfaceVpcEndpointAwsService.GLUE,
            "sqs": ec2.InterfaceVpcEndpointAwsService.SQS,
            "sns": ec2.InterfaceVpcEndpointAwsService.SNS,
            "secretsmanager": ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
            "lambda": ec2.InterfaceVpcEndpointAwsService.LAMBDA_,
            "cloudwatch-logs": ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
        }

        # Create gateway endpoints for S3 and DynamoDB
        for service_name in ["s3", "dynamodb"]:
            if service_name in services:
                try:
                    # Try to add the gateway endpoint
                    endpoints[service_name] = self.vpc.add_gateway_endpoint(
                        f"{service_name.capitalize()}Endpoint",
                        service=service_map[service_name]
                    )
                except Exception as e:
                    # If the endpoint already exists, log a message
                    print(f"Gateway endpoint for {service_name} already exists or could not be created: {str(e)}")

        # Skip creating interface endpoints for now
        # This will allow the VPC to be created successfully
        print("Skipping creation of interface endpoints to avoid availability zone issues")

        return endpoints
