"""
GenAI Sales Analyst - Main application file (Databricks version).
"""
import streamlit as st
import pandas as pd
import time
import os
import numpy as np
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import components
from src.bedrock.bedrock_helper import BedrockHelper
from src.vector_store.faiss_manager import FAISSManager

from src.graph.workflow import AnalysisWorkflow
from src.utils.databricks_rest_connector import DatabricksRestConnector
from src.utils.northwind_bootstrapper import bootstrap_northwind, check_northwind_exists
from src.utils.databricks_workspace_manager import create_databricks_workspace_if_needed

def initialize_components():
    """
    Initialize application components.
    
    Returns:
        Dictionary of initialized components
    """
    # Get environment variables
    aws_region = os.getenv('AWS_REGION', 'us-east-1')
    s3_bucket = os.getenv('S3_BUCKET', 'your-bucket-name')
    
    # Initialize Bedrock client
    bedrock = BedrockHelper(region_name=aws_region)
    
    # Initialize vector store
    vector_store = FAISSManager(
        bedrock_client=bedrock,
        s3_bucket=s3_bucket
    )
    
    # No monitoring needed
    monitor = None
    
    # Initialize workflow
    workflow = AnalysisWorkflow(
        bedrock_helper=bedrock,
        vector_store=vector_store,
        monitor=monitor
    )
    
    return {
        'bedrock': bedrock,
        'vector_store': vector_store,
        'monitor': monitor,
        'workflow': workflow
    }


def load_all_metadata(vector_store, show_progress=False):
    """
    Load metadata from Northwind tables.
    """
    catalog = os.getenv('DATABRICKS_CATALOG', 'workspace')
    schema = os.getenv('DATABRICKS_SCHEMA', 'northwind')
    
    # Create simple schema context for Northwind
    schema_text = f"""
    Catalog: {catalog}, Schema: {schema}
    
    Table: customers - Customer information
    Columns: customerid (string), companyname (string), contactname (string), country (string)
    
    Table: orders - Order information  
    Columns: orderid (int), customerid (string), orderdate (date), freight (decimal), shipcountry (string)
    
    Table: order_details - Order line items
    Columns: orderid (int), productid (int), unitprice (decimal), quantity (int)
    
    Table: products - Product catalog
    Columns: productid (int), productname (string), categoryid (int), unitprice (decimal)
    
    Table: categories - Product categories
    Columns: categoryid (int), categoryname (string), description (string)
    
    Table: suppliers - Supplier information
    Columns: supplierid (int), companyname (string), country (string)
    
    Table: employees - Employee data
    Columns: employeeid (int), lastname (string), firstname (string), title (string)
    
    Table: shippers - Shipping companies
    Columns: shipperid (int), companyname (string), phone (string)
    """
    
    # Add to vector store
    texts = [schema_text]
    metadatas = [{'catalog': catalog, 'schema': schema, 'type': 'schema'}]
    
    # Get embeddings
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
        
        if show_progress:
            st.sidebar.success(f"✅ Loaded Northwind schema metadata")
        
        return pd.DataFrame({'schema': [schema], 'loaded': [True]})
    
    return None


