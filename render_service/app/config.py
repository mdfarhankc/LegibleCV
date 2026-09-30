from functools import lru_cache
from typing import Annotated, Literal, Self

from pydantic import HttpUrl, field_validator, model_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    environment: Literal["development", "test", "production"] = "production"
    supabase_url: HttpUrl | None = None
    auth_disabled: bool = False
    allowed_origins: Annotated[list[str], NoDecode] = []

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def _split_origins(cls, value: object) -> object:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @model_validator(mode="after")
    def _check_auth(self) -> Self:
        if self.auth_disabled and self.environment != "development":
            raise ValueError("AUTH_DISABLED is only allowed when ENVIRONMENT=development")
        if not self.auth_disabled and self.supabase_url is None:
            raise ValueError("SUPABASE_URL is required when authentication is enabled")
        return self

    @property
    def jwks_url(self) -> str:
        return f"{str(self.supabase_url).rstrip('/')}/auth/v1/.well-known/jwks.json"

    @property
    def docs_enabled(self) -> bool:
        return self.environment != "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()
