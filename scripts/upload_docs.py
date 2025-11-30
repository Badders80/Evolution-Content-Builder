#!/usr/bin/env python3
"""
Auto-ingestion script: Upload docs from /docs folder to GCS bucket.
Vertex AI Search will automatically index new files.

Usage:
    python scripts/upload_docs.py
    
Or add to your workflow:
    python scripts/upload_docs.py --watch  (future: watch for changes)
"""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Configuration
PROJECT_ID = os.getenv("GOOGLE_PROJECT_ID", "evolution-engine")
GCS_BUCKET = os.getenv("GCS_BUCKET", f"{PROJECT_ID}-knowledge")
DOCS_FOLDER = Path(__file__).parent.parent / "docs"
GCS_PREFIX = "ingest/"  # Folder in GCS where files will be uploaded


def upload_docs():
    """Upload all files from /docs to GCS bucket."""
    try:
        from google.cloud import storage
    except ImportError:
        print("Installing google-cloud-storage...")
        os.system("pip install google-cloud-storage")
        from google.cloud import storage
    
    # Initialize client
    client = storage.Client(project=PROJECT_ID)
    
    # Get or create bucket
    try:
        bucket = client.get_bucket(GCS_BUCKET)
        print(f"Using existing bucket: {GCS_BUCKET}")
    except Exception:
        print(f"Creating bucket: {GCS_BUCKET}")
        bucket = client.create_bucket(GCS_BUCKET, location="us-central1")
    
    # Get files to upload
    if not DOCS_FOLDER.exists():
        print(f"Creating docs folder: {DOCS_FOLDER}")
        DOCS_FOLDER.mkdir(parents=True)
        print("Add your documents to /docs and run this script again.")
        return
    
    files = list(DOCS_FOLDER.glob("*"))
    files = [f for f in files if f.is_file() and not f.name.startswith(".")]
    
    if not files:
        print(f"No files found in {DOCS_FOLDER}")
        print("Add PDFs, TXT, MD, or other documents to /docs")
        return
    
    # Upload each file
    uploaded = 0
    for file_path in files:
        blob_name = f"{GCS_PREFIX}{file_path.name}"
        blob = bucket.blob(blob_name)
        
        # Check if already exists
        if blob.exists():
            print(f"  Skip (exists): {file_path.name}")
            continue
        
        print(f"  Uploading: {file_path.name} → gs://{GCS_BUCKET}/{blob_name}")
        blob.upload_from_filename(str(file_path))
        uploaded += 1
    
    print(f"\n✅ Uploaded {uploaded} new file(s) to gs://{GCS_BUCKET}/{GCS_PREFIX}")
    print("Vertex AI Search will automatically index these documents.")


def list_docs():
    """List all documents in the GCS bucket."""
    from google.cloud import storage
    
    client = storage.Client(project=PROJECT_ID)
    
    try:
        bucket = client.get_bucket(GCS_BUCKET)
    except Exception as e:
        print(f"Bucket not found: {GCS_BUCKET}")
        return
    
    blobs = list(bucket.list_blobs(prefix=GCS_PREFIX))
    
    if not blobs:
        print("No documents in knowledge base yet.")
        return
    
    print(f"\n📚 Documents in gs://{GCS_BUCKET}/{GCS_PREFIX}:")
    for blob in blobs:
        size_kb = blob.size / 1024 if blob.size else 0
        print(f"  - {blob.name.replace(GCS_PREFIX, '')} ({size_kb:.1f} KB)")


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--list":
        list_docs()
    else:
        upload_docs()
        print("\nTo list uploaded docs: python scripts/upload_docs.py --list")
