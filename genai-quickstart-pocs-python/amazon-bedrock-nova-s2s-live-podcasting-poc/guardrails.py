# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0
"""Guardrails for the live podcast application — topic validation and PII filtering."""
import re

# ---------------------------------------------------------------------------
# AWS Topic Validation
# ---------------------------------------------------------------------------

AWS_KEYWORDS = [
    "aws", "amazon web services", "cloud", "serverless", "microservices", "containers",
    "s3", "lambda", "ec2", "dynamodb", "cloudfront", "sqs", "sns", "rds", "ecs", "eks",
    "iam", "vpc", "route 53", "cloudwatch", "bedrock", "sagemaker", "kinesis", "redshift",
    "elasticache", "aurora", "fargate", "step functions", "eventbridge", "api gateway",
    "cloudformation", "cdk", "terraform", "amplify", "cognito", "kms", "secrets manager",
    "elastic beanstalk", "lightsail", "glue", "athena", "emr", "quicksight", "neptune",
    "documentdb", "msk", "apprunner", "codepipeline", "codecommit", "codebuild",
    "codedeploy", "cloudtrail", "config", "guardduty", "inspector", "macie",
    "security hub", "waf", "shield", "organizations", "control tower", "cost explorer",
    "nova sonic", "nova", "bedrock agents", "bedrock guardrails", "knowledge bases",
]


def is_valid_aws_topic(topic: str) -> bool:
    """Return True if the topic contains at least one AWS-related keyword (case-insensitive)."""
    topic_lower = topic.lower()
    return any(kw in topic_lower for kw in AWS_KEYWORDS)


# ---------------------------------------------------------------------------
# PII Output Filtering
# ---------------------------------------------------------------------------

_ACCESS_KEY_RE = re.compile(r"\bAKIA[A-Z0-9]{16}\b")
_EMAIL_RE = re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}")
_PHONE_RE = re.compile(r"\b\d{3}[-.]?\d{3}[-.]?\d{4}\b")
_ACCOUNT_ID_RE = re.compile(r"\b\d{12}\b")


def scrub_pii(text: str) -> str:
    """Replace PII patterns in text with redaction placeholders."""
    text = _ACCESS_KEY_RE.sub("[access-key redacted]", text)
    text = _EMAIL_RE.sub("[email redacted]", text)
    text = _PHONE_RE.sub("[phone redacted]", text)
    text = _ACCOUNT_ID_RE.sub("[account-id redacted]", text)
    return text
