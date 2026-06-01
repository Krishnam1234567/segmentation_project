from pydantic import BaseModel
from typing import List, Literal

class Entity(BaseModel):
    id: int
    name: str
    type: str
    jurisdiction: str
    risk: Literal['low', 'medium', 'high', 'critical']

class Director(BaseModel):
    name: str
    role: str
    entities: int
    conflicts: int

class DigitalTwinResponse(BaseModel):
    entities: List[Entity]
    directors: List[Director]
    total_entities: int
    total_jurisdictions: int
    active_directors: int
    legal_exposure: str
