"""
Reservation Manager - Handles all reservation-related operations.
"""
import uuid
from datetime import datetime
from typing import Optional, List, Dict
from .hotel_system import Hotel, Guest, Reservation, Room, RoomType

class ReservationManager:
    def __init__(self, hotel_system):
        self.hotel_system = hotel_system

    def create_reservation(self, 
                         guest: Guest,
                         city: str,
                         room_type: RoomType,
                         check_in: datetime,
                         check_out: datetime) -> Optional[Reservation]:
        hotel = self.hotel_system.hotels.get(city)
        if not hotel:
            raise ValueError(f"No hotel found in {city}")

        available_rooms = hotel.get_available_rooms(room_type, check_in, check_out)
        if not available_rooms:
            raise ValueError(f"No {room_type.value} rooms available for the specified dates")

        room = available_rooms[0]
        nights = (check_out - check_in).days
        total_cost = room.rate * nights

        reservation = Reservation(
            reservation_id=str(uuid.uuid4()),
            hotel_name=hotel.get_name(),
            guest=guest,
            room=room,
            check_in=check_in,
            check_out=check_out,
            total_cost=total_cost
        )

        room.occupied = True
        hotel.reservations[reservation.reservation_id] = reservation
        return reservation

    def modify_reservation(self,
                         reservation_id: str,
                         new_check_in: Optional[datetime] = None,
                         new_check_out: Optional[datetime] = None) -> Optional[Reservation]:
        for hotel in self.hotel_system.hotels.values():
            if reservation_id in hotel.reservations:
                reservation = hotel.reservations[reservation_id]
                if reservation.status == "CANCELLED":
                    raise ValueError("Cannot modify a cancelled reservation")

                if new_check_in:
                    reservation.check_in = new_check_in
                if new_check_out:
                    reservation.check_out = new_check_out

                # Recalculate total cost
                nights = (reservation.check_out - reservation.check_in).days
                reservation.total_cost = reservation.room.rate * nights
                return reservation

        raise ValueError("Reservation not found")

    def cancel_reservation(self, reservation_id: str) -> bool:
        for hotel in self.hotel_system.hotels.values():
            if reservation_id in hotel.reservations:
                reservation = hotel.reservations[reservation_id]
                if reservation.status == "CHECKED_IN":
                    raise ValueError("Cannot cancel a reservation after check-in")
                
                reservation.status = "CANCELLED"
                reservation.room.occupied = False
                return True
                
        raise ValueError("Reservation not found")

    def get_guest_reservations(self, guest_id: str) -> List[Reservation]:
        guest_reservations = []
        for hotel in self.hotel_system.hotels.values():
            for reservation in hotel.reservations.values():
                if reservation.guest.guest_id == guest_id:
                    guest_reservations.append(reservation)
        return guest_reservations