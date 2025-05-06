"""
Database Initialization Script for Shipment Tracking System

This script creates a SQLite database for tracking shipments with the following operations:
1. Creates a new shipments database (or connects to existing one)
2. Drops any existing shipments table for a clean start
3. Creates a new shipments table with the required schema
4. Populates the table with sample shipment data for testing
"""
import sqlite3

# Database file name
DB_FILE = 'shipments.db'

# Connect to (or create) the database
# If the database doesn't exist, this will create it
conn = sqlite3.connect(DB_FILE)
cur = conn.cursor()

# Drop table if it exists for a clean slate
# This ensures we start with a fresh table each time the script runs
cur.execute('DROP TABLE IF EXISTS shipments')

# Create the shipments table with all required fields
# Schema:
# - tracking_number: Unique identifier for each shipment
# - status: Current shipment status (e.g., "In Transit", "Delivered")
# - carrier: Shipping company (e.g., "FedEx", "UPS")
# - city: Destination city
# - state_code: Two-letter state code with CHECK constraint to enforce format
# - email: Customer email address for notifications
# - last_updated: Timestamp of the last status update
cur.execute('''
CREATE TABLE shipments (
    tracking_number TEXT PRIMARY KEY,
    status TEXT NOT NULL,
    carrier TEXT NOT NULL,
    city TEXT NOT NULL,
    state_code TEXT NOT NULL CHECK(length(state_code) = 2),
    email TEXT NOT NULL,
    last_updated TEXT NOT NULL
)
''')

# Insert sample shipment data for testing and development
# Each record represents a shipment with its tracking details
# Format: (tracking_number, status, carrier, city, state_code, email, last_updated)
dummy_data = [
    # FedEx shipment to California
    ("FDX123456789", "In Transit", "FedEx", "San Fransico", "CA", "abc@example.com", "2025-04-16T14:30:00Z"),
    
    # UPS shipment to Texas
    ("UPS987654321", "Shipped", "UPS", "Dallas", "TX", "abc@example.com", "2025-04-17T10:15:00Z"),
    
    # DHL shipment to New York
    ("DHL555666777", "Shipped", "DHL", "New York", "NY", "abc@example.com", "2025-04-15T18:00:00Z"),
    
    # FedEx shipment to Texas with specific email
    ("FDX111222333", "Ordered", "FedEx", "Austin", "TX", "abc@amazon.com", "2025-04-16T08:45:00Z"),
    
    # UPS shipment to New Jersey
    ("UPS444555666", "In Transit", "UPS", "Jersey City", "NJ", "abc@example.com", "2025-04-17T06:30:00Z"),
]

# Use executemany for efficient batch insertion of multiple records
# This is more efficient than executing multiple individual INSERT statements
cur.executemany('''
INSERT INTO shipments (tracking_number, status, carrier, city, state_code, email, last_updated)
VALUES (?, ?, ?, ?, ?, ?, ?)
''', dummy_data)

# Commit the transaction to save all changes to the database
conn.commit()

# Close the database connection to release resources
conn.close()

print("Database and table created, and dummy data inserted.")