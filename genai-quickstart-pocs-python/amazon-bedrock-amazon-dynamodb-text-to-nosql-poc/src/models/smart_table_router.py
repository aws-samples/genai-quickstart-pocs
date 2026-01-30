"""
Smart table router that selects the most relevant table for queries.
"""

import re
from typing import Dict, Any, List, Tuple

class SmartTableRouter:
    """Routes queries to the most specific table first, with fallback to sales_transactions."""
    
    def __init__(self):
        # Table-specific patterns with their target tables
        self.table_patterns = {
            'northwind_customers': [
                r'customerid\s*=\s*[\'"]([^\'\"]+)[\'"]',  # customerid = 'LAMAI'
                r'customer.*id\s*=\s*[\'"]([^\'\"]+)[\'"]', # customer_id = 'LAMAI'
                r'show.*customer.*with.*id',                # show customer with id
                r'customer.*from\s+([A-Za-z]+)',           # customer from Germany (if asking about customer info)
            ],
            'northwind_products': [
                r'productid\s*=\s*[\'"]([^\'\"]+)[\'"]',   # productid = '1'
                r'product.*id\s*=\s*[\'"]([^\'\"]+)[\'"]', # product_id = '1'
                r'show.*product.*with.*id',                # show product with id
                r'product.*name\s*=\s*[\'"]([^\'\"]+)[\'"]', # product_name = 'Chai'
            ],
            'northwind_orders': [
                r'orderid\s*=\s*[\'"]([^\'\"]+)[\'"]',     # orderid = '10248'
                r'order.*id\s*=\s*[\'"]([^\'\"]+)[\'"]',   # order_id = '10248'
                r'show.*order.*with.*id',                  # show order with id
            ]
        }
        
        # Fallback patterns that need sales_transactions (denormalized data)
        self.fallback_patterns = [
            r'top\s+\d+',           # top N queries need aggregation
            r'total.*revenue',      # revenue calculations
            r'total.*value',        # value calculations
            r'best.*customer',      # customer rankings
            r'sales.*by',           # sales analysis
            r'revenue.*by',         # revenue analysis
            r'with.*sales',         # queries mentioning sales data
            r'sales.*data',         # queries asking for sales data
            r'transaction',         # transaction-related queries
            r'which.*product.*revenue',  # product revenue analysis
            r'which.*supplier.*product', # supplier analysis
            r'which.*employee.*order',   # employee analysis
            r'most.*revenue',       # revenue-focused queries
            r'most.*product',       # product-focused queries
            r'most.*order',         # order-focused queries
        ]
    
    def route_query(self, query: str) -> Dict[str, Any]:
        """
        Route query to the most appropriate table.
        
        Args:
            query: Natural language query
            
        Returns:
            Query configuration with target table
        """
        query_lower = query.lower().strip()
        
        # Check if this needs fallback to sales_transactions
        for pattern in self.fallback_patterns:
            if re.search(pattern, query_lower):
                return self._create_sales_transactions_query(query)
        
        # Check for specific table patterns
        for table_name, patterns in self.table_patterns.items():
            for pattern in patterns:
                match = re.search(pattern, query, re.IGNORECASE)
                if match:
                    return self._create_specific_table_query(query, table_name, pattern, match)
        
        # Default fallback to sales_transactions
        return self._create_sales_transactions_query(query)
    
    def _create_specific_table_query(self, query: str, table_name: str, pattern: str, match) -> Dict[str, Any]:
        """Create query for specific table."""
        
        # Validate table name to prevent injection
        if not table_name.replace('_', '').replace('-', '').isalnum():
            raise ValueError(f"Invalid table name: {table_name}")
        
        # Extract filter conditions based on table and pattern
        where_clause = self._extract_where_clause(query, table_name, pattern, match)
        
        if where_clause:
            # Validate table name to prevent injection
            if not table_name.replace('_', '').isalnum():
                raise ValueError(f"Invalid table name: {table_name}")
            
            # Sanitize where clause by removing potentially dangerous characters
            sanitized_where = where_clause.replace(';', '').replace('--', '').replace('/*', '').replace('*/', '')
            # Note: Using f-string with validated table name and sanitized where clause
            partiql_statement = f"SELECT * FROM {table_name} WHERE {sanitized_where}"  # nosec B608 - table name validated, where clause sanitized
            explanation = f"Using {table_name} table for direct lookup: {sanitized_where}"
        else:
            # Validate table name to prevent injection
            if not table_name.replace('_', '').isalnum():
                raise ValueError(f"Invalid table name: {table_name}")
            
            # Note: Using f-string with validated table name
            partiql_statement = f"SELECT * FROM {table_name}"  # nosec B608 - table name is validated
            explanation = f"Using {table_name} table for general query"
        
        return {
            'operation': 'partiql',
            'table_name': table_name,
            'partiql_statement': partiql_statement,
            'use_partiql': True,
            'query_type': 'specific_table',
            'explanation': explanation,
            'primary_table': True
        }
    
    def _create_sales_transactions_query(self, query: str) -> Dict[str, Any]:
        """Create query for sales_transactions (fallback table)."""
        
        query_lower = query.lower()
        
        # Check for filtering patterns
        if self._has_filtering(query):
            where_clause = self._extract_sales_where_clause(query)
            if where_clause:
                # Sanitize where clause for security
                sanitized_where = where_clause.replace(';', '').replace('--', '').replace('/*', '').replace('*/', '')
                # Note: Using f-string with sanitized where clause for PartiQL
                partiql_statement = f"SELECT * FROM sales_transactions WHERE {sanitized_where}"  # nosec B608 - where clause is sanitized
                return {
                    'operation': 'partiql',
                    'table_name': 'sales_transactions',
                    'partiql_statement': partiql_statement,
                    'use_partiql': True,
                    'query_type': 'filtering',
                    'explanation': f'Using sales_transactions for filtering: {where_clause}',
                    'primary_table': False
                }
        
        # Check for TOP N patterns
        top_match = re.search(r'top\s+(\d+)', query_lower)
        if top_match:
            limit = int(top_match.group(1))
            return {
                'operation': 'scan',
                'table_name': 'sales_transactions',
                'use_native': True,
                'use_partiql': False,
                'query_type': 'top_n',
                'limit': limit,
                'explanation': f'Using sales_transactions for TOP {limit} analysis',
                'primary_table': False
            }
        
        # Default scan
        return {
            'operation': 'scan',
            'table_name': 'sales_transactions',
            'use_native': True,
            'use_partiql': False,
            'query_type': 'simple_scan',
            'explanation': 'Using sales_transactions for general query',
            'primary_table': False
        }
    
    def _extract_where_clause(self, query: str, table_name: str, pattern: str, match) -> str:
        """Extract WHERE clause for specific table."""
        
        if table_name == 'northwind_customers':
            if 'customerid' in pattern or 'customer.*id' in pattern:
                customer_id = match.group(1)
                return f"customerid = '{customer_id}'"  # Use actual column name
            elif 'from' in pattern:
                country = match.group(1).title()
                return f"country = '{country}'"
        
        elif table_name == 'northwind_products':
            if 'productid' in pattern or 'product.*id' in pattern:
                product_id = match.group(1)
                return f"productid = '{product_id}'"  # Use actual column name
            elif 'product.*name' in pattern:
                product_name = match.group(1)
                return f"productname = '{product_name}'"  # Use actual column name
        
        elif table_name == 'northwind_orders':
            if 'orderid' in pattern or 'order.*id' in pattern:
                order_id = match.group(1)
                return f"orderid = '{order_id}'"  # Use actual column name
        
        return ""
    
    def _has_filtering(self, query: str) -> bool:
        """Check if query has filtering patterns."""
        filtering_patterns = [
            r'customerid\s*=',
            r'from\s+\w+',
            r'where\s+\w+\s*=',
            r'country\s*=',
        ]
        
        query_lower = query.lower()
        return any(re.search(pattern, query_lower) for pattern in filtering_patterns)
    
    def _extract_sales_where_clause(self, query: str) -> str:
        """Extract WHERE clause for sales_transactions table (uses denormalized column names)."""
        
        # Customer ID - sales_transactions uses customer_id (denormalized)
        customerid_match = re.search(r'customerid\s*=\s*[\'"]([^\'\"]+)[\'"]', query, re.IGNORECASE)
        if customerid_match:
            return f"customer_id = '{customerid_match.group(1)}'"  # Keep denormalized name
        
        # Country - sales_transactions uses customer_country (denormalized)
        country_match = re.search(r'from\s+([A-Za-z]+)', query, re.IGNORECASE)
        if country_match:
            return f"customer_country = '{country_match.group(1).title()}'"  # Keep denormalized name
        
        # General WHERE
        where_match = re.search(r'where\s+(.+)', query, re.IGNORECASE)
        if where_match:
            return where_match.group(1).strip()
        
        return ""

def route_query_smart(query: str) -> Dict[str, Any]:
    """
    Smart function to route queries to the most appropriate table.
    
    Args:
        query: Natural language query
        
    Returns:
        Query configuration with optimal table selection
    """
    router = SmartTableRouter()
    return router.route_query(query)
