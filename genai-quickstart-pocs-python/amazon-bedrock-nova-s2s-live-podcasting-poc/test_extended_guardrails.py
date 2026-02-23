# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0
"""Tests for extended guardrails — topic validation and PII output filtering."""
import re
import string
import pytest
from hypothesis import given, assume, strategies as st

from guardrails import is_valid_aws_topic, scrub_pii, AWS_KEYWORDS


# ---------------------------------------------------------------------------
# Unit tests — is_valid_aws_topic
# ---------------------------------------------------------------------------

class TestIsValidAwsTopic:
    """Unit tests for topic validation."""

    @pytest.mark.parametrize("topic", [
        "Tell me about S3 versioning",
        "Lambda best practices",
        "How does EC2 auto-scaling work?",
        "AWS cost optimization",
        "Serverless architecture patterns",
        "Nova Sonic speech capabilities",
        "Bedrock Guardrails configuration",
    ])
    def test_valid_topics_accepted(self, topic):
        assert is_valid_aws_topic(topic) is True

    @pytest.mark.parametrize("topic", [
        "Best pizza in New York",
        "How to train a dog",
        "Stock market predictions",
        "My favorite movies",
    ])
    def test_invalid_topics_rejected(self, topic):
        assert is_valid_aws_topic(topic) is False

    def test_case_insensitive(self):
        assert is_valid_aws_topic("AWS") is True
        assert is_valid_aws_topic("aws") is True
        assert is_valid_aws_topic("Aws") is True
        assert is_valid_aws_topic("LAMBDA") is True

    def test_keyword_list_has_core_services(self):
        core = {"aws", "s3", "lambda", "ec2", "dynamodb", "bedrock", "iam", "vpc"}
        assert core.issubset(set(AWS_KEYWORDS))


# ---------------------------------------------------------------------------
# Unit tests — scrub_pii
# ---------------------------------------------------------------------------

class TestScrubPii:
    """Unit tests for PII output filtering."""

    def test_scrubs_email(self):
        assert scrub_pii("Contact [email redacted]") == "Contact [email redacted]"
        result = scrub_pii("Send to user@example.com please")
        assert "[email redacted]" in result
        assert "user@example.com" not in result

    def test_scrubs_phone(self):
        result = scrub_pii("Call 555-123-4567 now")
        assert "[phone redacted]" in result
        assert "555-123-4567" not in result

    def test_scrubs_account_id(self):
        result = scrub_pii("Account 123456789012 is active")
        assert "[account-id redacted]" in result
        assert "123456789012" not in result

    def test_scrubs_access_key(self):
        result = scrub_pii("Key AKIAIOSFODNN7EXAMPLE is exposed")
        assert "[access-key redacted]" in result
        assert "AKIAIOSFODNN7EXAMPLE" not in result

    def test_clean_text_unchanged(self):
        text = "AWS Lambda is a serverless compute service."
        assert scrub_pii(text) == text

    def test_multiple_pii_patterns(self):
        text = "Email user@test.com, call 555.123.4567, account 123456789012"
        result = scrub_pii(text)
        assert "user@test.com" not in result
        assert "555.123.4567" not in result
        assert "123456789012" not in result


# ---------------------------------------------------------------------------
# Property-based tests
# ---------------------------------------------------------------------------

# Strategy: random non-AWS text (letters only, no AWS keywords)
_safe_alpha = st.text(alphabet=string.ascii_letters, min_size=1, max_size=20)


# ===== Property 6: Topic with AWS keyword always passes =====

class TestProperty6_KeywordPasses:
    """Validates: Requirements 1.1, 1.4"""

    @given(prefix=_safe_alpha, keyword=st.sampled_from(AWS_KEYWORDS), suffix=_safe_alpha)
    def test_topic_with_keyword_passes(self, prefix, keyword, suffix):
        topic = f"{prefix} {keyword} {suffix}"
        assert is_valid_aws_topic(topic) is True


# ===== Property 7: Topic without AWS keywords fails =====

class TestProperty7_NoKeywordFails:
    """Validates: Requirements 1.1, 1.2"""

    @given(words=st.lists(st.text(alphabet="xyzqjw", min_size=3, max_size=8), min_size=1, max_size=5))
    def test_topic_without_keywords_fails(self, words):
        topic = " ".join(words)
        assume(not any(kw in topic.lower() for kw in AWS_KEYWORDS))
        assert is_valid_aws_topic(topic) is False


# ===== Property 8: Emails always scrubbed =====

class TestProperty8_EmailsScrubbed:
    """Validates: Requirements 2.2"""

    @given(
        local=st.from_regex(r"[a-zA-Z][a-zA-Z0-9_.+-]{0,10}", fullmatch=True),
        domain=st.from_regex(r"[a-zA-Z][a-zA-Z0-9-]{0,8}", fullmatch=True),
        tld=st.sampled_from(["com", "org", "net", "io"]),
    )
    def test_emails_always_scrubbed(self, local, domain, tld):
        email = f"{local}@{domain}.{tld}"
        result = scrub_pii(f"Contact {email} for info")
        assert email not in result
        assert "[email redacted]" in result


# ===== Property 9: Phone numbers always scrubbed =====

class TestProperty9_PhonesScrubbed:
    """Validates: Requirements 2.3"""

    @given(
        area=st.from_regex(r"[0-9]{3}", fullmatch=True),
        mid=st.from_regex(r"[0-9]{3}", fullmatch=True),
        last=st.from_regex(r"[0-9]{4}", fullmatch=True),
        sep=st.sampled_from(["-", ".", ""]),
    )
    def test_phones_always_scrubbed(self, area, mid, last, sep):
        phone = f"{area}{sep}{mid}{sep}{last}"
        result = scrub_pii(f"Call {phone} today")
        assert "[phone redacted]" in result


# ===== Property 10: Account IDs always scrubbed =====

class TestProperty10_AccountIdsScrubbed:
    """Validates: Requirements 2.4"""

    @given(digits=st.from_regex(r"[0-9]{12}", fullmatch=True))
    def test_account_ids_always_scrubbed(self, digits):
        result = scrub_pii(f"Account {digits} is active")
        assert "[account-id redacted]" in result


# ===== Property 11: Access keys always scrubbed =====

class TestProperty11_AccessKeysScrubbed:
    """Validates: Requirements 2.5"""

    @given(suffix=st.from_regex(r"[A-Z0-9]{16}", fullmatch=True))
    def test_access_keys_always_scrubbed(self, suffix):
        key = f"AKIA{suffix}"
        result = scrub_pii(f"Key {key} found")
        assert key not in result
        assert "[access-key redacted]" in result
