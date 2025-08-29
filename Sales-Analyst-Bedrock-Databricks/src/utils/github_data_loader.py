"""
GitHub data loader for complete Northwind dataset.
"""
import requests
import pandas as pd
import io
import tempfile
import os

def download_northwind_from_github():
    """Download complete Northwind dataset from GitHub and save to temp directory."""
    
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
    
    # Create temp directory
    temp_dir = tempfile.mkdtemp(prefix='northwind_')
    print(f"Downloading to: {temp_dir}")
    
    for table_name, filename in tables.items():
        print(f"Downloading {table_name}...")
        
        # Try primary source
        try:
            url = base_url + filename
            response = requests.get(url, timeout=30)
            if response.status_code == 200:
                df = pd.read_csv(io.StringIO(response.text))
                df = normalize_column_names(df, table_name)
                
                # Save to CSV
                csv_path = os.path.join(temp_dir, f"{table_name}.csv")
                df.to_csv(csv_path, index=False)
                print(f"✅ Downloaded {table_name}: {len(df)} rows")
                continue
        except Exception as e:
            print(f"Primary source failed for {table_name}: {e}")
        
        # Try alternative sources
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
                    df = normalize_column_names(df, table_name)
                    
                    # Save to CSV
                    csv_path = os.path.join(temp_dir, f"{table_name}.csv")
                    df.to_csv(csv_path, index=False)
                    print(f"✅ Downloaded {table_name}: {len(df)} rows")
                    success = True
                    break
            except:
                continue
        
        if not success:
            print(f"❌ Failed to download {table_name}, creating sample data")
            df = create_sample_table_data(table_name)
            csv_path = os.path.join(temp_dir, f"{table_name}.csv")
            df.to_csv(csv_path, index=False)
    
    return temp_dir

def create_sample_table_data(table_name):
    """Create sample data for tables that couldn't be downloaded."""
    
    if table_name == 'customers':
        return pd.DataFrame([
            {'customerid': 'ALFKI', 'companyname': 'Alfreds Futterkiste', 'contactname': 'Maria Anders', 'country': 'Germany', 'city': 'Berlin'},
            {'customerid': 'ANATR', 'companyname': 'Ana Trujillo Emparedados', 'contactname': 'Ana Trujillo', 'country': 'Mexico', 'city': 'México D.F.'},
            {'customerid': 'ANTON', 'companyname': 'Antonio Moreno Taquería', 'contactname': 'Antonio Moreno', 'country': 'Mexico', 'city': 'México D.F.'},
            {'customerid': 'BERGS', 'companyname': 'Berglunds snabbköp', 'contactname': 'Christina Berglund', 'country': 'Sweden', 'city': 'Luleå'},
            {'customerid': 'BLAUS', 'companyname': 'Blauer See Delikatessen', 'contactname': 'Hanna Moos', 'country': 'Germany', 'city': 'Mannheim'}
        ])
    
    elif table_name == 'orders':
        return pd.DataFrame([
            {'orderid': 10248, 'customerid': 'ALFKI', 'orderdate': '1996-07-04', 'shipcountry': 'Germany', 'freight': 32.38},
            {'orderid': 10249, 'customerid': 'ANATR', 'orderdate': '1996-07-05', 'shipcountry': 'Mexico', 'freight': 11.61},
            {'orderid': 10250, 'customerid': 'ANTON', 'orderdate': '1996-07-08', 'shipcountry': 'Mexico', 'freight': 65.83},
            {'orderid': 10251, 'customerid': 'BERGS', 'orderdate': '1996-07-09', 'shipcountry': 'Sweden', 'freight': 41.34},
            {'orderid': 10252, 'customerid': 'BLAUS', 'orderdate': '1996-07-10', 'shipcountry': 'Germany', 'freight': 51.30}
        ])
    
    elif table_name == 'order_details':
        return pd.DataFrame([
            {'orderid': 10248, 'productid': 11, 'unitprice': 14.0, 'quantity': 12, 'discount': 0.0},
            {'orderid': 10248, 'productid': 42, 'unitprice': 9.8, 'quantity': 10, 'discount': 0.0},
            {'orderid': 10249, 'productid': 14, 'unitprice': 18.6, 'quantity': 9, 'discount': 0.0},
            {'orderid': 10250, 'productid': 41, 'unitprice': 7.7, 'quantity': 10, 'discount': 0.0}
        ])
    
    elif table_name == 'products':
        return pd.DataFrame([
            {'productid': 11, 'productname': 'Queso Cabrales', 'categoryid': 4, 'unitprice': 21.0},
            {'productid': 14, 'productname': 'Tofu', 'categoryid': 7, 'unitprice': 23.25},
            {'productid': 20, 'productname': 'Sir Rodneys Marmalade', 'categoryid': 3, 'unitprice': 81.0}
        ])
    
    elif table_name == 'categories':
        return pd.DataFrame([
            {'categoryid': 1, 'categoryname': 'Beverages', 'description': 'Soft drinks, coffees, teas, beers, and ales'},
            {'categoryid': 2, 'categoryname': 'Condiments', 'description': 'Sweet and savory sauces, relishes, spreads, and seasonings'}
        ])
    
    elif table_name == 'suppliers':
        return pd.DataFrame([
            {'supplierid': 1, 'companyname': 'Exotic Liquids', 'country': 'UK'},
            {'supplierid': 2, 'companyname': 'New Orleans Cajun Delights', 'country': 'USA'}
        ])
    
    elif table_name == 'employees':
        return pd.DataFrame([
            {'employeeid': 1, 'lastname': 'Davolio', 'firstname': 'Nancy', 'title': 'Sales Representative'},
            {'employeeid': 2, 'lastname': 'Fuller', 'firstname': 'Andrew', 'title': 'Vice President, Sales'}
        ])
    
    elif table_name == 'shippers':
        return pd.DataFrame([
            {'shipperid': 1, 'companyname': 'Speedy Express'},
            {'shipperid': 2, 'companyname': 'United Package'}
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