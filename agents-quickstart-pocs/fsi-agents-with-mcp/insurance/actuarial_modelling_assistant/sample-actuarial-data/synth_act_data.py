import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random  # nosec B311 - random used for test/sample data generation
import math

# Set seed for reproducibility
np.random.seed(42)
random.seed(42)

# Number of policies to generate
num_policies = 5000


# Generate policy data
def generate_policy_data(num_policies):
    # Policy start dates between 2019-01-01 and 2022-12-31
    start_dates = [
        datetime(2019, 1, 1) + timedelta(days=random.randint(0, 1460))  # nosec B311 - used for test/sample data generation
        for _ in range(num_policies)
    ]

    # Policy IDs
    policy_ids = [f"P{i:06d}" for i in range(1, num_policies + 1)]

    # Policy duration (6 months or 12 months)
    durations = np.random.choice([6, 12], size=num_policies, p=[0.3, 0.7])

    # Policy end dates - Convert numpy.int64 to int
    end_dates = [
        start + timedelta(days=int(duration * 30))
        for start, duration in zip(start_dates, durations)
    ]

    # Product types
    product_types = np.random.choice(
        ["Auto", "Home", "Life", "Health"], size=num_policies, p=[0.4, 0.3, 0.2, 0.1]
    )

    # Geographic regions
    regions = np.random.choice(
        ["North", "South", "East", "West", "Central"], size=num_policies
    )

    # Risk scores (1-100, higher means riskier)
    risk_scores = np.random.normal(50, 15, num_policies)
    risk_scores = np.clip(risk_scores, 1, 100).round(2)

    # Premium calculation
    base_premiums = {"Auto": 800, "Home": 1200, "Life": 500, "Health": 2000}

    premiums = []
    for product, risk, duration in zip(product_types, risk_scores, durations):
        # Base premium adjusted for risk and duration
        base = base_premiums[product]
        risk_factor = 0.5 + (risk / 100 * 1.5)  # 0.5 to 2.0
        duration_factor = duration / 12

        # Add some random noise
        noise = np.random.normal(1, 0.1)

        premium = base * risk_factor * duration_factor * noise
        premiums.append(round(premium, 2))

    # Client age
    ages = np.random.normal(45, 15, num_policies).astype(int)
    ages = np.clip(ages, 18, 90)

    # Create DataFrame
    policies_df = pd.DataFrame(
        {
            "policy_id": policy_ids,
            "product_type": product_types,
            "region": regions,
            "client_age": ages,
            "risk_score": risk_scores,
            "start_date": start_dates,
            "end_date": end_dates,
            "duration_months": durations,
            "premium": premiums,
        }
    )

    return policies_df


