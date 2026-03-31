from typing import Dict, List
from pydantic import BaseModel, Field


class PredictRequest(BaseModel):
    answers: Dict[str, int] = Field(default_factory=dict)
    response_times: Dict[str, float] = Field(default_factory=dict)


class PredictResponse(BaseModel):
    confirmation_bias_score: float
    anchoring_bias_score: float
    negativity_bias_score: float
    confidence: float
    explanation: Dict[str, str]
    trait_scores: Dict[str, float]
    behavioral_features: Dict[str, float]
    model_version: str
    disclaimer: str
    response_completeness: float
    timing_quality: float
    model_metrics: Dict[str, float | str]
    artifact_path: str
    feature_importance_top: List[Dict[str, float | str]]
