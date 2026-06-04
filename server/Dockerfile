FROM python:3.12-slim

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# Enable bytecode compilation
ENV UV_COMPILE_BYTECODE=1

# Copy project files
COPY pyproject.toml uv.lock ./

# Install dependencies using uv into a managed venv (default behavior)
RUN uv sync --frozen --no-install-project

# Copy backend application source
COPY . .

# Final sync to install the project itself
RUN uv sync --frozen

# Expose port
EXPOSE 8000

# Use 'uv run' to ensure uvicorn is found in the managed environment
# We point to app:app and keep asyncio loop for better debugging
CMD ["uv", "run", "uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000", "--loop", "asyncio"]
