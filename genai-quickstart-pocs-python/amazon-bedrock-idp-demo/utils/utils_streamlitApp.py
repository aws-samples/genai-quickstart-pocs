import streamlit as st
import base64



## Sidebar Contact Details Function
def contact_sidebar():
    """Professional contact sidebar without HTML tags visible"""
    with st.sidebar:
        # Section header
        st.subheader("📞 Quick Contact")
        
        # Contact cards with icons
        cols = st.columns([1, 4])
        with cols[0]: st.markdown("📧") 
        with cols[1]: st.markdown("**Email:** [akmandi@amazon.com](mailto:akmandi@amazon.com)")
        
        cols = st.columns([1, 4])
        with cols[0]: st.markdown("📱")
        with cols[1]: st.markdown("**Phone:** [+1 (555) 123-4567](tel:+15551234567)")
        
        cols = st.columns([1, 4])
        with cols[0]: st.markdown("🌐") 
        with cols[1]: st.markdown("**Website:** [anandmandilwar.com](https://anandmandilwar.com)")
        
        # Divider
        st.markdown("---")
        
        # Contact form
        with st.expander("✉️ Send us a message"):
            with st.form("contact_form"):
                name = st.text_input("Your name")
                email = st.text_input("Your email*", placeholder="your@email.com")
                message = st.text_area("Message*", placeholder="Your message...")
                
                if st.form_submit_button("Send"):
                    if not email or not message:
                        st.warning("Please fill required fields (*)")
                    else:
                        # Add your email sending logic here
                        st.success("Message sent! We'll respond within 24 hours.")

                    


def display_banner(banner_path, caption=None):
    """Dynamic banner with container and caption styling"""
    # Cache-busted CSS with container styles
    css = f"""
    <style>
        .banner-container {{
            width: 100%;
            height: 200px;
            margin: 0 auto;
            padding: 0;
            position: relative;
            overflow: hidden;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            margin-bottom: 25px;
        }}
        
        .banner-container img {{
            width: 100%;
            height: auto;
            display: block;
            transition: transform 0.3s ease;
        }}
        
        .banner-container:hover img {{
            transform: scale(1.02);
        }}
        
        .banner-caption {{
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(0,0,0,0.7);
            color: #FF9900 !important;
            font-size: 1.2rem !important;
            padding: 12px 20px !important;
            margin: 0 !important;
            text-align: center;
            font-family: 'Arial', sans-serif;
        }}
        
        @media (max-width: 768px) {{
            .banner-container {{
                border-radius: 8px;
            }}
            .banner-caption {{
                font-size: 1rem !important;
                padding: 8px 12px !important;
            }}
        }}
    </style>
    """
    st.markdown(css, unsafe_allow_html=True)
    
    # Banner HTML with container
    try:
        with open(banner_path, "rb") as f:
            img_base64 = base64.b64encode(f.read()).decode()
        
        banner_html = f"""
        <div class="banner-container">
            <img src="data:image/jpeg;base64,{img_base64}" alt="Banner Image">
            {f'<p class="banner-caption">{caption}</p>' if caption else ''}
        </div>
        """
        st.markdown(banner_html, unsafe_allow_html=True)
        
    except Exception as e:
        st.error(f"Error loading banner: {str(e)}")