FROM python:3.12-slim

WORKDIR /app

COPY ml-service/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY ml-service/app ./app
COPY ml-service/scripts ./scripts
COPY ml-service/artifacts ./artifacts

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "--app-dir", "/app", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
