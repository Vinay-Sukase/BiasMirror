from pathlib import Path
import os


ROOT_DIR = Path(__file__).resolve().parents[1]
REPO_DIR = ROOT_DIR.parent
ARTIFACTS_DIR = ROOT_DIR / "artifacts"
DEFAULT_DATASET_PATH = REPO_DIR / "archive" / "IPIP-FFM-data-8Nov2018" / "data-final.csv"
DEFAULT_CODEBOOK_PATH = REPO_DIR / "archive" / "IPIP-FFM-data-8Nov2018" / "codebook.txt"

MODEL_PATH = ARTIFACTS_DIR / "bias_model.pkl"
METADATA_PATH = ARTIFACTS_DIR / "preprocessing_metadata.json"
METRICS_PATH = ARTIFACTS_DIR / "model_metrics.json"
FEATURE_IMPORTANCE_PATH = ARTIFACTS_DIR / "feature_importance.csv"

MODEL_VERSION = os.getenv("MODEL_VERSION", "biasmirror-rf-v1")
MAX_TRAIN_ROWS = os.getenv("MAX_TRAIN_ROWS")
