"""
Bifrost LLM Client - All LLM calls go through Bifrost (required by sponsors).
Bifrost forwards to OmniRoute (our multi-LLM round-robin setup).
"""

import os
import json
import asyncio
import httpx
from typing import Dict, Any, List, Optional
from dataclasses import dataclass


@dataclass
class LLMResponse:
    content: str
    model: str
    usage: Dict[str, int] = None
    error: str = None


class BifrostClient:
    def __init__(
        self,
        base_url: str = None,
        api_key: str = None,
        model: str = "claude-3-5-sonnet-20241022",
        timeout: float = 60.0,
        max_retries: int = 3
    ):
        self.base_url = base_url or os.getenv("ANTHROPIC_BASE_URL", "http://localhost:20128/v1")
        self.api_key = api_key or os.getenv("ANTHROPIC_API_KEY", "")
        self.model = model
        self.timeout = timeout
        self.max_retries = max_retries

        # Remove trailing slash
        self.base_url = self.base_url.rstrip("/")

    def _get_headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

    def _parse_response(self, response_data: Dict[str, Any]) -> str:
        """Extract content from various response formats (OpenAI, Anthropic, etc.)."""
        # OpenAI format
        if "choices" in response_data and response_data["choices"]:
            choice = response_data["choices"][0]
            if "message" in choice:
                return choice["message"].get("content", "")
            if "text" in choice:
                return choice["text"]

        # Anthropic format
        if "content" in response_data and isinstance(response_data["content"], list):
            for block in response_data["content"]:
                if block.get("type") == "text":
                    return block.get("text", "")
            if response_data["content"]:
                return response_data["content"][0].get("text", "")

        # Fallback
        return str(response_data)

    async def call_llm(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.2,
        max_tokens: int = 4000,
        **kwargs
    ) -> LLMResponse:
        """
        Call LLM through Bifrost with retries and error handling.
        Returns LLMResponse with content or error.
        """
        url = f"{self.base_url}/chat/completions"
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            **kwargs
        }

        last_error = None

        for attempt in range(self.max_retries):
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    response = await client.post(
                        url,
                        headers=self._get_headers(),
                        json=payload
                    )

                    if response.status_code == 200:
                        data = response.json()
                        content = self._parse_response(data)

                        # Extract usage if available
                        usage = data.get("usage", {})

                        return LLMResponse(
                            content=content,
                            model=self.model,
                            usage=usage
                        )

                    elif response.status_code == 429:
                        # Rate limited - wait and retry
                        wait_time = 2 ** attempt
                        await asyncio.sleep(wait_time)
                        last_error = f"Rate limited (attempt {attempt + 1}/{self.max_retries})"
                        continue

                    elif response.status_code >= 500:
                        # Server error - retry
                        wait_time = 2 ** attempt
                        await asyncio.sleep(wait_time)
                        last_error = f"Server error {response.status_code}: {response.text}"
                        continue

                    else:
                        # Client error - don't retry
                        return LLMResponse(
                            content="",
                            model=self.model,
                            error=f"HTTP {response.status_code}: {response.text}"
                        )

            except httpx.TimeoutException:
                last_error = f"Timeout after {self.timeout}s (attempt {attempt + 1}/{self.max_retries})"
                await asyncio.sleep(1)

            except httpx.ConnectError:
                last_error = f"Connection failed to {self.base_url} (attempt {attempt + 1}/{self.max_retries})"
                await asyncio.sleep(2)

            except Exception as e:
                last_error = f"Unexpected error: {type(e).__name__}: {str(e)}"
                await asyncio.sleep(1)

        return LLMResponse(
            content="",
            model=self.model,
            error=f"All retries failed. Last error: {last_error}"
        )

    async def call_llm_json(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.1,
        max_tokens: int = 4000,
        **kwargs
    ) -> LLMResponse:
        """
        Call LLM and expect JSON response. Attempts to parse JSON from response.
        """
        # Add instruction to return JSON
        json_messages = messages.copy()
        if json_messages and json_messages[0].get("role") == "system":
            json_messages[0]["content"] += "\n\nIMPORTANT: Respond ONLY with valid JSON. No markdown, no explanation."
        else:
            json_messages.insert(0, {
                "role": "system",
                "content": "Respond ONLY with valid JSON. No markdown, no explanation."
            })

        response = await self.call_llm(json_messages, temperature, max_tokens, **kwargs)

        if response.error:
            return response

        # Try to parse JSON from content
        content = response.content.strip()

        # Clean markdown code blocks
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            # Try to extract from any code block
            parts = content.split("```")
            if len(parts) >= 3:
                content = parts[1].strip()
                if content.startswith("json"):
                    content = content[4:].strip()

        try:
            parsed = json.loads(content)
            return LLMResponse(
                content=json.dumps(parsed),
                model=response.model,
                usage=response.usage
            )
        except json.JSONDecodeError as e:
            return LLMResponse(
                content="",
                model=response.model,
                usage=response.usage,
                error=f"Failed to parse JSON from LLM response: {str(e)}. Raw: {content[:500]}"
            )


# Global client instance
_default_client = None

def get_client() -> BifrostClient:
    global _default_client
    if _default_client is None:
        _default_client = BifrostClient()
    return _default_client

async def call_llm(messages: List[Dict[str, str]], **kwargs) -> LLMResponse:
    """Convenience function for simple calls."""
    return await get_client().call_llm(messages, **kwargs)

async def call_llm_json(messages: List[Dict[str, str]], **kwargs) -> LLMResponse:
    """Convenience function for JSON calls."""
    return await get_client().call_llm_json(messages, **kwargs)