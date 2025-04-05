# Dockerfile

FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /app

COPY . .

RUN pip install --no-cache-dir -r requirements.txt

# Expose Flask port
EXPOSE 8080

# Command to run generator first, then start Flask
CMD ["sh", "-c", "python generate_site.py && flask run --host=0.0.0.0 --port=8080"]
