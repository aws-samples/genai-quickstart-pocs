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
                        "generated_sql": "SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'northwind' AND table_name = 'customers';",
                        "skip_context": True,
                        "steps_completed": state.get("steps_completed", []) + ["retrieve_context", "direct_sql"]
                    }
                else:
                    # For other queries with no context, force SQL generation with Northwind schema
                    return {
                        **state,
                        "relevant_context": [{
                            "text": "Use northwind schema with tables: customers, orders, order_details, products, categories, suppliers, employees, shippers"
                        }],
                        "steps_completed": state.get("steps_completed", []) + ["retrieve_context", "fallback_context"]
                    }
            

            
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
        
        # If no context is available, use Northwind schema
        if not context_str:
            prompt = f"""Generate a SQL query to answer this question:
            
Question: {query}

Use the Northwind database with these tables:
- northwind.customers: customerid, companyname, contactname, country
- northwind.orders: orderid, customerid, orderdate, freight, shipcountry
- northwind.order_details: orderid, productid, unitprice, quantity
- northwind.products: productid, productname, categoryid, unitprice
- northwind.categories: categoryid, categoryname, description
- northwind.suppliers: supplierid, companyname, country
- northwind.employees: employeeid, lastname, firstname, title
- northwind.shippers: shipperid, companyname, phone

IMPORTANT SQL RULES: 
1. Do NOT use 'USE DATABASE' statements
2. Always use schema.table format (e.g., northwind.customers)
3. Use lowercase table and column names
4. Do NOT nest aggregate functions (AVG, SUM, COUNT, etc.)
5. Use subqueries or CTEs for complex calculations
6. For order value calculations: use (unitprice * quantity) from order_details
7. Generate valid Redshift SQL syntax

For "average order value by customer" type queries, use this pattern:
SELECT customerid, companyname, AVG(order_total) as avg_order_value
FROM (
  SELECT c.customerid, c.companyname, o.orderid, SUM(od.unitprice * od.quantity) as order_total
  FROM northwind.customers c
  JOIN northwind.orders o ON c.customerid = o.customerid
  JOIN northwind.order_details od ON o.orderid = od.orderid
  GROUP BY c.customerid, c.companyname, o.orderid
) subquery
GROUP BY customerid, companyname
ORDER BY avg_order_value DESC;

Generate ONLY the SQL query without any explanation.
"""
        else:
            prompt = f"""Generate a SQL query to answer this question:
            
Question: {query}

Relevant context:
{context_str}

IMPORTANT SQL RULES: 
1. Do NOT use 'USE DATABASE' statements
2. Always use schema.table format (e.g., northwind.customers)
3. Use lowercase table and column names
4. Do NOT nest aggregate functions (AVG, SUM, COUNT, etc.)
5. Use subqueries or CTEs for complex calculations
6. For order value calculations: use (unitprice * quantity) from order_details
7. Generate valid Redshift SQL syntax

Generate ONLY the SQL query without any explanation.
"""
        
        try:
            sql = self.bedrock.invoke_model(prompt)
            

            
            # Remove any USE DATABASE statements
            sql_lines = [line for line in sql.split('\n') if not line.strip().upper().startswith('USE DATABASE')]
            sql = '\n'.join(sql_lines)
            
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
        # Initialize state
        state = {
            "query": query,
            "timestamp": datetime.now().isoformat(),
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
        

        
        return state