import json
import logging
import math
import re
import urllib.error
import urllib.request
from collections import Counter
from hashlib import sha256
from typing import Any, Sequence

from app.core.config import settings

logger = logging.getLogger(__name__)


class EmbeddingService:
    """Provider-agnostic embedding service for knowledge-base retrieval."""

    LOCAL_PROVIDER = "local"
    LOCAL_MODEL = "local-fallback-v1"
    LOCAL_LEGACY_PROVIDER = "local-fallback"

    def __init__(
        self,
        provider: str | None = None,
        model: str | None = None,
        dimension: int | None = None,
        api_key: str | None = None,
        base_url: str | None = None,
    ) -> None:
        self.provider_name = self._resolve_provider(provider)
        self.model = model or getattr(settings, "EMBEDDING_MODEL", self.LOCAL_MODEL)
        self.dimension = int(dimension or getattr(settings, "EMBEDDING_DIMENSION", 128))
        self.api_key = (api_key if api_key is not None else getattr(settings, "EMBEDDING_API_KEY", "")).strip()
        self.base_url = (base_url if base_url is not None else getattr(settings, "EMBEDDING_BASE_URL", "https://api.openai.com/v1")).strip()
        self.model_dimension = self._resolve_model_dimension(self.model)
        if self.model_dimension is not None:
            self.dimension = self.model_dimension

    @staticmethod
    def _resolve_provider(provider: str | None) -> str:
        value = (provider or getattr(settings, "EMBEDDING_PROVIDER", "local") or "local").strip().lower()
        if value in {"local", "local-fallback", "local_fallback"}:
            return "local-fallback"
        return value

    @staticmethod
    def _resolve_model_dimension(model: str | None) -> int | None:
        if not model:
            return None
        model_name = str(model).lower()
        if model_name.startswith("text-embedding-3"):
            return 1536
        if model_name.startswith("text-embedding-ada-002"):
            return 1536
        if model_name.startswith("text-embedding-004"):
            return 256
        return None

    @staticmethod
    def _normalize_text(text: str) -> str:
        return re.sub(r"\s+", " ", (text or "")).strip().lower()

    @staticmethod
    def _tokenize(text: str) -> list[str]:
        normalized = EmbeddingService._normalize_text(text)
        return [token for token in re.findall(r"[a-z0-9]+", normalized) if token]

    def _build_local_vector(self, text: str) -> list[float]:
        normalized = self._normalize_text(text)
        if not normalized:
            return [0.0] * self.dimension

        tokens = self._tokenize(normalized)
        if not tokens:
            return [0.0] * self.dimension

        counts = Counter(tokens)
        vector = [0.0] * self.dimension

        for token, weight in counts.items():
            bucket = int(sha256(token.encode("utf-8")).hexdigest(), 16) % self.dimension
            vector[bucket] += float(weight)

        magnitude = math.sqrt(sum(value * value for value in vector))
        if magnitude == 0:
            return [0.0] * self.dimension

        return [value / magnitude for value in vector]

    def _build_external_payload(self, texts: Sequence[str]) -> dict[str, Any]:
        return {
            "input": list(texts),
            "model": self.model,
        }

    def _fetch_external_embeddings(self, texts: Sequence[str]) -> list[list[float]]:
        api_key = (self.api_key or "").strip()
        if not api_key:
            raise ValueError("Embedding provider API key not configured")

        clean_base = self.base_url.rstrip("/")
        endpoint = f"{clean_base}/embeddings"
        payload = self._build_external_payload(texts)
        request = urllib.request.Request(
            endpoint,
            data=json.dumps(payload).encode("utf-8"),
            method="POST",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}",
            },
        )

        try:
            with urllib.request.urlopen(request, timeout=20) as response:
                raw = response.read().decode("utf-8")
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, OSError) as exc:
            logger.exception("Embedding provider request failed for model=%s provider=%s", self.model, self.provider_name)
            raise ValueError(f"Embedding provider failed for model '{self.model}'") from exc

        try:
            body = json.loads(raw)
        except json.JSONDecodeError as exc:
            logger.error("Embedding provider returned invalid JSON for model=%s provider=%s", self.model, self.provider_name)
            raise ValueError(f"Embedding provider returned invalid JSON for model '{self.model}'") from exc

        data = body.get("data")
        if not isinstance(data, list):
            raise ValueError(f"Embedding provider returned an unexpected response for model '{self.model}'")

        vectors: list[list[float]] = []
        for item in data:
            if not isinstance(item, dict):
                continue
            embedding = item.get("embedding")
            if not isinstance(embedding, list):
                continue
            vectors.append([float(value) for value in embedding])

        if len(vectors) != len(texts):
            raise ValueError(f"Embedding provider returned {len(vectors)} vectors for {len(texts)} inputs")

        return vectors

    def validate_embedding(self, vector: Sequence[float], expected_dimension: int | None = None) -> list[float]:
        values = [float(value) for value in vector]
        dimension = expected_dimension if expected_dimension is not None else self.dimension
        if len(values) != dimension:
            raise ValueError(
                f"Embedding dimension mismatch: expected {dimension}, received {len(values)}"
            )
        return values

    def generate_embedding(self, text: str) -> list[float]:
        normalized = (text or "").strip()
        if not normalized:
            return [0.0] * self.dimension

        if self.provider_name in {"local-fallback", "local"}:
            return self.validate_embedding(self._build_local_vector(normalized))

        vectors = self._fetch_external_embeddings([normalized])
        if not vectors:
            raise ValueError("Embedding provider returned no embeddings")
        return self.validate_embedding(vectors[0])

    def generate_embeddings(self, texts: Sequence[str]) -> list[list[float]]:
        cleaned = [str(text or "") for text in texts]
        if not cleaned:
            return []

        if self.provider_name in {"local-fallback", "local"}:
            return [self.validate_embedding(self._build_local_vector(text)) for text in cleaned]

        vectors = self._fetch_external_embeddings(cleaned)
        return [self.validate_embedding(vector) for vector in vectors]

    @staticmethod
    def serialize_vector(vector: Sequence[float]) -> str:
        if not isinstance(vector, list):
            vector = list(vector)
        return json.dumps([float(value) for value in vector])

    @staticmethod
    def deserialize_vector(raw_vector: str | None) -> list[float]:
        if raw_vector is None:
            return []
        try:
            values = json.loads(raw_vector)
        except (TypeError, ValueError):
            return []
        if not isinstance(values, list):
            return []
        return [float(value) for value in values]

    @staticmethod
    def cosine_similarity(left: Sequence[float], right: Sequence[float]) -> float:
        if not left or not right:
            return 0.0
        if len(left) != len(right):
            return 0.0

        dot_product = sum(a * b for a, b in zip(left, right))
        left_magnitude = math.sqrt(sum(a * a for a in left))
        right_magnitude = math.sqrt(sum(b * b for b in right))
        if left_magnitude == 0 or right_magnitude == 0:
            return 0.0
        return dot_product / (left_magnitude * right_magnitude)

    def rank_chunks_by_relevance(self, query: str, chunks: Sequence[str | dict[str, Any]]) -> list[dict[str, Any]]:
        query_vector = self.generate_embedding(query)
        ranked: list[dict[str, Any]] = []

        for chunk in chunks:
            if isinstance(chunk, dict):
                content = str(chunk.get("content") or "")
                metadata = dict(chunk)
            else:
                content = str(chunk or "")
                metadata = {}

            if not content.strip():
                continue

            chunk_vector = self.generate_embedding(content)
            score = self.cosine_similarity(query_vector, chunk_vector)
            item = {"score": score, "content": content, **metadata}
            ranked.append(item)

        ranked.sort(key=lambda item: item["score"], reverse=True)
        return ranked
