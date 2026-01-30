"""
Test script for the Car Insurance Claim System
Run this to generate a sample PDF and test the system
"""

import os
import sys
from datetime import datetime

# Add current directory to path
sys.path.append(os.path.dirname(__file__))

from insurance_claim_system.claim_system import (
    InsuranceClaimSystem, 
    AccidentType, 
    VehicleDamageLevel, 
    Vehicle, 
    AccidentDetails,
    PolicyHolder
)
from insurance_claim_system.pdf_generator import ClaimFormPDFGenerator

def main():
    print("=" * 60)
    print("CAR INSURANCE CLAIM SYSTEM - TEST")
    print("=" * 60)
    print()
    
    try:
        # Initialize system
        print("1. Initializing insurance system...")
        insurance_system = InsuranceClaimSystem()
        pdf_generator = ClaimFormPDFGenerator()
        print("   ✓ System initialized")
        
        # Create test policy holder
        print("\n2. Creating test policy holder...")
        test_holder = PolicyHolder(
            policy_id='POL-TEST-001',
            name='John Smith',
            phone='555-123-4567',
            email='john.smith@email.com',
            address='123 Main St, Anytown, ST 12345'
        )
        print(f"   ✓ Policy holder: {test_holder.name} - Policy: {test_holder.policy_id}")
        
        # Create test vehicle
        print("\n3. Creating test vehicle...")
        vehicle = Vehicle(
            make='Honda',
            model='Civic',
            year=2022,
            color='Red',
            license_plate='TEST123'
        )
        print(f"   ✓ Vehicle: {vehicle.year} {vehicle.make} {vehicle.model} ({vehicle.color})")
        
        # Create accident details
        print("\n4. Creating accident details...")
        accident_details = AccidentDetails(
            accident_date=datetime(2024, 12, 25),
            accident_time='3:45 PM',
            location='Highway 101 near Exit 15',
            description='Vehicle slid on wet pavement and hit guardrail during heavy rain. No injuries occurred, but front bumper and headlight were damaged.',
            accident_type=AccidentType.COLLISION,
            police_report_number='PR-2024-12345',
            other_party_info='No other vehicles involved',
            witnesses='Highway patrol officer John Smith witnessed the incident'
        )
        print(f"   ✓ Accident: {accident_details.accident_type.value} on {accident_details.accident_date.strftime('%Y-%m-%d')}")
        
        # Create claim
        print("\n5. Creating insurance claim...")
        claim = insurance_system.create_claim(
            policy_holder=test_holder,
            vehicle=vehicle,
            accident_details=accident_details,
            damage_level=VehicleDamageLevel.MODERATE,
            estimated_cost=3500.0
        )
        print(f"   ✓ Claim created with ID: {claim.claim_id}")
        
        # Generate PDF
        print("\n6. Generating PDF...")
        pdf_path = pdf_generator.generate_claim_pdf(claim)
        
        # Check if PDF was created
        if os.path.exists(pdf_path):
            file_size = os.path.getsize(pdf_path)
            abs_path = os.path.abspath(pdf_path)
            print(f"   ✓ PDF generated successfully!")
            print(f"   📄 File: {pdf_path}")
            print(f"   📁 Full path: {abs_path}")
            print(f"   📊 Size: {file_size:,} bytes")
            
            # Show directory contents
            claims_dir = os.path.dirname(pdf_path)
            print(f"\n7. Files in {claims_dir}:")
            if os.path.exists(claims_dir):
                files = [f for f in os.listdir(claims_dir) if f.endswith('.pdf')]
                if files:
                    for file in sorted(files):
                        full_path = os.path.join(claims_dir, file)
                        size = os.path.getsize(full_path)
                        print(f"   📄 {file} ({size:,} bytes)")
                else:
                    print("   (No PDF files found)")
            
            print(f"\n🎉 SUCCESS! You can now open the PDF file:")
            print(f"   macOS: open \"{abs_path}\"")
            print(f"   Windows: start \"\" \"{abs_path}\"")
            print(f"   Linux: xdg-open \"{abs_path}\"")
            
        else:
            print("   ✗ PDF generation failed!")
            print(f"   Expected path: {pdf_path}")
            
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1
    
    print("\n" + "=" * 60)
    print("TEST COMPLETE")
    print("=" * 60)
    return 0

if __name__ == "__main__":
    sys.exit(main())
