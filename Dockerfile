# Stage 1: Builder
FROM python:3.11-slim AS builder

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --upgrade pip
RUN pip install --user -r requirements.txt

# Copy source code
COPY . .

# Generate server.py and templates
RUN python generate_site.py

# Stage 2: Runtime
FROM python:3.11-slim

WORKDIR /app

COPY --from=builder /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH

COPY --from=builder /app /app

EXPOSE 8080

CMD ["gunicorn", "server:app", "--bind", "0.0.0.0:8080"]