# Generate claims data
def generate_claims_data(policies_df):
    # Probability of claim for each product type
    claim_probabilities = {"Auto": 0.15, "Home": 0.08, "Life": 0.02, "Health": 0.20}

    # Generate claims based on product type and risk score
    claims = []
    claim_ids = []
    claim_counter = 1

    for _, policy in policies_df.iterrows():
        # Base probability of claim
        base_prob = claim_probabilities[policy["product_type"]]

        # Adjust based on risk score
        risk_adjustment = (
            policy["risk_score"] / 50
        )  # normalize to have 1.0 at risk_score = 50
        prob = min(base_prob * risk_adjustment, 0.95)  # cap at 95%

        # Determine number of claims
        if policy["product_type"] == "Life":
            # Life policies can have at most 1 claim
            num_claims = np.random.binomial(1, prob)
        else:
            # Other policies can have multiple claims
            policy_duration = (
                policy["end_date"] - policy["start_date"]
            ).days / 365  # in years
            # Poisson distribution for number of claims, scaled by policy duration
            lambda_param = prob * policy_duration * 2
            num_claims = np.random.poisson(lambda_param)
            num_claims = min(num_claims, 5)  # Cap at 5 claims per policy

        for _ in range(num_claims):
            # Claim date between policy start and end date
            claim_date = policy["start_date"] + timedelta(
                days=random.randint(0, (policy["end_date"] - policy["start_date"]).days)  # nosec B311 - used for test/sample data generation
            )

            # Claim amount - this will depend on product type and have a long tail
            if policy["product_type"] == "Auto":
                # Auto claims - mixed distribution
                if random.random() < 0.8:  # nosec B311 - used for test/sample data generation  # Minor claims
                    amount = np.random.gamma(2, 1000)
                else:  # Major claims
                    amount = np.random.gamma(5, 5000)

            elif policy["product_type"] == "Home":
                # Home claims - higher variance
                if random.random() < 0.9:  # nosec B311 - used for test/sample data generation  # Regular claims
                    amount = np.random.gamma(2, 2000)
                else:  # Catastrophic claims
                    amount = np.random.gamma(3, 15000)

            elif policy["product_type"] == "Life":
                # Life claims - typically the full policy amount
                base_amount = 100000
                age_factor = math.exp(-0.03 * (policy["client_age"] - 40))
                amount = base_amount * age_factor * (1 + np.random.normal(0, 0.1))

            else:  # Health
                # Health claims - wide range
                if random.random() < 0.7:  # nosec B311 - used for test/sample data generation  # Regular claims
                    amount = np.random.gamma(1.5, 1000)
                elif random.random() < 0.95:  # nosec B311 - used for test/sample data generation  # Serious condition
                    amount = np.random.gamma(3, 5000)
                else:  # Critical condition
                    amount = np.random.gamma(2, 25000)

            # Add seasonality for certain claim types
            if policy["product_type"] == "Auto" and claim_date.month in [
                12,
                1,
                2,
            ]:  # Winter months
                amount *= 1.2  # Higher claims in winter
            elif policy["product_type"] == "Home" and claim_date.month in [
                6,
                7,
                8,
                9,
            ]:  # Summer/hurricane season
                amount *= 1.3  # Higher claims in hurricane season

            # Status - open, closed, in litigation
            days_since_claim = (datetime(2023, 1, 1) - claim_date).days

            if days_since_claim < 30:
                status = "Open"
            elif days_since_claim < 90:
                status = np.random.choice(["Open", "Closed"], p=[0.3, 0.7])
            else:
                if random.random() < 0.05:  # nosec B311 - used for test/sample data generation  # 5% of old claims are in litigation
                    status = "Litigation"
                else:
                    status = "Closed"

            # Claim settlement amount
            if status == "Closed":
                settlement_factor = np.random.beta(8, 2)  # Usually close to 1
                settlement = round(amount * settlement_factor, 2)
            else:
                settlement = None

            # Time to close (days)
            if status == "Closed":
                time_to_close = int(np.random.gamma(3, 10))
                time_to_close = min(time_to_close, days_since_claim)
            else:
                time_to_close = None

            # Claim ID
            claim_id = f"C{claim_counter:07d}"
            claim_counter += 1

            # Claim type
            if policy["product_type"] == "Auto":
                claim_types = [
                    "Collision",
                    "Theft",
                    "Vandalism",
                    "Injury",
                    "Property Damage",
                ]
                claim_type = np.random.choice(claim_types, p=[0.5, 0.1, 0.1, 0.2, 0.1])
            elif policy["product_type"] == "Home":
                claim_types = [
                    "Fire",
                    "Theft",
                    "Water Damage",
                    "Liability",
                    "Natural Disaster",
                ]
                claim_type = np.random.choice(claim_types, p=[0.1, 0.2, 0.4, 0.1, 0.2])
            elif policy["product_type"] == "Life":
                claim_type = "Death Benefit"
            else:  # Health
                claim_types = [
                    "Illness",
                    "Surgery",
                    "Accident",
                    "Preventive Care",
                    "Chronic Condition",
                ]
                claim_type = np.random.choice(claim_types, p=[0.3, 0.2, 0.2, 0.1, 0.2])

            claims.append(
                {
                    "claim_id": claim_id,
                    "policy_id": policy["policy_id"],
                    "claim_date": claim_date,
                    "claim_amount": round(amount, 2),
                    "claim_type": claim_type,
                    "status": status,
                    "settlement_amount": settlement,
                    "time_to_close_days": time_to_close,
                }
            )

            claim_ids.append(claim_id)

    claims_df = pd.DataFrame(claims)
    return claims_df


