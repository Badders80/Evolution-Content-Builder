# Evolution Seek Engine (GoogleSeek Clone)

**Purpose:**  
Evolution Seek is our internal “NeuralSeek-style” engine built on Google Cloud.  
It powers all grounded content generation for Evolution Stables:

- Investor updates  
- Owner education & guides  
- Race reports (pre/post)  
- Social content (LinkedIn, X, etc.)  
- Future: TikTok scripts & faceless content

It combines:

1. **Query rewrite** (Gemini 2.0 Flash)  
2. **Retrieval** from our knowledgebase (Vertex AI Search / Discovery Engine)  
3. **Answer/content generation** (Gemini 3.0 Pro or 2.0 Flash)  
4. **Optional PII sanitisation** (DLP)

---

## High-Level Architecture

```text
User (Streamlit UI)
   ↓
POST /api/seek (FastAPI)
   ↓
EvolutionSeek.generate_answer()
   ├─ (optional) sanitize() via DLP
   ├─ rewrite_query() → Gemini 2.0 Flash
   ├─ retrieve() → Vertex AI Search
   └─ generate_answer() → Gemini 3.0 Pro or 2.0 Flash
       ↓
   JSON { answer, rewritten_query, sources[] }
```

## Code Overview

- `backend/server.py` – FastAPI app entrypoint  
- `backend/google_seek/service.py` – core engine  
- `backend/google_seek/router.py` – `/api/seek` endpoint  
- `seek_app.py` – Streamlit UI calling the API

## Environment Variables

Required:

- `GOOGLE_PROJECT_ID` – GCP Project ID (e.g. `evo-neuralseek-clone`)  
- `GOOGLE_LOCATION_ID` – Vertex AI region (e.g. `us-central1` or `global`)  
- `VERTEX_SEARCH_DATASTORE_ID` – Discovery Engine data store ID (e.g. `evo-knowledge`)  
- `GOOGLE_APPLICATION_CREDENTIALS` – path to service account JSON (if not using ADC / Workload Identity)

## Tasks & Model Routing

We support the following task values when calling `/api/seek`:

| Task        | Description                                   | Model            |
|-------------|-----------------------------------------------|------------------|
| general     | Generic Q&A                                   | gemini-2.0-flash |
| investor    | Investor updates, owner-facing summaries      | gemini-3.0-pro   |
| social      | Short-form social copy (LinkedIn, X)          | gemini-2.0-flash |
| tiktok      | Faceless TikTok script (short, punchy)        | gemini-2.0-flash |
| legal       | PDS / agreements / rules - careful summarisation | gemini-3.0-pro   |
| governance  | NZTR / VARA / internal governance explanations | gemini-3.0-pro   |

This makes the engine future-proof: new content types are just new task modes.

## Brand Voice & Guardrails

Enforced in `service.py` prompt:

- understated, confident, clear  
- no hype or buzzwords  
- avoid “revolutionising”, “cutting-edge”, “democratising”  
- no emojis  
- factual, grounded in context only  

If the context does not contain the answer, the engine must say:

> “I don’t have enough information in our docs to answer that.”

This is critical for governance / investor comms.

## Knowledgebase: Vertex AI Search

We use Discovery Engine / Vertex AI Search with an Enterprise Search data store.

- Data store ID: `evo-knowledge` (example)  
- Connected to a GCS bucket: `gs://evo-knowledge/`

### Phase 3 — Vertex AI Search Datastore Build + Dataset Setup

Follow these steps to stand up the datastore that powers Evolution Seek:

1) Create the Search app  
   - Console: Vertex AI → Search → Create App  
   - Type: Enterprise Search → Generic  
   - Region: `global` or `us-central1` (recommended)  
   - Name: `evolution-seek`

2) Create the datastore  
   - In the app: Datastores → Create → Document store → Unstructured files  
   - Source: GCS bucket (recommended `gs://evolution-seek-datasets`)

3) Upload documents to GCS (knowledgebase)  
   ```
   evolution-seek-datasets/
     brand/
       Evolution Brand Bible.pdf
       Voice and Tone Guidelines.docx
     racing/
       NZTR Rules.pdf
       NZTR SR16.pdf
       NZTR Syndication Guidelines.pdf
       VARA Horse Lease Token Whitepaper.pdf
       VARA Risk Statement.pdf
     horses/
       First Gear Reports/
       Stephen Gray Training Reports/
       Zeddiani Updates/
       Karaka Sales Notes/
     partnerships/
       Tokinvest Overview.pdf
       Dubai Racing Club MOU.pdf
     owners/
       Owner Onboarding Pack.pdf
       Syndication Agreement Template.pdf
       Updated PDS Template.pdf
     content/
       TikTok Concepts/
       Instagram Post Templates/
       Investor Update Examples/
       Past LinkedIn Posts/
   ```
   - Ingest: Vertex AI → Search → Your datastore → Add data → GCS → select bucket → ingest (indexing ~3–10 minutes).

4) Capture the datastore ID  
   - Format looks like `projects/123/locations/global/dataStores/abcdef123456` → store `abcdef123456` in `.env` as `VERTEX_SEARCH_DATASTORE_ID`.

5) Grant GCS read to Discovery Engine  
   - IAM principal: `service-<PROJECT_NUMBER>@gcp-sa-discoveryengine.iam.gserviceaccount.com`  
   - Role: `roles/storage.objectViewer`

