"""Behavior-lock tests for the PE fund redemption agent tools.

These tests capture the CURRENT behavior of the pure data-handling logic
(CSV parsing, filtering, result envelope shape, and error paths) without any
live AWS calls. boto3's S3 client is mocked so the tests exercise only the
tool's own parsing/filtering code.

The suite is intentionally dependency-light (no live Bedrock/S3) so it can run
in CI and act as a regression gate for the dependency upgrades applied to
genai/uv.lock (pillow -> 12.3.0, mcp -> 1.30.0, starlette -> 1.8.0).
"""

import io
import json
import os
import sys
from unittest import mock

import pytest

# The tool modules read FUND_DOCUMENTS_BUCKET at import time and fall back to a
# boto3 list_buckets() call if it is unset. Set it before import so collection
# never touches the network.
os.environ.setdefault("FUND_DOCUMENTS_BUCKET", "test-bucket")
os.environ.setdefault("AWS_DEFAULT_REGION", "us-east-1")

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import tools.pull_s3_data___get_investors as investors_tool  # noqa: E402
import tools.pull_s3_data___get_fund_mapping as fund_mapping_tool  # noqa: E402
import agent_config  # noqa: E402


INVESTORS_CSV = (
    "investor_id,investor_name,estimated_net_worth\n"
    "INV001,Alice Capital,5000000\n"
    "INV002,Bob Holdings,250000\n"
    "INV003,Alice Ventures,12000000\n"
)

FUND_MAPPING_CSV = (
    "fund_id,fund_name,investor_class\n"
    "FUND001,Growth Fund,ClassA\n"
    "FUND002,Income Fund,ClassB\n"
    "FUND003,Growth Fund II,Institutional\n"
)


def _mock_s3_get_object(csv_body: str):
    """Build a mock boto3 S3 client whose get_object returns csv_body."""
    client = mock.MagicMock()
    client.get_object.return_value = {
        "Body": io.BytesIO(csv_body.encode("utf-8"))
    }

    # NoSuchKey must be an exception class on the mock's `exceptions` attr,
    # because the tool references s3_client.exceptions.NoSuchKey.
    class NoSuchKey(Exception):
        pass

    client.exceptions.NoSuchKey = NoSuchKey
    return client


def _parse_success(result):
    """Assert the success envelope shape and return the parsed inner JSON."""
    assert result["status"] == "success"
    assert result["toolUseId"] == "t-1"
    assert isinstance(result["content"], list) and result["content"]
    return json.loads(result["content"][0]["text"])


# --------------------------------------------------------------------------- #
# get_investors
# --------------------------------------------------------------------------- #

class TestGetInvestors:
    def _call(self, tool_input):
        with mock.patch.object(investors_tool, "boto3") as b:
            b.client.return_value = _mock_s3_get_object(INVESTORS_CSV)
            # Ensure the module-level bucket is set for the call.
            investors_tool.FUND_DOCUMENTS_BUCKET = "test-bucket"
            return investors_tool.pull_s3_data___get_investors(
                {"toolUseId": "t-1", "input": tool_input}
            )

    def test_returns_all_rows_with_no_filter(self):
        data = _parse_success(self._call({}))
        assert data["total_found"] == 3
        assert data["data_source"] == "S3 CSV Database"
        assert data["source"] == "s3://test-bucket/database/investors.csv"

    def test_filter_by_partial_name_case_insensitive(self):
        data = _parse_success(self._call({"investor_name": "alice"}))
        # Two rows contain "Alice" (Alice Capital, Alice Ventures).
        assert data["total_found"] == 2
        names = {row["investor_name"] for row in data["investors"]}
        assert names == {"Alice Capital", "Alice Ventures"}

    def test_filter_by_investor_id_exact(self):
        data = _parse_success(self._call({"investor_id": "INV002"}))
        assert data["total_found"] == 1
        assert data["investors"][0]["investor_name"] == "Bob Holdings"

    def test_filter_by_min_net_worth(self):
        data = _parse_success(self._call({"min_net_worth": 1000000}))
        # Alice Capital (5M) and Alice Ventures (12M) qualify; Bob (250k) does not.
        assert data["total_found"] == 2

    def test_filter_by_net_worth_range(self):
        data = _parse_success(
            self._call({"min_net_worth": 1000000, "max_net_worth": 6000000})
        )
        assert data["total_found"] == 1
        assert data["investors"][0]["investor_name"] == "Alice Capital"

    def test_limit_caps_results(self):
        data = _parse_success(self._call({"limit": 1}))
        assert data["total_found"] == 1

    def test_missing_bucket_returns_error(self):
        with mock.patch.object(investors_tool, "boto3"):
            investors_tool.FUND_DOCUMENTS_BUCKET = None
            result = investors_tool.pull_s3_data___get_investors(
                {"toolUseId": "t-1", "input": {}}
            )
        assert result["status"] == "error"
        assert "FUND_DOCUMENTS_BUCKET" in result["content"][0]["text"]
        investors_tool.FUND_DOCUMENTS_BUCKET = "test-bucket"  # restore


# --------------------------------------------------------------------------- #
# get_fund_mapping
# --------------------------------------------------------------------------- #

class TestGetFundMapping:
    def _call(self, tool_input):
        with mock.patch.object(fund_mapping_tool, "boto3") as b:
            b.client.return_value = _mock_s3_get_object(FUND_MAPPING_CSV)
            fund_mapping_tool.FUND_DOCUMENTS_BUCKET = "test-bucket"
            return fund_mapping_tool.pull_s3_data___get_fund_mapping(
                {"toolUseId": "t-1", "input": tool_input}
            )

    def test_returns_all_rows_with_no_filter(self):
        data = _parse_success(self._call({}))
        assert data["total_found"] == 3

    def test_filter_by_investor_class(self):
        data = _parse_success(self._call({"investor_class": "Institutional"}))
        assert data["total_found"] == 1
        assert data["funds"][0]["fund_id"] == "FUND003"

    def test_filter_by_partial_fund_name(self):
        data = _parse_success(self._call({"fund_name": "growth"}))
        # "Growth Fund" and "Growth Fund II" both match.
        assert data["total_found"] == 2


# --------------------------------------------------------------------------- #
# agent_config.load_prompt  (pure file I/O, no AWS)
# --------------------------------------------------------------------------- #

class TestLoadPrompt:
    def test_pe_prompt_appends_rules(self):
        text = agent_config.load_prompt("pe_prompt.md")
        assert isinstance(text, str) and len(text) > 0
        # pe_prompt uses rules.md (not mcp_rules.md); result concatenates both.
        rules_path = os.path.join(
            os.path.dirname(agent_config.__file__), "prompts", "rules.md"
        )
        with open(rules_path) as f:
            rules = f.read().strip()
        assert text.endswith(rules)

    def test_mcp_prompt_uses_mcp_rules(self):
        text = agent_config.load_prompt("mcp_prompt.md")
        mcp_rules_path = os.path.join(
            os.path.dirname(agent_config.__file__), "prompts", "mcp_rules.md"
        )
        with open(mcp_rules_path) as f:
            mcp_rules = f.read().strip()
        assert text.endswith(mcp_rules)
