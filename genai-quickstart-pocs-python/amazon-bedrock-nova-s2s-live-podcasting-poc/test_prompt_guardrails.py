# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0
"""Tests for AWS prompt guardrails — system prompt and per-turn prompt validation."""
import re
import pytest
from hypothesis import given, strategies as st


# ---------------------------------------------------------------------------
# Helpers — extract prompt strings from source modules
# ---------------------------------------------------------------------------

def _get_system_prompt():
    """Return the default_system_prompt by reading nova_sonic_client.py source."""
    import pathlib, ast
    source = pathlib.Path("nova_sonic_client.py").read_text()
    # Find the assignment and extract all the string literals in the parenthesised group
    marker = "default_system_prompt = ("
    start = source.index(marker) + len(marker)
    # Collect all quoted string fragments until the closing paren
    parts = []
    pos = start
    while pos < len(source):
        c = source[pos]
        if c == ')':
            break
        if c == '"':
            # Find the end of this string literal
            end = source.index('"', pos + 1)
            parts.append(ast.literal_eval(source[pos:end + 1]))
            pos = end + 1
        else:
            pos += 1
    return "".join(parts)


def _build_prompts(topic: str):
    """Return all per-turn prompt strings for a given topic."""
    prompts = []
    previous_matthew = "Welcome to the show."
    previous_tiffany = "Thanks for having me."
    pii_suffix = " Do not mention any real names, emails, or personal data."

    for i in range(10):
        if i % 2 == 0:
            if i == 0:
                prompt = (
                    f"You are Matthew, the host of a popular AWS cloud podcast. "
                    f"Welcome your guest Tiffany, an AWS Solutions Architect, and introduce today's AWS topic: {topic}. "
                    f"Be warm, enthusiastic, and set the stage for a deep dive into this AWS service or pattern. 2-3 sentences."
                    + pii_suffix
                )
            elif i == 8:
                prompt = (
                    f"You are Matthew, the AWS podcast host. Tiffany just said: {previous_tiffany}. "
                    f"This is the final exchange. Wrap up the conversation about {topic} with a key AWS takeaway or best practice "
                    f"and thank Tiffany for joining. 2-3 sentences."
                    + pii_suffix
                )
            else:
                prompt = (
                    f"You are Matthew, the AWS podcast host. Tiffany just said: {previous_tiffany}. "
                    f"React naturally to what she said, then ask a thoughtful follow-up question about {topic} "
                    f"related to AWS services, architecture, or best practices. "
                    f"Be conversational and curious. Do not re-introduce the topic or welcome Tiffany again. 1-2 sentences."
                    + pii_suffix
                )
        else:
            if i == 1:
                prompt = (
                    f"You are Tiffany, an AWS Solutions Architect and cloud expert guest on a podcast. "
                    f"Matthew just introduced the AWS topic: {previous_matthew}. "
                    f"Thank him for having you and share your initial perspective on {topic} from an AWS standpoint. "
                    f"Be insightful and engaging. 2-3 sentences."
                    + pii_suffix
                )
            else:
                prompt = (
                    f"You are Tiffany, an AWS Solutions Architect guest on a podcast. Matthew just said: {previous_matthew}. "
                    f"Respond naturally with your AWS expertise on {topic}. Share a specific AWS service recommendation, "
                    f"architecture pattern, or best practice. Be conversational and informative. Do not thank Matthew or "
                    f"re-introduce yourself — the conversation is already underway. 2-3 sentences."
                    + pii_suffix
                )
        prompts.append(prompt)
    return prompts


# ---------------------------------------------------------------------------
# PII regex patterns (same as guardrails.py)
# ---------------------------------------------------------------------------

_EMAIL_RE = re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}")
_PHONE_RE = re.compile(r"\b\d{3}[-.]?\d{3}[-.]?\d{4}\b")
_ACCOUNT_ID_RE = re.compile(r"\b\d{12}\b")
_ACCESS_KEY_RE = re.compile(r"\bAKIA[A-Z0-9]{16}\b")


# ===== Property 1: System prompt contains AWS keywords =====

class TestProperty1_AWSFocus:
    """Validates: Requirements 1.1"""

    def test_system_prompt_contains_aws(self):
        prompt = _get_system_prompt()
        assert "AWS" in prompt or "aws" in prompt.lower()

    def test_system_prompt_contains_cloud(self):
        prompt = _get_system_prompt()
        assert "cloud" in prompt.lower()


# ===== Property 2: System prompt contains PII guardrail =====

class TestProperty2_PIIPrevention:
    """Validates: Requirements 1.2, 3.1"""

    def test_system_prompt_mentions_pii(self):
        prompt = _get_system_prompt()
        assert "personally identifiable information" in prompt.lower() or "pii" in prompt.upper()

    def test_system_prompt_lists_pii_types(self):
        prompt = _get_system_prompt().lower()
        for term in ["email", "phone", "account id", "access key", "credential"]:
            assert term in prompt, f"System prompt should mention '{term}'"


# ===== Property 3: Redirect instruction present =====

class TestProperty3_Redirect:
    """Validates: Requirements 1.3"""

    def test_system_prompt_has_redirect(self):
        prompt = _get_system_prompt().lower()
        assert "redirect" in prompt or "unrelated" in prompt


# ===== Property 4: No PII patterns in per-turn prompts =====

class TestProperty4_NoPIIInPrompts:
    """Validates: Requirements 2.5, 3.2"""

    @given(topic=st.text(min_size=1, max_size=100))
    def test_no_email_in_prompts(self, topic):
        for prompt in _build_prompts(topic):
            assert not _EMAIL_RE.search(prompt), f"Email found in prompt with topic={topic!r}"

    @given(topic=st.text(min_size=1, max_size=100))
    def test_no_access_key_in_prompts(self, topic):
        for prompt in _build_prompts(topic):
            assert not _ACCESS_KEY_RE.search(prompt), f"Access key found in prompt with topic={topic!r}"


# ===== Property 5: Generic references instruction =====

class TestProperty5_GenericReferences:
    """Validates: Requirements 3.3"""

    def test_system_prompt_uses_generic_references(self):
        prompt = _get_system_prompt().lower()
        assert "a customer" in prompt or "generic" in prompt or "an organization" in prompt
