import os

import requests
import streamlit as st

API_URL = os.getenv("SEEK_API_URL", "http://localhost:8000/api/seek")

st.set_page_config(page_title="Evolution Seek", layout="wide")
st.title("Evolution Seek")
st.caption("NeuralSeek-style retrieval and synthesis powered by Vertex AI Search + Gemini")

with st.sidebar:
    st.subheader("Request Settings")
    task = st.selectbox(
        "Task type",
        ["general", "investor", "social", "tiktok", "legal"],
        help="Routes to the right Gemini model and prompt style.",
    )
    enable_dlp = st.checkbox("Enable DLP sanitisation", value=False)
    st.write(f"API endpoint: `{API_URL}`")

query = st.text_area(
    "Ask Evolution Seek:",
    placeholder="e.g., Summarise the latest investor updates on syndicate performance",
    height=180,
)

if st.button("Generate", type="primary"):
    if not query.strip():
        st.warning("Please enter a query before generating.")
    else:
        payload = {"query": query, "task": task, "dlp": enable_dlp}
        try:
            response = requests.post(API_URL, json=payload, timeout=60)
            response.raise_for_status()
            data = response.json()

            st.write("### Answer")
            st.write(data.get("answer", ""))

            st.write("### Rewritten Query")
            st.code(data.get("rewritten_query", ""))

            st.write("### Sources")
            sources = data.get("sources", [])
            if not sources:
                st.info("No sources returned from Vertex AI Search.")
            else:
                for source in sources:
                    st.write(f"- **{source.get('document_id', 'unknown')}**")
                    st.code(source.get("snippet", ""), language="markdown")
        except requests.RequestException as exc:
            st.error(f"Request failed: {exc}")
        except Exception as exc:  # safeguard for unexpected payload issues
            st.error(f"Unexpected error: {exc}")

