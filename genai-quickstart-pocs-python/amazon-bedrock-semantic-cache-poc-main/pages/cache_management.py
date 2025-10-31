import streamlit as st
import pandas as pd
import time
from semantic_cache import view_cache, clear_cache 

st.set_page_config(page_title="Cache Management", page_icon="🗄️", layout='wide')
st.title("Cache Management")

# Configure similarity threshold
if 'similarity_threshold' not in st.session_state:
    st.session_state.similarity_threshold = 0.7
st.session_state.similarity_threshold = st.sidebar.slider("Similarity Threshold", 0.0, 1.0, st.session_state.similarity_threshold, 0.01)


# View cache
st.subheader("Cache Data")
cache_entries = view_cache()

if cache_entries:
    df = pd.DataFrame(cache_entries)
    df['create_date'] = pd.to_datetime(df['create_date'])
    df = df.sort_values('create_date', ascending=False)
    df = df.reindex(columns=['query',
                     'response',
                     'create_date',
                     'ttl'])
    
    # Format the dataframe
    df['create_date'] = df['create_date'].dt.strftime('%Y-%m-%d %H:%M:%S')
    df['query'] = df['query'].str.wrap(30)  # Wrap text at 30 characters
    df['response'] = df['response'].str.wrap(50)  # Wrap text at 50 characters
    
    # Display the table
    st.dataframe(df, 
                 column_config={
                     'query': 'Query',
                     'response': 'Response',
                     'create_date': 'Create Date',
                     'ttl': 'TTL'
                 },
                 hide_index=True,
                 use_container_width=True)
else:
    st.info("The cache is currently empty.")

# Clear cache
if st.sidebar.button("Clear Cache"):
    clear_cache()
    time.sleep(5)
    st.experimental_rerun()  # Rerun the app to reflect the cleared cache

