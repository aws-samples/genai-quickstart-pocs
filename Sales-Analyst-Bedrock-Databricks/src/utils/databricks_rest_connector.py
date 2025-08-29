"""
Databricks REST API connector (alternative to SQL connector)
"""
import os
import requests
import time
from dotenv import load_dotenv

load_dotenv()

class DatabricksRestConnector:
    def __init__(self):
        self.host = os.getenv('DATABRICKS_HOST', '').rstrip('/')
        self.token = os.getenv('DATABRICKS_TOKEN', '')
        self.warehouse_id = os.getenv('DATABRICKS_CLUSTER_ID', '')
        
        self.headers = {
            'Authorization': f'Bearer {self.token}',
            'Content-Type': 'application/json'
        }
        
        # Auto-create warehouse if needed
        if not self.warehouse_id or self.warehouse_id == 'auto_created':
            self.warehouse_id = self.get_or_create_warehouse()
    
    def get_or_create_warehouse(self):
        """Get existing warehouse or create new one"""
        try:
            # Check for existing warehouses
            response = requests.get(
                f"{self.host}/api/2.0/sql/warehouses",
                headers=self.headers
            )
            
            if response.status_code == 200:
                warehouses = response.json().get('warehouses', [])
                # Look for default Serverless Starter Warehouse first
                for warehouse in warehouses:
                    if warehouse.get('name') == 'Serverless Starter Warehouse':
                        print(f"Using default Serverless Starter Warehouse: {warehouse['id']}")
                        return warehouse['id']
                # Look for existing sales-analyst warehouse
                for warehouse in warehouses:
                    if warehouse.get('name') == 'sales-analyst':
                        print(f"Using existing warehouse: {warehouse['id']}")
                        return warehouse['id']
            
            # Create new warehouse
            print("Creating new SQL warehouse...")
            response = requests.post(
                f"{self.host}/api/2.0/sql/warehouses",
                headers=self.headers,
                json={
                    "name": "sales-analyst",
                    "cluster_size": "2X-Small",
                    "min_num_clusters": 1,
                    "max_num_clusters": 1,
                    "auto_stop_mins": 10,
                    "enable_photon": True,
                    "warehouse_type": "PRO",
                    "enable_serverless_compute": False
                }
            )
            
            if response.status_code == 200:
                warehouse_id = response.json()['id']
                print(f"Created warehouse: {warehouse_id}")
                
                # Wait for warehouse to be ready
                self.wait_for_warehouse_ready(warehouse_id)
                return warehouse_id
            else:
                print(f"Failed to create warehouse: {response.text}")
                return None
                
        except Exception as e:
            print(f"Error managing warehouse: {e}")
            return None
    
    def wait_for_warehouse_ready(self, warehouse_id, max_wait=300):
        """Wait for warehouse to be ready"""
        print("Waiting for warehouse to be ready...")
        start_time = time.time()
        
        while time.time() - start_time < max_wait:
            try:
                response = requests.get(
                    f"{self.host}/api/2.0/sql/warehouses/{warehouse_id}",
                    headers=self.headers
                )
                
                if response.status_code == 200:
                    state = response.json().get('state')
                    if state == 'RUNNING':
                        print("Warehouse is ready!")
                        return True
                    elif state in ['STARTING', 'STOPPED']:
                        # Start the warehouse if stopped
                        requests.post(
                            f"{self.host}/api/2.0/sql/warehouses/{warehouse_id}/start",
                            headers=self.headers
                        )
                        time.sleep(10)
                    else:
                        time.sleep(5)
                else:
                    time.sleep(5)
                    
            except Exception as e:
                print(f"Error checking warehouse status: {e}")
                time.sleep(5)
        
        print("Warehouse setup timed out")
        return False
    
    def execute_query(self, query):
        """Execute SQL query using REST API"""
        try:
            # Start query execution
            response = requests.post(
                f"{self.host}/api/2.0/sql/statements/",
                headers=self.headers,
                json={
                    "warehouse_id": self.warehouse_id,
                    "statement": query,
                    "wait_timeout": "30s"
                }
            )
            
            if response.status_code != 200:
                raise Exception(f"Query failed: {response.text}")
            
            result = response.json()
            statement_id = result.get('statement_id')
            
            # Poll for completion if still running
            while result.get('status', {}).get('state') in ['PENDING', 'RUNNING']:
                time.sleep(2)
                response = requests.get(
                    f"{self.host}/api/2.0/sql/statements/{statement_id}",
                    headers=self.headers
                )
                result = response.json()
            
            # Extract results
            if result.get('status', {}).get('state') == 'SUCCEEDED':
                data = result.get('result', {}).get('data_array', [])
                columns = [col['name'] for col in result.get('manifest', {}).get('schema', {}).get('columns', [])]
                
                # Convert to list of dictionaries
                return [dict(zip(columns, row)) for row in data]
            else:
                error_msg = result.get('status', {}).get('error', {}).get('message', 'Unknown error')
                raise Exception(f"Query failed: {error_msg}")
                
        except Exception as e:
            print(f"Error executing query: {e}")
            return []

# Test function
def test_rest_connection():
    connector = DatabricksRestConnector()
    result = connector.execute_query("SELECT 1 as test")
    print(f"Test result: {result}")
    return len(result) > 0

if __name__ == "__main__":
    test_rest_connection()