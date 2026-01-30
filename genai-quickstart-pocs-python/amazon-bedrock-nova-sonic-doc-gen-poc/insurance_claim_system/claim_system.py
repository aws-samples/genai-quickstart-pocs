"""
Car Insurance Claim System - Core components and functionality.
"""
from dataclasses import dataclass
from datetime import datetime
import json
from typing import Dict, List, Optional
from enum import Enum
import jsonpickle

class AccidentType(str, Enum):
    COLLISION = "Collision"
    COMPREHENSIVE = "Comprehensive"
    LIABILITY = "Liability"
    UNINSURED_MOTORIST = "Uninsured Motorist"
    
    def toJSON(self):
        return {"value": self.value}
    
    @staticmethod
    def fromString(from_value):
        for val in AccidentType:
            if val.value.lower() == from_value.lower():
                return val
        return AccidentType.COLLISION

class VehicleDamageLevel(str, Enum):
    MINOR = "Minor"
    MODERATE = "Moderate"
    SEVERE = "Severe"
    TOTAL_LOSS = "Total Loss"
    
    def toJSON(self):
        return {"value": self.value}
    
    @staticmethod
    def fromString(from_value):
        for val in VehicleDamageLevel:
            if val.value.lower() == from_value.lower():
                return val
        return VehicleDamageLevel.MINOR

@dataclass
class Vehicle:
    make: str
    model: str
    year: int
    color: str
    license_plate: str
    vin: str = ""
    
    def toJSON(self):
        return jsonpickle.encode(self, unpicklable=False)

@dataclass
class PolicyHolder:
    policy_id: str
    name: str
    phone: str
    email: str
    address: str
    drivers_license: str = ""
    
    def toJSON(self):
        return json.dumps(
            self,
            default=lambda o: o.__dict__, 
            sort_keys=True,
            indent=4)

@dataclass
class AccidentDetails:
    accident_date: datetime
    accident_time: str
    location: str
    description: str
    accident_type: AccidentType
    police_report_number: str = ""
    other_party_info: str = ""
    witnesses: str = ""
    
    def toJSON(self):
        return jsonpickle.encode(self, unpicklable=False)

@dataclass
class ClaimForm:
    claim_id: str
    policy_holder: PolicyHolder
    vehicle: Vehicle
    accident_details: AccidentDetails
    damage_level: VehicleDamageLevel
    estimated_damage_cost: float
    created_date: datetime
    status: str = "SUBMITTED"  # SUBMITTED, UNDER_REVIEW, APPROVED, DENIED
    
    def toJSON(self):
        return jsonpickle.encode(self, unpicklable=False)

class InsuranceClaimSystem:
    def __init__(self):
        self.claims: Dict[str, ClaimForm] = {}
    

    
    def create_claim(self, policy_holder: PolicyHolder, vehicle: Vehicle, 
                    accident_details: AccidentDetails, damage_level: VehicleDamageLevel,
                    estimated_cost: float = 0.0) -> ClaimForm:
        """Create a new insurance claim"""
        import secrets  # Use cryptographically secure random for claim IDs
        claim_id = 'abc' + str(secrets.randbelow(90000000) + 10000000)  # nosec B311 - using secrets module
        
        claim = ClaimForm(
            claim_id=claim_id,
            policy_holder=policy_holder,
            vehicle=vehicle,
            accident_details=accident_details,
            damage_level=damage_level,
            estimated_damage_cost=estimated_cost,
            created_date=datetime.now()
        )
        
        self.claims[claim_id] = claim
        return claim
