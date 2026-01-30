"""
LangGraph workflow for the GenAI Sales Analyst application.
"""
from typing import Dict, Any, List, Tuple
import json
from datetime import datetime


class AnalysisWorkflow:
    """
    LangGraph workflow for sales data analysis.
    """
    
    def __init__(self, bedrock_helper, vector_store, monitor=None):
        """
        Initialize the analysis workflow.
        
        Args:
            bedrock_helper: Client for Amazon Bedrock API
            vector_store: Vector store for similarity search
            monitor: Optional monitoring client
        """
        self.bedrock = bedrock_helper
        self.vector_store = vector_store
        self.monitor = monitor
    
    def understand_query(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Understand and classify the user query.
        
        Args:
            state: Current workflow state
            
        Returns:
            Updated workflow state
        """
        query = state['query']
        
        prompt = f"""Analyze this query and classify it:
        
Query: {query}

Determine:
1. Query type (analysis/sql/metadata/comparison)
2. Required data sources or tables
3. Time frame mentioned (if any)
4. Specific metrics requested (if any)

Return as JSON with these fields.
"""
        
        try:
            response = self.bedrock.invoke_model(prompt)
            
            # Log to monitoring if available
            if self.monitor and self.monitor.enabled:
                try:
                    self.monitor.log_interaction(
                        prompt=prompt,
                        response=response,
                        metadata={
                            "step_name": "understand_query",
                            "query": query
                        },
                        trace_id=state.get('trace_id')
                    )
                except Exception as e:
                    print(f"Error logging to LangFuse: {str(e)}")
            
            # Parse the response as JSON
            try:
                analysis = json.loads(response)
            except json.JSONDecodeError:
                # If not valid JSON, create a simple structure
                analysis = {
                    "type": "analysis",
                    "data_sources": [],
                    "time_frame": "not specified",
                    "metrics": []
                }
            
            return {
                **state,
                "query_analysis": analysis,
                "steps_completed": state.get("steps_completed", []) + ["understand_query"]
            }
        except Exception as e:
            return {
                **state,
                "error": f"Error in understand_query: {str(e)}",
                "steps_completed": state.get("steps_completed", []) + ["understand_query_error"]
            }
    
    def retrieve_context(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Retrieve relevant context from vector store.
        
        Args:
            state: Current workflow state
            
        Returns:
            Updated workflow state with relevant context
        """
        if "error" in state:
            return state
            
        query = state['query']
        
        try:
            # Get similar documents from vector store
            similar_docs = self.vector_store.similarity_search(query, k=5)
            
            # Handle empty results
            if not similar_docs:
                # If no similar documents found, create a direct SQL query
                if "schema" in query.lower() and "customer" in query.lower():
                    # Special case for schema queries
                    return {
                        **state,
                        "generated_sql": "USE DATABASE SNOWFLAKE_SAMPLE_DATA;\nDESCRIBE TABLE TPCH_SF1.CUSTOMER;",
                        "skip_context": True,
                        "steps_completed": state.get("steps_completed", []) + ["retrieve_context", "direct_sql"]
                    }
                else:
                    # For other queries with no context
                    return {
                        **state,
                        "relevant_context": [],
                        "steps_completed": state.get("steps_completed", []) + ["retrieve_context", "no_results"]
                    }
            
            # Log to monitoring if available
            if self.monitor and self.monitor.enabled:
                try:
                    self.monitor.log_interaction(
                        prompt=query,
                        response=str(similar_docs),
                        metadata={
                            "step_name": "retrieve_context",
                            "num_results": len(similar_docs)
                        },
                        trace_id=state.get('trace_id')
                    )
                except Exception as e:
                    print(f"Error logging to LangFuse: {str(e)}")
            
            return {
                **state,
                "relevant_context": similar_docs,
                "steps_completed": state.get("steps_completed", []) + ["retrieve_context"]
            }
        except Exception as e:
            return {
                **state,
                "error": f"Error in retrieve_context: {str(e)}",
                "steps_completed": state.get("steps_completed", []) + ["retrieve_context_error"]
            }
    
    def generate_sql(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate SQL based on the query and context.
        
        Args:
            state: Current workflow state
            
        Returns:
            Updated workflow state with generated SQL
        """
        if "error" in state:
            return state
            
        # If we already have direct SQL, skip this step
        if "skip_context" in state and state["skip_context"] and "generated_sql" in state:
            return state
            
        query = state['query']
        context = state.get('relevant_context', [])
        
        # Create context string from relevant documents
        context_str = "\n".join([f"- {doc['text']}" for doc in context])
        
        # If no context is available, use a more generic prompt
        if not context_str:
            prompt = f"""Generate a SQL query to answer this question:
            
Question: {query}

First, make sure to use the SNOWFLAKE_SAMPLE_DATA database.
This database has the TPCH_SF1 schema with these tables and their important columns:
- CUSTOMER: C_CUSTKEY, C_NAME, C_ADDRESS, C_NATIONKEY, C_PHONE, C_ACCTBAL, C_MKTSEGMENT, C_COMMENT
- ORDERS: O_ORDERKEY, O_CUSTKEY, O_ORDERSTATUS, O_TOTALPRICE, O_ORDERDATE, O_ORDERPRIORITY, O_CLERK, O_SHIPPRIORITY, O_COMMENT
- LINEITEM: L_ORDERKEY, L_PARTKEY, L_SUPPKEY, L_LINENUMBER, L_QUANTITY, L_EXTENDEDPRICE, L_DISCOUNT, L_TAX, L_RETURNFLAG, L_LINESTATUS, L_SHIPDATE, L_COMMITDATE, L_RECEIPTDATE
- PART: P_PARTKEY, P_NAME, P_MFGR, P_BRAND, P_TYPE, P_SIZE, P_CONTAINER, P_RETAILPRICE, P_COMMENT
- PARTSUPP: PS_PARTKEY, PS_SUPPKEY, PS_AVAILQTY, PS_SUPPLYCOST, PS_COMMENT
- SUPPLIER: S_SUPPKEY, S_NAME, S_ADDRESS, S_NATIONKEY, S_PHONE, S_ACCTBAL, S_COMMENT
- NATION: N_NATIONKEY, N_NAME, N_REGIONKEY, N_COMMENT
- REGION: R_REGIONKEY, R_NAME, R_COMMENT

IMPORTANT: 
1. Start your query with 'USE DATABASE SNOWFLAKE_SAMPLE_DATA;'
2. Always use fully qualified table names including schema (e.g., TPCH_SF1.CUSTOMER)
3. Use the EXACT column names as listed above, including the prefixes (C_, O_, L_, etc.)
4. When using table aliases, reference columns with the correct prefix (e.g., c.C_CUSTKEY, o.O_ORDERDATE)

Generate ONLY the SQL query without any explanation.
"""
        else:
            prompt = f"""Generate a SQL query to answer this question:
            
Question: {query}

First, make sure to use the SNOWFLAKE_SAMPLE_DATA database.
Relevant context:
{context_str}

IMPORTANT: 
1. Start your query with 'USE DATABASE SNOWFLAKE_SAMPLE_DATA;'
2. Always use fully qualified table names including schema (e.g., TPCH_SF1.CUSTOMER)
3. Use the EXACT column names from the database, including the prefixes (C_, O_, L_, etc.)
4. When using table aliases, reference columns with the correct prefix (e.g., c.C_CUSTKEY, o.O_ORDERDATE)
5. Common column names in TPCH_SF1 schema:
   - CUSTOMER: C_CUSTKEY, C_NAME, C_MKTSEGMENT
   - ORDERS: O_ORDERKEY, O_CUSTKEY, O_TOTALPRICE, O_ORDERDATE
   - LINEITEM: L_ORDERKEY, L_QUANTITY, L_EXTENDEDPRICE, L_DISCOUNT

Generate ONLY the SQL query without any explanation.
"""
        
        try:
            sql = self.bedrock.invoke_model(prompt)
            
            # Log to monitoring if available
            if self.monitor and self.monitor.enabled:
                try:
                    self.monitor.log_interaction(
                        prompt=prompt,
                        response=sql,
                        metadata={
                            "step_name": "generate_sql",
                            "query": query
                        },
                        trace_id=state.get('trace_id')
                    )
                except Exception as e:
                    print(f"Error logging to LangFuse: {str(e)}")
            
            # Ensure SQL starts with USE DATABASE
            if "use database" not in sql.lower():
                sql = f"USE DATABASE SNOWFLAKE_SAMPLE_DATA;\n{sql}"
            
            return {
                **state,
                "generated_sql": sql.strip(),
                "steps_completed": state.get("steps_completed", []) + ["generate_sql"]
            }
        except Exception as e:
            return {
                **state,
                "error": f"Error in generate_sql: {str(e)}",
                "steps_completed": state.get("steps_completed", []) + ["generate_sql_error"]
            }
    
    def analyze_results(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze query results and provide an answer.
        
        Args:
            state: Current workflow state
            
        Returns:
            Updated workflow state with analysis
        """
        if "error" in state:
            return state
            
        query = state['query']
        sql = state.get('generated_sql', '')
        results = state.get('query_results', [])
        
        # Convert results to string representation
        if not results:
            analysis = "No results found for this query."
            
            if self.monitor and self.monitor.enabled:
                try:
                    self.monitor.log_interaction(
                        prompt=query,
                        response=analysis,
                        metadata={
                            "step_name": "analyze_results",
                            "results_count": 0
                        },
                        trace_id=state.get('trace_id')
                    )
                except Exception as e:
                    print(f"Error logging to LangFuse: {str(e)}")
                
            return {
                **state,
                "analysis": analysis,
                "steps_completed": state.get("steps_completed", []) + ["analyze_results"]
            }
        
        results_str = "\n".join([str(row) for row in results[:10]])
        if len(results) > 10:
            results_str += f"\n... and {len(results) - 10} more rows"
        
        prompt = f"""Analyze these query results to answer the user's question:
        
Question: {query}

SQL Query:
{sql}

Query Results (first 10 rows):
{results_str}

Provide a clear, concise analysis that directly answers the question. Include key insights from the data.
"""
        
        try:
            analysis = self.bedrock.invoke_model(prompt)
            
            # Log to monitoring if available
            if self.monitor and self.monitor.enabled:
                try:
                    self.monitor.log_interaction(
                        prompt=prompt,
                        response=analysis,
                        metadata={
                            "step_name": "analyze_results",
                            "results_count": len(results)
                        },
                        trace_id=state.get('trace_id')
                    )
                except Exception as e:
                    print(f"Error logging to LangFuse: {str(e)}")
            
            return {
                **state,
                "analysis": analysis.strip(),
                "steps_completed": state.get("steps_completed", []) + ["analyze_results"]
            }
        except Exception as e:
            return {
                **state,
                "error": f"Error in analyze_results: {str(e)}",
                "steps_completed": state.get("steps_completed", []) + ["analyze_results_error"]
            }
    
    def handle_error(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle errors in the workflow.
        
        Args:
            state: Current workflow state
            
        Returns:
            Updated workflow state with error handling
        """
        error = state.get('error', 'Unknown error')
        
        # Log to monitoring if available
        if self.monitor and self.monitor.enabled:
            try:
                self.monitor.log_error(
                    error_message=error,
                    metadata={
                        "query": state.get('query', ''),
                        "steps_completed": state.get('steps_completed', [])
                    }
                )
            except Exception as e:
                print(f"Error logging error to LangFuse: {str(e)}")
        
        # Generate a user-friendly error message
        prompt = f"""An error occurred while processing this query:
        
Query: {state.get('query', '')}

Error: {error}

Generate a user-friendly error message explaining what went wrong and suggesting how to fix it.
"""
        
        try:
            friendly_message = self.bedrock.invoke_model(prompt)
        except Exception:
            friendly_message = f"Sorry, an error occurred: {error}. Please try rephrasing your question."
        
        return {
            **state,
            "error_handled": True,
            "friendly_error": friendly_message.strip(),
            "steps_completed": state.get("steps_completed", []) + ["handle_error"]
        }
    
    def execute(self, query: str, execute_query_func=None) -> Dict[str, Any]:
        """
        Execute the analysis workflow.
        
        Args:
            query: User query string
            execute_query_func: Function to execute SQL queries
            
        Returns:
            Final workflow state
        """
        # Create trace ID for monitoring
        trace_id = None
        if self.monitor and self.monitor.enabled:
            try:
                from uuid import uuid4
                trace_id = f"workflow-{uuid4()}"
            except Exception:  # nosec B110 - intentional pass for error handling
                pass
        
        # Initialize state
        state = {
            "query": query,
            "timestamp": datetime.now().isoformat(),
            "trace_id": trace_id,
            "steps_completed": []
        }
        
        # Execute workflow steps manually instead of using LangGraph
        state = self.understand_query(state)
        
        if "error" not in state:
            state = self.retrieve_context(state)
        
        if "error" not in state:
            state = self.generate_sql(state)
        
        # Execute SQL if available and no errors
        if "generated_sql" in state and "error" not in state and execute_query_func:
            try:
                start_time = datetime.now()
                results = execute_query_func(state["generated_sql"])
                end_time = datetime.now()
                execution_time = (end_time - start_time).total_seconds()
                
                state["query_results"] = results
                state["execution_time"] = execution_time
                
                # Analyze results
                state = self.analyze_results(state)
                
            except Exception as e:
                state["error"] = f"Error executing SQL: {str(e)}"
                state = self.handle_error(state)
        elif "error" in state:
            state = self.handle_error(state)
        
        # Log complete workflow to monitoring
        if self.monitor and self.monitor.enabled:
            try:
                steps = []
                for step in state.get("steps_completed", []):
                    step_data = {
                        "name": step
                    }
                    steps.append(step_data)
                    
                self.monitor.log_workflow(
                    workflow_name="analysis_workflow",
                    steps=steps,
                    metadata={
                        "query": query,
                        "execution_time": state.get("execution_time"),
                        "error": state.get("error")
                    }
                )
            except Exception as e:
                print(f"Error logging workflow to LangFuse: {str(e)}")
        
        return state