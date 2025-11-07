from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    CfnOutput,
    Tags,
)
from constructs import Construct
from typing import Dict

from cdk_emr_kb.constructs.vpc_endpoints import VpcEndpoints


class VpcStack(Stack):
    """
    VPC stack for EMR Knowledge Base infrastructure.
    Creates a VPC with configurable subnet architecture and VPC endpoints.
    """

    def __init__(self, scope: Construct, construct_id: str, config: dict, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Extract VPC configuration
        vpc_config = config.get("vpc", {})
        cidr = vpc_config.get("cidr", "10.0.0.0/16")
        vpc_config.get("maxAzs", 3)
        create_public_subnets = vpc_config.get("createPublicSubnets", True)
        create_endpoints = vpc_config.get("createEndpoints", True)

        # Define subnet configuration based on whether public subnets are needed
        subnet_configuration = []

        # Always add private subnets
        subnet_configuration.append(
            ec2.SubnetConfiguration(
                name="private",
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS if create_public_subnets else ec2.SubnetType.PRIVATE_ISOLATED,
                cidr_mask=24))

        # Add public subnets if needed
        if create_public_subnets:
            subnet_configuration.append(
                ec2.SubnetConfiguration(
                    name="public",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                )
            )

        # Create VPC with the specified configuration
        # Try a different set of availability zones that might support all required services
        # Based on AWS documentation, us-east-1d, us-east-1e, and us-east-1f might work better
        self.vpc = ec2.Vpc(
            self, "EmrKbVpc",
            vpc_name=f"{construct_id}-vpc",
            cidr=cidr,
            availability_zones=['us-east-1d', 'us-east-1e', 'us-east-1f'],  # Try a different set of AZs
            nat_gateways=1 if create_public_subnets else 0,
            subnet_configuration=subnet_configuration,
            # We'll create the S3 endpoint using our custom construct
            gateway_endpoints={}
        )

        # Create security groups
        self.security_groups = self._create_security_groups()

        # Create VPC endpoints if needed
        if create_endpoints:
            self.vpc_endpoints = VpcEndpoints(
                self, "VpcEndpoints",
                vpc=self.vpc,
                security_group=self.security_groups["vpce"],
                services=[
                    "s3",
                    "redshift-serverless",
                    "redshift-data",
                    "bedrock",
                    "bedrock-runtime",
                    "bedrock-agent",
                    "bedrock-agent-runtime"
                ]
            )

        # Add tags to VPC resources
        self._add_tags()

        # Create outputs
        self._create_outputs()

    def _create_security_groups(self) -> Dict[str, ec2.SecurityGroup]:
        """Create security groups for the VPC."""
        security_groups = {}

        # Security group for Redshift
        security_groups["redshift"] = ec2.SecurityGroup(
            self, "RedshiftSecurityGroup",
            vpc=self.vpc,
            description="Security group for Redshift Serverless",
            allow_all_outbound=True,
        )

        # Security group for VPC endpoints
        security_groups["vpce"] = ec2.SecurityGroup(
            self, "VpcEndpointSecurityGroup",
            vpc=self.vpc,
            description="Security group for VPC endpoints",
            allow_all_outbound=True,
        )

        # Allow HTTPS traffic from the VPC CIDR to the VPC endpoint security group
        security_groups["vpce"].add_ingress_rule(
            peer=ec2.Peer.ipv4(self.vpc.vpc_cidr_block),
            connection=ec2.Port.tcp(443),
            description="Allow HTTPS traffic within VPC"
        )

        return security_groups

    def _add_tags(self) -> None:
        """Add tags to VPC resources."""
        Tags.of(self.vpc).add("Name", f"{self.stack_name}-vpc")

        for name, sg in self.security_groups.items():
            Tags.of(sg).add("Name", f"{self.stack_name}-{name}-sg")

    def _create_outputs(self) -> None:
        """Create CloudFormation outputs."""
        CfnOutput(
            self, "VpcId",
            value=self.vpc.vpc_id,
            description="VPC ID",
            export_name=f"{self.stack_name}-VpcId"
        )

        # Output private subnet IDs
        private_subnet_ids = [subnet.subnet_id for subnet in self.vpc.private_subnets]
        CfnOutput(
            self, "PrivateSubnetIds",
            value=",".join(private_subnet_ids),
            description="Comma-separated list of private subnet IDs",
            export_name=f"{self.stack_name}-PrivateSubnetIds"
        )

        # Output public subnet IDs if they exist
        if self.vpc.public_subnets:
            public_subnet_ids = [subnet.subnet_id for subnet in self.vpc.public_subnets]
            CfnOutput(
                self, "PublicSubnetIds",
                value=",".join(public_subnet_ids),
                description="Comma-separated list of public subnet IDs",
                export_name=f"{self.stack_name}-PublicSubnetIds"
            )

        # Output security group IDs
        for name, sg in self.security_groups.items():
            CfnOutput(
                self, f"{name.capitalize()}SecurityGroupId",
                value=sg.security_group_id,
                description=f"ID of the {name} security group",
                export_name=f"{self.stack_name}-{name.capitalize()}SecurityGroupId"
            )
