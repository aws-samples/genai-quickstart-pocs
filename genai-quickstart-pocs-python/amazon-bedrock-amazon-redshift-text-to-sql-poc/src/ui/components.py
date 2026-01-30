"""
UI components for the GenAI Sales Analyst application.
"""
import streamlit as st
import pandas as pd
import altair as alt
from PIL import Image
import os
from ..config.settings import IMAGES_FOLDER


def display_header():
    """
    Display the application header with logo and title.
    """
    # Load LendingTree logo if available
    logo_path = os.path.join(IMAGES_FOLDER, "lendingtree_Logo.png")
    if os.path.exists(logo_path):
        lendingtree_logo = Image.open(logo_path)
        st.image(lendingtree_logo, use_column_width=False, width=300)

    st.markdown('<hr style="border:2px solid #0A74DA;margin:10px 0;">', unsafe_allow_html=True)
    st.markdown(
        '<h1 style="color:#52247F;text-align:left;">GenAI Sales Analyst <span style="color:blue; font-style:italic; font-size:20px">(Powered by Amazon Bedrock©)</span></h1>',
        unsafe_allow_html=True,
    )
    st.markdown('<hr style="border:2px solid #0A74DA;margin:10px 0;">', unsafe_allow_html=True)


def display_config_tab(get_redshift_databases_fn, get_redshift_schemas_fn, get_available_models_fn):
    """
    Display the configuration tab.
    
    Args:
        get_redshift_databases_fn (function): Function to get Redshift databases.
        get_redshift_schemas_fn (function): Function to get Redshift schemas.
        get_available_models_fn (function): Function to get available models.
    """
    st.markdown(
        """
        <div style="border: 2px solid #0A74DA; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
            <h3 style="color: #52247F; margin-bottom: 15px;">🔧 Configuration</h3>
        </div>
        """,
        unsafe_allow_html=True,
    )
    
    databases = get_redshift_databases_fn()
    selected_db = st.selectbox(
        "Select Database:",
        databases,
        index=databases.index(st.session_state.config["database"]) if databases and st.session_state.config["database"] in databases else 0
    ) if databases else None

    schemas = get_redshift_schemas_fn(selected_db) if selected_db else []
    selected_schema = st.selectbox(
        "Select Schema:",
        schemas,
        index=schemas.index(st.session_state.config["schema"]) if schemas and st.session_state.config["schema"] in schemas else 0
    ) if schemas else None

    available_models = get_available_models_fn()
    selected_model = st.selectbox(
        "Select AI Model:",
        available_models,
        index=available_models.index(st.session_state.config["model"]) if available_models and st.session_state.config["model"] in available_models else 0
    )

    if st.button("Set Configuration", key="set_config"):
        st.session_state.config.update({
            "database": selected_db,
            "schema": selected_schema,
            "model": selected_model
        })
        st.success(
            f"Configuration updated: Database = {selected_db}, Schema = {selected_schema}, Model = {selected_model}"
        )

    # Information banner at the bottom
    st.markdown(
        """
        <div style="border: 2px solid #0A74DA; padding: 20px; border-radius: 10px; margin-top: 30px;">
            <h3 style="color: #52247F; margin-bottom: 15px;">🤖 About This Tool</h3>
            <p style="color: #333333; line-height: 1.6;">
                Welcome to your intelligent sales analysis assistant, powered by Amazon Bedrock Nova. 
                This tool helps you navigate and analyze sales data across multiple 
                Redshift databases with ease.
            </p>
            <p style="color: #333333; line-height: 1.6;">
                Simply use natural language to:
                <ul style="margin-top: 10px;">
                    <li>Query sales data seamlessly</li>
                    <li>Generate comprehensive data summaries</li>
                    <li>Uncover valuable business insights</li>
                    <li>Analyze trends and patterns</li>
                </ul>
            </p>
            <p style="color: #333333; line-height: 1.6;">
                No SQL knowledge required - just ask your questions naturally, and let the AI handle the complexity.
            </p>
        </div>
        """,
        unsafe_allow_html=True,
    )