6) Smoke test in console  
   - Vertex AI → Search → Try Demo  
   - Sample queries: “What is digital-syndication?”, “What is Evolution Stables?”, “How does the SR16 work?”, “What is the owner’s responsibility?”, “What is Tokinvest?”, “What is the First Gear lease structure?”  
   - Expect to see snippets from your uploaded docs; if not, re-check ingestion path.

7) Connect to FastAPI + Streamlit  
   - `.env` should include:
     ```
     GOOGLE_PROJECT_ID=evolution-stables
     GOOGLE_LOCATION_ID=global
     VERTEX_SEARCH_DATASTORE_ID=abcdef123456
     SEEK_API_URL=http://localhost:8000/api/seek
     GOOGLE_APPLICATION_CREDENTIALS=/path/to/your-key.json
     ```
   - Start API: `uvicorn backend.server:app --reload --port 8000`  
   - Start UI: `streamlit run seek_app.py`
   - Test in UI with: “Explain what digital-syndication means for an owner in simple terms.”  
     - Expect Evolution tone, grounded citations, Gemini 3.0 Pro routing, and a compliance-friendly answer.

Initial folder structure in `gs://evo-knowledge`:

```
/brand/
  brand_bible_v1.pdf
  tone_rules.md

/product/
  digital_syndication_overview.md
  owner_onboarding_guide_v1.pdf
  pds_template_generic.pdf

/racing/
  nztr_rules_extract_ownership.pdf
  nztr_lease_rules_summary.md
  workflows_race_day.md

/horses/
  first_gear_profile.md
  first_gear_pedigree.pdf

/content-templates/
  investor_update_template.md
  race_preview_template.md
  race_review_template.md
  social_post_templates.md
```

As the project matures, add:

- more horses (`/horses/horse_name/...`)  
- more syndicates  
- more governance and rule docs  
- specific trainer docs

## Recommended Naming Convention

Keep filenames lowercase, hyphen-separated, and versioned for major updates (`v1`, `v2`, etc.).

```
/brand/
  evolution-brand-bible-v1.pdf
  evolution-tone-rules-v1.md

/product/
  digital-syndication-overview-v1.md
  owner-onboarding-guide-v1.pdf
  pds-generic-template-v1.pdf

/racing/
  nztr-ownership-rules-extract-2025-01.pdf
  nztr-lease-rules-summary-v1.md
  nztr-sr16-process-notes-v1.md

/horses/
  first-gear-profile-v1.md
  first-gear-pedigree-v1.pdf
  first-gear-training-notes-template-v1.md

/content-templates/
  investor-update-template-v1.md
  race-preview-template-v1.md
  race-review-template-v1.md
  social-post-templates-v1.md
```

Upload this into `gs://evo-knowledge/` and sync the Vertex AI Search data store. In the console:

```
Vertex AI → Search & Conversation → Your data store → “Sync now”
```

Once done, those documents will be searchable and will feed into the `retrieve()` step in `EvolutionSeek`.

## Using /api/seek in the UI

Basic use from Streamlit:

```python
import requests

payload = {
    "query": "Write an investor update for First Gear's last run at Wanganui.",
    "task": "investor",
    "dlp": False
}

res = requests.post("http://localhost:8000/api/seek", json=payload)
data = res.json()
print(data["answer"])
print(data["sources"])
```

## Local Development

Set environment:

```bash
export GOOGLE_PROJECT_ID="evo-neuralseek-clone"
export GOOGLE_LOCATION_ID="us-central1"
export VERTEX_SEARCH_DATASTORE_ID="evo-knowledge"
# optional, if not using ADC
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
```

Start FastAPI:

```bash
uvicorn backend.server:app --reload --port 8000
```

Start Streamlit:

```bash
streamlit run seek_app.py
```

## Production (Cloud Run – high level)

1) Containerise the FastAPI app  

`Dockerfile` (root):

```Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PORT=8000

CMD ["uvicorn", "backend.server:app", "--host", "0.0.0.0", "--port", "8000"]
```

Build + test locally:

```bash
docker build -t evolution-seek .
docker run -p 8000:8000 evolution-seek
```

2) Push to Google Artifact Registry (optional detail later)  
3) Deploy to Cloud Run:

```bash
gcloud run deploy evolution-seek \
  --image=REGION-docker.pkg.dev/PROJECT_ID/REPO/evolution-seek:latest \
  --platform=managed \
  --region=us-central1 \
  --allow-unauthenticated \
  --set-env-vars=GOOGLE_PROJECT_ID=evo-neuralseek-clone,GOOGLE_LOCATION_ID=us-central1,VERTEX_SEARCH_DATASTORE_ID=evo-knowledge
```

4) Service account & IAM

- Create a dedicated service account, e.g. `evolution-seek-sa`.  
- Grant:
  - Vertex AI User  
  - Discovery Engine Search Editor  
  - DLP User (if DLP is enabled)  
- Configure Cloud Run to use this service account. Then you don’t need to distribute JSON keys; ADC just works.

## Streamlit → Cloud Run

Once FastAPI is on Cloud Run, update `seek_app.py` to read the endpoint from an env var, e.g.:

```python
API_URL = os.getenv("SEEK_API_URL", "http://localhost:8000/api/seek")
```

Set `SEEK_API_URL` to your Cloud Run URL, e.g.:

```bash
export SEEK_API_URL="https://evolution-seek-xxxxx-run.app/api/seek"
```

NeuralSeek-style flow end-to-end. 
