"""
Denormalized sales data bootstrapper for DynamoDB.
"""
import os
from decimal import Decimal
from .dynamodb_connector import create_table, batch_write_items, get_available_tables, execute_query

# Single denormalized table
SALES_TABLE = {
    'sales_transactions': {
        'key_schema': [
            {'AttributeName': 'transaction_id', 'KeyType': 'HASH'}
        ],
        'attribute_definitions': [
            {'AttributeName': 'transaction_id', 'AttributeType': 'S'}
        ]
    }
}

def check_sales_exists():
    """Check if sales table exists with data."""
    try:
        existing_tables = get_available_tables()
        if 'sales_transactions' not in existing_tables:
            return False
        
        # Check if table has data
        try:
            data = execute_query({'operation': 'scan', 'table_name': 'sales_transactions'})
            return data and len(data) > 0
        except Exception:
            return False
    except Exception:
        return False

def create_denormalized_data():
    """Create denormalized sales transaction data."""
    
    transactions = [
        {
            'transaction_id': 'TXN_001',
            'order_id': Decimal('10248'),
            'customer_id': 'ALFKI',
            'customer_name': 'Alfreds Futterkiste',
            'customer_country': 'Germany',
            'customer_city': 'Berlin',
            'product_id': Decimal('1'),
            'product_name': 'Chai',
            'category_id': Decimal('1'),
            'category_name': 'Beverages',
            'supplier_name': 'Exotic Liquids',
            'supplier_country': 'UK',
            'employee_id': Decimal('5'),
            'employee_name': 'Nancy Davolio',
            'order_date': '1996-07-04',
            'shipped_date': '1996-07-16',
            'quantity': Decimal('12'),
            'unit_price': Decimal('14.0'),
            'discount': Decimal('0.0'),
            'line_total': Decimal('168.0'),  # quantity * unit_price * (1-discount)
            'freight': Decimal('32.38'),
            'shipper_name': 'Federal Shipping'
        },
        {
            'transaction_id': 'TXN_002',
            'order_id': Decimal('10248'),
            'customer_id': 'ALFKI',
            'customer_name': 'Alfreds Futterkiste',
            'customer_country': 'Germany',
            'customer_city': 'Berlin',
            'product_id': Decimal('2'),
            'product_name': 'Chang',
            'category_id': Decimal('1'),
            'category_name': 'Beverages',
            'supplier_name': 'Exotic Liquids',
            'supplier_country': 'UK',
            'employee_id': Decimal('5'),
            'employee_name': 'Nancy Davolio',
            'order_date': '1996-07-04',
            'shipped_date': '1996-07-16',
            'quantity': Decimal('10'),
            'unit_price': Decimal('9.8'),
            'discount': Decimal('0.0'),
            'line_total': Decimal('98.0'),
            'freight': Decimal('32.38'),
            'shipper_name': 'Federal Shipping'
        },
        {
            'transaction_id': 'TXN_003',
            'order_id': Decimal('10249'),
            'customer_id': 'ANATR',
            'customer_name': 'Ana Trujillo Emparedados',
            'customer_country': 'Mexico',
            'customer_city': 'México D.F.',
            'product_id': Decimal('1'),
            'product_name': 'Chai',
            'category_id': Decimal('1'),
            'category_name': 'Beverages',
            'supplier_name': 'Exotic Liquids',
            'supplier_country': 'UK',
            'employee_id': Decimal('6'),
            'employee_name': 'Andrew Fuller',
            'order_date': '1996-07-05',
            'shipped_date': '1996-07-10',
            'quantity': Decimal('9'),
            'unit_price': Decimal('18.6'),
            'discount': Decimal('0.0'),
            'line_total': Decimal('167.4'),
            'freight': Decimal('11.61'),
            'shipper_name': 'Speedy Express'
        },
        {
            'transaction_id': 'TXN_004',
            'order_id': Decimal('10249'),
            'customer_id': 'ANATR',
            'customer_name': 'Ana Trujillo Emparedados',
            'customer_country': 'Mexico',
            'customer_city': 'México D.F.',
            'product_id': Decimal('2'),
            'product_name': 'Chang',
            'category_id': Decimal('1'),
            'category_name': 'Beverages',
            'supplier_name': 'Exotic Liquids',
            'supplier_country': 'UK',
            'employee_id': Decimal('6'),
            'employee_name': 'Andrew Fuller',
            'order_date': '1996-07-05',
            'shipped_date': '1996-07-10',
            'quantity': Decimal('40'),
            'unit_price': Decimal('42.4'),
            'discount': Decimal('0.0'),
            'line_total': Decimal('1696.0'),
            'freight': Decimal('11.61'),
            'shipper_name': 'Speedy Express'
        },
        {
            'transaction_id': 'TXN_005',
            'order_id': Decimal('10250'),
            'customer_id': 'ANTON',
            'customer_name': 'Antonio Moreno Taquería',
            'customer_country': 'Mexico',
            'customer_city': 'México D.F.',
            'product_id': Decimal('3'),
            'product_name': 'Aniseed Syrup',
            'category_id': Decimal('2'),
            'category_name': 'Condiments',
            'supplier_name': 'Exotic Liquids',
            'supplier_country': 'UK',
            'employee_id': Decimal('4'),
            'employee_name': 'Janet Leverling',
            'order_date': '1996-07-08',
            'shipped_date': '1996-07-12',
            'quantity': Decimal('35'),
            'unit_price': Decimal('10.0'),
            'discount': Decimal('0.15'),
            'line_total': Decimal('297.5'),  # 35 * 10 * (1-0.15)
            'freight': Decimal('65.83'),
            'shipper_name': 'United Package'
        },
        {
            'transaction_id': 'TXN_006',
            'order_id': Decimal('10251'),
            'customer_id': 'ALFKI',
            'customer_name': 'Alfreds Futterkiste',
            'customer_country': 'Germany',
            'customer_city': 'Berlin',
            'product_id': Decimal('1'),
            'product_name': 'Chai',
            'category_id': Decimal('1'),
            'category_name': 'Beverages',
            'supplier_name': 'Exotic Liquids',
            'supplier_country': 'UK',
            'employee_id': Decimal('3'),
            'employee_name': 'Janet Leverling',
            'order_date': '1996-07-09',
            'shipped_date': '1996-07-15',
            'quantity': Decimal('15'),
            'unit_price': Decimal('16.8'),
            'discount': Decimal('0.15'),
            'line_total': Decimal('214.2'),  # 15 * 16.8 * (1-0.15)
            'freight': Decimal('41.34'),
            'shipper_name': 'Speedy Express'
        }
    ]
    
    return transactions

