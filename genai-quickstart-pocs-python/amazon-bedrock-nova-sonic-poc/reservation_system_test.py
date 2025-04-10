"""
Test file to demonstrate the functionality of HotelTestDataGenerator class.
This file shows how to use the HotelSystem methods exposed via HotelTestDataGenerator.
"""

from datetime import datetime, timedelta
import json
from hotel_reservation_system.hotel_test_data_generator import HotelTestDataGenerator
from hotel_reservation_system.hotel_system import RoomType, Room, Guest
import dateutil.parser

def test_hotel_system():
    # Initialize the test data generator
    test_generator = HotelTestDataGenerator()
    
    # Test getting all hotels
    all_hotels = test_generator.get_all_hotels()
    print("\nAll hotels in the system:")
    for hotel in all_hotels:
        print(f"- {hotel['name']} in {hotel['city']}")
    
    # Test getting all rooms in a specific city
    city = "Chicago"
    try:
        city_rooms = test_generator.get_rooms_by_city(city)
        print(f"\nAll rooms in {city}: {len(city_rooms)}")
        room_types = {}
        for room in city_rooms:
            room_types[room.room_type.value] = room_types.get(room.room_type.value, 0) + 1
        print("Room distribution:")
        for room_type, count in room_types.items():
            print(f"- {room_type}: {count} rooms")
    except KeyError as e:
        print(f"Error: {str(e)}")
    
    # Test getting available rooms in a city
    available_rooms = test_generator.get_available_rooms(room_type=RoomType.SUITE, city=city)
    print(f"\nAvailable SUITE rooms in {city}: {len(available_rooms)}")

    # Test getting available rooms in a city by date
    check_in=dateutil.parser.parse("05-20-2025")
    check_out=dateutil.parser.parse("05-25-2025")
    available_rooms = test_generator.get_available_rooms_by_city_and_date(room_type=None, city=city, check_in=datetime, check_out=datetime)
    print(f"\nAvailable rooms in {city} between {check_in} and {check_out} {len(available_rooms)}")
    room_list = []
    for room in available_rooms:
        print(room)
        room_list.append(room.toJSON())
    print(room_list)
    roomlist_json = []
    for room in available_rooms:
            roomlist_json.append(room.toJSON())
            print("back from get avail rooms, returning")
            print({"rooms": roomlist_json})
    
    # Generate future reservations with default number of guests (10)
    reservations = test_generator.generate_future_reservations()
    print(f"\nGenerated {len(reservations)} future reservations")
    
    # Test creating a new guest
    new_guest = test_generator.create_guest(
        name="John Doe",
        email="john.doe@example.com",
        phone="123-456-7890",
        address="123 Main St"
    )
    print(f"\nCreated new guest: {new_guest.name}")
    
    # Test getting guest by ID
    retrieved_guest = test_generator.get_guest(new_guest.guest_id)
    print(f"Retrieved guest: {retrieved_guest.name}")
    
    # Test updating guest information
    test_generator.update_guest(
        guest_id=new_guest.guest_id,
        name="John Smith",
        email="john.smith@example.com"
    )
    updated_guest = test_generator.get_guest(new_guest.guest_id)
    print(f"\nUpdated guest name: {updated_guest.name}")
    
    # Test searching guest by phone
    found_guest = test_generator.search_by_phone("123-456-7890")
    print(f"\nFound guest by phone: {found_guest.name}")
    
    # Test getting all guests
    all_guests = test_generator.get_all_guests()
    print(f"\nTotal number of guests: {len(all_guests)}")
    
    # Test creating a new reservation
    check_in = datetime.now() + timedelta(days=7)
    check_out = check_in + timedelta(days=3)
    new_reservation = test_generator.create_reservation(
        guest=new_guest,
        city="Miami",
        room_type=RoomType.DELUXE,
        check_in=check_in,
        check_out=check_out
    )
    print(f"\nCreated new reservation for {new_guest.name}")
    
    # Test modifying reservation
    modified_check_out = check_out + timedelta(days=2)
    test_generator.modify_reservation(
        reservation_id=new_reservation.reservation_id,
        new_check_out=modified_check_out
    )
    print(f"Modified reservation check-out date")
    
    # Test getting guest reservations
    guest_reservations = test_generator.get_guest_reservations(new_guest.guest_id)
    print(f"\nRetrieved {len(guest_reservations)} reservations for {new_guest.name}")
    
    # Test canceling reservation
    cancelled = test_generator.cancel_reservation(new_reservation.reservation_id)
    print(f"\nCancelled reservation: {cancelled}")

    # Test error handling for non-existent city
    try:
        rooms = test_generator.get_rooms_by_city("NonExistentCity")
        print("This should not be printed")
    except KeyError as e:
        print(f"\nExpected error when searching non-existent city: {str(e)}")

if __name__ == "__main__":
    test_hotel_system()
