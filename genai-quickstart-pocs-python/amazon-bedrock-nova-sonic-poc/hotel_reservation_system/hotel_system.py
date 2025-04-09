"""
Hotel Reservation System - Core components and functionality.
"""
from dataclasses import dataclass
from datetime import datetime
import json
from typing import Dict, List, Optional
from enum import Enum
import jsonpickle

class RoomType(str, Enum):
    STANDARD: str = "Standard"
    DELUXE: str = "Deluxe"
    SUITE: str = "Suite"
    PRESIDENTIAL: str = "Presidential"
    def toJSON(self):
        return {"value": self.value}
    
    def fromString(from_value):
        for val in RoomType:
            if val.value == from_value:
                return val
        return None


@dataclass
class Room:
    room_id: str
    room_type: RoomType
    rate: float
    occupied: bool = False
    def toJSON(self):
        #return a JSON serialized verion of this object, and have the datetime fields printed out in iso format
        return jsonpickle.encode(self, unpicklable=False)


@dataclass
class Guest:
    guest_id: str
    name: str
    email: str
    phone: str
    address: str
    def toJSON(self):
        return json.dumps(
            self,
            default=lambda o: o.__dict__, 
            sort_keys=True,
            indent=4)

@dataclass
class Reservation:
    reservation_id: str
    hotel_name: str
    guest: Guest
    room: Room
    check_in: datetime
    check_out: datetime
    total_cost: float
    status: str = "CONFIRMED"  # CONFIRMED, CANCELLED, CHECKED_IN, CHECKED_OUT
    def toJSON(self):
        #return a JSON serialized verion of this object, and have the datetime fields printed out in iso format
        return jsonpickle.encode(self, unpicklable=False)
       
class Hotel:
    def __init__(self, name: str, city: str):
        self.name = name
        self.city = city
        self.rooms: List[Room] = []
        self.reservations: Dict[str, Reservation] = {}
        

    def add_room(self, room: Room) -> None:
        self.rooms.append(room)

    def get_available_rooms(self, room_type: Optional[RoomType] = None, 
                          check_in: datetime = None, 
                          check_out: datetime = None) -> List[Room]:
        print("In hotel_system.get_available_rooms")
        # Implementation to check room availability
        # Find one room per type
        available_rooms = []
        type_found = []
        for room in self.rooms:
            if not room.occupied \
            and (room_type is None or room.room_type == room_type) \
            and room.room_type.value not in type_found:
                available_rooms.append(room)
                type_found.append(room.room_type.value)
                print("Found room of type {}".format(room.room_type))

        # available = [room for room in self.rooms 
        #             if not room.occupied and 
        #             (room_type is None or room.room_type == room_type)]
        print("Done processing in hotel_system.get_available_rooms")
        return available_rooms
    def get_name(self):
        return self.name

class HotelSystem:
    def __init__(self):
        self.hotels: Dict[str, Hotel] = {}
        self.guests: Dict[str, Guest] = {}
        self._initialize_sample_data()

    def get_all_hotels(self) -> List[Dict[str, str]]:
        """
        Returns a list of all hotels in the system with their details.
        
        Returns:
            List[Dict[str, str]]: List of dictionaries containing hotel information
                                 with 'name' and 'city' keys.
        """
        return [{"name": hotel.name, "city": hotel.city} for hotel in self.hotels.values()]

    def get_rooms_by_city(self, city: str) -> List[Room]:
        """
        Returns all rooms available in a given city.
        
        Args:
            city (str): The name of the city to search for rooms
            
        Returns:
            List[Room]: List of all rooms in the specified city
            
        Raises:
            KeyError: If the specified city is not found in the system
        """
        if city not in self.hotels:
            raise KeyError(f"No hotels found in city: {city}")
        
        return self.hotels[city].rooms

    def get_available_rooms_by_city(self, city: str, room_type: Optional[RoomType] = None) -> List[Room]:
        """
        Returns all available rooms in a given city, optionally filtered by room type.
        
        Args:
            city (str): The name of the city to search for rooms
            room_type (Optional[RoomType]): Optional room type to filter results
            
        Returns:
            List[Room]: List of available rooms in the specified city
            
        Raises:
            KeyError: If the specified city is not found in the system
        """
        if city not in self.hotels:
            raise KeyError(f"No hotels found in city: {city}")
        
        return self.hotels[city].get_available_rooms(room_type)
    
    def get_available_rooms_by_city_and_date(self, city: str, room_type: Optional[RoomType] = RoomType.STANDARD, check_in=datetime, check_out=datetime) -> List[Room]:
        """
        Returns all available rooms in a given city, optionally filtered by room type.
        
        Args:
            city (str): The name of the city to search for rooms
            room_type (Optional[RoomType]): Optional room type to filter results
            
        Returns:
            List[Room]: List of available rooms in the specified city
            
        Raises:
            KeyError: If the specified city is not found in the system
        """
        if city not in self.hotels:
            raise KeyError(f"No hotels found in city: {city}")
        
        return self.hotels[city].get_available_rooms(room_type, check_in=check_in, check_out=check_out)

    def _initialize_sample_data(self):
        # Initialize sample hotels in major cities
        cities = ["New York", "Los Angeles", "Chicago", "Miami", "Las Vegas"]
        for city in cities:
            hotel = Hotel(f"{city} Grand Hotel", city)
            # Add sample rooms of different types
            for i in range(50):  # Add 50 rooms per hotel
                room_type = RoomType.STANDARD if i < 20 else \
                           RoomType.DELUXE if i < 35 else \
                           RoomType.SUITE if i < 45 else RoomType.PRESIDENTIAL
                base_rate = 100 if room_type == RoomType.STANDARD else \
                           200 if room_type == RoomType.DELUXE else \
                           400 if room_type == RoomType.SUITE else 1000
                room = Room(f"{city[:3].upper()}-{i:03d}", room_type, base_rate)
                hotel.add_room(room)
            self.hotels[city] = hotel