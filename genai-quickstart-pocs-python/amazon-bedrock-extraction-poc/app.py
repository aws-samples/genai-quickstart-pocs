import streamlit as st
from extract_pdf_to_json import pdf_processing


#Setup Streamlit
st.set_page_config(page_title="Extraction", page_icon=":tada", layout="wide")
st.title(f""":rainbow[Extract Financial KPI's from Earnings Report]""")

#
with st.container():
    st.write("---")
    uploaded_file = st.file_uploader('Upload a .pdf file', type="pdf")
    st.write("---")

go=st.button("Go!")
if go:
    st.balloons()
    pdf_processing(uploaded_file)