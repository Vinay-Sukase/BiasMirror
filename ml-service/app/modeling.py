from __future__ import annotations

from dataclasses import dataclass
import json
from pathlib import Path
from typing import Iterable

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split

from .config import MODEL_PATH


TRAITS = ["EXT", "EST", "AGR", "CSN", "OPN"]
REVERSE_KEY_MAP = {
    "EXT": ["EXT2", "EXT4", "EXT6", "EXT8", "EXT10"],
    "EST": ["EST2", "EST4"],
    "AGR": ["AGR1", "AGR3", "AGR5", "AGR7"],
    "CSN": ["CSN2", "CSN4", "CSN6", "CSN8"],
    "OPN": ["OPN2", "OPN4", "OPN6"],
}
TARGET_COLUMNS = [
    "confirmation_bias_score",
    "anchoring_bias_score",
    "negativity_bias_score",
]


@dataclass
class PreparedTrainingSet:
    features: pd.DataFrame
    targets: pd.DataFrame
    metadata: dict
    feature_importance: pd.DataFrame | None = None


def load_columns(dataset_path: Path) -> list[str]:
    return pd.read_csv(dataset_path, sep="\t", nrows=0).columns.tolist()


def get_trait_columns(columns: Iterable[str]) -> list[str]:
    return [column for column in columns if column[:3] in TRAITS and not column.endswith("_E")]


def get_response_time_columns(columns: Iterable[str]) -> list[str]:
    return [column for column in columns if column.endswith("_E")]


def reverse_key_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    scored = df.copy()
    for items in REVERSE_KEY_MAP.values():
        for item in items:
            if item in scored:
                scored[item] = 6 - scored[item]
    return scored


def compute_trait_scores(scored_df: pd.DataFrame) -> pd.DataFrame:
    trait_scores = {}
    for trait in TRAITS:
        columns = [column for column in scored_df.columns if column.startswith(trait) and not column.endswith("_E")]
        trait_scores[trait] = scored_df[columns].mean(axis=1)
    trait_df = pd.DataFrame(trait_scores)
    return (trait_df - 1.0) / 4.0


def compute_behavioral_features(response_df: pd.DataFrame) -> pd.DataFrame:
    positive = response_df.where(response_df > 0)
    median = positive.median(axis=1)
    fast_counts = positive.le(median, axis=0).sum(axis=1)
    slow_counts = positive.gt(median, axis=0).sum(axis=1)

    return pd.DataFrame(
        {
            "avg_response_time": positive.mean(axis=1),
            "response_variance": positive.var(axis=1),
            "fast_vs_slow_ratio": (fast_counts + 1) / (slow_counts + 1),
            "valid_time_count": positive.notna().sum(axis=1),
        }
    )


def min_max_normalize(frame: pd.DataFrame) -> tuple[pd.DataFrame, dict]:
    minimum = frame.min()
    maximum = frame.max()
    spread = (maximum - minimum).replace(0, 1)
    normalized = (frame - minimum) / spread
    metadata = {
        "min": minimum.to_dict(),
        "max": maximum.to_dict(),
    }
    return normalized.fillna(0), metadata


def apply_min_max(frame: pd.DataFrame, metadata: dict) -> pd.DataFrame:
    minimum = pd.Series(metadata["min"])
    maximum = pd.Series(metadata["max"])
    spread = (maximum - minimum).replace(0, 1)
    normalized = (frame[minimum.index] - minimum) / spread
    return normalized.fillna(0).clip(lower=0, upper=1)


def create_synthetic_targets(trait_scores: pd.DataFrame, behavioral_norm: pd.DataFrame) -> pd.DataFrame:
    confirmation = (
        0.50 * (1 - trait_scores["OPN"])
        + 0.25 * (1 - trait_scores["AGR"])
        + 0.15 * behavioral_norm["fast_vs_slow_ratio"]
        + 0.10 * (1 - behavioral_norm["response_variance"])
    )
    anchoring = (
        0.40 * (1 - trait_scores["OPN"])
        + 0.20 * (1 - trait_scores["EXT"])
        + 0.20 * behavioral_norm["fast_vs_slow_ratio"]
        + 0.20 * (1 - behavioral_norm["response_variance"])
    )
    negativity = (
        0.60 * trait_scores["EST"]
        + 0.15 * (1 - trait_scores["EXT"])
        + 0.15 * behavioral_norm["avg_response_time"]
        + 0.10 * behavioral_norm["response_variance"]
    )
    targets = pd.DataFrame(
        {
            "confirmation_bias_score": confirmation.clip(0, 1),
            "anchoring_bias_score": anchoring.clip(0, 1),
            "negativity_bias_score": negativity.clip(0, 1),
        }
    )
    return targets
