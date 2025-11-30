import os
import json
import time
import jwt
from pathlib import Path

def generate_vertex_search_jwt() -> str:
    """Generate JWT for Vertex AI Search widget authentication."""
    
    # Try to load service account from file or environment
    sa_key_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    
    if sa_key_path and Path(sa_key_path).exists():
        with open(sa_key_path, "r") as f:
            sa = json.load(f)
    else:
        # Try keys directory
        keys_path = Path(__file__).parent.parent.parent / "keys" / "service-account.json"
        if keys_path.exists():
            with open(keys_path, "r") as f:
                sa = json.load(f)
        else:
            raise FileNotFoundError(
                "Service account JSON not found. Set GOOGLE_APPLICATION_CREDENTIALS "
                "or place service-account.json in /keys directory."
            )
    
    now = int(time.time())
    
    payload = {
        "iss": sa["client_email"],
        "sub": sa["client_email"],
        "aud": "https://gen-app-builder.googleapis.com",
        "iat": now,
        "exp": now + 3600,  # 1 hour
    }
    
    return jwt.sign(payload, sa["private_key"], algorithm="RS256")
