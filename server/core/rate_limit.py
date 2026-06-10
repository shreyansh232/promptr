import sys
import jwt
from fastapi import Request
from slowapi import Limiter

from config import get_settings

settings = get_settings()


def get_client_ip(request: Request) -> str:
    """
    Extract the real client IP address, respecting proxy headers.
    """
    # X-Forwarded-For can contain a list of IPs: client, proxy1, proxy2.
    # The first one is the original client IP.
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()

    # Fallback to X-Real-IP
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip.strip()

    if request.client and request.client.host:
        return request.client.host
    return "127.0.0.1"


def get_rate_limit_key(request: Request) -> str:
    """
    Extract user identifier from JWT for rate limiting.
    Falls back to IP address if no valid token is present.
    """
    auth_header = request.headers.get("Authorization")
    if auth_header:
        parts = auth_header.split(" ", 1)
        if len(parts) == 2 and parts[0].lower() == "bearer":
            token = parts[1]
            try:
                # In promptr, settings.auth_secret is the secret key, algorithm is HS256
                payload = jwt.decode(token, settings.auth_secret, algorithms=["HS256"])
                user_id = payload.get("sub")
                if user_id:
                    return f"user:{user_id}"
            except jwt.PyJWTError:
                pass

    return f"ip:{get_client_ip(request)}"


if "pytest" in sys.modules:
    storage_uri = "memory://"
else:
    storage_uri = settings.redis_url

limiter = Limiter(
    key_func=get_rate_limit_key,
    default_limits=["60/minute"],
    storage_uri=storage_uri,
    swallow_errors=True,
)
