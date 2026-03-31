from __future__ import annotations

import numpy as np
import pandas as pd

from .config import MODEL_PATH, MODEL_VERSION
from .modeling import (
    TARGET_COLUMNS,
    apply_min_max,
    compute_behavioral_features,
    compute_trait_scores,
    load_model_bundle,
    reverse_key_dataframe,
    tree_prediction_variance,
)


class Predictor:
    def __init__(self) -> None:
        self.model = None
        self.metadata = None
        self.metrics = None
        self.feature_importance = None

    def load(self) -> None:
        if not MODEL_PATH.exists():
            raise FileNotFoundError(f"Model artifact not found at {MODEL_PATH}")
        self.model, self.metadata, self.metrics, self.feature_importance = load_model_bundle(MODEL_PATH)

    @property
    def is_ready(self) -> bool:
        return self.model is not None

    def _score_traits(self, answers: dict[str, int]) -> dict[str, float]:
        frame = pd.DataFrame([answers], columns=self.metadata["trait_columns"]).fillna(3)
        scored = reverse_key_dataframe(frame)
        trait_scores = compute_trait_scores(scored).iloc[0].to_dict()
        return {key: float(round(value, 4)) for key, value in trait_scores.items()}

    def _behavioral_features(self, response_times: dict[str, float]) -> tuple[dict[str, float], pd.DataFrame]:
        frame = pd.DataFrame([response_times], columns=self.metadata["response_time_columns"])
        behavioral = compute_behavioral_features(frame)
        normalized = apply_min_max(
            behavioral[["avg_response_time", "response_variance", "fast_vs_slow_ratio"]],
            self.metadata["behavior_normalization"],
        )
        features = behavioral.iloc[0].fillna(0).to_dict()
        cleaned = {key: float(round(value, 4)) for key, value in features.items()}
        return cleaned, normalized

    def _prepare_feature_row(self, answers: dict[str, int], response_times: dict[str, float]) -> pd.DataFrame:
        combined = {}
        for column in self.metadata["trait_columns"]:
            combined[column] = answers.get(column, self.metadata["feature_medians"].get(column, 3))
        for column in self.metadata["response_time_columns"]:
            value = response_times.get(column)
            if value is None or value <= 0:
                value = self.metadata["feature_medians"].get(column, 0)
            combined[column] = value
        frame = pd.DataFrame([combined], columns=self.metadata["feature_columns"])
        return frame.fillna(pd.Series(self.metadata["feature_medians"]))

    def _rule_contributions(
        self, trait_scores: dict[str, float], behavioral_norm: pd.DataFrame
    ) -> dict[str, dict[str, float]]:
        b = behavioral_norm.iloc[0].to_dict()
        return {
            "confirmation": {
                "low_openness": round(0.50 * (1 - trait_scores["OPN"]), 4),
                "low_agreeableness": round(0.25 * (1 - trait_scores["AGR"]), 4),
                "fast_vs_slow_ratio": round(0.15 * b["fast_vs_slow_ratio"], 4),
                "response_variance": round(0.10 * (1 - b["response_variance"]), 4),
            },
            "anchoring": {
                "low_openness": round(0.40 * (1 - trait_scores["OPN"]), 4),
                "low_extraversion": round(0.20 * (1 - trait_scores["EXT"]), 4),
                "fast_vs_slow_ratio": round(0.20 * b["fast_vs_slow_ratio"], 4),
                "response_variance": round(0.20 * (1 - b["response_variance"]), 4),
            },
            "negativity": {
                "neuroticism": round(0.60 * trait_scores["EST"], 4),
                "low_extraversion": round(0.15 * (1 - trait_scores["EXT"]), 4),
                "avg_response_time": round(0.15 * b["avg_response_time"], 4),
                "response_variance": round(0.10 * b["response_variance"], 4),
            },
        }

    def predict(self, answers: dict[str, int], response_times: dict[str, float]) -> dict:
        if not self.is_ready:
            self.load()

        feature_row = self._prepare_feature_row(answers, response_times)
        prediction = self.model.predict(feature_row)[0]
        variance = tree_prediction_variance(self.model, feature_row.to_numpy())
        ensemble_agreement = float(np.clip(1 - np.mean(variance), 0, 1))
        response_completeness = float(
            round(sum(1 for value in response_times.values() if value and value > 0) / 50, 4)
        )
        timing_quality = float(
            np.clip(
                1 - np.mean(np.array(list(response_times.values()) or [0]) <= 0) - np.mean(variance) / 0.05,
                0,
                1,
            )
        )
        confidence = round(
            0.6 * ensemble_agreement + 0.2 * response_completeness + 0.2 * timing_quality,
            4,
        )

        trait_scores = self._score_traits(answers)
        behavioral_features, behavioral_norm = self._behavioral_features(response_times)
        contributions = self._rule_contributions(trait_scores, behavioral_norm)

        explanation = {}
        for target, value in zip(TARGET_COLUMNS, prediction):
            bias = target.replace("_bias_score", "")
            ordered = sorted(contributions[bias].items(), key=lambda item: item[1], reverse=True)[:2]
            top_summary = ", ".join(
                f"{name.replace('_', ' ')} ({round(score * 100)} pts)" for name, score in ordered
            )
            explanation[bias] = (
                f"{bias.capitalize()} bias is estimated at {round(float(value) * 100)} / 100. "
                f"Primary rule-based contributors: {top_summary}."
            )

        return {
            "confirmation_bias_score": round(float(prediction[0]), 4),
            "anchoring_bias_score": round(float(prediction[1]), 4),
            "negativity_bias_score": round(float(prediction[2]), 4),
            "confidence": confidence,
            "explanation": explanation,
            "trait_scores": trait_scores,
            "behavioral_features": behavioral_features,
            "model_version": MODEL_VERSION,
            "disclaimer": "Model is based on inferred relationships, not direct ground truth labels.",
            "response_completeness": round(response_completeness, 4),
            "timing_quality": round(float(timing_quality), 4),
            "model_metrics": self.metrics,
            "artifact_path": str(MODEL_PATH),
            "feature_importance_top": self.feature_importance.head(10).to_dict(orient="records"),
        }


predictor = Predictor()
