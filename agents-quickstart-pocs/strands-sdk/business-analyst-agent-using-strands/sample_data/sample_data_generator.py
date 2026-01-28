"""
Sample Data Generator for Strands Agents Streamlit Demo

This script generates realistic sample datasets with embedded patterns
that showcase the capabilities of the Strands Agents SDK.

Note: This file uses random module extensively for test/sample data generation.
All random usage is intentional and safe for this purpose.
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random  # nosec B311 - random used extensively for test/sample data generation throughout this file
from pathlib import Path

# Set random seed for reproducibility
np.random.seed(42)
random.seed(42)

def generate_ecommerce_sales():
    """Generate e-commerce sales data with clear regional and seasonal patterns."""
    
    # Date range: 6 months
    start_date = datetime(2024, 7, 1)
    
    # Generate base data
    n_records = 500
    data = []
    
    regions = ['West Coast', 'East Coast', 'Midwest', 'South']
    region_multipliers = [1.35, 1.0, 0.85, 0.95]  # West Coast performs best
    
    categories = ['Electronics', 'Clothing', 'Books', 'Home & Garden']
    category_base_revenue = [800, 150, 45, 200]
    
    segments = ['Enterprise', 'Individual', 'Small Business']
    segment_multipliers = [3.0, 1.0, 1.5]
    
    for i in range(n_records):
        # Random date with Q4 bias (seasonal pattern)
        if random.random() < 0.4:  # 40% chance of Q4 date  # nosec B311 - used for test/sample data generation
            date = start_date + timedelta(days=random.randint(120, 183))  # Oct-Dec  # nosec B311 - used for test/sample data generation
        else:
            date = start_date + timedelta(days=random.randint(0, 183))  # nosec B311 - used for test/sample data generation
        
        region_idx = random.randint(0, 3)  # nosec B311 - used for test/sample data generation
        region = regions[region_idx]
        region_mult = region_multipliers[region_idx]
        
        category_idx = random.randint(0, 3)  # nosec B311 - used for test/sample data generation
        category = categories[category_idx]
        base_revenue = category_base_revenue[category_idx]
        
        segment_idx = random.randint(0, 2)  # nosec B311 - used for test/sample data generation
        segment = segments[segment_idx]
        segment_mult = segment_multipliers[segment_idx]
        
        # Q4 electronics boost
        seasonal_mult = 2.4 if (date.month >= 10 and category == 'Electronics') else 1.0
        
        # Calculate revenue with all multipliers plus some randomness
        revenue = base_revenue * region_mult * segment_mult * seasonal_mult * random.uniform(0.7, 1.3)  # nosec B311 - used for test/sample data generation
        units = max(1, int(revenue / (base_revenue * random.uniform(0.8, 1.2))))  # nosec B311 - used for test/sample data generation
        
        data.append({
            'Date': date.strftime('%Y-%m-%d'),
            'Region': region,
            'Product_Category': category,
            'Customer_Segment': segment,
            'Units_Sold': units,
            'Revenue': round(revenue, 2),
            'Customer_ID': f'CUST_{i+1000:04d}'
        })
    
    return pd.DataFrame(data)

def generate_marketing_campaigns():
    """Generate marketing campaign data with clear ROI patterns."""
    
    campaigns = [
        # Email campaigns (high ROI)
        ('Summer Email Blast', 'Email', 2500, 450),
        ('Product Launch Email', 'Email', 1800, 420),
        ('Newsletter Promotion', 'Email', 1200, 480),
        ('Customer Winback Email', 'Email', 3000, 400),
        
        # Social media campaigns (good reach, medium ROI)
        ('Brand Awareness Social', 'Social Media', 8000, 220),
        ('Product Demo Social', 'Social Media', 5500, 240),
        ('Influencer Partnership', 'Social Media', 12000, 200),
        ('Video Content Campaign', 'Social Media', 7200, 260),
        
        # Paid search (high volume, lower ROI)
        ('Google Ads - Generic', 'Paid Search', 15000, 180),
        ('Google Ads - Brand', 'Paid Search', 8000, 200),
        ('Bing Ads Campaign', 'Paid Search', 6000, 160),
        ('Product Keywords', 'Paid Search', 20000, 170),
        
        # Display advertising (lowest ROI)
        ('Banner Ad Campaign', 'Display', 10000, 120),
        ('Retargeting Display', 'Display', 7500, 140),
        ('Video Display Ads', 'Display', 12000, 110),
        
        # Content marketing (variable ROI)
        ('Blog Content Push', 'Content', 3000, 280),
        ('Webinar Series', 'Content', 5000, 320),
        ('White Paper Campaign', 'Content', 2500, 350),
    ]
    
    data = []
    start_date = datetime(2024, 8, 1)
    
    for i, (name, channel, budget, roi_percent) in enumerate(campaigns):
        # Add some randomness to the ROI
        actual_roi = roi_percent * random.uniform(0.85, 1.15)  # nosec B311 - used for test/sample data generation
        revenue = budget * (actual_roi / 100)
        
        # Calculate other metrics based on channel characteristics
        if channel == 'Email':
            impressions = budget * random.uniform(8, 12)  # High efficiency  # nosec B311 - used for test/sample data generation
            ctr = random.uniform(0.08, 0.15)  # High CTR  # nosec B311 - used for test/sample data generation
        elif channel == 'Social Media':
            impressions = budget * random.uniform(15, 25)  # Good reach  # nosec B311 - used for test/sample data generation
            ctr = random.uniform(0.02, 0.06)  # Medium CTR  # nosec B311 - used for test/sample data generation
        elif channel == 'Paid Search':
            impressions = budget * random.uniform(5, 8)  # Lower reach but targeted  # nosec B311 - used for test/sample data generation
            ctr = random.uniform(0.03, 0.08)  # Good CTR  # nosec B311 - used for test/sample data generation
        elif channel == 'Display':
            impressions = budget * random.uniform(20, 35)  # High reach, low engagement  # nosec B311 - used for test/sample data generation
            ctr = random.uniform(0.005, 0.02)  # Low CTR  # nosec B311 - used for test/sample data generation
        else:  # Content
            impressions = budget * random.uniform(10, 18)  # nosec B311 - used for test/sample data generation
            ctr = random.uniform(0.04, 0.10)  # nosec B311 - used for test/sample data generation
        
        clicks = int(impressions * ctr)
        conversion_rate = random.uniform(0.02, 0.08)  # nosec B311 - used for test/sample data generation
        conversions = int(clicks * conversion_rate)
        
        campaign_date = start_date + timedelta(days=random.randint(0, 120))  # nosec B311 - used for test/sample data generation
        
        data.append({
            'Campaign_Name': name,
            'Channel': channel,
            'Start_Date': campaign_date.strftime('%Y-%m-%d'),
            'Budget': budget,
            'Impressions': int(impressions),
            'Clicks': clicks,
            'Conversions': conversions,
            'Revenue': round(revenue, 2),
            'ROI_Percent': round(actual_roi, 1)
        })
    
    return pd.DataFrame(data)

def generate_employee_analytics():
    """Generate employee data with clear correlation patterns."""
    
    departments = ['Engineering', 'Sales', 'Marketing', 'Customer Success', 'Operations']
    dept_base_salary = [95000, 75000, 70000, 65000, 60000]
    dept_satisfaction = [4.2, 3.6, 3.8, 4.0, 3.7]  # Engineering highest
    
    n_employees = 300
    data = []
    
    for i in range(n_employees):
        dept_idx = random.randint(0, 4)  # nosec B311 - used for test/sample data generation
        department = departments[dept_idx]
        base_salary = dept_base_salary[dept_idx]
        base_satisfaction = dept_satisfaction[dept_idx]
        
        # Years of experience (affects salary and performance)
        experience = random.randint(0, 15)  # nosec B311 - used for test/sample data generation
        experience_salary_boost = experience * 2500
        
        # Training hours (affects performance)
        training_hours = random.randint(5, 80)  # nosec B311 - used for test/sample data generation
        
        # Performance score (influenced by experience and training)
        base_performance = 3.0
        experience_boost = min(experience * 0.1, 1.0)  # Cap at 1.0
        training_boost = min(training_hours * 0.015, 1.2)  # Cap at 1.2
        performance_noise = random.uniform(-0.3, 0.3)  # nosec B311 - used for test/sample data generation
        
        performance_score = min(5.0, base_performance + experience_boost + training_boost + performance_noise)
        
        # Salary (influenced by experience, department, and some performance)
        performance_salary_boost = (performance_score - 3.0) * 5000
        salary_noise = random.uniform(-5000, 5000)  # nosec B311 - used for test/sample data generation
        salary = base_salary + experience_salary_boost + performance_salary_boost + salary_noise
        salary = max(40000, salary)  # Floor
        
        # Satisfaction (department base + some randomness, slightly correlated with performance)
        satisfaction_boost = (performance_score - 3.0) * 0.2
        satisfaction_noise = random.uniform(-0.4, 0.4)  # nosec B311 - used for test/sample data generation
        satisfaction = max(1.0, min(5.0, base_satisfaction + satisfaction_boost + satisfaction_noise))
        
        data.append({
            'Employee_ID': f'EMP_{i+1001:04d}',
            'Department': department,
            'Years_Experience': experience,
            'Salary': int(salary),
            'Performance_Score': round(performance_score, 1),
            'Satisfaction_Score': round(satisfaction, 1),
            'Training_Hours': training_hours
        })
    
    return pd.DataFrame(data)

def generate_support_tickets():
    """Generate support ticket data with resolution time patterns."""
    
    categories = ['Technical Issue', 'Billing Question', 'Account Access', 'Feature Request', 'Bug Report']
    priorities = ['High', 'Medium', 'Low']
    
    # Base resolution times by priority (in hours)
    priority_base_times = {'High': 2.3, 'Medium': 18, 'Low': 72}
    
    # Category difficulty multipliers
    category_multipliers = {
        'Technical Issue': 1.45,  # Harder
        'Billing Question': 0.6,  # Easy
        'Account Access': 0.8,   # Medium
        'Feature Request': 1.2,  # Medium-hard
        'Bug Report': 1.3        # Hard
    }
    
    n_tickets = 400
    data = []
    start_date = datetime(2024, 10, 1)
    
    # Agent performance (some are faster/better than others)
    agents = [f'Agent_{i+1:02d}' for i in range(8)]
    agent_efficiency = {agent: random.uniform(0.7, 1.3) for agent in agents}  # nosec B311 - used for test/sample data generation
    agent_satisfaction_bonus = {agent: random.uniform(-0.3, 0.4) for agent in agents}  # nosec B311 - used for test/sample data generation
    
    for i in range(n_tickets):
        # Create date with Monday bias (40% more tickets on Monday)
        days_offset = random.randint(0, 90)  # nosec B311 - used for test/sample data generation
        ticket_date = start_date + timedelta(days=days_offset)
        
        if ticket_date.weekday() == 0:  # Monday
            if random.random() < 0.4:  # 40% chance to keep this Monday ticket  # nosec B311 - used for test/sample data generation
                pass
            else:
                # Redistribute to other days
                ticket_date = start_date + timedelta(days=random.randint(0, 90))  # nosec B311 - used for test/sample data generation
        
        category = random.choice(categories)  # nosec B311 - used for test/sample data generation
        priority = random.choice(priorities)  # nosec B311 - used for test/sample data generation
        agent = random.choice(agents)  # nosec B311 - used for test/sample data generation
        
        # Calculate resolution time
        base_time = priority_base_times[priority]
        category_mult = category_multipliers[category]
        agent_mult = agent_efficiency[agent]
        time_noise = random.uniform(0.5, 1.8)  # nosec B311 - used for test/sample data generation
        
        resolution_time = base_time * category_mult * agent_mult * time_noise
        
        # Calculate satisfaction (higher for faster resolution, varies by agent)
        base_satisfaction = 4.0
        
        # Time penalty (longer resolution = lower satisfaction)
        if resolution_time < base_time * 0.8:
            time_bonus = 0.5
        elif resolution_time > base_time * 1.5:
            time_bonus = -0.8
        else:
            time_bonus = 0
        
        agent_bonus = agent_satisfaction_bonus[agent]
        satisfaction_noise = random.uniform(-0.3, 0.3)  # nosec B311 - used for test/sample data generation
        
        satisfaction = max(1.0, min(5.0, base_satisfaction + time_bonus + agent_bonus + satisfaction_noise))
        
        data.append({
            'Ticket_ID': f'TKT_{i+10001:05d}',
            'Created_Date': ticket_date.strftime('%Y-%m-%d'),
            'Priority': priority,
            'Category': category,
            'Resolution_Time_Hours': round(resolution_time, 1),
            'Customer_Satisfaction': round(satisfaction, 1),
            'Agent_ID': agent
        })
    
    return pd.DataFrame(data)

def main():
    """Generate all sample datasets."""
    
    # Create sample_data directory
    output_dir = Path('sample_data')
    output_dir.mkdir(exist_ok=True)
    
    print("🚀 Generating sample datasets for Strands Agents demo...")
    
    # Generate datasets
    datasets = {
        'ecommerce_sales.csv': generate_ecommerce_sales(),
        'marketing_campaigns.csv': generate_marketing_campaigns(),
        'employee_analytics.csv': generate_employee_analytics(),
        'support_tickets.csv': generate_support_tickets()
    }
    
    # Save datasets
    for filename, df in datasets.items():
        filepath = output_dir / filename
        df.to_csv(filepath, index=False)
        print(f"✅ Generated {filename}: {len(df)} rows, {len(df.columns)} columns")
    
    print(f"\n📁 All datasets saved to {output_dir}/")
    print("\n🎯 Recommended test questions:")
    print("E-commerce: 'What are our strongest performing regions and why?'")
    print("Marketing: 'Which marketing channels give us the best ROI?'")
    print("Employee: 'What factors correlate most with employee performance?'")
    print("Support: 'What patterns do you see in our ticket resolution times?'")
    
    print(f"\n📊 Dataset summaries:")
    for filename, df in datasets.items():
        print(f"\n{filename}:")
        print(f"  Columns: {', '.join(df.columns.tolist())}")
        print(f"  Sample insights embedded:")
        if 'ecommerce' in filename:
            print("    - West Coast outperforms other regions")
            print("    - Q4 electronics surge pattern")
            print("    - Enterprise segment higher value")
        elif 'marketing' in filename:
            print("    - Email campaigns highest ROI (~450%)")
            print("    - Paid search high volume, medium ROI")
            print("    - Clear diminishing returns patterns")
        elif 'employee' in filename:
            print("    - Training hours correlate with performance")
            print("    - Engineering highest satisfaction")
            print("    - Experience predicts salary growth")
        elif 'support' in filename:
            print("    - Priority system working effectively")
            print("    - Technical issues take longer")
            print("    - Agent performance variations")

if __name__ == "__main__":
    main()