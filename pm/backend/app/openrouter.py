from __future__ import annotations

import json
import os
from typing import Any, Dict, Optional

import httpx
from fastapi import HTTPException

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = "openai/gpt-oss-120b"


def _get_api_key() -> str:
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="OPENROUTER_API_KEY is not set")
    return api_key


def _build_payload(prompt: str) -> Dict[str, Any]:
    return {
        "model": MODEL,
        "messages": [{"role": "user", "content": prompt}],
    }


def _extract_content(data: Dict[str, Any]) -> str:
    try:
        return data["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError) as exc:
        raise HTTPException(
            status_code=502,
            detail="Unexpected OpenRouter response",
        ) from exc


def _extract_json_content(data: Dict[str, Any]) -> Dict[str, Any]:
    content = _extract_content(data)
    if isinstance(content, dict):
        return content
    if isinstance(content, str):
        try:
            return json.loads(content)
        except json.JSONDecodeError as exc:
            raise HTTPException(
                status_code=502,
                detail="OpenRouter returned invalid JSON",
            ) from exc
    raise HTTPException(status_code=502, detail="OpenRouter returned invalid JSON")


def call_openrouter(prompt: str, client: Optional[httpx.Client] = None) -> str:
    api_key = _get_api_key()
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    payload = _build_payload(prompt)

    def send_request(http_client: httpx.Client) -> str:
        response = http_client.post(
            OPENROUTER_URL,
            headers=headers,
            json=payload,
        )
        if response.status_code != 200:
            raise HTTPException(
                status_code=502,
                detail=f"OpenRouter error: {response.status_code} {response.text}",
            )
        return _extract_content(response.json())

    if client is None:
        with httpx.Client(timeout=30.0) as http_client:
            return send_request(http_client)

    return send_request(client)


def call_openrouter_structured(
    messages: list[dict[str, Any]],
    schema: Dict[str, Any],
    client: Optional[httpx.Client] = None,
) -> Dict[str, Any]:
    api_key = _get_api_key()
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": MODEL,
        "messages": messages,
        "response_format": {
            "type": "json_schema",
            "json_schema": {
                "name": "board_update",
                "strict": True,
                "schema": schema,
            },
        },
    }

    def send_request(http_client: httpx.Client) -> Dict[str, Any]:
        response = http_client.post(
            OPENROUTER_URL,
            headers=headers,
            json=payload,
        )
        if response.status_code != 200:
            raise HTTPException(
                status_code=502,
                detail=f"OpenRouter error: {response.status_code} {response.text}",
            )
        return _extract_json_content(response.json())

    if client is None:
        with httpx.Client(timeout=30.0) as http_client:
            return send_request(http_client)

    return send_request(client)
