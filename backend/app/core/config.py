from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Union
import json

class Settings(BaseSettings):
    PROJECT_NAME: str = "ParkingController API"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = "postgresql://postgres:a.123456@localhost:5433/db_parking"
    BACKEND_CORS_ORIGINS: Union[str, List[str]] = ["http://localhost:5173", "http://127.0.0.1:5173", "http://192.168.122.126:5173", "http://localhost:3000"]

    @property
    def cors_origins_list(self) -> List[str]:
        if isinstance(self.BACKEND_CORS_ORIGINS, str):
            try:
                # Intenta parsear como JSON si es un string (ej. desde .env: '["http://localhost:3000"]')
                return json.loads(self.BACKEND_CORS_ORIGINS)
            except json.JSONDecodeError:
                # Si no es JSON, lo separa por comas
                return [origin.strip() for origin in self.BACKEND_CORS_ORIGINS.split(",")]
        return self.BACKEND_CORS_ORIGINS

    # Seguridad JWT
    SECRET_KEY: str = "PARKING_SECRET_KEY_DEV_2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480 # 8 horas

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )

settings = Settings()