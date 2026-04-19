from decimal import Decimal
from pydantic import BaseModel, ConfigDict, model_serializer

class BaseSchema(BaseModel):
    """
    Base Pydantic schema with standard configs.
    Configured to allow reading fields directly from SQLAlchemy ORM models.
    """
    model_config = ConfigDict(from_attributes=True)

    @model_serializer(mode='wrap')
    def serialize_model(self, handler):
        """
        Global serializer to handle types like Decimal that aren't 
        always JSON-serializable by default in some environments.
        Converts Decimals to float for the frontend.
        """
        result = handler(self)
        return self._convert_decimals(result)

    def _convert_decimals(self, obj):
        if isinstance(obj, dict):
            return {k: self._convert_decimals(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [self._convert_decimals(v) for v in obj]
        elif isinstance(obj, Decimal):
            return float(obj)
        return obj
