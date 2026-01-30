"""
GitHub data loader for complete Northwind dataset.
"""
import requests
import pandas as pd
import io
import tempfile
import os

def download_northwind_from_github():
    """Download complete Northwind dataset from GitHub."""
    
    # GitHub raw URLs for Northwind CSV files
    base_url = "https://raw.githubusercontent.com/graphql-compose/graphql-compose-examples/master/examples/northwind/data/csv/"
    
    tables = {
        'categories': 'categories.csv',
        'customers': 'customers.csv', 
        'employees': 'employees.csv',
        'order_details': 'order_details.csv',
        'orders': 'orders.csv',
        'products': 'products.csv',
        'shippers': 'shippers.csv',
        'suppliers': 'suppliers.csv'
    }
    
    # Alternative GitHub source
    alt_base_url = "https://raw.githubusercontent.com/Microsoft/sql-server-samples/master/samples/databases/northwind-pubs/northwind-data/"
    
    downloaded_data = {}
    
    for table_name, filename in tables.items():
        print(f"Downloading {table_name}...")
        
        # Try primary source
        try:
            url = base_url + filename
            response = requests.get(url, timeout=30)
            if response.status_code == 200:
                df = pd.read_csv(io.StringIO(response.text))
                downloaded_data[table_name] = df
                print(f"✅ Downloaded {table_name}: {len(df)} rows")
                continue
        except Exception as e:
            print(f"Primary source failed for {table_name}: {e}")
        
        # Try alternative sources with different naming
        alt_names = [
            filename,
            filename.replace('_', ''),
            filename.replace('_', '-'),
            table_name + '.csv'
        ]
        
        success = False
        for alt_name in alt_names:
            try:
                alt_url = f"https://raw.githubusercontent.com/jpwhite3/northwind-SQLite3/master/csv/{alt_name}"
                response = requests.get(alt_url, timeout=30)
                if response.status_code == 200:
                    df = pd.read_csv(io.StringIO(response.text))
                    downloaded_data[table_name] = df
                    print(f"✅ Downloaded {table_name}: {len(df)} rows")
                    success = True
                    break
            except:
                continue  # nosec B112 - intentional continue for error handling
        
        if not success:
            print(f"❌ Failed to download {table_name}, creating sample data")
            downloaded_data[table_name] = create_sample_table_data(table_name)
    
    return downloaded_data

