import os
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


class EvolutionSeek:
    def __init__(self):
        self.search_client = None
        self.dlp_client = None

        # Configure Gemini generation
        if GEMINI_API_KEY:
            genai.configure(api_key=GEMINI_API_KEY)
            self.flash = genai.GenerativeModel("gemini-2.0-flash")
            self.pro = genai.GenerativeModel("gemini-2.5-pro")
        elif PROJECT_ID:
            # Fall back to Vertex AI SDK for generation (requires project + ADC)
            import vertexai
            from vertexai.generative_models import GenerativeModel

            vertexai.init(project=PROJECT_ID, location=LOCATION)
            self.flash = GenerativeModel("gemini-2.0-flash")
            self.pro = GenerativeModel("gemini-2.5-pro")
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
    # Answer Generation (Gemini 3.0 Pro)
    # --------------------------
    async def generate_answer(self, user_query: str, task: str = "general", enable_dlp: bool = False):
        # Step 1: DLP filtering
        cleaned = await self.sanitize(user_query) if enable_dlp else user_query

        # Step 2: Rewrite to search query
        rewritten = await self.rewrite_query(cleaned)

        # Step 3: Retrieve context from Vertex Search
        context, sources = await self.retrieve(rewritten)

        # Step 4: Model routing
        model = self.pro if task in ["investor", "legal", "governance"] else self.flash

        task_instruction = {
            "general": "Provide a clear, factual answer.",
            "investor": "Write an investor update in an understated, confident, direct tone.",
            "social": "Write a concise, understated social post.",
            "tiktok": "Write a short, punchy faceless TikTok script.",
            "legal": "Summarise with precision and preserve legal meaning.",
        }.get(task, "Provide a clear answer.")

        # Build prompt - adjust based on whether we have context
        context_section = f"""
        CONTEXT (use this as reference):
        {context}
        """ if context else ""
        
        fallback_instruction = """
        If you cannot answer based on the provided context, say:
        "I don't have enough information in our docs to answer that."
        """ if task == "general" and not context else ""

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
        USER REQUEST:
        {cleaned}
        {fallback_instruction}
        """

        result = model.generate_content(prompt)

        return {
            "ok": True,
            "answer": result.text,
            "rewritten_query": rewritten,
            "sources": sources,
        }