# Generate risk factor data
def generate_risk_factors(policies_df):
    risk_factors = []

    for _, policy in policies_df.iterrows():
        # Auto-specific risk factors
        if policy["product_type"] == "Auto":
            # Vehicle age (years)
            vehicle_age = max(1, int(np.random.gamma(3, 2)))

            # Vehicle value
            vehicle_value = max(5000, int(np.random.gamma(3, 5000)))

            # Engine power (HP)
            engine_power = int(np.random.normal(150, 50))

            # Driver experience (years)
            driver_exp = max(1, int(policy["client_age"] - 18 - np.random.gamma(1, 2)))

            # Prior accidents
            prior_accidents = int(
                np.random.poisson(max(0.2, (100 - policy["risk_score"]) / 100))
            )

            risk_factors.append(
                {
                    "policy_id": policy["policy_id"],
                    "vehicle_age": vehicle_age,
                    "vehicle_value": vehicle_value,
                    "engine_power": engine_power,
                    "driver_experience": driver_exp,
                    "prior_accidents": prior_accidents,
                    "home_value": None,
                    "construction_year": None,
                    "construction_type": None,
                    "security_system": None,
                    "smoker": None,
                    "health_condition": None,
                    "family_history": None,
                    "occupation_risk": None,
                }
            )

        # Home-specific risk factors
        elif policy["product_type"] == "Home":
            # Home value
            home_value = int(np.random.gamma(5, 50000))

            # Construction year
            construction_year = int(np.random.normal(1990, 20))
            construction_year = min(2022, max(1900, construction_year))

            # Construction type
            construction_types = ["Wood", "Brick", "Concrete", "Steel Frame"]
            construction_type = np.random.choice(construction_types)

            # Security system
            security_system = np.random.choice([True, False], p=[0.7, 0.3])

            risk_factors.append(
                {
                    "policy_id": policy["policy_id"],
                    "vehicle_age": None,
                    "vehicle_value": None,
                    "engine_power": None,
                    "driver_experience": None,
                    "prior_accidents": None,
                    "home_value": home_value,
                    "construction_year": construction_year,
                    "construction_type": construction_type,
                    "security_system": security_system,
                    "smoker": None,
                    "health_condition": None,
                    "family_history": None,
                    "occupation_risk": None,
                }
            )

        # Life-specific risk factors
        elif policy["product_type"] == "Life":
            # Smoker - Fix the probability calculation to ensure it's between 0 and 1
            smoker_prob = min(max(0.2 + (policy["risk_score"] - 50) / 100, 0.05), 0.7)
            smoker = np.random.choice([True, False], p=[smoker_prob, 1 - smoker_prob])

            # Family history (0-5 scale, higher is worse)
            # Ensure parameters for beta distribution are positive
            alpha = max(0.1, policy["risk_score"] / 20)
            beta = max(0.1, 5 - policy["risk_score"] / 20)
            family_history = int(np.random.beta(alpha, beta) * 5)

            # Occupation risk (0-10 scale)
            # Ensure parameters for beta distribution are positive
            alpha = max(0.1, policy["risk_score"] / 20)
            beta = max(0.1, 10 - policy["risk_score"] / 20)
            occupation_risk = int(np.random.beta(alpha, beta) * 10)

            risk_factors.append(
                {
                    "policy_id": policy["policy_id"],
                    "vehicle_age": None,
                    "vehicle_value": None,
                    "engine_power": None,
                    "driver_experience": None,
                    "prior_accidents": None,
                    "home_value": None,
                    "construction_year": None,
                    "construction_type": None,
                    "security_system": None,
                    "smoker": smoker,
                    "health_condition": None,
                    "family_history": family_history,
                    "occupation_risk": occupation_risk,
                }
            )

        # Health-specific risk factors
        else:
            # Smoker - Fix the probability calculation
            smoker_prob = min(max(0.15 + (policy["risk_score"] - 50) / 150, 0.05), 0.5)
            smoker = np.random.choice([True, False], p=[smoker_prob, 1 - smoker_prob])

            # Health condition (0-5 scale, higher is worse)
            # Ensure parameters for beta distribution are positive
            alpha = max(0.1, policy["risk_score"] / 20)
            beta = max(0.1, 5 - policy["risk_score"] / 20)
            health_condition = int(np.random.beta(alpha, beta) * 5)

            # Family history (0-5 scale, higher is worse)
            # Ensure parameters for beta distribution are positive
            alpha = max(0.1, policy["risk_score"] / 25)
            beta = max(0.1, 5 - policy["risk_score"] / 25)
            family_history = int(np.random.beta(alpha, beta) * 5)

            risk_factors.append(
                {
                    "policy_id": policy["policy_id"],
                    "vehicle_age": None,
                    "vehicle_value": None,
                    "engine_power": None,
                    "driver_experience": None,
                    "prior_accidents": None,
                    "home_value": None,
                    "construction_year": None,
                    "construction_type": None,
                    "security_system": None,
                    "smoker": smoker,
                    "health_condition": health_condition,
                    "family_history": family_history,
                    "occupation_risk": None,
                }
            )

    risk_factors_df = pd.DataFrame(risk_factors)
    return risk_factors_df


