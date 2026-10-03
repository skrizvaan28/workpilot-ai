import secrets

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "WorkPilot AI"
    VERSION: str = "0.1.0"
    ENVIRONMENT: str = "development"
    DATABASE_URL: str = ""
    SECRET_KEY: str = ""
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"
    LLM_API_KEY: str = ""
    LLM_BASE_URL: str = "https://api.openai.com/v1"
    LLM_MODEL: str = "gpt-4o-mini"
    EMBEDDING_PROVIDER: str = "local"
    EMBEDDING_MODEL: str = "local-fallback-v1"
    EMBEDDING_API_KEY: str = ""
    EMBEDDING_BASE_URL: str = "https://api.openai.com/v1"
    EMBEDDING_DIMENSION: int = 128
    VECTOR_STORE: str = "json"
    VECTOR_DIMENSION: int = 128
    VECTOR_SIMILARITY_METRIC: str = "cosine"
    VECTOR_TOP_K: int = 5
    VECTOR_MIN_SIMILARITY: float = 0.2

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @model_validator(mode="after")
    def validate_runtime_configuration(self):
        if not self.DATABASE_URL.strip():
            raise ValueError("DATABASE_URL must be configured")

        environment = self.ENVIRONMENT.strip().lower()
        if not self.SECRET_KEY.strip():
            if environment in {"production", "prod"}:
                raise ValueError("SECRET_KEY must be configured in production")
            self.SECRET_KEY = secrets.token_urlsafe(32)

        if environment in {"production", "prod"}:
            insecure_secrets = {"dev-secret-change-me", "replace-this-with-a-long-random-secret"}
            if self.SECRET_KEY in insecure_secrets or len(self.SECRET_KEY) < 32:
                raise ValueError("SECRET_KEY must be a strong, unique value in production")

        if "*" in self.cors_origin_list:
            raise ValueError("Wildcard CORS origins are not allowed when credentials are enabled")
        return self

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


settings = Settings()

