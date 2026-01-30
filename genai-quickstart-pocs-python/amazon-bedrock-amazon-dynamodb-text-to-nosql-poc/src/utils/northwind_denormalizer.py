"""
Denormalize existing Northwind tables into sales_transactions.
"""
from src.utils.dynamodb_connector import execute_query, batch_write_items, create_table, delete_table
from decimal import Decimal

def denormalize_northwind_data():
    """Read all Northwind tables and create denormalized transactions."""
    
    # Get all data from existing tables
    customers = execute_query({'operation': 'scan', 'table_name': 'northwind_customers'})
    products = execute_query({'operation': 'scan', 'table_name': 'northwind_products'})
    orders = execute_query({'operation': 'scan', 'table_name': 'northwind_orders'})
    order_details = execute_query({'operation': 'scan', 'table_name': 'northwind_order_details'})
    categories = execute_query({'operation': 'scan', 'table_name': 'northwind_categories'})
    suppliers = execute_query({'operation': 'scan', 'table_name': 'northwind_suppliers'})
    employees = execute_query({'operation': 'scan', 'table_name': 'northwind_employees'})
    shippers = execute_query({'operation': 'scan', 'table_name': 'northwind_shippers'})
    
    print(f"Loaded: {len(customers)} customers, {len(products)} products, {len(orders)} orders, {len(order_details)} order details")
    
    # Create lookup dictionaries
    customer_lookup = {c['customerid']: c for c in customers}
    product_lookup = {p['productid']: p for p in products}
    category_lookup = {c['categoryid']: c for c in categories}
    supplier_lookup = {s['supplierid']: s for s in suppliers}
    employee_lookup = {e['employeeid']: e for e in employees}
    shipper_lookup = {s['shipperid']: s for s in shippers}
    order_lookup = {o['orderid']: o for o in orders}
    
    transactions = []
    
    # Create denormalized transactions from order_details
    for i, detail in enumerate(order_details):
        order_id = detail['orderid']
        product_id = detail['productid']
        
        # Get related data
        order = order_lookup.get(order_id, {})
        product = product_lookup.get(product_id, {})
        customer = customer_lookup.get(order.get('customerid'), {})
        category = category_lookup.get(product.get('categoryid'), {})
        supplier = supplier_lookup.get(product.get('supplierid'), {})
        employee = employee_lookup.get(order.get('employeeid'), {})
        shipper = shipper_lookup.get(order.get('shipvia'), {})
        
        # Calculate line total
        quantity = float(detail.get('quantity', 0))
        unit_price = float(detail.get('unitprice', 0))
        discount = float(detail.get('discount', 0))
        line_total = quantity * unit_price * (1 - discount)
        
        transaction = {
            'transaction_id': f'TXN_{i+1:04d}',
            'order_id': Decimal(str(order_id)),
            'customer_id': customer.get('customerid', ''),
            'customer_name': customer.get('companyname', ''),
            'customer_country': customer.get('country', ''),
            'customer_city': customer.get('city', ''),
            'product_id': Decimal(str(product_id)),
            'product_name': product.get('productname', ''),
            'category_id': Decimal(str(product.get('categoryid', 0))),
            'category_name': category.get('categoryname', ''),
            'supplier_name': supplier.get('companyname', ''),
            'supplier_country': supplier.get('country', ''),
            'employee_id': Decimal(str(order.get('employeeid', 0))),
            'employee_name': f"{employee.get('firstname', '')} {employee.get('lastname', '')}".strip(),
            'order_date': order.get('orderdate', ''),
            'shipped_date': order.get('shippeddate', ''),
            'quantity': Decimal(str(quantity)),
            'unit_price': Decimal(str(unit_price)),
            'discount': Decimal(str(discount)),
            'line_total': Decimal(str(line_total)),
            'freight': Decimal(str(order.get('freight', 0))),
            'shipper_name': shipper.get('companyname', '')
        }
        
        transactions.append(transaction)
    
    print(f"Created {len(transactions)} denormalized transactions")
    return transactions

def bootstrap_from_northwind(show_progress=False):
    """Create denormalized sales table from existing Northwind data."""
    if show_progress:
        import streamlit as st
        st.info("🔄 Denormalizing Northwind data...")
        progress_bar = st.progress(0)
    
    try:
        # Delete existing sales table
        try:
            delete_table('sales_transactions')
            if show_progress:
                progress_bar.progress(0.2, text="Deleted existing sales table...")
        except:  # nosec B110 - intentional pass for error handling
            pass
        
        # Create new sales table
        if show_progress:
            progress_bar.progress(0.4, text="Creating sales table...")
        
        table_config = {
            'key_schema': [
                {'AttributeName': 'transaction_id', 'KeyType': 'HASH'}
            ],
            'attribute_definitions': [
                {'AttributeName': 'transaction_id', 'AttributeType': 'S'}
            ]
        }
        
        success = create_table('sales_transactions', table_config['key_schema'], table_config['attribute_definitions'])
        if not success:
            if show_progress:
                st.error("❌ Failed to create sales table")
            return False
        
        # Denormalize data
        if show_progress:
            progress_bar.progress(0.6, text="Denormalizing Northwind data...")
        
        transactions = denormalize_northwind_data()
        
        if not transactions:
            if show_progress:
                st.error("❌ No transactions created from Northwind data")
            return False
        
        # Load denormalized data
        if show_progress:
            progress_bar.progress(0.8, text="Loading denormalized data...")
        
        success = batch_write_items('sales_transactions', transactions)
        if not success:
            if show_progress:
                st.error("❌ Failed to load denormalized data")
            return False
        
        if show_progress:
            progress_bar.progress(1.0, text="Completed!")
            st.success(f"✅ Created {len(transactions)} denormalized transactions from Northwind data")
        
        return True
        
    except Exception as e:
        if show_progress:
            st.error(f"❌ Error denormalizing Northwind data: {str(e)}")
        print(f"Error: {str(e)}")
        return False