def display_analyst_tab(handle_user_query_fn, execute_multiple_sql_queries_fn):
    """
    Display the sales analyst tab.
    
    Args:
        handle_user_query_fn (function): Function to handle user queries.
        execute_multiple_sql_queries_fn (function): Function to execute SQL queries.
    """
    # Create two columns
    col1, col2 = st.columns(2, gap="large")
    
    with col1:
        st.markdown(
            """
            <div style="border: 2px solid #0A74DA; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                <h3 style="color: #52247F; margin-bottom: 15px;">📝 Sales Analyzer</h3>
            </div>
            """,
            unsafe_allow_html=True,
        )
        
        nl_query = st.text_area(
            "Enter your question:",
            height=100,
            placeholder="Ask anything about the sales data...",
            key="query_input"
        )

        if st.button("Submit", key="submit_query") and nl_query.strip():
            db_name = st.session_state.config.get("database")
            schema_name = st.session_state.config.get("schema")
            model_id = st.session_state.config.get("model")
            
            if db_name and schema_name:
                sql_queries, summary = handle_user_query_fn(nl_query, db_name, schema_name, model_id)
                
                if sql_queries:
                    results = execute_multiple_sql_queries_fn(sql_queries, database=db_name, schema=schema_name)
                    
                    if results:
                        # Store the query and result in session state
                        st.session_state.queries.append(nl_query)
                        st.session_state.history.append({"query": nl_query, "results": results})
                        
                        for query, df in results.items():
                            if df is not None:
                                st.markdown(f"**Query:** {query}")
                                st.dataframe(df)
                                
                                # Try to visualize the data if possible
                                if not df.empty and len(df.columns) >= 2:
                                    try:
                                        # Simple heuristic for visualization
                                        if len(df) <= 20:  # Small enough for a chart
                                            numeric_cols = df.select_dtypes(include=['number']).columns
                                            if len(numeric_cols) >= 1:
                                                # Choose first string column for x-axis if available
                                                string_cols = df.select_dtypes(include=['object']).columns
                                                if len(string_cols) >= 1:
                                                    x_col = string_cols[0]
                                                    y_col = numeric_cols[0]
                                                    
                                                    chart = alt.Chart(df).mark_bar().encode(
                                                        x=x_col,
                                                        y=y_col,
                                                        tooltip=list(df.columns)
                                                    ).properties(
                                                        title=f"Visualization of {y_col} by {x_col}"
                                                    )
                                                    st.altair_chart(chart, use_container_width=True)
                                    except Exception as e:  # nosec B110 - intentional pass for error handling
                                        pass  # Silently fail if visualization isn't possible
                            else:
                                st.warning(f"No results for query: {query}")
                    else:
                        st.warning("No results returned for the queries.")
                elif summary:
                    st.markdown("### Data Summary")
                    st.text(summary)
                    
                    # Store the query and summary in session state
                    st.session_state.queries.append(nl_query)
                    st.session_state.history.append({"query": nl_query, "summary": summary})
                else:
                    st.warning("No SQL queries or summary generated.")

    with col2:
        st.markdown(
            """
            <div style="border: 2px solid #0A74DA; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                <h3 style="color: #52247F; margin-bottom: 15px;">🗂 Historical Results</h3>
            </div>
            """,
            unsafe_allow_html=True,
        )
        
        if "queries" in st.session_state and "history" in st.session_state:
            if st.session_state.queries:
                for entry in st.session_state.history:
                    query = entry["query"]
                    
                    st.markdown(
                        f"""
                        <div style="border: 2px solid #0A74DA; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                            <h4 style="color: #52247F; margin-bottom: 15px;">Query: {query}</h4>
                        </div>
                        """,
                        unsafe_allow_html=True,
                    )

                    if "results" in entry:
                        result_set = entry["results"]
                        if isinstance(result_set, dict):
                            for sql_query, df in result_set.items():
                                st.code(sql_query, language="sql")
                                if df is not None and not df.empty:
                                    st.dataframe(df)
                                else:
                                    st.warning(f"No results for query: {sql_query}")
                        else:
                            st.warning("Unexpected data format in historical results.")
                    elif "summary" in entry:
                        st.text(entry["summary"])
            else:
                st.markdown("No historical queries found.")
        else:
            st.warning("Session state is missing query history.")


def display_exit_button(reset_app_fn):
    """
    Display the exit button.
    
    Args:
        reset_app_fn (function): Function to reset the application.
    """
    st.markdown('<div class="exit-button">', unsafe_allow_html=True)
    if st.button("Exit", key="exit_button"):
        reset_app_fn()
    st.markdown('</div>', unsafe_allow_html=True)