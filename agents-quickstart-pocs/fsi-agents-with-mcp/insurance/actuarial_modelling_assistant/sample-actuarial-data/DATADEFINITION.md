# Actuarial Data Definitions

This directory contains sample actuarial data files for insurance analysis and modeling.

## Data Files

### insurance_policies.csv
Contains policy information including:
- Policy ID, product type (Auto, Home, Life, Health)
- Geographic region
- Client age and risk score
- Policy dates and duration
- Premium amount

**Example (first 5 rows):**
```
policy_id,product_type,region,client_age,risk_score,start_date,end_date,duration_months,premium
P000001,Auto,West,67,32.34,2022-08-02,2023-07-28,12,782.53
P000002,Home,South,30,73.44,2019-08-17,2020-08-11,12,1823.63
P000003,Life,Central,70,63.33,2019-02-21,2020-02-16,12,709.73
P000004,Auto,East,41,75.96,2020-07-17,2021-07-12,12,1184.66
P000005,Life,East,67,58.1,2020-05-16,2020-11-12,6,356.26
```

### insurance_claims.csv
Contains claims data:
- Claim ID and associated policy ID
- Claim date, amount, and type
- Claim status (Open, Closed, Litigation)
- Settlement details for closed claims

**Example (first 5 rows):**
```
claim_id,policy_id,claim_date,claim_amount,claim_type,status,settlement_amount,time_to_close_days
C0000001,P000019,2021-11-27,1362.34,Liability,Closed,771.15,44.0
C0000002,P000023,2020-06-20,13224.66,Accident,Closed,9864.17,21.0
C0000003,P000027,2021-05-28,4135.68,Collision,Closed,3945.56,20.0
C0000004,P000034,2023-05-18,125093.04,Liability,Open,,
C0000005,P000036,2020-12-22,3070.09,Vandalism,Closed,2333.9,17.0
```

### insurance_risk_factors.csv
Contains risk factors specific to each policy type:
- Auto: vehicle age, value, engine power, driver experience, accident history
- Home: home value, construction details, security systems
- Life: smoking status, family health history, occupation risk
- Health: health conditions, family history

**Example (first 5 rows):**
```
policy_id,vehicle_age,vehicle_value,engine_power,driver_experience,prior_accidents,home_value,construction_year,construction_type,security_system,smoker,health_condition,family_history,occupation_risk
P000001,2.0,24447.0,170.0,47.0,0.0,,,,,,,,
P000002,,,,,,147485.0,1952.0,Concrete,False,,,,
P000003,,,,,,,,,,True,,2.0,2.0
P000004,5.0,20137.0,144.0,19.0,0.0,,,,,,,,
P000005,,,,,,,,,,False,,2.0,4.0
```

### insurance_payments.csv
Contains payment history:
- Payment schedule and dates
- Scheduled and actual payment amounts
- Payment status (Paid, Late, Missed)

**Example (first 5 rows):**
```
policy_id,payment_date,scheduled_amount,actual_amount,status,payment_schedule
P000001,2022-08-02,65.21,65.21,Paid,Monthly
P000001,2022-09-01,65.21,65.21,Paid,Monthly
P000001,2022-10-01,65.21,65.21,Paid,Monthly
P000001,2022-10-31,65.21,65.21,Paid,Monthly
P000001,2022-11-30,65.21,65.21,Paid,Monthly
```

### insurance_reserve_adjustments.csv
Contains reserve adjustments for open claims:
- Adjustment dates and amounts
- Reasons for adjustments 

**Example (first 5 rows):**
```
claim_id,adjustment_date,previous_reserve,new_reserve,adjustment_amount,adjustment_reason
C0000013,2022-12-17,2234.84,2149.64,-85.2,Updated Estimate
C0000013,2022-12-21,2149.64,1922.5,-227.14,Expert Assessment
C0000067,2022-02-02,6115.11,5712.51,-402.6,Expert Assessment
C0000067,2022-02-21,5712.51,5890.81,178.3,New Information
C0000067,2022-05-20,5890.81,6597.6,706.79,Expert Assessment 