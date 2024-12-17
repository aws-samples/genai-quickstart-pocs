import streamlit as st

pages = {
    "Welcome": [
        st.Page("streamlit_pages/Welcome.py", title="Welcome to Translation Helper"),
    ],
    "Translation": [
        st.Page("streamlit_pages/Chat.py", title="Translate with Chat"),
        st.Page("streamlit_pages/Text.py", title="Translate Text"),
        st.Page("streamlit_pages/File.py", title="Translate a File"),
        st.Page("streamlit_pages/PDF.py", title="Translate a PDF"),
    ],
}

pg = st.navigation(pages)
pg.run()