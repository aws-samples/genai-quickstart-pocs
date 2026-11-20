"""DeepEval-native pytest integration.

Teams that prefer test-runner semantics can run:

    deepeval test run tests/test_deepeval_metrics.py

This produces the same evaluation results as ``python -m src``, but surfaces
each assertion as a distinct pytest outcome. Useful for integration into
existing pytest-driven CI pipelines.

Every test here is an integration test (``-m integration``): it calls the
deployed agent (Amazon Lex V2 for the ``connect`` invoker, the AgentCore
Gateway for ``gateway``) and an Amazon Bedrock judge model. When the target
isn't configured (scripts/setup_env.sh or setup_env.ps1 not run), the tests
are skipped with a message saying which environment variables are missing.
"""

from __future__ import annotations

import os
from pathlib import Path

import pytest

from src.config import load_config
from src.invokers import build_invoker
from src.judge import get_bedrock_judge
from src.metrics import build_metrics
from src.test_cases import load_test_cases

try:
    from deepeval import assert_test
    from deepeval.test_case import LLMTestCase
except ImportError:  # pragma: no cover
    assert_test = None  # type: ignore[assignment]
    LLMTestCase = None  # type: ignore[assignment]


_ADVERSARIAL_CATEGORIES = {"jailbreak", "adversarial", "out_of_scope"}


def _load_test_cases_for_pytest():
    config_path = os.environ.get("HARNESS_CONFIG") or str(
        Path(__file__).resolve().parents[1] / "config" / "default.yaml"
    )
    cfg = load_config(config_path)
    cases_path = os.environ.get("HARNESS_TEST_CASES") or cfg.test_cases.path
    return cfg, load_test_cases(cases_path)


_CONFIG, _CASES = _load_test_cases_for_pytest()

pytestmark = pytest.mark.integration


def _missing_target_env(invoker_name: str, config) -> list:
    """Return the environment variables the chosen invoker needs but doesn't have."""
    if invoker_name == "connect":
        required = [config.invoker.connect.bot_id_env, config.invoker.connect.bot_alias_id_env]
        return [name for name in required if not os.environ.get(name)]
    if invoker_name == "gateway":
        gateway_id_env = config.invoker.gateway.gateway_id_env
        if os.environ.get(gateway_id_env) or os.environ.get("AGENTCORE_GATEWAY_URL"):
            return []
        return [f"{gateway_id_env} (or AGENTCORE_GATEWAY_URL)"]
    return []


@pytest.fixture(scope="session")
def integration_target():
    """Skip the suite, with a reason, unless the deployed agent is configured."""
    name = os.environ.get("HARNESS_INVOKER") or _CONFIG.invoker.default
    missing = _missing_target_env(name, _CONFIG)
    if missing:
        pytest.skip(
            f"integration test: the {name!r} invoker needs {', '.join(missing)}. "
            "Deploy the sample and run scripts/setup_env.sh (or setup_env.ps1), "
            "with AWS credentials that can call Amazon Bedrock, to run it."
        )
    return name


@pytest.fixture(scope="session")
def metrics(integration_target):
    judge = get_bedrock_judge(
        model_id=_CONFIG.aws.bedrock_model_id,
        region=_CONFIG.aws.region,
    )
    return build_metrics(
        judge_model=judge,
        correctness_threshold=_CONFIG.metrics.correctness_threshold,
        relevancy_threshold=_CONFIG.metrics.relevancy_threshold,
        guardrail_threshold=_CONFIG.metrics.guardrail_threshold,
    )


@pytest.fixture(scope="session")
def invoker(integration_target):
    inv = build_invoker(integration_target, _CONFIG)
    yield inv
    inv.close()


@pytest.mark.parametrize("case", _CASES, ids=[c.test_id for c in _CASES])
def test_agent_response(case, integration_target, invoker, metrics):
    if assert_test is None:  # pragma: no cover
        pytest.skip("deepeval is not installed")

    result = invoker.invoke(case.input)
    llm_case = LLMTestCase(
        input=case.input,
        actual_output=result.actual_output,
        expected_output=case.expected_outcome or None,
    )

    if case.category in _ADVERSARIAL_CATEGORIES:
        assert_test(llm_case, [metrics.guardrail])
    elif case.expected_outcome:
        assert_test(llm_case, [metrics.correctness, metrics.relevancy])
    else:
        assert_test(llm_case, [metrics.relevancy])
