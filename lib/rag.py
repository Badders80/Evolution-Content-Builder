"""
RAG helper for Evolution Content Builder.
Use this to query the knowledge base from any Python code.

Usage:
    from lib.rag import rag, rag_sync
    
    # Async
    result = await rag("What are the NZTR syndication rules?")
    
    # Sync  
    result = rag_sync("Summarise First Gear's latest race")
    
    print(result["answer"])
    print(result["sources"])
"""
import os
import requests
from typing import Optional

API_URL = os.getenv("SEEK_API_URL", "http://localhost:8000")


def rag_sync(query: str, max_results: int = 5) -> dict:
    """
    Synchronous RAG query.
    Returns: {"answer": str, "sources": list, "query": str}
    """
    response = requests.post(
        f"{API_URL}/api/rag",
        json={"query": query, "max_results": max_results},
        timeout=30,
    )
    response.raise_for_status()
    return response.json()


async def rag(query: str, max_results: int = 5) -> dict:
    """
    Async RAG query (for use in async contexts).
    Returns: {"answer": str, "sources": list, "query": str}
    """
    import aiohttp
    
    async with aiohttp.ClientSession() as session:
        async with session.post(
            f"{API_URL}/api/rag",
            json={"query": query, "max_results": max_results},
        ) as response:
            response.raise_for_status()
            return await response.json()


# Convenience functions for common queries
def get_horse_info(horse_name: str) -> dict:
    """Get information about a specific horse."""
    return rag_sync(f"What do we know about {horse_name}? Include recent updates, race history, and trainer notes.")


def get_trainer_notes(horse_name: str) -> dict:
    """Get trainer notes for a horse."""
    return rag_sync(f"What are the latest trainer notes and updates for {horse_name}?")


def get_nztr_rules(topic: str) -> dict:
    """Get NZTR rules on a specific topic."""
    return rag_sync(f"Explain the NZTR rules and requirements for {topic}.")


def get_syndication_info(topic: str) -> dict:
    """Get syndication-related information."""
    return rag_sync(f"What are the key points about {topic} in the context of racehorse syndication?")
