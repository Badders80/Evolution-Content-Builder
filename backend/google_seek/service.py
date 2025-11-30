import os
import asyncio
from typing import Tuple

from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables from a local .env if present
load_dotenv()

# Try Gemini API key first (simpler), optionally layer Vertex AI Search/DLP if creds are present
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
PROJECT_ID = os.getenv("GOOGLE_PROJECT_ID")
LOCATION = os.getenv("GOOGLE_LOCATION_ID", "global")
DATA_STORE_ID = os.getenv("VERTEX_SEARCH_DATASTORE_ID")
FLASH_MODEL = os.getenv("GEMINI_FLASH_MODEL", "models/gemini-2.0-flash")
PRO_MODEL = os.getenv("GEMINI_PRO_MODEL", "models/gemini-3-pro-preview")
VERTEX_FLASH_MODEL = os.getenv("VERTEX_FLASH_MODEL", "gemini-2.0-flash")
VERTEX_PRO_MODEL = os.getenv("VERTEX_PRO_MODEL", "gemini-1.5-pro")
DDG_ENABLED = os.getenv("DDG_ENABLED", "true").lower() == "true"

try:
    from duckduckgo_search import DDGS

    DDG_AVAILABLE = True
except ImportError:
    DDG_AVAILABLE = False


class EvolutionSeek:
    def __init__(self):
        self.search_client = None
        self.dlp_client = None

        # Configure Gemini generation
        if GEMINI_API_KEY:
            genai.configure(api_key=GEMINI_API_KEY)
            self.flash = genai.GenerativeModel(FLASH_MODEL)
            self.pro = genai.GenerativeModel(PRO_MODEL)
        elif PROJECT_ID:
            # Fall back to Vertex AI SDK for generation (requires project + ADC)
            import vertexai
            from vertexai.generative_models import GenerativeModel

            vertexai.init(project=PROJECT_ID, location=LOCATION)
            # Use conservative defaults that are broadly available in Vertex AI
            self.flash = GenerativeModel(VERTEX_FLASH_MODEL)
            self.pro = GenerativeModel(VERTEX_PRO_MODEL)
        else:
            raise ValueError("Either GEMINI_API_KEY or GOOGLE_PROJECT_ID must be set.")

        # Optional: Discovery Engine search (requires project + datastore + ADC)
        if PROJECT_ID and DATA_STORE_ID:
            try:
                from google.cloud import discoveryengine_v1beta as discoveryengine

                self.search_client = discoveryengine.SearchServiceClient()
            except Exception as exc:  # pragma: no cover - runtime guard rail
                print(f"⚠️ Vertex Search unavailable: {exc}")

        # Optional: DLP for sanitisation (requires ADC)
        if PROJECT_ID:
            try:
                from google.cloud import dlp_v2

                self.dlp_client = dlp_v2.DlpServiceClient()
            except Exception as exc:  # pragma: no cover - runtime guard rail
                print(f"⚠️ DLP unavailable: {exc}")

    # --------------------------
    # Optional: PII Sanitisation
    # --------------------------
    async def sanitize(self, text: str) -> str:
        if not self.dlp_client:
            return text  # Skip DLP if not available
            
        request = {
            "parent": f"projects/{PROJECT_ID}/locations/global",
            "item": {"value": text},
            "inspect_config": {
                "info_types": [{"name": "EMAIL_ADDRESS"}, {"name": "PHONE_NUMBER"}]
            },
            "deidentify_config": {
                "info_type_transformations": {
                    "transformations": [
                        {
                            "primitive_transformation": {
                                "replace_with_info_type_config": {}
                            }
                        }
                    ]
                }
            },
        }
        response = self.dlp_client.deidentify_content(request)
        return response.item.value

    # --------------------------
    # Query Rewrite
    # --------------------------
    async def rewrite_query(self, query: str) -> str:
        prompt = f"""
        Rewrite this into a clean, search-ready query.
        Do NOT answer the question.
        Query:
        {query}
        """

        result = self.flash.generate_content(prompt)
        return result.text.strip()

    # --------------------------
    # Retrieval Layer (Vertex AI Search)
    # --------------------------
    async def retrieve(self, query: str) -> Tuple[str, list[dict]]:
        # If no search client (API key mode), return empty context
        if not self.search_client:
            return "", []
        
        from google.cloud import discoveryengine_v1beta as discoveryengine
        
        serving_config = self.search_client.serving_config_path(
            project=PROJECT_ID,
            location="global",
            data_store=DATA_STORE_ID,
            serving_config="default_serving_config",
        )

        request = discoveryengine.SearchRequest(
            serving_config=serving_config,
            query=query,
            page_size=6,
            query_expansion_spec={"condition": "AUTO"},
            spell_correction_spec={"mode": "AUTO"},
        )

        response = self.search_client.search(request)

        context = ""
        sources = []

        for result in response.results:
            doc = result.document
            data = doc.derived_struct_data or doc.struct_data or {}

            snippet = (
                data.get("snippets", [{}])[0].get("snippet")
                or data.get("extracted_text")
                or data.get("plain_text")
                or data.get("content")
                or ""
            )

            context += f"DOC {doc.name}:\n{snippet}\n\n"

            sources.append(
                {
                    "document_id": doc.name,
                    "snippet": snippet,
                }
            )

        return context, sources

    # --------------------------
    # Web Retrieval (DuckDuckGo)
    # --------------------------
    async def web_search(self, query: str, max_results: int = 5) -> list[dict]:
        if not (DDG_ENABLED and DDG_AVAILABLE):
            return []

        max_results = max(1, min(max_results, 10))  # keep it lean

        def _search():
            with DDGS() as ddgs:
                results = ddgs.text(query, max_results=max_results)
                normalized = []
                for item in results:
                    normalized.append(
                        {
                            "title": item.get("title") or "",
                            "url": item.get("href") or item.get("url") or "",
                            "snippet": item.get("body") or item.get("snippet") or "",
                        }
                    )
                return normalized

        try:
            return await asyncio.to_thread(_search)
        except Exception as exc:  # pragma: no cover - runtime guard rail
            print(f"⚠️ DuckDuckGo search failed: {exc}")
            return []

    # --------------------------
    # Answer Generation (Gemini 3.0 Pro)
    # --------------------------
    async def generate_answer(
        self,
        user_query: str,
        task: str = "general",
        enable_dlp: bool = False,
        grounded: bool = False,
        web: bool = False,
        web_results: int = 5,
    ):
        # Step 1: DLP filtering
        cleaned = await self.sanitize(user_query) if enable_dlp else user_query

        # Step 2: Rewrite to search query
        rewritten = await self.rewrite_query(cleaned)

        # Step 3: Retrieve context from Vertex Search (only if grounded)
        if grounded:
            if not self.search_client:
                return {
                    "ok": False,
                    "error": "Grounded mode requested but Vertex AI Search is not configured. Set GOOGLE_PROJECT_ID, VERTEX_SEARCH_DATASTORE_ID, and ADC credentials.",
                    "rewritten_query": rewritten,
                    "sources": [],
                    "grounded": False,
                    "web_sources": [],
                }
            context, sources = await self.retrieve(rewritten)
            if not context:
                return {
                    "ok": False,
                    "error": "No context returned from Vertex AI Search; cannot answer in grounded mode.",
                    "rewritten_query": rewritten,
                    "sources": sources,
                    "grounded": False,
                    "web_sources": [],
                }
        else:
            context, sources = "", []

        # Optional web retrieval
        web_sources = await self.web_search(rewritten, max_results=web_results) if web else []

        # Step 4: Model routing
        model = self.pro if task in ["investor", "legal", "governance"] else self.flash

        task_instruction = {
            "general": "Provide a clear, factual answer.",
            "investor": "Write an investor update in an understated, confident, direct tone.",
            "social": "Write a concise, understated social post.",
            "tiktok": "Write a short, punchy faceless TikTok script.",
            "legal": "Summarise with precision and preserve legal meaning.",
            "governance": "Explain governance or compliance topics precisely and succinctly.",
            "race_preview": "Write a concise race preview highlighting form, conditions, and key angles.",
            "race_update": "Summarise the latest race update clearly and factually.",
        }.get(task, "Provide a clear answer.")

        # Build prompt - adjust based on whether we have context
        context_section = (
            f"""
        CONTEXT (use this as reference only):
        {context}
        """
            if context
            else "No retrieved context is available. Answer without citing internal sources."
        )

        if web_sources:
            web_items = [f"- {w['title']} — {w['url']}\n  {w['snippet']}" for w in web_sources]
            web_text = os.linesep.join(web_items)
            web_section = f"""
        WEB CONTEXT (DuckDuckGo snippets):
        {web_text}
        """
        else:
            web_section = "No external web context is included."

        prompt = f"""
        You are the Evolution Stables content engine.

        BRAND TONE:
        - understated, confident, clear
        - avoid hype or buzzwords
        - no emojis
        - no 'revolutionising', 'cutting-edge', or 'democratising'

        TASK:
        {task_instruction}
        {context_section}
        {web_section}

        USER REQUEST:
        {cleaned}

        If you do not have grounded context, provide a concise best-effort answer but do not fabricate citations or pretend it is grounded.
        """

        try:
            result = model.generate_content(prompt)
            return {
                "ok": True,
                "answer": result.text,
                "rewritten_query": rewritten,
                "sources": sources,
                "grounded": grounded and bool(context),
                "web_sources": web_sources,
            }
        except Exception as exc:
            return {
                "ok": False,
                "error": str(exc),
                "rewritten_query": rewritten,
                "sources": sources,
                "grounded": grounded and bool(context),
                "web_sources": web_sources,
            }