# Generate payment history
def generate_payment_history(policies_df):
    payments = []

    for _, policy in policies_df.iterrows():
        # Determine payment schedule (monthly, quarterly, semi-annual, annual)
        if policy["duration_months"] == 6:
            schedule_options = ["Monthly", "Quarterly", "Semi-Annual"]
            schedule_probs = [0.4, 0.3, 0.3]
        else:  # 12 months
            schedule_options = ["Monthly", "Quarterly", "Semi-Annual", "Annual"]
            schedule_probs = [0.5, 0.2, 0.2, 0.1]

        payment_schedule = np.random.choice(schedule_options, p=schedule_probs)

        # Determine number of payments and amount per payment
        if payment_schedule == "Monthly":
            num_payments = int(policy["duration_months"])
            amount_per_payment = policy["premium"] / num_payments
        elif payment_schedule == "Quarterly":
            num_payments = int(policy["duration_months"]) // 3
            amount_per_payment = policy["premium"] / num_payments
        elif payment_schedule == "Semi-Annual":
            num_payments = int(policy["duration_months"]) // 6
            amount_per_payment = policy["premium"] / num_payments
        else:  # Annual
            num_payments = 1
            amount_per_payment = policy["premium"]

        # Generate payments
        payment_dates = []
        current_date = policy["start_date"]

        for i in range(int(num_payments)):
            if payment_schedule == "Monthly":
                next_date = current_date + timedelta(days=30)
            elif payment_schedule == "Quarterly":
                next_date = current_date + timedelta(days=90)
            elif payment_schedule == "Semi-Annual":
                next_date = current_date + timedelta(days=182)
            else:  # Annual
                next_date = current_date + timedelta(days=365)

            # If next payment is after policy end, don't include it
            if next_date > policy["end_date"]:
                break

            payment_dates.append(current_date)
            current_date = next_date

        # Generate payment status and actual amounts
        for i, payment_date in enumerate(payment_dates):
            # Payment status
            # First payment is always made
            if i == 0:
                status = "Paid"
                payment_amount = amount_per_payment
            else:
                # Some randomness in payment behavior
                if (
                    policy["risk_score"] > 80
                ):  # Higher risk clients more likely to miss payments
                    status_prob = [0.8, 0.1, 0.1]  # [Paid, Late, Missed]
                elif policy["risk_score"] > 60:
                    status_prob = [0.9, 0.07, 0.03]
                else:
                    status_prob = [0.97, 0.02, 0.01]

                status = np.random.choice(["Paid", "Late", "Missed"], p=status_prob)

                if status == "Paid":
                    payment_amount = amount_per_payment
                elif status == "Late":
                    # Late fee
                    payment_amount = amount_per_payment * 1.05
                else:  # Missed
                    payment_amount = 0

            payments.append(
                {
                    "policy_id": policy["policy_id"],
                    "payment_date": payment_date,
                    "scheduled_amount": round(amount_per_payment, 2),
                    "actual_amount": round(payment_amount, 2),
                    "status": status,
                    "payment_schedule": payment_schedule,
                }
            )

    payments_df = pd.DataFrame(payments)
    return payments_df


