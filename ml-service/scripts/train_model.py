from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.config import ARTIFACTS_DIR, DEFAULT_DATASET_PATH
from app.modeling import prepare_training_data, save_artifacts, train_models


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train the BiasMirror random forest model")
    parser.add_argument("--dataset", type=Path, default=DEFAULT_DATASET_PATH)
    parser.add_argument("--max-rows", type=int, default=None)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    prepared = prepare_training_data(args.dataset, max_rows=args.max_rows)
    model, metrics, feature_importance = train_models(prepared)
    save_artifacts(model, prepared.metadata, metrics, feature_importance)
    print(json.dumps({"artifacts_dir": str(ARTIFACTS_DIR), "metrics": metrics}, indent=2))


if __name__ == "__main__":
    main()
