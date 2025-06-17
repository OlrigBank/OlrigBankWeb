# ---------- Base stage (shared) ----------
FROM python:3.11-slim AS base

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /app

COPY requirements.txt .

RUN pip install --upgrade pip
RUN pip install --user -r requirements.txt

ENV PATH=/root/.local/bin:$PATH

# ---------- Build stage ----------
FROM base AS builder

COPY . .

RUN python generate_site.py

# ---------- Production stage ----------
FROM base AS production

COPY --from=builder /root/.local /root/.local
COPY --from=builder /app /app

EXPOSE 8080

# Add healthcheck for production container
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD curl --fail http://localhost:8080/health || exit 1

CMD ["gunicorn", "src.server:application", "--bind", "0.0.0.0:8080", "--workers", "4"]


