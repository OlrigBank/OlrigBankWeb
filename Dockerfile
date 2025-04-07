# Stage 2: Production stage
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /app

COPY --from=builder /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH

# ✅ ✅ ✅ Correct: Copy the fully prepared /app from builder stage!
COPY --from=builder /app /app

EXPOSE 8080

CMD ["gunicorn", "server:app", "--bind", "0.0.0.0:8080"]
