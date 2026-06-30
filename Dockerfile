FROM python:3.12-slim

WORKDIR /app

# Install Node.js for frontend build
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend
COPY server/ server/

# Build frontend
COPY frontend/ frontend/
WORKDIR /app/frontend
RUN npm install && npm run build

WORKDIR /app

EXPOSE 29876

ENV PORT=29876
ENV DB_PATH=/app/data/doctor_daily.db

CMD ["python", "-m", "uvicorn", "server.main:app", "--host", "0.0.0.0", "--port", "29876"]
