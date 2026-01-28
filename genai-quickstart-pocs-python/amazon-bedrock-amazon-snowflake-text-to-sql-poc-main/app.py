"""
GenAI Sales Analyst - Main application file.
"""
import streamlit as st
import pandas as pd
import time
import os
import pickle  # nosec B403 - pickle needed for data serialization with security controls
import numpy as np
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import components
from src.bedrock.bedrock_helper import BedrockHelper
from src.vector_store.faiss_manager import FAISSManager
from src.monitoring.langfuse_monitor import LangfuseMonitor
from src.graph.workflow import AnalysisWorkflow
from src.utils.snowflake_connector import (
    get_snowflake_connection, 
    execute_query,
    get_available_databases,
    get_available_schemas,
    get_available_tables,
    get_table_columns
)
from src.utils.northwind_bootstrapper import bootstrap_northwind, check_northwind_exists

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
    
    # Initialize monitoring
    langfuse_public_key = os.getenv('LANGFUSE_PUBLIC_KEY', '')
    langfuse_secret_key = os.getenv('LANGFUSE_SECRET_KEY', '')
    langfuse_host = os.getenv('LANGFUSE_HOST', '')
    
    monitor = None
    if langfuse_public_key and langfuse_secret_key:
        try:
            monitor = LangfuseMonitor(
                public_key=langfuse_public_key,
                secret_key=langfuse_secret_key,
                host=langfuse_host if langfuse_host else None
            )
        except Exception as e:
            st.sidebar.error(f"Error initializing LangFuse: {str(e)}")
    
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
    Load metadata from tables in Snowflake sample database.
    
    Args:
        vector_store: Vector store to add metadata to
        show_progress: Whether to show progress messages
        
    Returns:
        DataFrame with metadata
    """
    # Check if metadata cache exists
    cache_file = "metadata_cache.pkl"
    if os.path.exists(cache_file):
        try:
            # Try JSON first for security
            json_cache_file = cache_file.replace('.pkl', '.json')
            if os.path.exists(json_cache_file):
                with open(json_cache_file, "r") as f:
                    import json
                    cached_data = json.load(f)
            else:
                # Fallback to pickle for existing data, but warn about security risk
                import warnings
                import os
                import io
                warnings.warn("Using pickle deserialization - consider migrating to JSON format for security", 
                             SecurityWarning, stacklevel=2)
                
                # Add basic validation before pickle deserialization
                file_size = os.path.getsize(cache_file)
                if file_size > 100 * 1024 * 1024:  # 100MB limit
                    raise ValueError("Pickle file too large - potential security risk")
                
                # Use restricted unpickler for additional security
                try:
                    import pickle  # nosec B403 - needed for FAISS vector store serialization - last resort with explicit warning
                    import builtins
                    
                    class RestrictedUnpickler(pickle.Unpickler):
                        def find_class(self, module, name):
                            # Only allow safe built-in types and specific modules
                            if module in ("builtins", "__builtin__") and name in ("list", "dict", "str", "int", "float", "bool", "tuple"):
                                return getattr(builtins, name)
                            elif module == "numpy" and name in ("ndarray", "dtype"):
                                import numpy
                                return getattr(numpy, name)
                            elif module == "pandas" and name in ("DataFrame", "Series"):
                                import pandas
                                return getattr(pandas, name)
                            else:
                                raise pickle.UnpicklingError(f"Forbidden class {module}.{name}")
                    
                    with open(cache_file, "rb") as f:
                        cached_data = RestrictedUnpickler(f).load()
                except Exception as e:
                    # If restricted unpickling fails, fall back to regular pickle with warning
                    warnings.warn(f"Restricted unpickling failed ({e}), using regular pickle - HIGH SECURITY RISK", 
                                 SecurityWarning, stacklevel=2)
                    with open(cache_file, "rb") as f:
                        cached_data = pickle.load(f)  # nosec B301 - last resort with explicit warning
            
            vector_store.texts = cached_data.get("texts", [])
            vector_store.metadata = cached_data.get("metadata", [])
            embeddings_array = np.array(cached_data.get("embeddings", [])).astype('float32')
            if len(embeddings_array) > 0:
                vector_store.index.add(embeddings_array)
            if show_progress:
                st.sidebar.success(f"✅ Loaded metadata from cache ({len(vector_store.texts)} items)")
                return cached_data.get("dataframe")
        except Exception as e:
            if show_progress:
                st.sidebar.error(f"Error loading cache: {str(e)}")
    
    # Target tables from Northwind database
    database = "SALES_ANALYST"
    schema = "NORTHWIND"
    tables = [
        "CUSTOMERS", "ORDERS", "ORDER_DETAILS", "PRODUCTS", 
        "CATEGORIES", "SUPPLIERS", "EMPLOYEES", "SHIPPERS"
    ]
    
    all_metadata = []
    progress_text = "Loading metadata..." if show_progress else None
    
    # Create progress bar if showing progress
    if show_progress:
        total_tables = len(tables)
        progress_bar = st.sidebar.progress(0)
        table_count = 0
    
    # Load metadata for each table
    for table in tables:
        try:
            if show_progress:
                table_count += 1
                progress_bar.progress(table_count / total_tables, text=f"Loading {table}...")
            
            metadata_df = get_table_columns(database, schema, table)
            
            # Add table description
            table_desc = f"Table {table} in {schema}"
            metadata_df['table_description'] = table_desc
            metadata_df['database'] = database
            metadata_df['schema'] = schema
            
            all_metadata.append(metadata_df)
            
            # Also get sample data to enrich metadata
            try:
                # Validate database, schema, and table names to prevent injection
                if not database.replace('_', '').replace('-', '').isalnum():
                    raise ValueError(f"Invalid database name: {database}")
                if not schema.replace('_', '').replace('-', '').isalnum():
                    raise ValueError(f"Invalid schema name: {schema}")
                if not table.replace('_', '').replace('-', '').isalnum():
                    raise ValueError(f"Invalid table name: {table}")
                
                # Use validated names in query
                # Note: Using f-string with validated database, schema, and table names
                sample_data = execute_query(f"SELECT * FROM {database}.{schema}.{table} LIMIT 5")  # nosec B608 - all identifiers are validated
                if sample_data:
                    sample_values = {}
                    for col in metadata_df['column_name'].tolist():
                        if col in sample_data[0]:
                            values = [str(row[col]) for row in sample_data if row[col] is not None][:3]
                            if values:
                                sample_values[col] = ", ".join(values)
                    
                    # Add sample values to metadata
                    for i, row in metadata_df.iterrows():
                        col = row['column_name']
                        if col in sample_values:
                            metadata_df.at[i, 'sample_values'] = sample_values[col]
            except Exception:  # nosec B110 - intentional pass for error handling
                # Silently continue if sample data fails
                pass
            
        except Exception as e:
            if show_progress:
                st.sidebar.error(f"Error loading metadata for {table}: {str(e)}")
    
    # Clear progress bar if showing progress
    if show_progress:
        progress_bar.empty()
    
    # Combine all metadata
    if all_metadata:
        combined_metadata = pd.concat(all_metadata)
        
        # Add to vector store
        texts = []
        metadatas = []
        
        for _, row in combined_metadata.iterrows():
            # Create rich text description
            sample_values = f", Sample values: {row.get('sample_values', 'N/A')}" if 'sample_values' in row else ""
            text = f"Table: {row['database']}.{row['schema']}.{row['table_name']}, Column: {row['column_name']}, Type: {row['data_type']}, Description: {row['description']}{sample_values}"
            texts.append(text)
            metadatas.append(row.to_dict())
        
        # Get embeddings and add to vector store
        embeddings = []
        for text in texts:
            embedding = vector_store.bedrock_client.get_embeddings(text)
            embeddings.append(embedding)
        
        # Convert embeddings to numpy array
        embeddings_array = np.array(embeddings).astype('float32')
        
        # Add to vector store
        vector_store.texts = texts
        vector_store.metadata = metadatas
        vector_store.index.add(embeddings_array)
        
        # Save to cache
        try:
            with open(cache_file, "wb") as f:
                pickle.dump({
                    "texts": texts,
                    "metadata": metadatas,
                    "embeddings": embeddings,
                    "dataframe": combined_metadata
                }, f)
        except Exception as e:
            if show_progress:
                st.sidebar.warning(f"Could not save metadata cache: {str(e)}")
        
        return combined_metadata
    
    return None


def main():
    """
    Main application function.
    """
    # Set page config
    st.set_page_config(
        page_title="Sales Data Analyst",
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
    
    # Custom CSS for other elements
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
        background-color: #0066cc;
    }
    .workflow-step {
        padding: 10px;
        border-radius: 5px;
        margin-bottom: 10px;
    }
    .workflow-step-completed {
        background-color: #e6f3ff;
        border-left: 4px solid #0066cc;
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
    
    # Header with direct HTML and inline styles
    st.markdown('<h1 style="font-size: 50px; font-weight: 900; color: #0066cc; text-align: left; margin-bottom: 5px; line-height: 1.0;">Sales Data Analyst</h1>', unsafe_allow_html=True)
    st.markdown('<p style="font-size: 14px; color: #0066cc; margin-top: -5px; margin-bottom: 15px; text-align: left;">(Powered by Amazon Bedrock and Snowflake)</p>', unsafe_allow_html=True)
    st.markdown('<div style="border-bottom: 4px double #0066cc; margin-bottom: 30px;"></div>', unsafe_allow_html=True)
    
    # Initialize components
    components = initialize_components()
    
    # Test Snowflake connection and auto-setup database
    try:
        conn = get_snowflake_connection()
        st.sidebar.success("✅ Connected to Snowflake")
        conn.close()
        
        # Auto-create Northwind database if it doesn't exist
        if not check_northwind_exists():
            st.sidebar.info("🔄 Setting up Northwind database...")
            with st.spinner("Creating Northwind database with sample data..."):
                success = bootstrap_northwind(show_progress=True)
                if success:
                    st.sidebar.success("✅ Northwind database created successfully!")
                else:
                    st.sidebar.error("❌ Failed to create Northwind database")
                    return
        else:
            st.sidebar.success("✅ Northwind database ready")
            
    except Exception as e:
        st.sidebar.error(f"❌ Snowflake connection failed: {str(e)}")
        return
    
    # Load metadata on startup if not already loaded
    if 'metadata_loaded' not in st.session_state or not st.session_state.metadata_loaded:
        with st.spinner("Loading database metadata..."):
            # Add small delay to ensure database is ready
            import time
            time.sleep(2)
            metadata_df = load_all_metadata(components['vector_store'], show_progress=True)
            if metadata_df is not None and len(metadata_df) > 0:
                st.session_state.metadata_df = metadata_df
                st.session_state.metadata_loaded = True
                st.session_state.metadata_count = len(metadata_df)
                st.sidebar.success(f"✅ Loaded metadata for {len(metadata_df)} columns")
            else:
                st.sidebar.error("❌ Failed to load metadata - try reloading the page")
                st.session_state.metadata_loaded = False
    
    # Sidebar
    with st.sidebar:
        st.header("Settings")
        
        # Monitoring status
        if components['monitor'] and components['monitor'].enabled:
            st.success("✅ LangFuse monitoring enabled")
        else:
            st.warning("⚠️ LangFuse monitoring disabled")
        
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
                    st.success(f"✅ Reloaded metadata for {len(metadata_df)} columns")
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
        
        **👨‍💼 Operations:**
        - 👔 **Employees** - Staff details and hierarchy
        - 🚛 **Shippers** - Delivery companies and contacts
        """)
        
        # Show available databases and schemas
        with st.expander("Database Explorer", expanded=False):
            if st.button("Show Databases"):
                try:
                    databases = get_available_databases()
                    st.write("Available databases:")
                    st.write(", ".join(databases))
                except Exception as e:
                    st.error(f"Error listing databases: {str(e)}")
    
    # Main content area - use full width for col1
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
                result = components['workflow'].execute(question, execute_query)
            
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
                'results': result.get('query_results', [])[:10],  # Store only first 10 rows
                'analysis': result.get('analysis', ''),
                'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            })
            
        except Exception as e:
            st.error(f"Error: {str(e)}")
    
    # Show history
    if 'history' in st.session_state and st.session_state.history:
        with st.expander("Query History", expanded=False):
            for i, item in enumerate(reversed(st.session_state.history[-5:])):  # Show last 5 queries
                st.write(f"**{item['timestamp']}**: {item['question']}")
                if st.button(f"Show details", key=f"history_{i}"):
                    st.code(item['sql'], language="sql")
                    st.dataframe(item['results'])
                    st.write(item['analysis'])
                st.divider()


if __name__ == "__main__":
    main()