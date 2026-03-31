from pathlib import Path
import sys

from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.main import app  # noqa: E402
from app.predictor import predictor  # noqa: E402


def test_predict_endpoint_accepts_mixed_metric_types(monkeypatch):
    monkeypatch.setattr(predictor, "model", object(), raising=False)
    monkeypatch.setattr(
        predictor,
        "predict",
        lambda answers, response_times: {
            "confirmation_bias_score": 0.4,
            "anchoring_bias_score": 0.5,
            "negativity_bias_score": 0.6,
            "confidence": 0.91,
            "explanation": {"confirmation": "ok", "anchoring": "ok", "negativity": "ok"},
            "trait_scores": {"EXT": 0.4, "EST": 0.5, "AGR": 0.6, "CSN": 0.5, "OPN": 0.4},
            "behavioral_features": {
                "avg_response_time": 3200.0,
                "response_variance": 1400.0,
                "fast_vs_slow_ratio": 1.0,
            },
            "model_version": "test-model",
            "disclaimer": "Model is based on inferred relationships, not direct ground truth labels.",
            "response_completeness": 1.0,
            "timing_quality": 0.95,
            "model_metrics": {"r2_score": 0.8, "limitations": "synthetic"},
            "artifact_path": "artifacts/bias_model.pkl",
            "feature_importance_top": [{"feature": "EST1", "importance": 0.2}],
        },
    )

    client = TestClient(app)
    response = client.post("/ml/predict", json={"answers": {"EXT1": 3}, "response_times": {"EXT1_E": 1500}})

    assert response.status_code == 200
    assert response.json()["model_metrics"]["limitations"] == "synthetic"
