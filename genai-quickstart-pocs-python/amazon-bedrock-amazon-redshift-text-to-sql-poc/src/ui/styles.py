"""
CSS styles for the GenAI Sales Analyst application.
"""
import streamlit as st


def apply_custom_styles():
    """
    Apply custom CSS styles to the Streamlit application.
    """
    st.markdown(
        """
        <style>
            /* Input text areas */
            .stTextArea textarea {
                border: 1px solid #0A74DA !important;
                border-radius: 5px !important;
                padding: 10px !important;
                color: #333333 !important;
            }
            
            /* Select boxes */
            .stSelectbox div[data-baseweb="select"] > div {
                border: 1px solid #0A74DA !important;
                border-radius: 5px !important;
                color: #333333 !important;
            }
            
            /* Buttons */
            .stButton > button {
                border: 1px solid #0A74DA !important;
                border-radius: 5px !important;
                color: #333333 !important;
                background-color: white !important;
                padding: 10px 20px !important;
                transition: all 0.3s ease !important;
            }
            
            .stButton > button:hover {
                background-color: #0A74DA !important;
                color: white !important;
            }
            
            /* Success messages */
            .stSuccess {
                border: 1px solid #0A74DA !important;
                border-radius: 5px !important;
                padding: 10px !important;
            }
            
            /* Error messages */
            .stError {
                border: 1px solid #ff4b4b !important;
                border-radius: 5px !important;
                padding: 10px !important;
            }
            
            /* Dataframes */
            .dataframe {
                border: 1px solid #0A74DA !important;
                border-radius: 5px !important;
            }
            
            /* Code blocks */
            .stCodeBlock {
                border: 1px solid #0A74DA !important;
                border-radius: 5px !important;
            }
            
            /* Text input */
            .stTextInput > div > div > input {
                border: 1px solid #0A74DA !important;
                border-radius: 5px !important;
                padding: 10px !important;
                color: #333333 !important;
            }
            
            /* Adjust height for select boxes to match other elements */
            .stSelectbox > div > div > div {
                min-height: 40px !important;
            }
            
            /* Hover effects for interactive elements */
            .stSelectbox div[data-baseweb="select"]:hover,
            .stTextArea textarea:hover,
            .stTextInput > div > div > input:hover {
                border-color: #52247F !important;
            }
            
            /* Focus states */
            .stSelectbox div[data-baseweb="select"]:focus-within,
            .stTextArea textarea:focus,
            .stTextInput > div > div > input:focus {
                border-color: #52247F !important;
                box-shadow: 0 0 0 1px #52247F !important;
            }
            
            /* Large Exit Button Styling */
            .exit-button {
                display: flex;
                justify-content: center;
                margin-top: 50px;
                padding: 10px;
            }
            
            .exit-button .stButton > button {
                font-size: 40px !important;
                padding: 15px 60px !important;
                background-color: white !important;
                color: #0A74DA !important;
                border: 2px solid #0A74DA !important;
                border-radius: 20px !important;
                transition: all 0.3s ease !important;
                font-weight: bold !important;
            }
            
            .exit-button .stButton > button:hover {
                background-color: #0A74DA !important;
                color: white !important;
                transform: scale(1.05);
            }
        </style>
        """,
        unsafe_allow_html=True,
    )