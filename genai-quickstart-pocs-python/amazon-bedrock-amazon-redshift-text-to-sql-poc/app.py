
"""
GenAI Sales Analyst - Wizard-Based Setup v2.2
"""
import streamlit as st
import pandas as pd
import time
import os
from dotenv import load_dotenv

load_dotenv()

from src.bedrock.bedrock_helper_iam import BedrockHelper
from src.vector_store.faiss_manager import FAISSManager
from src.graph.workflow import AnalysisWorkflow
from src.utils.redshift_connector_iam import get_redshift_connection, execute_query
from src.utils.northwind_bootstrapper import bootstrap_northwind, check_northwind_exists
from src.utils.setup_state import SetupState
from src.utils.redshift_cluster_manager import create_redshift_cluster
import numpy as np


# Sample queries for Northwind database
NORTHWIND_SAMPLE_QUERIES = [
    "What are the top 10 customers by total order value?",
    "Which products generate the most revenue?",
    "What's the average order value by country?",
    "Which product categories sell the most?",
    "What are the top 5 most expensive products?",
    "How many orders come from each country?",
    "Which employees process the most orders?",
    "What's the monthly sales trend?",
    "Which suppliers provide the most products?",
    "What's the average discount given per product category?"
]


def show_setup_wizard(setup_state):
    """Show setup wizard for first-time configuration."""
    st.title("🚀 GenAI Sales Analyst Setup")
    
    state = setup_state.get_state()
    
    # Show back button if option is selected
    if state['setup_option']:
        if st.button("⬅️ Back to Options", key="back_to_options"):
            setup_state.update_state(setup_option=None)
            st.rerun()
        st.markdown("---")
        
        # Show selected option workflow
        if state['setup_option'] == 1:
            show_option1_workflow(setup_state)
        elif state['setup_option'] == 2:
            show_option2_workflow(setup_state)
        elif state['setup_option'] == 3:
            show_option3_workflow(setup_state)
        return
    
    # Landing page - show option choices
    st.markdown("Choose how you want to get started:")
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.markdown("### Option 1")
        st.markdown("**Create New Cluster**")
        st.write(f"• Creates {os.getenv('OPTION1_CLUSTER_ID', 'sales-analyst-cluster')}")
        st.write("• Loads Northwind sample data")
        st.write("• Uses .env credentials")
        st.write("⏱️ ~10 minutes")
        
        # Check if cluster exists
        cluster_id = os.getenv('OPTION1_CLUSTER_ID', 'sales-analyst-cluster')
        cluster_exists = False
        try:
            import boto3
            redshift = boto3.client('redshift', region_name=os.getenv('AWS_REGION', 'us-east-1'))
            cluster_info = redshift.describe_clusters(ClusterIdentifier=cluster_id)
            if cluster_info['Clusters'][0]['ClusterStatus'] == 'available':
                cluster_exists = True
                st.info("✅ Cluster exists")
        except:
            pass
        
        if st.button("Select Option 1", key="opt1", width="stretch"):
            setup_state.reset_state()  # Clear any cached connection
            setup_state.update_state(setup_option=1)
            st.rerun()
        
        # Show cleanup if cluster exists
        if cluster_exists:
            st.markdown("---")
            if st.button("🗑️ Delete Cluster", key="delete_landing", width="stretch"):
                st.session_state.confirm_delete_landing = True
            if st.session_state.get('confirm_delete_landing', False):
                if st.button("⚠️ Confirm", key="confirm_landing", width="stretch"):
                    with st.spinner("Deleting..."):
                        cleanup_option1_resources()
                        setup_state.reset_state()
                        st.session_state.confirm_delete_landing = False
                        time.sleep(2)
                        st.rerun()
    
    with col2:
        st.markdown("### Option 2")
        st.markdown("**Load to Existing Cluster**")
        st.write("• Connect to your cluster")
        st.write("• Load Northwind sample data")
        st.write("• Keep your existing data")
        st.write("⏱️ ~5 minutes")
        if st.button("Select Option 2", key="opt2", width="stretch"):
            setup_state.reset_state()  # Clear any cached connection
            setup_state.update_state(setup_option=2)
            st.rerun()
    
    with col3:
        st.markdown("### Option 3")
        st.markdown("**Use Existing Data**")
        st.write("• Point to your database")
        st.write("• No data loading needed")
        st.write("• Query your own data")
        st.write("⏱️ ~2 minutes")
        if st.button("Select Option 3", key="opt3", width="stretch"):
            setup_state.reset_state()  # Clear any cached connection
            setup_state.update_state(setup_option=3)
            st.rerun()
    
    # Reset button for clearing stale state
    st.markdown("---")
    if st.button("🔄 Reset All Setup", key="reset_all_setup_landing", width="stretch"):
        setup_state.reset_state()
        st.success("Setup state reset successfully!")
        time.sleep(1)
        st.rerun()


