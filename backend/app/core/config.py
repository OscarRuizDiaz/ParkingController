from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "ParkingController API"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/db_parking"

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"  # 👈 CLAVE
    )

settings = Settings()