def main():
    """
    Main application function.
    """
    # Set page config
    st.set_page_config(
        page_title="Sales Data Analyst (Databricks)",
        page_icon="📊",
        layout="wide"
    )
    
    # Hide Streamlit branding
    hide_streamlit_style = """
    <style>
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    .stDeployButton {display:none;}
    </style>
    """
    st.markdown(hide_streamlit_style, unsafe_allow_html=True)
    
    # Custom CSS
    st.markdown("""
    <style>
    .subheader {
        font-size: 1.8rem;
        font-weight: 600;
        color: #444;
        margin-bottom: 1rem;
    }
    .info-text {
        font-size: 1.1rem;
        color: #666;
    }
    .stProgress > div > div > div > div {
        background-color: #ff6600;
    }
    .workflow-step {
        padding: 10px;
        border-radius: 5px;
        margin-bottom: 10px;
    }
    .workflow-step-completed {
        background-color: #fff3e0;
        border-left: 4px solid #ff6600;
    }
    .workflow-step-error {
        background-color: #ffebee;
        border-left: 4px solid #f44336;
    }
    .data-section {
        background-color: #f9f9f9;
        padding: 15px;
        border-radius: 5px;
        margin-bottom: 20px;
    }
    </style>
    """, unsafe_allow_html=True)
    
    # Header
    st.markdown('<h1 style="font-size: 50px; font-weight: 900; color: #ff6600; text-align: left; margin-bottom: 5px; line-height: 1.0;">Sales Data Analyst</h1>', unsafe_allow_html=True)
    st.markdown('<p style="font-size: 14px; color: #ff6600; margin-top: -5px; margin-bottom: 15px; text-align: left;">(Powered by Amazon Bedrock and Databricks)</p>', unsafe_allow_html=True)
    st.markdown('<div style="border-bottom: 4px double #ff6600; margin-bottom: 30px;"></div>', unsafe_allow_html=True)
    
    # Check Databricks configuration
    if not os.getenv('DATABRICKS_HOST') or not os.getenv('DATABRICKS_TOKEN'):
        st.error("❌ Missing Databricks configuration. Please add DATABRICKS_HOST and DATABRICKS_TOKEN to your .env file.")
        st.stop()
    
    # Initialize components
    components = initialize_components()
    
    # Setup Databricks workspace
    try:
        with st.spinner("Setting up Databricks workspace..."):
            # Initialize REST connector
            db_connector = DatabricksRestConnector()
            
            # Test connection
            test_result = db_connector.execute_query("SELECT 1 as test")
            if test_result:
                st.sidebar.success("✅ Connected to Databricks")
            else:
                st.sidebar.error("❌ Failed to connect to Databricks")
                return
        
        # Always do fresh setup - no checks
        if 'database_setup_complete' not in st.session_state:
            progress_bar = st.progress(0)
            status_text = st.empty()
            
            def update_progress(progress, message):
                progress_bar.progress(progress)
                status_text.text(f"🚀 {message}")
            
            success = bootstrap_northwind(
                show_progress=False, 
                fresh_start=True,
                progress_callback=update_progress
            )
            
            if success:
                time.sleep(1)
                progress_bar.empty()
                status_text.empty()
                st.sidebar.success("✅ Database ready")
                st.session_state.database_setup_complete = True
                st.session_state.metadata_loaded = False
            else:
                status_text.error("❌ Setup failed")
                return
        else:
            st.sidebar.success("✅ Database ready")
            

            
    except Exception as e:
        st.sidebar.error(f"❌ Databricks connection failed: {str(e)}")
        return
    
    # Load metadata
    if 'metadata_loaded' not in st.session_state or not st.session_state.metadata_loaded:
        try:
            metadata_df = load_all_metadata(components['vector_store'], show_progress=True)
            if metadata_df is not None and len(metadata_df) > 0:
                st.session_state.metadata_df = metadata_df
                st.session_state.metadata_loaded = True
                st.session_state.metadata_count = len(metadata_df)
                st.sidebar.success(f"✅ Loaded metadata for {len(metadata_df)} schemas")
            else:
                st.sidebar.warning("⚠️ No metadata loaded - database may still be setting up")
                st.session_state.metadata_loaded = False
        except Exception as e:
            st.sidebar.error(f"❌ Error loading metadata: {str(e)}")
            st.session_state.metadata_loaded = False
    else:
        st.sidebar.success("✅ Metadata ready")
    
    # Sidebar
    with st.sidebar:
        st.header("Settings")
        

        
        # Workflow status
        if components['workflow']:
            st.success("✅ Analysis workflow enabled")
        
        # Reload metadata button
        if st.button("🔄 Reload Metadata", key="reload_metadata"):
            with st.spinner("Reloading database metadata..."):
                st.session_state.metadata_loaded = False
                metadata_df = load_all_metadata(components['vector_store'], show_progress=True)
                if metadata_df is not None and len(metadata_df) > 0:
                    st.session_state.metadata_df = metadata_df
                    st.session_state.metadata_loaded = True
                    st.session_state.metadata_count = len(metadata_df)
                    st.success(f"✅ Reloaded metadata for {len(metadata_df)} schemas")
                    st.rerun()
                else:
                    st.error("❌ Failed to reload metadata")
        
        # Available data section moved to sidebar
        st.header("📋 Available Data")
        st.markdown("""
        **🏢 Business Data:**
        - 👥 **Customers** - Company details, contacts, locations
        - 📦 **Orders** - Order dates, shipping info, freight costs
        - 🛍️ **Order Details** - Products, quantities, prices, discounts
        
        **🏭 Product Catalog:**
        - 🎯 **Products** - Names, prices, stock levels
        - 📂 **Categories** - Product groupings and descriptions
        - 🚚 **Suppliers** - Vendor information and contacts
        
        **👨💼 Operations:**
        - 👔 **Employees** - Staff details and hierarchy
        - 🚛 **Shippers** - Delivery companies and contacts
        """)
        
        # Show available catalogs and schemas
        with st.expander("Database Explorer", expanded=False):
            if st.button("Show Catalogs"):
                try:
                    catalogs = get_available_catalogs()
                    st.write("Available catalogs:")
                    st.write(", ".join(catalogs))
                except Exception as e:
                    st.error(f"Error listing catalogs: {str(e)}")
    
    # Main content area
    col1 = st.container()
    
    with col1:
        st.markdown('<p class="subheader">Ask questions about your sales data</p>', unsafe_allow_html=True)
        st.markdown('<p class="info-text">You can ask about customer orders, product sales, and more.</p>', unsafe_allow_html=True)
        
        # Examples
        with st.expander("💡 Example questions", expanded=False):
            st.markdown("""
            **✅ Try these working questions:**
            
            1. **What are the top 10 customers by total order value?**
            2. **Which products generate the most revenue?**
            3. **What's the average order value by country?**
            4. **Which product categories sell the most?**
            5. **What are the top 5 most expensive products?**
            6. **How many orders come from each country?**
            7. **Which countries have the highest average order values?**
            8. **Who are our most frequent customers?**
            9. **Which suppliers provide the most products?**
            10. **Which employees process the most orders?**
            """)
        
        # Question input
        question = st.text_input(
            "Ask your question:",
            placeholder="e.g., What are the top 5 customers by order value?"
        )
    
    # Process question
    if question:
        if 'metadata_df' not in st.session_state or not st.session_state.get('metadata_loaded', False):
            st.error("Metadata not loaded. Please click 'Reload Metadata' button in the sidebar.")
            return
        
        try:
            # Execute workflow
            with st.spinner("Processing your question..."):
                result = components['workflow'].execute(question, db_connector.execute_query)
            
            # Display workflow steps
            with st.expander("Workflow Steps", expanded=False):
                steps = result.get("steps_completed", [])
                for step in steps:
                    if "error" in step:
                        st.markdown(f'<div class="workflow-step workflow-step-error">{step}</div>', unsafe_allow_html=True)
                    else:
                        st.markdown(f'<div class="workflow-step workflow-step-completed">{step}</div>', unsafe_allow_html=True)
            
            # Display error if any
            if "error" in result:
                st.error(result.get("friendly_error", result["error"]))
            
            # Display SQL if generated
            if "generated_sql" in result:
                with st.expander("Generated SQL", expanded=True):
                    st.code(result["generated_sql"], language="sql")
            
            # Display results if available
            if "query_results" in result:
                st.write(f"Query executed in {result.get('execution_time', 0):.2f} seconds, returned {len(result['query_results'])} rows")
                with st.expander("Query Results", expanded=True):
                    st.dataframe(result["query_results"])
            
            # Display analysis
            if "analysis" in result:
                st.subheader("Analysis")
                st.write(result["analysis"])
            
            # Save to history
            if 'history' not in st.session_state:
                st.session_state.history = []
            
            st.session_state.history.append({
                'question': question,
                'sql': result.get('generated_sql', ''),
                'results': result.get('query_results', [])[:10],
                'analysis': result.get('analysis', ''),
                'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            })
            
        except Exception as e:
            st.error(f"Error: {str(e)}")
    
    # Show history
    if 'history' in st.session_state and st.session_state.history:
        with st.expander("Query History", expanded=False):
            for i, item in enumerate(reversed(st.session_state.history[-5:])):
                st.write(f"**{item['timestamp']}**: {item['question']}")
                if st.button(f"Show details", key=f"history_{i}"):
                    st.code(item['sql'], language="sql")
                    st.dataframe(item['results'])
                    st.write(item['analysis'])
                st.divider()


if __name__ == "__main__":
    main()