def cleanup_option1_resources():
    """Delete Option 1 cluster and all related resources."""
    import boto3
    region = os.getenv('AWS_REGION', 'us-east-1')
    cluster_id = os.getenv('OPTION1_CLUSTER_ID', 'sales-analyst-cluster')
    
    try:
        # Delete Redshift cluster
        redshift = boto3.client('redshift', region_name=region)
        try:
            redshift.delete_cluster(
                ClusterIdentifier=cluster_id,
                SkipFinalClusterSnapshot=True
            )
            st.info("🗑️ Deleting Redshift cluster...")
        except:
            pass
        
        # Terminate bastion host
        ec2 = boto3.client('ec2', region_name=region)
        try:
            instances = ec2.describe_instances(
                Filters=[
                    {'Name': 'tag:Name', 'Values': ['sales-analyst-bastion']},
                    {'Name': 'instance-state-name', 'Values': ['running', 'stopped']}
                ]
            )
            for reservation in instances['Reservations']:
                for instance in reservation['Instances']:
                    ec2.terminate_instances(InstanceIds=[instance['InstanceId']])
                    st.info(f"🗑️ Terminating bastion host {instance['InstanceId']}...")
        except:
            pass
        
        st.success("✅ Cleanup initiated. Resources will be deleted in a few minutes.")
    except Exception as e:
        st.error(f"❌ Cleanup error: {str(e)}")


