from __future__ import annotations

import json

import httpx

from app import openrouter


def test_call_openrouter_success(monkeypatch):
    monkeypatch.setenv("OPENROUTER_API_KEY", "test-key")

    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url == httpx.URL(openrouter.OPENROUTER_URL)
        assert request.headers["Authorization"] == "Bearer test-key"
        payload = json.loads(request.content.decode("utf-8"))
        assert payload["model"] == openrouter.MODEL
        assert payload["messages"][0]["content"] == "What is 2+2?"
        return httpx.Response(
            200,
            json={"choices": [{"message": {"content": "4"}}]},
        )

    transport = httpx.MockTransport(handler)
    client = httpx.Client(transport=transport)
    try:
        content = openrouter.call_openrouter("What is 2+2?", client=client)
        assert content == "4"
    finally:
        client.close()


def test_call_openrouter_structured_parses_json(monkeypatch):
    monkeypatch.setenv("OPENROUTER_API_KEY", "test-key")

    def handler(request: httpx.Request) -> httpx.Response:
        payload = json.loads(request.content.decode("utf-8"))
        assert payload["response_format"]["type"] == "json_schema"
        return httpx.Response(
            200,
            json={"choices": [{"message": {"content": "{\"message\":\"ok\"}"}}]},
        )

    transport = httpx.MockTransport(handler)
    client = httpx.Client(transport=transport)
    try:
        result = openrouter.call_openrouter_structured(
            messages=[{"role": "user", "content": "hi"}],
            schema={"type": "object"},
            client=client,
        )
        assert result == {"message": "ok"}
    finally:
        client.close()