# Generate reserve adjustments for open claims
def generate_reserve_adjustments(claims_df):
    adjustments = []

    # Only generate adjustments for open or litigation claims
    open_claims = claims_df[claims_df["status"].isin(["Open", "Litigation"])]

    for _, claim in open_claims.iterrows():
        # Number of adjustments (1-5)
        num_adjustments = np.random.randint(1, 6)

        claim_date = claim["claim_date"]
        today = datetime(2023, 1, 1)
        days_range = (today - claim_date).days

        # If claim is very recent, fewer adjustments
        if days_range < 30:
            num_adjustments = min(num_adjustments, 2)

        # Initial reserve is typically close to claim amount
        current_reserve = claim["claim_amount"] * np.random.normal(0.9, 0.1)
        current_reserve = max(current_reserve, 0)

        # Generate adjustment dates, spaced out from claim date to today
        if days_range > 1 and num_adjustments < days_range:
            adjustment_days = sorted(
                np.random.choice(
                    range(1, days_range),
                    size=min(num_adjustments, days_range - 1),
                    replace=False,
                )
            )
            adjustment_dates = [
                claim_date + timedelta(days=int(day)) for day in adjustment_days
            ]

            for i, adj_date in enumerate(adjustment_dates):
                # Previous reserve
                prev_reserve = current_reserve

                # Direction of adjustment
                if i < len(adjustment_dates) - 1:
                    # Earlier adjustments more random
                    direction = np.random.choice([-1, 1], p=[0.4, 0.6])

                    # Adjustment magnitude (as percentage of previous reserve)
                    magnitude = np.random.beta(2, 5) * 0.3  # Usually small adjustments

                    # New reserve
                    current_reserve = prev_reserve * (1 + direction * magnitude)
                    current_reserve = max(current_reserve, 0)
                else:
                    # Last adjustment typically moves closer to final expected payout
                    if claim["status"] == "Litigation":
                        # Litigation cases often have higher reserves
                        expected_payout = claim["claim_amount"] * np.random.normal(
                            1.2, 0.2
                        )
                    else:
                        expected_payout = claim["claim_amount"] * np.random.normal(
                            0.95, 0.1
                        )

                    # Move towards expected payout
                    current_reserve = prev_reserve * 0.3 + expected_payout * 0.7

                adjustments.append(
                    {
                        "claim_id": claim["claim_id"],
                        "adjustment_date": adj_date,
                        "previous_reserve": round(prev_reserve, 2),
                        "new_reserve": round(current_reserve, 2),
                        "adjustment_amount": round(current_reserve - prev_reserve, 2),
                        "adjustment_reason": np.random.choice(
                            [
                                "New Information",
                                "Updated Estimate",
                                "Policy Review",
                                "Expert Assessment",
                                "Claim Development",
                            ]
                        ),
                    }
                )

    adjustments_df = pd.DataFrame(adjustments)
    return adjustments_df


# Main execution
if __name__ == "__main__":
    # Generate datasets
    policies_df = generate_policy_data(num_policies)
    claims_df = generate_claims_data(policies_df)
    risk_factors_df = generate_risk_factors(policies_df)
    payments_df = generate_payment_history(policies_df)
    reserve_adjustments_df = generate_reserve_adjustments(claims_df)

    # Export to CSV
    policies_df.to_csv("insurance_policies.csv", index=False)
    claims_df.to_csv("insurance_claims.csv", index=False)
    risk_factors_df.to_csv("insurance_risk_factors.csv", index=False)
    payments_df.to_csv("insurance_payments.csv", index=False)
    reserve_adjustments_df.to_csv("insurance_reserve_adjustments.csv", index=False)

    print(f"Generated {len(policies_df)} policies")
    print(f"Generated {len(claims_df)} claims")
    print(f"Generated {len(payments_df)} payment records")
    print(f"Generated {len(reserve_adjustments_df)} reserve adjustments")