def show_option1_workflow(setup_state):
    """Option 1: Create new cluster."""
    st.markdown("## Option 1: Create New Cluster")
    
    # Validate required environment variables
    password = os.getenv('OPTION1_PASSWORD')
    if not password:
        st.error("❌ Missing required environment variable: OPTION1_PASSWORD")
        st.info("💡 Please set OPTION1_PASSWORD in your .env file and restart the application")
        st.code("OPTION1_PASSWORD=YourSecurePassword123!", language="bash")
        return
    
    state = setup_state.get_state()
    
    # Start SSM tunnel if using localhost and cluster is created
    if state['cluster_created'] and state['connection']['host'] == 'localhost':
        import subprocess
        try:
            result = subprocess.run(['pgrep', '-f', 'session-manager-plugin'], 
                                  capture_output=True, text=True)
            if not result.stdout.strip():
                # Tunnel not running, start it
                import boto3
                ec2 = boto3.client('ec2', region_name=os.getenv('AWS_REGION', 'us-east-1'))
                redshift = boto3.client('redshift', region_name=os.getenv('AWS_REGION', 'us-east-1'))
                
                instances = ec2.describe_instances(
                    Filters=[
                        {'Name': 'tag:Name', 'Values': ['sales-analyst-bastion']},
                        {'Name': 'instance-state-name', 'Values': ['running']}
                    ]
                )
                
                if instances['Reservations']:
                    bastion_id = instances['Reservations'][0]['Instances'][0]['InstanceId']
                    cluster_info = redshift.describe_clusters(ClusterIdentifier='sales-analyst-cluster')
                    endpoint = cluster_info['Clusters'][0]['Endpoint']['Address']
                    
                    subprocess.Popen([
                        'aws', 'ssm', 'start-session',
                        '--target', bastion_id,
                        '--document-name', 'AWS-StartPortForwardingSessionToRemoteHost',
                        '--parameters', f'{{"host":["{endpoint}"],"portNumber":["5439"],"localPortNumber":["5439"]}}',
                        '--region', os.getenv('AWS_REGION', 'us-east-1')
                    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                    
                    st.info("🔄 Starting SSM tunnel... Please wait.")
                    time.sleep(5)
                    st.rerun()
        except:
            pass
    
    # Step 1: Create Cluster (with check for existing)
    st.markdown("### Step 1: Create Redshift Cluster")
    if state['cluster_created']:
        st.success(f"✅ Cluster created: {state['cluster_id']}")
    else:
        # Check if cluster already exists in AWS
        cluster_exists = False
        endpoint = None
        is_public = False
        
        try:
            import boto3
            redshift = boto3.client('redshift', region_name=os.getenv('AWS_REGION', 'us-east-1'))
            cluster_info = redshift.describe_clusters(ClusterIdentifier='sales-analyst-cluster')
            if cluster_info['Clusters'][0]['ClusterStatus'] == 'available':
                cluster_exists = True
                endpoint = cluster_info['Clusters'][0]['Endpoint']['Address']
                is_public = cluster_info['Clusters'][0].get('PubliclyAccessible', False)
        except:
            pass
        
        if cluster_exists:
            st.info("ℹ️ Cluster 'sales-analyst-cluster' already exists")
            if st.button("✅ Use Existing Cluster", key="use_existing"):
                host = endpoint if is_public else 'localhost'
                setup_state.update_state(cluster_created=True, cluster_id='sales-analyst-cluster')
                setup_state.update_connection(
                    host=host, 
                    database=os.getenv('OPTION1_DATABASE', 'sales_analyst'), 
                    schema=os.getenv('OPTION1_SCHEMA', 'northwind'), 
                    user=os.getenv('OPTION1_USER', 'admin'), 
                    password=os.getenv('OPTION1_PASSWORD')
                )
                st.rerun()
            return
        
        # Cluster doesn't exist, show create button
        st.info("Cluster will be created with credentials from .env file")
        if st.button("🚀 Create Cluster", key="create_cluster"):
            with st.spinner("Creating cluster... This takes ~10 minutes"):
                try:
                    endpoint = create_redshift_cluster()
                    if endpoint:
                        cluster_id = endpoint.split('.')[0] if endpoint != 'localhost' else os.getenv('OPTION1_CLUSTER_ID', 'sales-analyst-cluster')
                        setup_state.update_state(cluster_created=True, cluster_id=cluster_id)
                        setup_state.update_connection(
                            host=endpoint, 
                            database=os.getenv('OPTION1_DATABASE', 'sales_analyst'), 
                            schema=os.getenv('OPTION1_SCHEMA', 'northwind'), 
                            user=os.getenv('OPTION1_USER', 'admin'), 
                            password=os.getenv('OPTION1_PASSWORD')
                        )
                        st.rerun()
                except Exception as e:
                    st.error(f"❌ Error: {str(e)}")
        return
    
    # Step 2: Load Data (with check for existing)
    st.markdown("### Step 2: Load Northwind Data")
    if state['data_loaded']:
        st.success("✅ Northwind data loaded")
    else:
        # Check if Northwind already exists with retry
        northwind_exists = False
        check_error = None
        
        with st.spinner("Checking for existing Northwind data..."):
            for attempt in range(3):
                try:
                    conn_info = state['connection']
                    os.environ['REDSHIFT_HOST'] = conn_info['host']
                    os.environ['REDSHIFT_DATABASE'] = conn_info['database']
                    os.environ['REDSHIFT_SCHEMA'] = 'northwind'
                    os.environ['REDSHIFT_USER'] = conn_info['user']
                    os.environ['REDSHIFT_PASSWORD'] = conn_info['password']
                    
                    northwind_exists = check_northwind_exists()
                    check_error = None
                    break
                except Exception as e:
                    check_error = str(e)
                    if attempt < 2:
                        time.sleep(2)
                    continue
        
        if check_error:
            st.error(f"❌ Cannot connect to database: {check_error}")
            st.info("💡 Make sure SSM tunnel is running. Wait a moment and refresh the page.")
            return
        
        if northwind_exists:
            st.info("ℹ️ Northwind database already exists")
            if st.button("✅ Skip to Indexing", key="skip_to_index"):
                setup_state.update_state(data_loaded=True)
                st.rerun()
            return
        
        # Northwind doesn't exist, show load button
        st.info("Northwind data not found. Click below to load sample data.")
        if st.button("📦 Load Northwind Data", key="load_data_opt1"):
            progress_placeholder = st.empty()
            status_placeholder = st.empty()
            
            try:
                conn_info = state['connection']
                os.environ['REDSHIFT_HOST'] = conn_info['host']
                os.environ['REDSHIFT_DATABASE'] = conn_info['database']
                os.environ['REDSHIFT_SCHEMA'] = conn_info['schema']
                os.environ['REDSHIFT_USER'] = conn_info['user']
                os.environ['REDSHIFT_PASSWORD'] = conn_info['password']
                
                progress_placeholder.info("📥 Downloading Northwind database...")
                
                # Show loading progress
                tables = ['customers', 'orders', 'order_details', 'products', 'categories', 
                         'suppliers', 'employees', 'shippers', 'regions', 'territories']
                
                progress_bar = st.progress(0)
                for i, table in enumerate(tables):
                    status_placeholder.info(f"Loading table: {table}...")
                    progress_bar.progress((i + 1) / len(tables))
                    time.sleep(0.1)
                
                success = bootstrap_northwind(show_progress=True)
                
                if success:
                    setup_state.update_state(data_loaded=True)
                    progress_placeholder.success("✅ All tables loaded!")
                    time.sleep(1)
                    st.rerun()
                else:
                    st.error("❌ Failed to load data. Check connection and permissions.")
            except Exception as e:
                st.error(f"❌ Error: {str(e)}")
        return
    
    # Step 3: Index Schema
    st.markdown("### Step 3: Index for AI Queries")
    if state['schema_indexed']:
        st.success("✅ Schema indexed and ready")
    else:
        if st.button("🤖 Index Schema", key="index_opt1"):
            with st.spinner("Indexing schema..."):
                try:
                    conn_info = state['connection']
                    os.environ['REDSHIFT_HOST'] = conn_info['host']
                    os.environ['REDSHIFT_DATABASE'] = conn_info['database']
                    os.environ['REDSHIFT_SCHEMA'] = conn_info['schema']
                    os.environ['REDSHIFT_USER'] = conn_info['user']
                    os.environ['REDSHIFT_PASSWORD'] = conn_info['password']
                    
                    bedrock = BedrockHelper(region_name=os.getenv('AWS_REGION', 'us-east-1'))
                    vector_store = FAISSManager(bedrock_client=bedrock)
                    load_metadata(vector_store, conn_info['schema'])
                    
                    setup_state.update_state(schema_indexed=True)
                    st.success("✅ Schema indexed!")
                    st.rerun()
                except Exception as e:
                    st.error(f"❌ Error: {str(e)}")
                    return
        else:
            return  # Only return if button not clicked yet
    
    st.success("🎉 Setup complete!")
    if st.button("Start Using App", type="primary"):
        setup_state.mark_setup_complete()
        st.rerun()


def show_option2_workflow(setup_state):
    """Option 2: Load to existing cluster."""
    st.markdown("## Option 2: Load to Existing Cluster")
    
    state = setup_state.get_state()
    
    # Step 1: Configure Connection
    if not state['connection'].get('host'):
        st.markdown("### Step 1: Enter Cluster Details")
        with st.form("cluster_config"):
            host = st.text_input("Cluster Endpoint", placeholder="cluster.xxx.redshift.amazonaws.com")
            database = st.text_input("Database", value="dev")
            user = st.text_input("Username", value="awsuser")
            password = st.text_input("Password", type="password")
            
            if st.form_submit_button("Test Connection"):
                if host and database and user and password:
                    try:
                        os.environ['REDSHIFT_HOST'] = host
                        os.environ['REDSHIFT_DATABASE'] = database
                        os.environ['REDSHIFT_USER'] = user
                        os.environ['REDSHIFT_PASSWORD'] = password
                        
                        conn = get_redshift_connection()
                        conn.close()
                        
                        setup_state.update_connection(host=host, database=database, schema='northwind', user=user, password=password)
                        st.success("✅ Connection successful!")
                        time.sleep(1)
                        st.rerun()
                    except Exception as e:
                        st.error(f"❌ Connection failed: {str(e)}")
        return
    
    st.success(f"✅ Connected to: {state['connection']['host']}")
    
    # Step 2: Load Data (with check if already loaded)
    st.markdown("### Step 2: Load Northwind Data")
    if state['data_loaded']:
        st.success("✅ Northwind data already loaded")
    else:
        # Check if Northwind already exists
        northwind_exists = False
        try:
            conn_info = state['connection']
            os.environ['REDSHIFT_HOST'] = conn_info['host']
            os.environ['REDSHIFT_DATABASE'] = conn_info['database']
            os.environ['REDSHIFT_SCHEMA'] = 'northwind'
            os.environ['REDSHIFT_USER'] = conn_info['user']
            os.environ['REDSHIFT_PASSWORD'] = conn_info['password']
            
            northwind_exists = check_northwind_exists()
        except:
            pass
        
        if northwind_exists:
            st.info("ℹ️ Northwind database already exists in this cluster")
            if st.button("Skip to Indexing", key="skip_load"):
                setup_state.update_state(data_loaded=True)
                st.rerun()
            return  # Don't show load button if Northwind exists
        
        # Only show load button if Northwind doesn't exist
        if st.button("📦 Load Northwind Data", key="load_data_opt2"):
            progress_placeholder = st.empty()
            status_placeholder = st.empty()
            
            try:
                conn_info = state['connection']
                os.environ['REDSHIFT_HOST'] = conn_info['host']
                os.environ['REDSHIFT_DATABASE'] = conn_info['database']
                os.environ['REDSHIFT_SCHEMA'] = 'northwind'
                os.environ['REDSHIFT_USER'] = conn_info['user']
                os.environ['REDSHIFT_PASSWORD'] = conn_info['password']
                
                # Check if cluster is private
                status_placeholder.info("🔍 Checking cluster accessibility...")
                try:
                    conn = get_redshift_connection()
                    conn.close()
                    status_placeholder.success("✅ Direct connection successful")
                except:
                    status_placeholder.warning("⚠️ Setting up secure connection...")
                    
                    import boto3
                    redshift = boto3.client('redshift', 
                        region_name=os.getenv('AWS_REGION', 'us-east-1'))
                    
                    cluster_id = conn_info['host'].split('.')[0]
                    
                    try:
                        cluster_info = redshift.describe_clusters(ClusterIdentifier=cluster_id)
                        is_public = cluster_info['Clusters'][0].get('PubliclyAccessible', False)
                        
                        if not is_public:
                            status_placeholder.info("🔧 Creating bastion host...")
                            from src.utils.redshift_cluster_manager import create_bastion_host, create_ssm_tunnel
                            bastion_id = create_bastion_host()
                            if bastion_id:
                                status_placeholder.info(f"✅ Bastion created: {bastion_id}")
                                status_placeholder.info("🔗 Establishing SSM tunnel...")
                                tunnel_success = create_ssm_tunnel(bastion_id, conn_info['host'])
                                if tunnel_success:
                                    status_placeholder.success("✅ Tunnel established")
                                    os.environ['REDSHIFT_HOST'] = 'localhost'
                                    setup_state.update_connection(host='localhost')
                    except Exception as e:
                        status_placeholder.warning(f"Proceeding with connection: {str(e)}")
                
                # Load data
                progress_placeholder.info("📥 Downloading Northwind database...")
                
                # Show loading progress
                tables = ['customers', 'orders', 'order_details', 'products', 'categories', 
                         'suppliers', 'employees', 'shippers', 'regions', 'territories']
                
                progress_bar = st.progress(0)
                for i, table in enumerate(tables):
                    status_placeholder.info(f"Loading table: {table}...")
                    progress_bar.progress((i + 1) / len(tables))
                    time.sleep(0.1)
                
                success = bootstrap_northwind(show_progress=True)
                
                if success:
                    setup_state.update_state(data_loaded=True)
                    progress_placeholder.success("✅ Data loaded successfully!")
                    time.sleep(1)
                    st.rerun()
                else:
                    st.error("❌ Failed to load data")
            except Exception as e:
                st.error(f"❌ Error: {str(e)}")
        return
    
    # Step 3: Index Schema
    st.markdown("### Step 3: Index for AI Queries")
    if state['schema_indexed']:
        st.success("✅ Schema indexed and ready")
    else:
        if st.button("🤖 Index Schema", key="index_opt2"):
            with st.spinner("Indexing schema..."):
                try:
                    conn_info = state['connection']
                    os.environ['REDSHIFT_HOST'] = conn_info['host']
                    os.environ['REDSHIFT_DATABASE'] = conn_info['database']
                    os.environ['REDSHIFT_SCHEMA'] = 'northwind'
                    os.environ['REDSHIFT_USER'] = conn_info['user']
                    os.environ['REDSHIFT_PASSWORD'] = conn_info['password']
                    
                    bedrock = BedrockHelper(region_name=os.getenv('AWS_REGION', 'us-east-1'))
                    vector_store = FAISSManager(bedrock_client=bedrock)
                    load_metadata(vector_store, 'northwind')
                    
                    setup_state.update_state(schema_indexed=True)
                    st.success("✅ Schema indexed!")
                    st.rerun()
                except Exception as e:
                    st.error(f"❌ Error: {str(e)}")
        return
    
    st.success("🎉 Setup complete!")
    if st.button("Start Using App"):
        setup_state.mark_setup_complete()
        st.rerun()


def show_option3_workflow(setup_state):
    """Option 3: Use existing data."""
    st.markdown("## Option 3: Use Existing Data")
    
    state = setup_state.get_state()
    
    # Step 1: Configure Connection
    if not state['connection'].get('host'):
        st.markdown("### Step 1: Enter Connection Details")
        with st.form("existing_config"):
            host = st.text_input("Cluster Endpoint", placeholder="cluster.xxx.redshift.amazonaws.com")
            database = st.text_input("Database", value="dev")
            schema = st.text_input("Schema", value="public")
            user = st.text_input("Username", value="awsuser")
            password = st.text_input("Password", type="password")
            
            if st.form_submit_button("Test Connection"):
                if host and database and schema and user and password:
                    try:
                        os.environ['REDSHIFT_HOST'] = host
                        os.environ['REDSHIFT_DATABASE'] = database
                        os.environ['REDSHIFT_SCHEMA'] = schema
                        os.environ['REDSHIFT_USER'] = user
                        os.environ['REDSHIFT_PASSWORD'] = password
                        
                        conn = get_redshift_connection()
                        cursor = conn.cursor()
                        cursor.execute("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = %s", (schema,))
                        table_count = cursor.fetchone()[0]
                        conn.close()
                        
                        setup_state.update_connection(host=host, database=database, schema=schema, user=user, password=password)
                        st.success(f"✅ Connection successful! Found {table_count} tables")
                        time.sleep(1)
                        st.rerun()
                    except Exception as e:
                        st.error(f"❌ Connection failed: {str(e)}")
        return
    
    st.success(f"✅ Connected to: {state['connection']['host']}")
    st.info(f"Schema: {state['connection']['schema']}")
    
    # Step 2: Index Schema
    st.markdown("### Step 2: Index for AI Queries")
    if state['schema_indexed']:
        st.success("✅ Schema indexed and ready")
    else:
        if st.button("🤖 Index Schema", key="index_opt3"):
            with st.spinner("Indexing schema..."):
                try:
                    conn_info = state['connection']
                    os.environ['REDSHIFT_HOST'] = conn_info['host']
                    os.environ['REDSHIFT_DATABASE'] = conn_info['database']
                    os.environ['REDSHIFT_SCHEMA'] = conn_info['schema']
                    os.environ['REDSHIFT_USER'] = conn_info['user']
                    os.environ['REDSHIFT_PASSWORD'] = conn_info['password']
                    
                    bedrock = BedrockHelper(region_name=os.getenv('AWS_REGION', 'us-east-1'))
                    vector_store = FAISSManager(bedrock_client=bedrock)
                    load_metadata(vector_store, conn_info['schema'])
                    
                    setup_state.update_state(schema_indexed=True, data_loaded=True)
                    st.success("✅ Schema indexed!")
                    st.rerun()
                except Exception as e:
                    st.error(f"❌ Error: {str(e)}")
        return
    
    st.success("🎉 Setup complete!")
    if st.button("Start Using App"):
        setup_state.mark_setup_complete()
        st.rerun()


def load_metadata(vector_store, schema):
    """Load and index schema metadata with proper schema qualification."""
    database = os.getenv('REDSHIFT_DATABASE', 'sales_analyst')
    
    tables_query = f"""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = '{schema}' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
    """
    tables_result = execute_query(tables_query)
    
    if not tables_result:
        raise Exception(f"No tables found in schema '{schema}'")
    
    # Enhanced schema description with explicit schema qualification
    schema_parts = [f"Database: {database}, Schema: {schema}\n"]
    schema_parts.append(f"IMPORTANT: Always use schema-qualified table names: {schema}.tablename\n")
    
    for (table_name,) in tables_result:
        columns_query = f"""
            SELECT column_name, data_type
            FROM information_schema.columns 
            WHERE table_schema = '{schema}' 
            AND table_name = '{table_name}'
            ORDER BY ordinal_position
        """
        columns_result = execute_query(columns_query)
        
        if columns_result:
            columns_list = [f"{col_name} ({data_type})" for col_name, data_type in columns_result]
            columns_str = ", ".join(columns_list)
            # Include schema in table description
            schema_parts.append(f"Table: {schema}.{table_name}\nColumns: {columns_str}\n")
    
    schema_text = "\n".join(schema_parts)
    texts = [schema_text]
    metadatas = [{'database': database, 'schema': schema, 'type': 'schema'}]
    
    embeddings = []
    for text in texts:
        embedding = vector_store.bedrock_client.get_embeddings(text)
        embeddings.append(embedding)
    
    if embeddings:
        embeddings_array = np.array(embeddings).astype('float32')
        if embeddings_array.ndim == 1:
            embeddings_array = embeddings_array.reshape(1, -1)
        
        vector_store.texts = texts
        vector_store.metadata = metadatas
        vector_store.index.add(embeddings_array)


def show_main_app():
    """Show main application after setup."""
    setup_state = SetupState()
    state = setup_state.get_state()
    conn_info = state['connection']
    
    # Start SSM tunnel if using localhost (private cluster)
    if conn_info['host'] == 'localhost':
        import subprocess
        # Check if tunnel is already running
        try:
            result = subprocess.run(['pgrep', '-f', 'session-manager-plugin'], 
                                  capture_output=True, text=True)
            if not result.stdout.strip():
                # Tunnel not running, start it
                import boto3
                ec2 = boto3.client('ec2', region_name=os.getenv('AWS_REGION', 'us-east-1'))
                redshift = boto3.client('redshift', region_name=os.getenv('AWS_REGION', 'us-east-1'))
                
                # Get bastion instance
                instances = ec2.describe_instances(
                    Filters=[
                        {'Name': 'tag:Name', 'Values': ['sales-analyst-bastion']},
                        {'Name': 'instance-state-name', 'Values': ['running']}
                    ]
                )
                
                if instances['Reservations']:
                    bastion_id = instances['Reservations'][0]['Instances'][0]['InstanceId']
                    
                    # Get cluster endpoint
                    cluster_info = redshift.describe_clusters(ClusterIdentifier='sales-analyst-cluster')
                    endpoint = cluster_info['Clusters'][0]['Endpoint']['Address']
                    
                    # Start tunnel in background
                    subprocess.Popen([
                        'aws', 'ssm', 'start-session',
                        '--target', bastion_id,
                        '--document-name', 'AWS-StartPortForwardingSessionToRemoteHost',
                        '--parameters', f'{{"host":["{endpoint}"],"portNumber":["5439"],"localPortNumber":["5439"]}}',
                        '--region', os.getenv('AWS_REGION', 'us-east-1')
                    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                    
                    st.info("🔄 Starting SSM tunnel... Please wait 5 seconds and refresh.")
                    time.sleep(5)
                    st.rerun()
        except:
            pass
    
    os.environ['REDSHIFT_HOST'] = conn_info['host']
    os.environ['REDSHIFT_DATABASE'] = conn_info['database']
    os.environ['REDSHIFT_SCHEMA'] = conn_info['schema']
    os.environ['REDSHIFT_USER'] = conn_info['user']
    os.environ['REDSHIFT_PASSWORD'] = conn_info['password']
    
    # Initialize components
    bedrock = BedrockHelper(region_name=os.getenv('AWS_REGION', 'us-east-1'))
    vector_store = FAISSManager(bedrock_client=bedrock)
    workflow = AnalysisWorkflow(bedrock_helper=bedrock, vector_store=vector_store, monitor=None)
    
    # Load metadata
    load_metadata(vector_store, conn_info['schema'])
    
    # Header
    st.title("📊 Sales Data Analyst")
    st.markdown("*Powered by Amazon Bedrock and Amazon Redshift*")
    
    # Sidebar
    with st.sidebar:
        st.markdown("### 📊 Connection Status")
        st.success("✅ Connected")
        st.markdown(f"**Cluster:** `{conn_info['host'].split('.')[0]}`")
        st.markdown(f"**Database:** `{conn_info['database']}`")
        st.markdown(f"**Schema:** `{conn_info['schema']}`")
        
        # Show available tables
        st.markdown("---")
        st.markdown("### 📋 Available Tables")
        try:
            tables_query = f"""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = '{conn_info['schema']}' 
                AND table_type = 'BASE TABLE'
                ORDER BY table_name
            """
            tables_result = execute_query(tables_query)
            if tables_result:
                for (table_name,) in tables_result:
                    st.write(f"• {table_name}")
        except Exception as e:
            st.error(f"Error loading tables: {str(e)}")
        
        # Back to setup button
        st.markdown("---")
        if st.button("⬅️ Back to Setup", key="back_to_setup"):
            setup_state.update_state(setup_complete=False)
            st.rerun()
    
    # Show sample queries for Northwind (Options 1 & 2)
    is_northwind = conn_info['schema'] == 'northwind'
    if is_northwind:
        # Auto-collapse if query was just selected
        expand_queries = not st.session_state.get('query_just_selected', False)
        
        with st.expander("💡 Sample Queries for Northwind Database", expanded=expand_queries):
            st.markdown("Click any query to use it:")
            for i, query in enumerate(NORTHWIND_SAMPLE_QUERIES):
                if st.button(query, key=f"sample_{i}"):
                    st.session_state.selected_query = query
                    st.session_state.query_just_selected = True
                    st.rerun()
    
    # Query interface
    st.markdown("### Ask questions about your data")
    
    # Pre-fill if sample query selected
    default_query = st.session_state.get('selected_query', '')
    question = st.text_input("💬 Your question:", value=default_query, placeholder="e.g., What are the top 10 customers by revenue?")
    
    # Clear selected query after use
    if 'selected_query' in st.session_state:
        del st.session_state.selected_query
    
    # Reset collapse flag after displaying
    if 'query_just_selected' in st.session_state:
        st.session_state.query_just_selected = False
    
    if question:
        with st.spinner("Processing..."):
            try:
                result = workflow.execute(question, execute_query)
                
                if "generated_sql" in result:
                    st.subheader("📝 Generated SQL")
                    st.code(result["generated_sql"], language="sql")
                
                if "query_results" in result and result["query_results"]:
                    st.subheader("📊 Results")
                    results = result["query_results"]
                    
                    if isinstance(results, list) and len(results) > 0:
                        # Get column names from SQL query
                        try:
                            conn = get_redshift_connection()
                            cursor = conn.cursor()
                            cursor.execute(result["generated_sql"])
                            column_names = [desc[0] for desc in cursor.description]
                            cursor.close()
                            conn.close()
                            
                            # Create DataFrame with proper column names
                            df = pd.DataFrame(results, columns=column_names)
                        except:
                            # Fallback to default if column extraction fails
                            df = pd.DataFrame(results)
                        
                        st.dataframe(df, width="stretch")
                        
                        # Download button
                        csv = df.to_csv(index=False).encode('utf-8')
                        st.download_button(
                            label="📥 Download as CSV",
                            data=csv,
                            file_name="query_results.csv",
                            mime="text/csv",
                            key="download_csv"
                        )
                
                if "analysis" in result:
                    st.subheader("💡 Analysis")
                    st.markdown(result["analysis"])
            except Exception as e:
                st.error(f"❌ Error: {str(e)}")


def main():
    """Main application entry point."""
    st.set_page_config(page_title="Sales Data Analyst", page_icon="📊", layout="wide")
    
    st.markdown("""
    <style>
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    .stDeployButton {display:none;}
    
    /* Better form input styling */
    .stTextInput > div > div > input {
        border: 2px solid #e0e0e0;
        border-radius: 5px;
        padding: 10px;
    }
    .stTextInput > div > div > input:focus {
        border-color: #0066cc;
        box-shadow: 0 0 0 1px #0066cc;
    }
    </style>
    """, unsafe_allow_html=True)
    
    setup_state = SetupState()
    state = setup_state.get_state()
    
    # Validate state
    if state.get('setup_complete') and not state.get('schema_indexed'):
        st.warning("⚠️ Setup state is incomplete. Resetting...")
        setup_state.reset_state()
        time.sleep(1)
        st.rerun()
    
    if not setup_state.is_setup_complete():
        show_setup_wizard(setup_state)
    else:
        show_main_app()


if __name__ == "__main__":
    main()