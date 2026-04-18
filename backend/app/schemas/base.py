from pydantic import BaseModel, ConfigDict

class BaseSchema(BaseModel):
    """
    Base Pydantic schema with standard configs.
    Configured to allow reading fields directly from SQLAlchemy ORM models.
    """
    model_config = ConfigDict(from_attributes=True)
