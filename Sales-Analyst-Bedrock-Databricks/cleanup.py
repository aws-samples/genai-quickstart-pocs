#!/usr/bin/env python3
"""
Cleanup script for Sales Analyst Databricks demo.
Removes all created resources to avoid ongoing costs.
"""
import os
from dotenv import load_dotenv
from src.utils.databricks_rest_connector import DatabricksRestConnector
import requests

load_dotenv()

def cleanup_databricks_resources():
    """Clean up all Databricks resources created by the demo."""
    try:
        host = os.getenv('DATABRICKS_HOST', '').rstrip('/')
        token = os.getenv('DATABRICKS_TOKEN', '')
        catalog = os.getenv('DATABRICKS_CATALOG', 'workspace')
        schema = os.getenv('DATABRICKS_SCHEMA', 'northwind')
        
        if not host or not token:
            print("❌ Missing Databricks credentials in .env file")
            return False
        
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        
        connector = DatabricksRestConnector()
        
        print("🧹 Starting cleanup of Databricks resources...")
        
        # 1. Drop schema and all tables
        print(f"🗑️ Dropping schema {catalog}.{schema}...")
        try:
            connector.execute_query(f"DROP SCHEMA IF EXISTS {catalog}.{schema} CASCADE")
            print(f"✅ Dropped schema {catalog}.{schema}")
        except Exception as e:
            print(f"⚠️ Could not drop schema: {e}")
        
        # 2. Stop and delete custom warehouse (if created)
        print("🛑 Checking for custom warehouses to clean up...")
        try:
            response = requests.get(f"{host}/api/2.0/sql/warehouses", headers=headers)
            if response.status_code == 200:
                warehouses = response.json().get('warehouses', [])
                for warehouse in warehouses:
                    if warehouse.get('name') == 'sales-analyst':
                        warehouse_id = warehouse['id']
                        print(f"🛑 Stopping warehouse: {warehouse_id}")
                        
                        # Stop warehouse
                        requests.post(f"{host}/api/2.0/sql/warehouses/{warehouse_id}/stop", headers=headers)
                        
                        # Delete warehouse
                        response = requests.delete(f"{host}/api/2.0/sql/warehouses/{warehouse_id}", headers=headers)
                        if response.status_code == 200:
                            print(f"✅ Deleted custom warehouse: {warehouse_id}")
                        else:
                            print(f"⚠️ Could not delete warehouse: {response.text}")
                        break
                else:
                    print("ℹ️ No custom warehouses found (using default Serverless Starter Warehouse)")
        except Exception as e:
            print(f"⚠️ Error managing warehouses: {e}")
        
        # 3. Clean up local cache files
        print("🧹 Cleaning up local cache files...")
        cache_files = [
            'metadata_cache.pkl',
            '__pycache__',
            'src/__pycache__',
            'src/bedrock/__pycache__',
            'src/graph/__pycache__',
            'src/utils/__pycache__',
            'src/vector_store/__pycache__',
            'src/monitoring/__pycache__'
        ]
        
        for cache_file in cache_files:
            try:
                if os.path.exists(cache_file):
                    if os.path.isfile(cache_file):
                        os.remove(cache_file)
                    else:
                        import shutil
                        shutil.rmtree(cache_file)
                    print(f"✅ Removed {cache_file}")
            except Exception as e:
                print(f"⚠️ Could not remove {cache_file}: {e}")
        
        print("\n✅ Cleanup completed!")
        print("\nResources cleaned up:")
        print(f"  • Schema: {catalog}.{schema} (and all tables)")
        print("  • Custom warehouse: sales-analyst (if existed)")
        print("  • Local cache files")
        print("\nNote: Default 'Serverless Starter Warehouse' was preserved")
        print("💰 This should eliminate ongoing Databricks costs from the demo")
        
        return True
        
    except Exception as e:
        print(f"❌ Cleanup failed: {e}")
        return False

if __name__ == "__main__":
    print("🧹 Sales Analyst Databricks Cleanup")
    print("=" * 40)
    
    confirm = input("This will delete all demo data and resources. Continue? (y/N): ")
    if confirm.lower() in ['y', 'yes']:
        cleanup_databricks_resources()
    else:
        print("Cleanup cancelled.")