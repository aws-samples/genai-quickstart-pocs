"""
LangGraph workflow for the GenAI Sales Analyst application (Databricks version).
"""
from typing import Dict, Any, List, Tuple
import json
from datetime import datetime


class AnalysisWorkflow:
    """
    LangGraph workflow for sales data analysis with Databricks.
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
            
            try:
                analysis = json.loads(response)
            except json.JSONDecodeError:
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
        """
        if "error" in state:
            return state
            
        query = state['query']
        
        try:
            similar_docs = self.vector_store.similarity_search(query, k=5)
            
            if not similar_docs:
                if "schema" in query.lower() and "customer" in query.lower():
                    return {
                        **state,
                        "generated_sql": "DESCRIBE workspace.northwind.customers;",
                        "skip_context": True,
                        "steps_completed": state.get("steps_completed", []) + ["retrieve_context", "direct_sql"]
                    }
                else:
                    return {
                        **state,
                        "relevant_context": [{
                            "text": "Use workspace.northwind schema with Delta tables: customers, orders, order_details, products, categories, suppliers, employees, shippers"
                        }],
                        "steps_completed": state.get("steps_completed", []) + ["retrieve_context", "fallback_context"]
                    }
            
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
        Generate SQL based on the query and context for Databricks.
        """
        if "error" in state:
            return state
            
        if "skip_context" in state and state["skip_context"] and "generated_sql" in state:
            return state
            
        query = state['query']
        context = state.get('relevant_context', [])
        
        context_str = "\n".join([f"- {doc['text']}" for doc in context])
        
        if not context_str:
            prompt = f"""Generate a SQL query to answer this question for Databricks:
            
Question: {query}

Use the workspace.northwind catalog with these Delta tables:
- workspace.northwind.categories: categoryid (BIGINT), categoryname (STRING), description (STRING)
- workspace.northwind.customers: customerid (STRING), companyname (STRING), contactname (STRING), country (STRING)
- workspace.northwind.employees: employeeid (BIGINT), lastname (STRING), firstname (STRING), title (STRING)
- workspace.northwind.products: productid (BIGINT), productname (STRING), supplierid (BIGINT), categoryid (BIGINT), unitprice (DOUBLE)
- workspace.northwind.suppliers: supplierid (BIGINT), companyname (STRING), country (STRING)
- workspace.northwind.shippers: shipperid (BIGINT), companyname (STRING), phone (STRING)
- workspace.northwind.orders: orderid (BIGINT), customerid (STRING), employeeid (BIGINT), orderdate (STRING), freight (DOUBLE), shipcountry (STRING)
- workspace.northwind.order_details: orderid (BIGINT), productid (BIGINT), unitprice (DOUBLE), quantity (BIGINT), discount (DOUBLE)

NO CAST operations needed - all numeric columns have proper types

IMPORTANT SQL RULES for Databricks: 
1. Always use catalog.schema.table format (e.g., workspace.northwind.customers)
2. Use lowercase table and column names
3. Do NOT nest aggregate functions (AVG, SUM, COUNT, etc.)
4. Use subqueries or CTEs for complex calculations
5. ALL COLUMNS ARE STRING TYPE - use CAST for calculations: CAST(unitprice AS DECIMAL(10,2)) * CAST(quantity AS INT)
6. Generate valid Databricks SQL syntax
7. Use LIMIT instead of TOP for row limiting

For "average order value by customer" type queries, use this pattern:
SELECT customerid, companyname, AVG(order_total) as avg_order_value
FROM (
  SELECT c.customerid, c.companyname, o.orderid, SUM(CAST(od.unitprice AS DECIMAL(10,2)) * CAST(od.quantity AS INT)) as order_total
  FROM workspace.northwind.customers c
  JOIN workspace.northwind.orders o ON c.customerid = o.customerid
  JOIN workspace.northwind.order_details od ON o.orderid = od.orderid
  GROUP BY c.customerid, c.companyname, o.orderid
) subquery
GROUP BY customerid, companyname
ORDER BY avg_order_value DESC;

Generate ONLY the SQL query without any explanation.
"""
        else:
            prompt = f"""Generate a SQL query to answer this question for Databricks:
            
Question: {query}

Relevant context:
{context_str}

IMPORTANT SQL RULES for Databricks: 
1. Always use catalog.schema.table format (e.g., workspace.northwind.customers)
2. Use lowercase table and column names
3. Do NOT nest aggregate functions (AVG, SUM, COUNT, etc.)
4. Use subqueries or CTEs for complex calculations
5. ALL COLUMNS ARE STRING TYPE - use CAST for calculations: CAST(unitprice AS DECIMAL(10,2)) * CAST(quantity AS INT)
6. Generate valid Databricks SQL syntax
7. Use LIMIT instead of TOP for row limiting

Generate ONLY the SQL query without any explanation.
"""
        
        try:
            sql = self.bedrock.invoke_model(prompt)
            
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
        """
        if "error" in state:
            return state
            
        query = state['query']
        sql = state.get('generated_sql', '')
        results = state.get('query_results', [])
        
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
        """
        error = state.get('error', 'Unknown error')
        
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
        """
        trace_id = None
        if self.monitor and self.monitor.enabled:
            try:
                from uuid import uuid4
                trace_id = f"workflow-{uuid4()}"
            except Exception:
                pass
        
        state = {
            "query": query,
            "timestamp": datetime.now().isoformat(),
            "trace_id": trace_id,
            "steps_completed": []
        }
        
        state = self.understand_query(state)
        
        if "error" not in state:
            state = self.retrieve_context(state)
        
        if "error" not in state:
            state = self.generate_sql(state)
        
        if "generated_sql" in state and "error" not in state and execute_query_func:
            try:
                start_time = datetime.now()
                results = execute_query_func(state["generated_sql"])
                end_time = datetime.now()
                execution_time = (end_time - start_time).total_seconds()
                
                state["query_results"] = results
                state["execution_time"] = execution_time
                
                state = self.analyze_results(state)
                
            except Exception as e:
                state["error"] = f"Error executing SQL: {str(e)}"
                state = self.handle_error(state)
        elif "error" in state:
            state = self.handle_error(state)
        
        if self.monitor and self.monitor.enabled:
            try:
                steps = []
                for step in state.get("steps_completed", []):
                    step_data = {"name": step}
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