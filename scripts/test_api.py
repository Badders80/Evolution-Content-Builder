import json
import sys
import requests

BASE_URL = "http://localhost:8000"


def check(endpoint, method="get", payload=None):
    url = f"{BASE_URL}{endpoint}"
    try:
        if method == "post":
            resp = requests.post(url, json=payload, timeout=10)
        else:
            resp = requests.get(url, timeout=10)
        print(f"{endpoint}: {resp.status_code}")
        try:
            print(json.dumps(resp.json(), indent=2)[:400])
        except Exception:
            print(resp.text[:400])
        return resp.status_code
    except Exception as exc:
        print(f"{endpoint}: ERROR {exc}")
        return 0


def main():
    status = 0
    status |= check("/health")
    status |= check("/api/seek", method="post", payload={"query": "Hello from smoke test", "task": "general"})
    status |= check(
        "/api/seek",
        method="post",
        payload={"query": "Race preview for Wanganui sprint", "task": "race_preview", "web": True},
    )
    status |= check("/api/rag", method="post", payload={"query": "What is Evolution Stables?", "max_results": 3})
    status |= check("/api/auth/search-token")
    # Optional PDF render test if available
    try:
        status |= check("/api/render", method="post", payload={"html": "<h1>Test PDF</h1>"})
    except Exception:
        print("Skipping /api/render (not available).")
    # Optional citation metadata test (if seek returns citations)
    try:
        status |= check(
            "/api/seek",
            method="post",
            payload={"query": "Include citations about Evolution Stables", "task": "general", "grounded": False},
        )
    except Exception:
        print("Skipping citation check.")
    return 0 if status else 1


if __name__ == "__main__":
    sys.exit(main())