def bootstrap_sales_data(show_progress=False):
    """Bootstrap denormalized sales data in DynamoDB."""
    if show_progress:
        import streamlit as st
        st.info("🔄 Creating denormalized sales table...")
        progress_bar = st.progress(0)
    
    try:
        # Delete existing table if it exists
        existing_tables = get_available_tables()
        if 'sales_transactions' in existing_tables:
            from .dynamodb_connector import delete_table
            delete_table('sales_transactions')
            if show_progress:
                progress_bar.progress(0.2, text="Deleted existing table...")
        
        # Create table
        if show_progress:
            progress_bar.progress(0.4, text="Creating sales table...")
        
        success = create_table(
            'sales_transactions',
            SALES_TABLE['sales_transactions']['key_schema'],
            SALES_TABLE['sales_transactions']['attribute_definitions']
        )
        
        if not success:
            if show_progress:
                st.error("❌ Failed to create sales table")
            return False
        
        # Load data
        if show_progress:
            progress_bar.progress(0.7, text="Loading sales data...")
        
        transactions = create_denormalized_data()
        success = batch_write_items('sales_transactions', transactions)
        
        if not success:
            if show_progress:
                st.error("❌ Failed to load sales data")
            return False
        
        if show_progress:
            progress_bar.progress(1.0, text="Completed!")
            st.success(f"✅ Created sales table with {len(transactions)} transactions")
        
        return True
        
    except Exception as e:
        if show_progress:
            st.error(f"❌ Error creating sales data: {str(e)}")
        return False