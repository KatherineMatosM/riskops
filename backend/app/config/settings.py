from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_ENV: str = "development"
    SECRET_KEY: str = "secret"
    JWT_SECRET_KEY: str = "jwt_secret"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60

    DB_HOST: str = "localhost"
    DB_PORT: int = 1433
    DB_NAME: str = "riskops"
    DB_USER: str = "sa"
    DB_PASSWORD: str = ""

    CORS_ORIGINS: str = "http://localhost:3000"

    ADMIN_EMAIL: str = "admin@riskops.local"
    ADMIN_PASSWORD: str = "Admin123!"
    ADMIN_FULL_NAME: str = "System Administrator"

    AUTO_CREATE_TABLES: bool = False

    @property
    def DATABASE_URL(self) -> str:
        return (
            f"mssql+pyodbc://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
            "?driver=ODBC+Driver+18+for+SQL+Server&TrustServerCertificate=yes"
        )

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


settings = Settings()