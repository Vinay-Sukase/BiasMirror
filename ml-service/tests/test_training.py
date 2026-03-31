from pathlib import Path
import sys

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.modeling import prepare_training_data, train_models  # noqa: E402


def build_fixture_dataset(tmp_path: Path) -> Path:
    rng = np.random.default_rng(42)
    rows = 240
    data: dict[str, np.ndarray] = {}

    for trait in ["EXT", "EST", "AGR", "CSN", "OPN"]:
        for index in range(1, 11):
            data[f"{trait}{index}"] = rng.integers(1, 6, size=rows)
            data[f"{trait}{index}_E"] = rng.integers(900, 7000, size=rows)

    data["IPC"] = np.ones(rows, dtype=int)
    fixture = pd.DataFrame(data)
    path = tmp_path / "fixture.tsv"
    fixture.to_csv(path, sep="\t", index=False)
    return path


def test_prepare_training_data_filters_and_shapes_outputs(tmp_path: Path):
    fixture_path = build_fixture_dataset(tmp_path)
    prepared = prepare_training_data(fixture_path, max_rows=120)

    assert len(prepared.features) == 120
    assert prepared.targets.shape == (120, 3)
    assert prepared.metadata["rows_used"] == 120
    assert "EXT1" in prepared.metadata["feature_columns"]
    assert "EXT1_E" in prepared.metadata["feature_columns"]


def test_train_models_outputs_metrics_and_feature_importance(tmp_path: Path):
    fixture_path = build_fixture_dataset(tmp_path)
    prepared = prepare_training_data(fixture_path, max_rows=120)
    model, metrics, feature_importance = train_models(prepared)

    assert model is not None
    assert "r2_score" in metrics
    assert "mae" in metrics
    assert not feature_importance.empty
    assert {"feature", "importance"} == set(feature_importance.columns)
