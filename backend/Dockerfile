FROM python:3.12-slim

# Prevent Python from writing .pyc files and enable unbuffered output
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=4000

WORKDIR /app

# Install curl for healthcheck if needed
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend application
COPY . .

# Ensure uploads directories exist
RUN mkdir -p uploads/images uploads/files

# Expose application port
EXPOSE 4000

# Start production gunicorn server
CMD ["gunicorn", "app:app", "--bind", "0.0.0.0:4000", "--workers", "2", "--timeout", "120"]
