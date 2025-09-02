"""
GenAI Sales Analyst - Main application file.
"""
import streamlit as st
import pandas as pd
import time
import os
import pickle
import numpy as np
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import components
from src.bedrock.bedrock_helper import BedrockHelper
from src.vector_store.faiss_manager import FAISSManager

from src.graph.simple_workflow import SimpleAnalysisWorkflow
from src.utils.dynamodb_connector import (
    execute_query,
    get_available_tables,
    get_table_info
)
from src.utils.denormalized_bootstrapper import bootstrap_sales_data, check_sales_exists
from src.utils.northwind_denormalizer import bootstrap_from_northwind
from src.utils.dynamodb_bootstrapper import bootstrap_northwind, check_northwind_exists


def initialize_components():
    """
    Initialize application components.
    
    Returns:
        Dictionary of initialized components
    """
    # Get environment variables
    aws_region = os.getenv('AWS_REGION', 'us-east-1')
    
    # Initialize Bedrock client
    bedrock = BedrockHelper(region_name=aws_region)
    
    # Initialize vector store
    vector_store = FAISSManager(
        bedrock_client=bedrock
    )
    
    # No monitoring
    monitor = None
    
    # Initialize workflow
    workflow = SimpleAnalysisWorkflow(
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
    Load metadata from Northwind DynamoDB tables.
    """
    # Create schema context for denormalized sales table
    schema_text = """
    DynamoDB Denormalized Sales Data:
    
    Table: sales_transactions - Complete sales transaction data (NoSQL Document Store)
    Key: transaction_id (String)
    
    Available Attributes for Analysis:
    - Customer Data: customer_id, customer_name, customer_country, customer_city
    - Product Data: product_id, product_name, category_name, supplier_name, supplier_country
    - Order Data: order_id, order_date, shipped_date, employee_name
    - Financial Data: quantity, unit_price, discount, line_total, freight
    - Shipping: shipper_name
    
    This denormalized structure allows for fast analytics on:
    - Revenue by customer, product, category, country
    - Sales performance by employee, supplier
    - Order patterns by date, location
    - All data in single table - no joins needed
    
    Use scan operations to get all transactions, then aggregate client-side.
    """
    
    # Add to vector store
    texts = [schema_text]
    metadatas = [{'database': 'dynamodb', 'tables': 'northwind', 'type': 'schema'}]
    
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
            st.sidebar.success(f"✅ Loaded sales DynamoDB metadata")
        
        # Return dummy dataframe
        import pandas as pd
        return pd.DataFrame({'tables': ['sales_transactions'], 'loaded': [True]})
    
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
    @import url('https://fonts.googleapis.com/icon?family=Material+Icons');
    footer {visibility: hidden;}
    .stDeployButton {display:none;}
    </style>
    """
    st.markdown(hide_streamlit_style, unsafe_allow_html=True)
    
    # Custom CSS for other elements
    st.markdown("""
    <style>
    .subheader {
    /* Fix for Streamlit material icons display */
    [data-testid="stExpander"] [data-testid="stExpanderToggleIcon"] {
        font-family: 'Material Icons' !important;
    }
    /* Ensure material icon text is rendered as icons */
    .material-icons-text {
        font-family: 'Material Icons' !important;
        font-size: 18px !important;
    }
    .material-icons {
        font-family: 'Material Icons';
        font-weight: normal;
        font-style: normal;
        font-size: 24px;
        line-height: 1;
        letter-spacing: normal;
        text-transform: none;
        display: inline-block;
        white-space: nowrap;
        word-wrap: normal;
        direction: ltr;
        -webkit-font-feature-settings: 'liga';
        -webkit-font-smoothing: antialiased;
    }
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
    st.markdown('<p style="font-size: 14px; color: #0066cc; margin-top: -5px; margin-bottom: 15px; text-align: left;">(Powered by Amazon Bedrock and Amazon DynamoDB)</p>', unsafe_allow_html=True)
    st.markdown('<div style="border-bottom: 4px double #0066cc; margin-bottom: 30px;"></div>', unsafe_allow_html=True)
    
    # Initialize components
    components = initialize_components()
    
    # Test DynamoDB connection
    try:
        # Test DynamoDB connection
        try:
            tables = get_available_tables()
            st.sidebar.success(f"✅ Connected to DynamoDB ({len(tables)} tables)")
        except Exception as e:
            st.sidebar.error(f"❌ DynamoDB connection failed: {str(e)}")
            st.error("Please check your AWS credentials and region configuration.")
            st.stop()
        
        # Auto-create sales table from Northwind data if it doesn't exist
        if 'sales_checked' not in st.session_state:
            if not check_sales_exists():
                # Check if we need to create Northwind tables first
                from src.utils.dynamodb_bootstrapper import check_northwind_exists
                
                if not check_northwind_exists():
                    with st.spinner("Downloading complete Northwind dataset from GitHub..."):
                        northwind_success = bootstrap_northwind(show_progress=False)
                        if not northwind_success:
                            st.sidebar.error("❌ Failed to create Northwind tables")
                            st.session_state.sales_checked = True
                            return
                
                with st.spinner("Creating denormalized sales table..."):
                    success = bootstrap_from_northwind(show_progress=False)
                    if success:
                        st.sidebar.success("✅ Sales table created from Northwind data!")
                        st.session_state.metadata_loaded = False
                    else:
                        st.sidebar.error("❌ Failed to denormalize Northwind data")
            else:
                st.sidebar.success("✅ Sales table ready")
            st.session_state.sales_checked = True
        else:
            st.sidebar.success("✅ Sales table ready")
            
        # Test DynamoDB tables only once
        if 'database_tested' not in st.session_state:
            try:
                if check_sales_exists():
                    sales_result = execute_query({'operation': 'scan', 'table_name': 'sales_transactions'})
                    
                    if sales_result is not None:
                        transactions = len(sales_result)
                        st.sidebar.success(f"✅ DynamoDB has {transactions} sales transactions")
                        st.session_state.database_tested = True
                    else:
                        st.sidebar.info("📊 DynamoDB table exists but may be empty")
                        st.session_state.database_tested = True
                else:
                    st.sidebar.info("📊 DynamoDB ready (no sales table)")
                    st.session_state.database_tested = True
            except Exception as e:
                st.sidebar.error(f"❌ DynamoDB test failed: {str(e)}")
                st.session_state.database_tested = True
        else:
            st.sidebar.success("✅ DynamoDB ready")
            
    except Exception as e:
        st.sidebar.error(f"❌ DynamoDB connection failed: {str(e)}")
        return
    
    # Load metadata on startup if not already loaded (runs only once)
    if 'metadata_loaded' not in st.session_state or not st.session_state.metadata_loaded:
        try:
            metadata_df = load_all_metadata(components['vector_store'], show_progress=True)
            if metadata_df is not None and len(metadata_df) > 0:
                st.session_state.metadata_df = metadata_df
                st.session_state.metadata_loaded = True
                st.session_state.metadata_count = len(metadata_df)
                st.sidebar.success(f"✅ Loaded metadata for {len(metadata_df)} columns")
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
        - 🛒 **Order Details** - Products, quantities, prices, discounts
        
        **🏭 Product Catalog:**
        - 🎯 **Products** - Names, prices, stock levels
        - 📂 **Categories** - Product groupings and descriptions
        - 🚚 **Suppliers** - Vendor information and contacts
        
        **👨‍💼 Operations:**
        - 👔 **Employees** - Staff details and hierarchy
        - 🚛 **Shippers** - Delivery companies and contacts
        """)
        
        # Show available DynamoDB tables
        with st.expander("Table Explorer", expanded=False):
            if st.button("Show Tables"):
                try:
                    tables = get_available_tables()
                    st.write("Available DynamoDB tables:")
                    for table in tables:
                        st.write(f"- {table}")
                        # Show table info
                        table_info = get_table_info(table)
                        if table_info:
                            st.write(f"  Items: {table_info.get('item_count', 'Unknown')}")
                except Exception as e:
                    st.error(f"Error listing tables: {str(e)}")
    
    # Main content area - use full width for col1
    col1 = st.container()
    
    with col1:
        st.markdown('<p class="subheader">Ask questions about your sales data</p>', unsafe_allow_html=True)
        st.markdown('<p class="info-text">Ask natural language questions about your DynamoDB data.</p>', unsafe_allow_html=True)
        
        # Examples
        with st.expander("💡 Example questions", expanded=False):
            st.markdown("""
            **✅ Try these working questions:**
            
            1. **What are the top 10 customers by total order value?**
            2. **Show me a customer with customerid = 'LAMAI'**
            3. **Which employees process the most orders?**
            4. **Which suppliers provide the most products?**
            5. **Show customers from Germany**
            6. **Top 5 customers by total order value**
            """)
        
        # Enhanced Question input with better visibility
        st.markdown("### 💬 Ask Your Sales Question")
        st.markdown("---")
        question = st.text_input(
            "Enter your question",
            placeholder="🔍 e.g., What are the top 10 customers by total revenue?",
            help="Ask natural language questions about your sales data",
            key="main_query_input",
            label_visibility="collapsed",
        )
        
        # Add some styling for better visibility
        st.markdown("""
        <style>
        .stTextInput > div > div > input {
            background-color: #f0f8ff;
            border: 2px solid #4CAF50;
            border-radius: 10px;
            padding: 10px;
            font-size: 16px;
        }
        .stTextInput > div > div > input:focus {
            border-color: #45a049;
            box-shadow: 0 0 10px rgba(76, 175, 80, 0.3);
        }
        </style>
        """, unsafe_allow_html=True)
    
    # Process question
    if question:
        if 'metadata_df' not in st.session_state or not st.session_state.get('metadata_loaded', False):
            st.error("Metadata not loaded. Please click 'Reload Metadata' button in the sidebar.")
            return
        
        # Clear any previous results to ensure fresh display
        if "current_results" in st.session_state:
            del st.session_state.current_results
        
        # Clear all caches to prevent stale results
        st.cache_data.clear()
        st.cache_resource.clear()
        
        # Clear any workflow-related session state
        workflow_keys = [k for k in st.session_state.keys() if 'workflow' in k.lower() or 'query' in k.lower() or 'result' in k.lower()]
        for key in workflow_keys:
            if key not in ['metadata_loaded', 'database_tested', 'sales_checked']:  # Keep essential state
                del st.session_state[key]
        
        # Force fresh query processing
        import time
        query_timestamp = int(time.time() * 1000)
        
        # Force component refresh
        components['workflow'] = SimpleAnalysisWorkflow(
            bedrock_helper=components['bedrock'],
            vector_store=components['vector_store'],
            monitor=components.get('monitor')
        )
        
        
        try:
            # Execute workflow
            with st.spinner("Processing your question..."):
                result = components['workflow'].execute(question, execute_query)
            # Create container for results to ensure proper refresh
            results_container = st.container()
            with results_container:
                
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
                    error_message = result.get("friendly_error", result["error"])
                    if "🚫" in error_message or "**" in error_message:
                        # Rich error message with markdown
                        st.error("Query Not Supported")
                        st.markdown(error_message)
                    else:
                        # Simple error message
                        st.error(error_message)
                
                if "generated_query" in result:
                    with st.expander("Generated DynamoDB Query", expanded=True):
                        query_dict = result["generated_query"]
                        
                        # Show query optimization rationale
                        if query_dict.get("explanation"):
                            if query_dict.get("use_partiql"):
                                st.success(f"🔍 **PartiQL Selected**: {query_dict['explanation']}")
                            else:
                                st.info(f"⚡ **Native DynamoDB Selected**: {query_dict['explanation']}")
                        
                        # Show the actual query/operation
                        if query_dict.get("partiql_statement"):
                            st.markdown("**PartiQL Statement:**")
                            st.code(query_dict["partiql_statement"], language="sql")
                        elif query_dict.get("operation") == "scan":
                            st.markdown("**DynamoDB Operation:**")
                            st.code(f"table.scan() on {query_dict.get('table_name', 'unknown')}", language="python")
                        
                        # Show full query configuration
                        st.json(query_dict)
                # Display results if available
                if "query_results" in result and result["query_results"]:
                    results_data = result["query_results"]
                    st.write(f"Query executed in {result.get('execution_time', 0):.2f} seconds, returned {len(results_data)} rows")
                    
                    with st.expander("Query Results", expanded=True):
                        if len(results_data) > 0:
                            # Convert to DataFrame for better display
                            import pandas as pd
                            df = pd.DataFrame(results_data)
                            
                            # Force refresh by clearing cache and using unique key
                            st.cache_data.clear()
                            st.dataframe(
                                df, 
                                width="stretch",
                                key=f"results_{int(time.time() * 1000)}"  # Timestamp-based unique key
                            )
                            
                            # Show row count
                            if len(results_data) > 100:
                                st.caption(f"Showing all {len(results_data)} rows")
                        else:
                            st.info("No results returned for this query.")
                elif "query_results" in result:
                    st.info("Query executed successfully but returned no results.")
                
                # Display analysis
                if "analysis" in result:
                    st.subheader("Analysis")
                    st.write(result["analysis"])
                
                # Save to history
            if 'history' not in st.session_state:
                st.session_state.history = []
            
            st.session_state.history.append({
                'question': question,
                'query': result.get('generated_query', {}),
                'results': result.get('query_results', [])[:10],  # Store only first 10 rows
                'analysis': result.get('analysis', ''),
                'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            })
            
        except Exception as e:
            st.error(f"Error: {str(e)}")
    
    # Show history
    if "history" in st.session_state and st.session_state.history:
        with st.expander("📚 Query History (Last 5 Queries)", expanded=False):
            try:
                for i, item in enumerate(reversed(st.session_state.history[-5:])):  # Show last 5 queries
                    # Ensure item is a dictionary and has required fields
                    if not isinstance(item, dict):
                        continue
                    
                    # Create a unique container for each history item
                    with st.container():
                        # Safe access to item fields
                        timestamp = item.get('timestamp', 'Unknown time')
                        question = item.get('question', 'Unknown question')
                        st.markdown(f"**{timestamp}**: {question}")
                        
                        # Use expander for each history item details
                        with st.expander(f"📋 Show Details #{i+1}", expanded=False):
                            st.success("🔍 Historical Query Results")
                            st.markdown("---")
                            
                            # Show query details
                            st.markdown("**🔧 Query Configuration:**")
                            query_data = item.get("query", {})
                            if query_data:
                                st.json(query_data)
                            else:
                                st.info("No query configuration available")
                            
                            st.markdown("**📊 Results:**")
                            results_data = item.get("results", [])
                            if results_data:
                                try:
                                    df = pd.DataFrame(results_data)
                                    st.dataframe(df, width="stretch")
                                    st.caption(f"📈 {len(results_data)} rows returned")
                                except Exception as e:
                                    st.write(results_data)
                                    st.caption(f"Raw results (could not convert to table): {str(e)}")
                            else:
                                st.info("No results for this query")
                            
                            # Show analysis
                            analysis_data = item.get("analysis", "")
                            if analysis_data:
                                st.markdown("**🧠 Analysis:**")
                                st.write(analysis_data)
                            else:
                                st.info("No analysis available for this query")
                        
                        st.divider()
            except Exception as e:
                st.error(f"Error displaying query history: {str(e)}")
                st.info("Try refreshing the page or clearing your browser cache.")
if __name__ == "__main__":
    main()
    # JavaScript fix for material icons display
    st.markdown("""
    <script>
    // Fix material icons display
    function fixMaterialIcons() {
        // Find all elements that might contain material icon text
        const elements = document.querySelectorAll('*');
        elements.forEach(el => {
            if (el.textContent && el.textContent.includes('keyboard_double_arrow_right')) {
                el.innerHTML = el.innerHTML.replace(/keyboard_double_arrow_right/g, '»');
            }
            if (el.textContent && el.textContent.includes('expand_more')) {
                el.innerHTML = el.innerHTML.replace(/expand_more/g, '▼');
            }
            if (el.textContent && el.textContent.includes('expand_less')) {
                el.innerHTML = el.innerHTML.replace(/expand_less/g, '▲');
            }
        });
    }
    
    // Run the fix when page loads and periodically
    document.addEventListener('DOMContentLoaded', fixMaterialIcons);
    setTimeout(fixMaterialIcons, 1000);
    setInterval(fixMaterialIcons, 2000);
    </script>
    """, unsafe_allow_html=True)
