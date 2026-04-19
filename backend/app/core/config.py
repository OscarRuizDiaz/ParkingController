from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "ParkingController API"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = "postgresql://postgres:a.123456@localhost:5433/db_parking"

    # Seguridad JWT
    SECRET_KEY: str = "PARKING_SECRET_KEY_DEV_2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480 # 8 horas

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )

settings = Settings()