"""
Used to instantiate the HotelSystem and generate some simple test data.
This frame work is very simple happy path testing. Not intended to demonstrate conflict resolution
or other complex reservation tasks.
"""
from datetime import datetime, timedelta
import random  # nosec B311 - random used for test/sample data generation
from typing import List, Optional

from faker import Faker


from .hotel_system import  Guest, Reservation, Room, RoomType, HotelSystem
from .guest_manager import GuestManager, Guest
from .reservation_manager import ReservationManager

class HotelTestDataGenerator:
    def __init__(self):
        Faker.seed(42)
        random.seed(42)
        self.fake = Faker()
        #Set seed so this is reproducable
        self.hotel_system = HotelSystem()
        self.reservation_manager = ReservationManager(self.hotel_system)
        self.guest_manager = GuestManager(self.hotel_system)
        
    def generate_future_reservations(self, num_guests: int = 10) -> List[Reservation]:
        """
        Generate test data with the specified number of guests and future reservations.
        
        Args:
            num_guests: Number of fake guests to create (default: 10)
            
        Returns:
            List of created reservations
        """
        reservations = []
        room_types = list(RoomType)
        cities = ["New York", "Los Angeles", "Chicago", "Miami", "Las Vegas"]
        
        for i in range(num_guests):
            # Create a guest with fake data
            starting_phone=5555551234
            guest = self.guest_manager.create_guest(
                name=self.fake.name(),
                email=self.fake.email(),
                phone=starting_phone+i,
                address=self.fake.address()
            )
            
            # Create a reservation starting 30-90 days in the future
            future_days = random.randint(30, 90)  # nosec B311 - used for test/sample data generation
            stay_length = random.randint(1, 7)  # nosec B311 - used for test/sample data generation
            
            check_in = datetime.now() + timedelta(days=future_days)
            check_out = check_in + timedelta(days=stay_length)
            
            try:
                reservation = self.reservation_manager.create_reservation(
                    guest=guest,
                    city=random.choice(cities),  # nosec B311 - used for test/sample data generation
                    room_type=random.choice(room_types),  # nosec B311 - used for test/sample data generation
                    check_in=check_in,
                    check_out=check_out
                )
                reservations.append(reservation)
                
            except ValueError as e:
                print(f"Failed to create reservation for {guest.name}: {str(e)}")
                continue
                
        return reservations

    # HotelSystem methods


    def get_available_rooms(self, room_type: Optional[RoomType] = None, city: Optional[str] = None) -> List[Room]:
        """Get available rooms based on type and city"""
        if city:
            return self.hotel_system.get_available_rooms_by_city(city, room_type)
        return self.hotel_system.get_available_rooms(room_type)
    
    def get_available_rooms_by_city_and_date(self, city: str, room_type: Optional[RoomType] = None, check_in=datetime, check_out=datetime) -> List[Room]:
        """Get available rooms based on type and city"""
        return self.hotel_system.get_available_rooms_by_city_and_date(city, room_type, check_in, check_out)


    def get_all_hotels(self) -> List[dict]:
        """
        Get a list of all hotels in the system.
        
        Returns:
            List[dict]: List of dictionaries containing hotel information with 'name' and 'city' keys
        """
        return self.hotel_system.get_all_hotels()

    def get_rooms_by_city(self, city: str) -> List[Room]:
        """
        Get all rooms in a specific city.
        
        Args:
            city (str): The name of the city to search for rooms
            
        Returns:
            List[Room]: List of all rooms in the specified city
            
        Raises:
            KeyError: If the specified city is not found in the system
        """
        return self.hotel_system.get_rooms_by_city(city)

    # GuestManager methods
    def create_guest(self, name: str, email: str, phone: str, address: str) -> Guest:
        """Create a new guest"""
        return self.guest_manager.create_guest(name, email, phone, address)

    def get_guest(self, guest_id: str) -> Optional[Guest]:
        """Get guest by ID"""
        return self.guest_manager.get_guest(guest_id)

    def update_guest(self, guest_id: str, name: Optional[str] = None,
                    email: Optional[str] = None, phone: Optional[str] = None,
                    address: Optional[str] = None) -> Optional[Guest]:
        """Update guest information"""
        return self.guest_manager.update_guest(guest_id, name, email, phone, address)

    def search_by_phone(self, phone: str) -> Optional[Guest]:
        """Search for a guest by phone number"""
        return self.guest_manager.search_by_phone(phone)
    
    def get_all_guests(self):
        """Return all guests"""
        return self.guest_manager.get_all_guests()

    # ReservationManager methods
    def create_reservation(self, guest: Guest, city: str,
                         room_type: RoomType, check_in: datetime,
                         check_out: datetime) -> Optional[Reservation]:
        """Create a new reservation"""
        return self.reservation_manager.create_reservation(guest, city, room_type, check_in, check_out)

    def modify_reservation(self, reservation_id: str,
                         new_check_in: Optional[datetime] = None,
                         new_check_out: Optional[datetime] = None) -> Optional[Reservation]:
        """Modify an existing reservation"""
        return self.reservation_manager.modify_reservation(reservation_id, new_check_in, new_check_out)

    def cancel_reservation(self, reservation_id: str) -> bool:
        """Cancel a reservation"""
        return self.reservation_manager.cancel_reservation(reservation_id)

    def get_guest_reservations(self, guest_id: str) -> List[Reservation]:
        """Get all reservations for a guest"""
        return self.reservation_manager.get_guest_reservations(guest_id)

def main():
    """
    Example usage of the HotelTestDataGenerator
    """
    generator = HotelTestDataGenerator()
    reservations = generator.generate_future_reservations()
    
    print(f"\nCreated {len(reservations)} future reservations:")
    for reservation in reservations:
        print(f"\nReservation ID: {reservation.reservation_id}")
        print(f"Guest: {reservation.guest.name}")
        print(f"Check-in: {reservation.check_in}")
        print(f"Check-out: {reservation.check_out}")
        print(f"Room Type: {reservation.room.room_type.value}")
        print(f"Total Cost: ${reservation.total_cost}")

if __name__ == "__main__":
    main()