def create_sample_table_data(table_name):
    """Create sample data for tables that couldn't be downloaded."""
    
    if table_name == 'customers':
        return pd.DataFrame([
            {'CustomerID': 'ALFKI', 'CompanyName': 'Alfreds Futterkiste', 'ContactName': 'Maria Anders', 'Country': 'Germany', 'City': 'Berlin'},
            {'CustomerID': 'ANATR', 'CompanyName': 'Ana Trujillo Emparedados', 'ContactName': 'Ana Trujillo', 'Country': 'Mexico', 'City': 'México D.F.'},
            {'CustomerID': 'ANTON', 'CompanyName': 'Antonio Moreno Taquería', 'ContactName': 'Antonio Moreno', 'Country': 'Mexico', 'City': 'México D.F.'},
            {'CustomerID': 'BERGS', 'CompanyName': 'Berglunds snabbköp', 'ContactName': 'Christina Berglund', 'Country': 'Sweden', 'City': 'Luleå'},
            {'CustomerID': 'BLAUS', 'CompanyName': 'Blauer See Delikatessen', 'ContactName': 'Hanna Moos', 'Country': 'Germany', 'City': 'Mannheim'}
        ])
    
    elif table_name == 'orders':
        return pd.DataFrame([
            {'OrderID': 10248, 'CustomerID': 'ALFKI', 'OrderDate': '1996-07-04', 'ShipCountry': 'Germany', 'Freight': 32.38},
            {'OrderID': 10249, 'CustomerID': 'ANATR', 'OrderDate': '1996-07-05', 'ShipCountry': 'Mexico', 'Freight': 11.61},
            {'OrderID': 10250, 'CustomerID': 'ANTON', 'OrderDate': '1996-07-08', 'ShipCountry': 'Mexico', 'Freight': 65.83},
            {'OrderID': 10251, 'CustomerID': 'BERGS', 'OrderDate': '1996-07-09', 'ShipCountry': 'Sweden', 'Freight': 41.34},
            {'OrderID': 10252, 'CustomerID': 'BLAUS', 'OrderDate': '1996-07-10', 'ShipCountry': 'Germany', 'Freight': 51.30},
            {'OrderID': 10253, 'CustomerID': 'ALFKI', 'OrderDate': '1996-07-11', 'ShipCountry': 'Germany', 'Freight': 58.17},
            {'OrderID': 10254, 'CustomerID': 'ANATR', 'OrderDate': '1996-07-12', 'ShipCountry': 'Mexico', 'Freight': 22.98}
        ])
    
    elif table_name == 'order_details':
        return pd.DataFrame([
            {'OrderID': 10248, 'ProductID': 11, 'UnitPrice': 14.0, 'Quantity': 12, 'Discount': 0.0},
            {'OrderID': 10248, 'ProductID': 42, 'UnitPrice': 9.8, 'Quantity': 10, 'Discount': 0.0},
            {'OrderID': 10249, 'ProductID': 14, 'UnitPrice': 18.6, 'Quantity': 9, 'Discount': 0.0},
            {'OrderID': 10250, 'ProductID': 41, 'UnitPrice': 7.7, 'Quantity': 10, 'Discount': 0.0},
            {'OrderID': 10251, 'ProductID': 22, 'UnitPrice': 16.8, 'Quantity': 6, 'Discount': 0.0},
            {'OrderID': 10252, 'ProductID': 20, 'UnitPrice': 64.8, 'Quantity': 40, 'Discount': 0.05}
        ])
    
    elif table_name == 'products':
        return pd.DataFrame([
            {'ProductID': 11, 'ProductName': 'Queso Cabrales', 'CategoryID': 4, 'UnitPrice': 21.0},
            {'ProductID': 14, 'ProductName': 'Tofu', 'CategoryID': 7, 'UnitPrice': 23.25},
            {'ProductID': 20, 'ProductName': 'Sir Rodneys Marmalade', 'CategoryID': 3, 'UnitPrice': 81.0},
            {'ProductID': 22, 'ProductName': 'Gustafs Knäckebröd', 'CategoryID': 5, 'UnitPrice': 21.0},
            {'ProductID': 41, 'ProductName': 'Jacks New England Clam Chowder', 'CategoryID': 8, 'UnitPrice': 9.65},
            {'ProductID': 42, 'ProductName': 'Singaporean Hokkien Fried Mee', 'CategoryID': 5, 'UnitPrice': 14.0}
        ])
    
    elif table_name == 'categories':
        return pd.DataFrame([
            {'CategoryID': 1, 'CategoryName': 'Beverages', 'Description': 'Soft drinks, coffees, teas, beers, and ales'},
            {'CategoryID': 2, 'CategoryName': 'Condiments', 'Description': 'Sweet and savory sauces, relishes, spreads, and seasonings'},
            {'CategoryID': 3, 'CategoryName': 'Confections', 'Description': 'Desserts, candies, and sweet breads'},
            {'CategoryID': 4, 'CategoryName': 'Dairy Products', 'Description': 'Cheeses'},
            {'CategoryID': 5, 'CategoryName': 'Grains/Cereals', 'Description': 'Breads, crackers, pasta, and cereal'}
        ])
    
    elif table_name == 'suppliers':
        return pd.DataFrame([
            {'SupplierID': 1, 'CompanyName': 'Exotic Liquids', 'Country': 'UK'},
            {'SupplierID': 2, 'CompanyName': 'New Orleans Cajun Delights', 'Country': 'USA'},
            {'SupplierID': 3, 'CompanyName': 'Grandma Kellys Homestead', 'Country': 'USA'}
        ])
    
    elif table_name == 'employees':
        return pd.DataFrame([
            {'EmployeeID': 1, 'LastName': 'Davolio', 'FirstName': 'Nancy', 'Title': 'Sales Representative'},
            {'EmployeeID': 2, 'LastName': 'Fuller', 'FirstName': 'Andrew', 'Title': 'Vice President, Sales'},
            {'EmployeeID': 3, 'LastName': 'Leverling', 'FirstName': 'Janet', 'Title': 'Sales Representative'}
        ])
    
    elif table_name == 'shippers':
        return pd.DataFrame([
            {'ShipperID': 1, 'CompanyName': 'Speedy Express'},
            {'ShipperID': 2, 'CompanyName': 'United Package'},
            {'ShipperID': 3, 'CompanyName': 'Federal Shipping'}
        ])
    
    return pd.DataFrame()

def normalize_column_names(df, table_name):
    """Normalize column names to match expected schema."""
    
    # Common column name mappings
    column_mappings = {
        'customers': {
            'CustomerID': 'customerid',
            'CompanyName': 'companyname', 
            'ContactName': 'contactname',
            'Country': 'country',
            'City': 'city'
        },
        'orders': {
            'OrderID': 'orderid',
            'CustomerID': 'customerid',
            'OrderDate': 'orderdate',
            'ShipCountry': 'shipcountry',
            'Freight': 'freight'
        },
        'order_details': {
            'OrderID': 'orderid',
            'ProductID': 'productid',
            'UnitPrice': 'unitprice',
            'Quantity': 'quantity',
            'Discount': 'discount'
        },
        'products': {
            'ProductID': 'productid',
            'ProductName': 'productname',
            'CategoryID': 'categoryid',
            'UnitPrice': 'unitprice'
        },
        'categories': {
            'CategoryID': 'categoryid',
            'CategoryName': 'categoryname',
            'Description': 'description'
        },
        'suppliers': {
            'SupplierID': 'supplierid',
            'CompanyName': 'companyname',
            'Country': 'country'
        },
        'employees': {
            'EmployeeID': 'employeeid',
            'LastName': 'lastname',
            'FirstName': 'firstname',
            'Title': 'title'
        },
        'shippers': {
            'ShipperID': 'shipperid',
            'CompanyName': 'companyname'
        }
    }
    
    if table_name in column_mappings:
        df = df.rename(columns=column_mappings[table_name])
    
    # Convert all column names to lowercase
    df.columns = df.columns.str.lower()
    
    return df