import os

import requests
import streamlit as st

API_URL = os.getenv("SEEK_API_URL", "http://localhost:8000/api/seek")

st.set_page_config(page_title="Evolution Seek", layout="wide")
st.title("Evolution Seek")
st.caption("NeuralSeek-style retrieval and synthesis powered by Vertex AI Search + Gemini")

if "loading" not in st.session_state:
    st.session_state.loading = False
if "web_toggle" not in st.session_state:
    st.session_state.web_toggle = False
if "last_task" not in st.session_state:
    st.session_state.last_task = None

with st.sidebar:
    st.subheader("Request Settings")
    task = st.selectbox(
        "Task type",
        ["general", "investor", "social", "tiktok", "legal", "governance", "race_preview", "race_update"],
        help="Routes to the right Gemini model and prompt style.",
    )
    model_choice = st.selectbox(
        "Model routing",
        ["auto (task-routed)"],
        help="Auto routes to Gemini flash/pro based on task.",
    )
    enable_dlp = st.checkbox("Enable DLP sanitisation", value=False)
    grounded = st.checkbox(
        "Grounded (Vertex AI Search)",
        value=False,
        help="Requires Vertex AI Search datastore + ADC. Leave off to generate without retrieval.",
    )

    # Auto-default web toggle by task
    race_tasks = {"race_preview", "race_update"}
    internal_only_tasks = {"legal", "investor", "governance"}

    if task != st.session_state.last_task:
        if task in race_tasks:
            st.session_state.web_toggle = True
        elif task in internal_only_tasks:
            st.session_state.web_toggle = False
        st.session_state.last_task = task

    web = st.checkbox(
        "Add DuckDuckGo web context",
        value=st.session_state.web_toggle,
        help="Optional lightweight web snippets (DuckDuckGo).",
    )
    st.session_state.web_toggle = web

    if task in race_tasks and web:
        st.caption("Using live web context for race coverage.")
    elif task in internal_only_tasks and not web:
        st.caption("Internal-only generation.")

    web_results = st.slider("Web results", min_value=1, max_value=10, value=5)
    st.write(f"API endpoint: `{API_URL}`")

query = st.text_area(
    "Ask Evolution Seek:",
    placeholder="e.g., Summarise the latest investor updates on syndicate performance",
    height=180,
)

if st.button("Generate", type="primary", disabled=st.session_state.loading):
    if len(query.strip()) < 6:
        st.warning("Please enter a query with at least 6 characters.")
    else:
        st.session_state.loading = True
        payload = {
            "query": query,
            "task": task,
            "dlp": enable_dlp,
            "grounded": grounded,
            "web": web,
            "web_results": web_results,
        }
        try:
            with st.spinner("Generating..."):
                response = requests.post(API_URL, json=payload, timeout=90)
                response.raise_for_status()
                data = response.json()

            if not data.get("ok", True) and data.get("error"):
                st.error(f"⚠️ Engine Error: {data.get('error')}")
            else:
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

                st.write("### Web Snippets")
                web_sources = data.get("web_sources", [])
                if not web_sources:
                    st.info("No web snippets included.")
                else:
                    for item in web_sources:
                        st.write(f"- **{item.get('title') or 'result'}** — {item.get('url')}")
                        st.code(item.get("snippet", ""), language="markdown")
        except requests.RequestException as exc:
            st.error(f"Request failed: {exc}")
        except Exception as exc:  # safeguard for unexpected payload issues
            st.error(f"Unexpected error: {exc}")
        finally:
            st.session_state.loading = False
