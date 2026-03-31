from fastapi import FastAPI, HTTPException

from .config import MODEL_PATH
from .predictor import predictor
from .schemas import PredictRequest, PredictResponse


app = FastAPI(title="BiasMirror ML Service", version="1.0.0")


@app.on_event("startup")
def startup_event() -> None:
    if MODEL_PATH.exists():
        predictor.load()


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "model_ready": predictor.is_ready}


@app.post("/ml/predict", response_model=PredictResponse)
def predict(request: PredictRequest) -> PredictResponse:
    if not predictor.is_ready:
        raise HTTPException(status_code=503, detail="Model artifact not loaded")
    return PredictResponse(**predictor.predict(request.answers, request.response_times))
