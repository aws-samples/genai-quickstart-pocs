import sqlite3

# Connect to (or create) the database
conn = sqlite3.connect('shipments.db')
cur = conn.cursor()

# Drop table if it exists for a clean slate
cur.execute('DROP TABLE IF EXISTS shipments')

# Create the shipments table with email field
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

# Insert some dummy data
dummy_data = [
    ("FDX123456789", "In Transit", "FedEx", "San Fransico", "CA", "poprahul@amazon.com", "2025-04-16T14:30:00Z"),
    ("UPS987654321", "Shipped", "UPS", "Dallas", "TX", "poprahul@amazon.com", "2025-04-17T10:15:00Z"),
    ("DHL555666777", "Shipped", "DHL", "New York", "NY", "poprahul@amazon.com", "2025-04-15T18:00:00Z"),
    ("FDX111222333", "Ordered", "FedEx", "Austin", "TX", "poprahul@amazon.com", "2025-04-16T08:45:00Z"),
    ("UPS444555666", "In Transit", "UPS", "Jersey City", "NJ", "poprahul@amazon.com", "2025-04-17T06:30:00Z"),
]

cur.executemany('''
INSERT INTO shipments (tracking_number, status, carrier, city, state_code, email, last_updated)
VALUES (?, ?, ?, ?, ?, ?, ?)
''', dummy_data)

conn.commit()
conn.close()

print("Database and table created, and dummy data inserted.")
