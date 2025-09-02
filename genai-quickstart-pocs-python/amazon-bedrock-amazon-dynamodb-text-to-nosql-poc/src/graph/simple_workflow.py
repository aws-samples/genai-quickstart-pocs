"""
Simplified workflow that actually works.
"""

from datetime import datetime
from typing import Dict, Any, List
import json
from ..models.smart_table_router import route_query_smart

class SimpleAnalysisWorkflow:
    """Simplified analysis workflow with smart table routing."""
    
    def __init__(self, bedrock_helper, vector_store, monitor=None):
        self.bedrock = bedrock_helper
        self.vector_store = vector_store
        self.monitor = monitor
        self.debug = False  # Turn off debug output
    
    def execute(self, query: str, execute_query_func) -> Dict[str, Any]:
        """
        Execute simplified analysis workflow with smart table routing.
        
        Args:
            query: User's natural language query
            execute_query_func: Function to execute DynamoDB queries
            
        Returns:
            Analysis results
        """
        # Step 1: Smart route the query to most appropriate table
        query_config = route_query_smart(query)
        
        # Step 2: Execute the query
        try:
            start_time = datetime.now()
            results = execute_query_func(query_config)
            end_time = datetime.now()
            execution_time = (end_time - start_time).total_seconds()
            
        except Exception as e:
            return {
                'query': query,
                'error': f"Query execution failed: {str(e)}",
                'steps_completed': ['route_query', 'execute_query_error'],
                'generated_query': query_config
            }
        
        # Step 3: Process results if needed
        processed_results = self._process_results(results, query, query_config)
        
        # Step 4: Generate analysis
        analysis = self._generate_analysis(query, processed_results, query_config)
        
        return {
            'query': query,
            'generated_query': query_config,
            'query_results': processed_results,
            'execution_time': execution_time,
            'analysis': analysis,
            'steps_completed': ['route_query', 'execute_query', 'process_results', 'generate_analysis']
        }
    
    def _process_results(self, results: List[Dict], query: str, query_config: Dict) -> List[Dict]:
        """Process results based on query type."""
        
        if not results:
            return results
        
        query_type = query_config.get('query_type', 'simple_scan')
        query_lower = query.lower()
        
        # Handle specific analytical queries
        if 'product' in query_lower and 'revenue' in query_lower:
            return self._aggregate_by_product_revenue(results)
        elif 'supplier' in query_lower and 'product' in query_lower:
            return self._aggregate_by_supplier(results)
        elif 'employee' in query_lower and 'order' in query_lower:
            return self._aggregate_by_employee(results)
        
        # Handle TOP N queries with aggregation
        elif query_type == 'top_n' and ('customer' in query_lower and 'total' in query_lower):
            return self._aggregate_by_customer(results, query_config.get('limit', 10))
        
        elif query_type == 'top_n' and ('product' in query_lower and 'revenue' in query_lower):
            return self._aggregate_by_product(results, query_config.get('limit', 10))
        
        # For filtering queries, return as-is
        elif query_type == 'filtering' or query_type == 'specific_table':
            return results
        
        # For simple scans, limit to reasonable number
        else:
            limit = min(len(results), 100)  # Max 100 for display
            return results[:limit]
    
    def _aggregate_by_product_revenue(self, results: List[Dict]) -> List[Dict]:
        """Aggregate results by product revenue."""
        
        product_revenue = {}
        
        for item in results:
            product_name = item.get('product_name', 'Unknown')
            line_total = float(item.get('line_total', 0))
            
            if product_name not in product_revenue:
                product_revenue[product_name] = {
                    'product_name': product_name,
                    'total_revenue': 0,
                    'transaction_count': 0
                }
            
            product_revenue[product_name]['total_revenue'] += line_total
            product_revenue[product_name]['transaction_count'] += 1
        
        # Sort by revenue descending
        sorted_products = sorted(
            product_revenue.values(),
            key=lambda x: x['total_revenue'],
            reverse=True
        )
        
        return sorted_products
    
    def _aggregate_by_supplier(self, results: List[Dict]) -> List[Dict]:
        """Aggregate results by supplier."""
        
        supplier_data = {}
        
        for item in results:
            supplier = item.get('supplier_name', item.get('supplier_company_name', 'Unknown'))
            product = item.get('product_name', 'Unknown')
            
            if supplier not in supplier_data:
                supplier_data[supplier] = {
                    'supplier_name': supplier,
                    'unique_products': set(),
                    'total_transactions': 0
                }
            
            supplier_data[supplier]['unique_products'].add(product)
            supplier_data[supplier]['total_transactions'] += 1
        
        # Convert to list format
        result = []
        for supplier, data in supplier_data.items():
            result.append({
                'supplier_name': supplier,
                'product_count': len(data['unique_products']),
                'transaction_count': data['total_transactions'],
                'products': list(data['unique_products'])[:5]  # Show first 5 products
            })
        
        # Sort by product count descending
        return sorted(result, key=lambda x: x['product_count'], reverse=True)
    
    def _aggregate_by_employee(self, results: List[Dict]) -> List[Dict]:
        """Aggregate results by employee."""
        
        employee_data = {}
        
        for item in results:
            employee = item.get('employee_name', item.get('employee_first_name', 'Unknown'))
            order_id = item.get('order_id', 'Unknown')
            
            if employee not in employee_data:
                employee_data[employee] = {
                    'employee_name': employee,
                    'unique_orders': set(),
                    'total_transactions': 0
                }
            
            employee_data[employee]['unique_orders'].add(order_id)
            employee_data[employee]['total_transactions'] += 1
        
        # Convert to list format
        result = []
        for employee, data in employee_data.items():
            result.append({
                'employee_name': employee,
                'order_count': len(data['unique_orders']),
                'transaction_count': data['total_transactions']
            })
        
        # Sort by order count descending
        return sorted(result, key=lambda x: x['order_count'], reverse=True)
    
    def _aggregate_by_customer(self, results: List[Dict], limit: int) -> List[Dict]:
        """Aggregate results by customer."""
        
        customer_totals = {}
        
        for item in results:
            customer_name = item.get('customer_name', 'Unknown')
            line_total = float(item.get('line_total', 0))
            
            if customer_name not in customer_totals:
                customer_totals[customer_name] = {
                    'customer_name': customer_name,
                    'total_value': 0,
                    'order_count': 0
                }
            
            customer_totals[customer_name]['total_value'] += line_total
            customer_totals[customer_name]['order_count'] += 1
        
        # Sort by total value descending
        sorted_customers = sorted(
            customer_totals.values(),
            key=lambda x: x['total_value'],
            reverse=True
        )
        
        return sorted_customers[:limit]
    
    def _aggregate_by_product(self, results: List[Dict], limit: int) -> List[Dict]:
        """Aggregate results by product."""
        
        product_totals = {}
        
        for item in results:
            product_name = item.get('product_name', 'Unknown')
            line_total = float(item.get('line_total', 0))
            
            if product_name not in product_totals:
                product_totals[product_name] = {
                    'product_name': product_name,
                    'total_revenue': 0,
                    'order_count': 0
                }
            
            product_totals[product_name]['total_revenue'] += line_total
            product_totals[product_name]['order_count'] += 1
        
        # Sort by revenue descending
        sorted_products = sorted(
            product_totals.values(),
            key=lambda x: x['total_revenue'],
            reverse=True
        )
        
        return sorted_products[:limit]
    
    def _generate_analysis(self, query: str, results: List[Dict], query_config: Dict) -> str:
        """Generate human-readable analysis of results."""
        
        if not results:
            return "No results found for your query. You may want to try a different search criteria or check if the data exists in the database."
        
        query_type = query_config.get('query_type', 'simple_scan')
        table_name = query_config.get('table_name', 'unknown')
        is_primary_table = query_config.get('primary_table', False)
        
        # Generate contextual analysis based on table and query type
        if is_primary_table:
            return self._generate_primary_table_analysis(query, results, query_config, table_name)
        else:
            return self._generate_fallback_analysis(query, results, query_config)
    
    def _generate_primary_table_analysis(self, query: str, results: List[Dict], query_config: Dict, table_name: str) -> str:
        """Generate analysis for primary table queries."""
        
        count = len(results)
        query_lower = query.lower()
        
        if table_name == 'northwind_customers':
            if 'customerid' in query_lower and count == 1:
                customer = results[0]
                customer_name = customer.get('company_name', customer.get('customer_name', 'Unknown'))
                country = customer.get('country', 'Unknown')
                city = customer.get('city', 'Unknown')
                return f"Found customer **{customer_name}** located in {city}, {country}. This is their complete customer profile from the customers database."
            else:
                return f"Found {count} customers in the customers database. The table shows their complete profile information including contact details and location."
        
        elif table_name == 'northwind_products':
            if count == 1:
                product = results[0]
                product_name = product.get('product_name', 'Unknown')
                category = product.get('category_name', 'Unknown')
                price = product.get('unit_price', 0)
                return f"Found product **{product_name}** in the {category} category, priced at ${price}. This is the complete product information from the products database."
            else:
                return f"Found {count} products in the products database. The table shows complete product details including pricing, categories, and specifications."
        
        elif table_name == 'northwind_orders':
            if count == 1:
                order = results[0]
                order_id = order.get('order_id', 'Unknown')
                order_date = order.get('order_date', 'Unknown')
                return f"Found order **{order_id}** placed on {order_date}. This is the complete order header information from the orders database."
            else:
                return f"Found {count} orders in the orders database. The table shows order header information including dates, customers, and shipping details."
        
        return f"Found {count} records in the {table_name} database. This is the most specific data available for your query."
    
    def _generate_fallback_analysis(self, query: str, results: List[Dict], query_config: Dict) -> str:
        """Generate analysis for fallback table (sales_transactions) queries."""
        
        query_type = query_config.get('query_type', 'simple_scan')
        query_lower = query.lower()
        
        # Handle specific analytical queries
        if 'product' in query_lower and 'revenue' in query_lower:
            return self._generate_product_revenue_analysis(query, results, query_config)
        elif 'supplier' in query_lower and 'product' in query_lower:
            return self._generate_supplier_analysis(query, results, query_config)
        elif 'employee' in query_lower and 'order' in query_lower:
            return self._generate_employee_analysis(query, results, query_config)
        
        # Use the existing analysis methods for other fallback queries
        elif query_type == 'filtering':
            return self._generate_filtering_analysis(query, results, query_config)
        elif query_type == 'top_n':
            return self._generate_top_n_analysis(query, results, query_config)
        else:
            return self._generate_simple_analysis(query, results)
    
    def _generate_product_revenue_analysis(self, query: str, results: List[Dict], query_config: Dict) -> str:
        """Generate comprehensive analysis for product revenue queries."""
        
        count = len(results)
        if count == 0:
            return "No product revenue data found in the sales transactions."
        
        # Calculate comprehensive metrics
        total_revenue = sum(float(item.get('total_revenue', 0)) for item in results)
        total_products = len(results)
        avg_revenue = total_revenue / total_products if total_products > 0 else 0
        
        # Get top performers
        top_3 = results[:3] if len(results) >= 3 else results
        top_3_revenue = sum(float(item.get('total_revenue', 0)) for item in top_3)
        top_3_percentage = (top_3_revenue / total_revenue * 100) if total_revenue > 0 else 0
        
        # Calculate performance gaps
        top_revenue = float(top_3[0].get('total_revenue', 0)) if top_3 else 0
        performance_multiplier = (top_revenue / avg_revenue) if avg_revenue > 0 else 0
        
        # Build comprehensive analysis
        analysis = f"🏆 **TOP 3 REVENUE GENERATORS:**\n"
        for i, product in enumerate(top_3, 1):
            name = product.get('product_name', 'Unknown')
            revenue = float(product.get('total_revenue', 0))
            percentage = (revenue / total_revenue * 100) if total_revenue > 0 else 0
            analysis += f"{i}. {name}: ${revenue:,.2f} ({percentage:.1f}% of total)\n"
        
        analysis += f"\n📊 **PERFORMANCE ANALYSIS:**\n"
        analysis += f"• Total Revenue Analyzed: ${total_revenue:,.2f} from {total_products} products\n"
        analysis += f"• Average Revenue per Product: ${avg_revenue:,.2f}\n"
        analysis += f"• Top 3 products generate {top_3_percentage:.1f}% of total revenue\n"
        analysis += f"• Performance Gap: Top product generates {performance_multiplier:.1f}x more than average\n"
        
        analysis += f"\n💡 **BUSINESS INSIGHTS:**\n"
        if top_3_percentage > 50:
            analysis += f"• High revenue concentration - top 3 products dominate sales\n"
            analysis += f"• Risk: Heavy dependence on few products\n"
        else:
            analysis += f"• Balanced revenue distribution across product portfolio\n"
        
        if performance_multiplier > 5:
            analysis += f"• Significant performance gaps between top and average products\n"
            analysis += f"• Opportunity: Focus on boosting mid-tier product performance\n"
        
        # Calculate top 20% impact (Pareto analysis)
        top_20_percent_count = max(1, int(total_products * 0.2))
        top_20_revenue = sum(float(item.get('total_revenue', 0)) for item in results[:top_20_percent_count])
        pareto_percentage = (top_20_revenue / total_revenue * 100) if total_revenue > 0 else 0
        
        analysis += f"• Pareto Analysis: Top {top_20_percent_count} products ({(top_20_percent_count/total_products*100):.0f}%) generate {pareto_percentage:.1f}% of revenue\n"
        
        if pareto_percentage > 80:
            analysis += f"• Recommendation: Diversify revenue sources to reduce risk\n"
        else:
            analysis += f"• Recommendation: Leverage strong product portfolio for growth\n"
        
        return analysis
    
    def _generate_supplier_analysis(self, query: str, results: List[Dict], query_config: Dict) -> str:
        """Generate comprehensive analysis for supplier queries."""
        
        count = len(results)
        if count == 0:
            return "No supplier data found in the sales transactions."
        
        # Calculate comprehensive metrics
        total_suppliers = len(results)
        total_products = sum(item.get('product_count', 0) for item in results)
        avg_products_per_supplier = total_products / total_suppliers if total_suppliers > 0 else 0
        
        # Get top performers
        top_3 = results[:3] if len(results) >= 3 else results
        top_3_products = sum(item.get('product_count', 0) for item in top_3)
        top_3_percentage = (top_3_products / total_products * 100) if total_products > 0 else 0
        
        # Calculate concentration risk
        top_supplier_products = top_3[0].get('product_count', 0) if top_3 else 0
        concentration_risk = (top_supplier_products / total_products * 100) if total_products > 0 else 0
        
        # Build comprehensive analysis
        analysis = f"🏆 **TOP 3 SUPPLIERS BY PRODUCT DIVERSITY:**\n"
        for i, supplier in enumerate(top_3, 1):
            name = supplier.get('supplier_name', 'Unknown')
            product_count = supplier.get('product_count', 0)
            percentage = (product_count / total_products * 100) if total_products > 0 else 0
            analysis += f"{i}. {name}: {product_count} products ({percentage:.1f}% of catalog)\n"
        
        analysis += f"\n📊 **SUPPLIER ANALYSIS:**\n"
        analysis += f"• Total Suppliers: {total_suppliers} providing {total_products} products\n"
        analysis += f"• Average Products per Supplier: {avg_products_per_supplier:.1f}\n"
        analysis += f"• Top 3 suppliers provide {top_3_percentage:.1f}% of product catalog\n"
        analysis += f"• Supply Concentration: {concentration_risk:.1f}% of products from top supplier\n"
        
        analysis += f"\n💡 **BUSINESS INSIGHTS:**\n"
        if concentration_risk > 20:
            analysis += f"• High supply risk: Over-dependence on single supplier\n"
            analysis += f"• Recommendation: Diversify supplier base to reduce risk\n"
        else:
            analysis += f"• Good supplier diversity: Balanced distribution\n"
            analysis += f"• Recommendation: Maintain current supplier relationships\n"
        
        # Analyze supplier distribution
        if total_suppliers > 20:
            analysis += f"• Large supplier network provides flexibility and options\n"
        elif total_suppliers < 10:
            analysis += f"• Small supplier base may limit product variety\n"
            analysis += f"• Opportunity: Explore additional supplier partnerships\n"
        else:
            analysis += f"• Moderate supplier base provides good balance\n"
        
        # Performance gap analysis
        if top_3:
            performance_gap = top_supplier_products / avg_products_per_supplier if avg_products_per_supplier > 0 else 0
            if performance_gap > 3:
                analysis += f"• Significant gap: Top supplier provides {performance_gap:.1f}x more products than average\n"
            else:
                analysis += f"• Balanced performance: Suppliers provide similar product ranges\n"
        
        return analysis
    
    def _generate_employee_analysis(self, query: str, results: List[Dict], query_config: Dict) -> str:
        """Generate comprehensive analysis for employee queries."""
        
        count = len(results)
        if count == 0:
            return "No employee data found in the sales transactions."
        
        # Calculate comprehensive metrics
        total_employees = len(results)
        total_orders = sum(item.get('order_count', 0) for item in results)
        avg_orders_per_employee = total_orders / total_employees if total_employees > 0 else 0
        
        # Get top performers
        top_3 = results[:3] if len(results) >= 3 else results
        top_3_orders = sum(item.get('order_count', 0) for item in top_3)
        top_3_percentage = (top_3_orders / total_orders * 100) if total_orders > 0 else 0
        
        # Calculate workload distribution
        top_employee_orders = top_3[0].get('order_count', 0) if top_3 else 0
        workload_concentration = (top_employee_orders / total_orders * 100) if total_orders > 0 else 0
        
        # Build comprehensive analysis
        analysis = f"🏆 **TOP 3 EMPLOYEES BY ORDER PROCESSING:**\n"
        for i, employee in enumerate(top_3, 1):
            name = employee.get('employee_name', 'Unknown')
            order_count = employee.get('order_count', 0)
            percentage = (order_count / total_orders * 100) if total_orders > 0 else 0
            analysis += f"{i}. {name}: {order_count} orders ({percentage:.1f}% of total)\n"
        
        analysis += f"\n📊 **EMPLOYEE PERFORMANCE ANALYSIS:**\n"
        analysis += f"• Total Employees: {total_employees} processing {total_orders} orders\n"
        analysis += f"• Average Orders per Employee: {avg_orders_per_employee:.1f}\n"
        analysis += f"• Top 3 employees handle {top_3_percentage:.1f}% of all orders\n"
        analysis += f"• Workload Concentration: {workload_concentration:.1f}% handled by top performer\n"
        
        analysis += f"\n💡 **BUSINESS INSIGHTS:**\n"
        if workload_concentration > 30:
            analysis += f"• High workload concentration: Over-reliance on top performer\n"
            analysis += f"• Risk: Potential bottleneck if top employee unavailable\n"
            analysis += f"• Recommendation: Redistribute workload for better balance\n"
        else:
            analysis += f"• Balanced workload distribution across team\n"
            analysis += f"• Good: No single point of failure in order processing\n"
        
        # Performance gap analysis
        if top_3:
            performance_gap = top_employee_orders / avg_orders_per_employee if avg_orders_per_employee > 0 else 0
            if performance_gap > 2:
                analysis += f"• Performance Gap: Top employee processes {performance_gap:.1f}x more than average\n"
                analysis += f"• Opportunity: Training programs to improve team efficiency\n"
            else:
                analysis += f"• Consistent Performance: Team shows balanced productivity\n"
        
        # Team size analysis
        if total_employees < 5:
            analysis += f"• Small team: Consider capacity planning for growth\n"
        elif total_employees > 15:
            analysis += f"• Large team: Monitor for coordination and management efficiency\n"
        else:
            analysis += f"• Optimal team size: Good balance of capacity and management\n"
        
        # Efficiency insights
        if avg_orders_per_employee > 50:
            analysis += f"• High productivity: Team efficiently processes large order volumes\n"
        elif avg_orders_per_employee < 20:
            analysis += f"• Lower productivity: Potential for process optimization\n"
        else:
            analysis += f"• Moderate productivity: Standard performance levels\n"
        
        return analysis
    
    def _generate_filtering_analysis(self, query: str, results: List[Dict], query_config: Dict) -> str:
        """Generate analysis for filtering queries."""
        
        count = len(results)
        query_lower = query.lower()
        
        # Customer ID lookup
        if 'customerid' in query_lower:
            if count == 1:
                customer = results[0]
                customer_name = customer.get('customer_name', 'Unknown')
                country = customer.get('customer_country', 'Unknown')
                return f"Found customer **{customer_name}** from {country}. The table shows all their transaction records in the system."
            elif count > 1:
                return f"Found {count} transaction records for this customer ID. The table shows all their purchases and order details."
            else:
                return "No customer found with this ID. Please verify the customer ID is correct."
        
        # Country filtering
        elif 'from' in query_lower and any(word in query_lower for word in ['germany', 'france', 'usa', 'uk', 'spain']):
            countries = set(item.get('customer_country', 'Unknown') for item in results)
            country = list(countries)[0] if len(countries) == 1 else 'the specified country'
            
            customers = set(item.get('customer_name', 'Unknown') for item in results)
            customer_count = len(customers)
            
            return f"Found {count} transaction records from {customer_count} customers in {country}. The table shows all their purchases, including product details and order values."
        
        # Name filtering
        elif 'name' in query_lower:
            if count > 0:
                customer_name = results[0].get('customer_name', 'Unknown')
                return f"Found {count} transaction records for **{customer_name}**. The table shows their complete purchase history with product details and amounts."
        
        # Generic filtering
        return f"Found {count} records matching your filter criteria. The table shows the detailed transaction information for your search."
    
    def _generate_top_n_analysis(self, query: str, results: List[Dict], query_config: Dict) -> str:
        """Generate analysis for TOP N queries."""
        
        count = len(results)
        limit = query_config.get('limit', count)
        query_lower = query.lower()
        
        # Customer analysis
        if 'customer' in query_lower:
            if count > 0:
                top_customer = results[0]
                top_name = top_customer.get('customer_name', 'Unknown')
                top_value = top_customer.get('total_value', 0)
                
                total_all = sum(item.get('total_value', 0) for item in results)
                
                analysis = f"Here are the top {count} customers by total order value:\n\n"
                analysis += f"🏆 **Top Customer**: {top_name} with ${top_value:,.2f} in total orders\n"
                analysis += f"📊 **Combined Value**: These {count} customers represent ${total_all:,.2f} in total business\n"
                analysis += f"📈 **Business Insight**: The top customer accounts for {(top_value/total_all*100):.1f}% of this group's total value"
                
                return analysis
        
        # Product analysis  
        elif 'product' in query_lower:
            if count > 0:
                top_product = results[0]
                top_name = top_product.get('product_name', 'Unknown')
                top_revenue = top_product.get('total_revenue', 0)
                
                total_revenue = sum(item.get('total_revenue', 0) for item in results)
                
                analysis = f"Here are the top {count} products by revenue:\n\n"
                analysis += f"🏆 **Best Seller**: {top_name} with ${top_revenue:,.2f} in total revenue\n"
                analysis += f"💰 **Combined Revenue**: These {count} products generated ${total_revenue:,.2f} total\n"
                analysis += f"📈 **Market Share**: The top product accounts for {(top_revenue/total_revenue*100):.1f}% of this group's revenue"
                
                return analysis
        
        # Generic TOP N
        return f"Here are the top {count} results based on your criteria. The table shows the ranked data with the highest values first."
    
    def _generate_simple_analysis(self, query: str, results: List[Dict]) -> str:
        """Generate analysis for simple queries."""
        
        count = len(results)
        query_lower = query.lower()
        
        if 'customer' in query_lower:
            customers = set(item.get('customer_name', 'Unknown') for item in results)
            customer_count = len(customers)
            
            countries = set(item.get('customer_country', 'Unknown') for item in results)
            country_count = len(countries)
            
            return f"Retrieved {count} transaction records from {customer_count} customers across {country_count} countries. The table shows comprehensive customer transaction data including order details and amounts."
        
        elif 'product' in query_lower:
            products = set(item.get('product_name', 'Unknown') for item in results)
            product_count = len(products)
            
            return f"Retrieved {count} transaction records covering {product_count} different products. The table shows detailed product sales information including quantities and revenue."
        
        else:
            return f"Retrieved {count} records from the sales transactions database. The table shows detailed transaction information including customer, product, and order data."
