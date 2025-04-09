"""
Guest Manager - Handles guest profile operations.
"""
import uuid
from typing import Optional, Dict
from .hotel_system import Guest

class GuestManager:
    def __init__(self, hotel_system):
        self.hotel_system = hotel_system

    def create_guest(self, 
                    name: str,
                    email: str,
                    phone: str,
                    address: str) -> Guest:
        guest_id = str(uuid.uuid4())
        guest = Guest(guest_id, name, email, phone, address)
        self.hotel_system.guests[guest_id] = guest
        return guest

    def get_guest(self, guest_id: str) -> Optional[Guest]:
        return self.hotel_system.guests.get(guest_id)

    def update_guest(self,
                    guest_id: str,
                    name: Optional[str] = None,
                    email: Optional[str] = None,
                    phone: Optional[str] = None,
                    address: Optional[str] = None) -> Optional[Guest]:
        guest = self.get_guest(guest_id)
        if guest:
            if name is not None:
                guest.name = name
            if email is not None:
                guest.email = email
            if phone is not None:
                guest.phone = phone
            if address is not None:
                guest.address = address
            return guest
        return None

    def search_by_phone(self, phone: str) -> Optional[Guest]:
        """
        Search for a guest by their phone number.
        
        Args:
            phone: The phone number to search for.
            
        Returns:
            Guest object if found, None otherwise.
        """
        print("In search by phone: {}".format(phone))
        for guest in self.hotel_system.guests.values():
            if guest.phone == phone:
                print("found guest! {}".format(guest))
                return guest
        print("did not find guest!")
        return None

    #Function that returns a list of all guests
    def get_all_guests(self) -> Dict[str, Guest]:
        return self.hotel_system.guests

        