def prepare_training_data(dataset_path: Path, max_rows: int | None = None) -> PreparedTrainingSet:
    columns = load_columns(dataset_path)
    trait_columns = get_trait_columns(columns)
    response_time_columns = get_response_time_columns(columns)
    use_columns = trait_columns + response_time_columns + ["IPC"]
    df = pd.read_csv(dataset_path, sep="\t", usecols=use_columns)
    df = df[df["IPC"] == 1].copy()

    valid_traits = df[trait_columns].apply(lambda series: series.between(1, 5)).all(axis=1)
    df = df[valid_traits].copy()

    df[response_time_columns] = df[response_time_columns].where(df[response_time_columns] > 0)
    valid_time_count = df[response_time_columns].notna().sum(axis=1)
    df = df[valid_time_count >= 45].copy()

    if max_rows and len(df) > max_rows:
        df = df.sample(max_rows, random_state=42)

    keyed_traits = reverse_key_dataframe(df[trait_columns])
    trait_scores = compute_trait_scores(keyed_traits)
    behavioral = compute_behavioral_features(df[response_time_columns])
    behavioral_norm, behavior_metadata = min_max_normalize(
        behavioral[["avg_response_time", "response_variance", "fast_vs_slow_ratio"]]
    )
    targets = create_synthetic_targets(trait_scores, behavioral_norm)

    feature_columns = trait_columns + response_time_columns
    feature_frame = df[feature_columns].copy()
    medians = feature_frame.median().to_dict()
    feature_frame = feature_frame.fillna(medians)

    metadata = {
      "dataset_path": str(dataset_path),
      "rows_used": int(len(df)),
      "trait_columns": trait_columns,
      "response_time_columns": response_time_columns,
      "feature_columns": feature_columns,
      "feature_medians": medians,
      "behavior_normalization": behavior_metadata,
      "limitations": "Model is based on inferred relationships, not direct ground truth labels",
    }

    return PreparedTrainingSet(features=feature_frame, targets=targets, metadata=metadata)


def build_feature_importance(model: RandomForestRegressor, feature_columns: list[str]) -> pd.DataFrame:
    return (
        pd.DataFrame(
            {
                "feature": feature_columns,
                "importance": model.feature_importances_,
            }
        )
        .sort_values("importance", ascending=False)
        .reset_index(drop=True)
    )


def train_models(prepared: PreparedTrainingSet) -> tuple[RandomForestRegressor, dict, pd.DataFrame]:
    x_train, x_test, y_train, y_test = train_test_split(
        prepared.features, prepared.targets, test_size=0.2, random_state=42
    )

    baseline = LinearRegression()
    baseline.fit(x_train, y_train)
    baseline_predictions = baseline.predict(x_test)

    model = RandomForestRegressor(
        n_estimators=120,
        random_state=42,
        n_jobs=-1,
        max_depth=18,
        min_samples_leaf=2,
    )
    model.fit(x_train, y_train)
    predictions = model.predict(x_test)

    metrics = {
        "mse": float(mean_squared_error(y_test, predictions)),
        "mae": float(mean_absolute_error(y_test, predictions)),
        "r2_score": float(r2_score(y_test, predictions)),
        "model_accuracy": float(1 - mean_absolute_error(y_test, predictions)),
        "baseline_mse": float(mean_squared_error(y_test, baseline_predictions)),
        "baseline_mae": float(mean_absolute_error(y_test, baseline_predictions)),
        "baseline_r2_score": float(r2_score(y_test, baseline_predictions)),
        "confidence": float(np.clip(1 - np.mean(np.var(predictions, axis=0)), 0, 1)),
        "limitations": "Model is based on inferred relationships, not direct ground truth labels",
    }

    feature_importance = build_feature_importance(model, prepared.metadata["feature_columns"])
    return model, metrics, feature_importance


def save_artifacts(model: RandomForestRegressor, metadata: dict, metrics: dict, feature_importance: pd.DataFrame) -> None:
    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    (MODEL_PATH.parent / "preprocessing_metadata.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    (MODEL_PATH.parent / "model_metrics.json").write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    feature_importance.to_csv(MODEL_PATH.parent / "feature_importance.csv", index=False)


def tree_prediction_variance(model: RandomForestRegressor, feature_row: np.ndarray) -> np.ndarray:
    tree_predictions = np.array([tree.predict(feature_row)[0] for tree in model.estimators_])
    return np.var(tree_predictions, axis=0)


def load_model_bundle(model_path: Path = MODEL_PATH) -> tuple[RandomForestRegressor, dict, dict, pd.DataFrame]:
    model = joblib.load(model_path)
    metadata = json.loads((model_path.parent / "preprocessing_metadata.json").read_text(encoding="utf-8"))
    metrics = json.loads((model_path.parent / "model_metrics.json").read_text(encoding="utf-8"))
    feature_importance = pd.read_csv(model_path.parent / "feature_importance.csv")
    return model, metadata, metrics, feature_importance
