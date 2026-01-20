"""
FastAPI OTP Authentication Service for REO Dashboard

Endpoints:
  - GET /validate          - Internal auth validation for nginx auth_request
  - GET /health            - Health check endpoint
  - POST /reo/api/request-otp   - Request OTP code via email
  - POST /reo/api/verify-otp    - Verify OTP and create session
  - POST /reo/api/logout        - Invalidate session
"""
from fastapi import FastAPI, HTTPException, Response, Cookie, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

import os
from datetime import datetime

from .models import OtpRequest, OtpVerify, OtpResponse, SessionResponse
from .auth import get_session_manager
from .email import get_email_sender, generate_otp_code
from .whitelist import get_validator

# Create FastAPI app
app = FastAPI(
    title="REO Auth Gate",
    description="OTP authentication service for REO Dashboard",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS - disabled for security (same-origin only)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[],  # No cross-origin requests
    allow_credentials=False,
    allow_methods=[""],
    allow_headers=[""],
)

# Session cookie name
SESSION_COOKIE_NAME = "reo_session"
SESSION_COOKIE_MAX_AGE = 7 * 24 * 60 * 60  # 7 days in seconds


@app.get("/health")
async def health_check():
    """Health check endpoint for Docker healthcheck"""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}


@app.get("/validate")
async def validate_session(response: Response, reo_session: str | None = Cookie(default=None)):
    """
    Internal endpoint for nginx auth_request module

    Validates session cookie and returns appropriate status code:
    - 200 OK: Session valid
    - 401 Unauthorized: Session invalid or missing
    - 403 Forbidden: Session expired

    Note: No response body (nginx only cares about status code)
    """
    if not reo_session:
        response.status_code = status.HTTP_401_UNAUTHORIZED
        return response

    session_manager = get_session_manager()
    email = session_manager.validate_session(reo_session)

    if email is None:
        response.status_code = status.HTTP_403_FORBIDDEN
        return response

    response.status_code = status.HTTP_200_OK
    return response


@app.post("/reo/api/request-otp", response_model=OtpResponse)
async def request_otp(request: OtpRequest):
    """
    Request OTP code via email

    Returns 200 if email sent successfully
    Returns 400 if email format invalid
    Returns 403 if email not in whitelist
    Returns 429 if rate limit exceeded
    """
    whitelist = get_validator()

    # Check whitelist
    if not whitelist.is_allowed(request.email):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email address not authorized for access"
        )

    # Generate OTP code
    code = generate_otp_code(6)
    session_manager = get_session_manager()

    try:
        # Store OTP (will raise ValueError if rate limited)
        session_manager.store_otp(request.email, code)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=str(e)
        )

    # Send email
    email_sender = get_email_sender()
    email_sent = email_sender.send_otp_email(request.email, code)

    if not email_sent:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send email"
        )

    return OtpResponse(
        message="OTP code sent to your email",
        expires_in=10 * 60  # 10 minutes in seconds
    )


@app.post("/reo/api/verify-otp", response_model=SessionResponse)
async def verify_otp(request: OtpVerify, response: Response):
    """
    Verify OTP code and create session

    Returns 200 and sets session cookie if valid
    Returns 400 if request invalid
    Returns 401 if OTP invalid or expired
    """
    session_manager = get_session_manager()

    # Verify OTP
    if not session_manager.verify_otp(request.email, request.code):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired OTP code"
        )

    # Create session
    session_token = session_manager.create_session(request.email)

    # Set session cookie
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=session_token,
        max_age=SESSION_COOKIE_MAX_AGE,
        path="/reo",
        httponly=True,
        secure=False,  # Set True when using HTTPS
        samesite="lax"
    )

    return SessionResponse(
        message="Authentication successful",
        email=request.email
    )


@app.post("/reo/api/logout")
async def logout(response: Response, reo_session: str | None = Cookie(default=None)):
    """
    Invalidate session and clear cookie

    Returns 200 always (for security)
    """
    if reo_session:
        session_manager = get_session_manager()
        session_manager.invalidate_session(reo_session)

    # Clear cookie
    response.delete_cookie(
        key=SESSION_COOKIE_NAME,
        path="/reo"
    )

    return {"message": "Logged out successfully"}


@app.get("/stats")
async def get_stats():
    """
    Get statistics (for debugging/monitoring)

    Returns active OTPs, sessions, rate limit entries
    """
    session_manager = get_session_manager()
    whitelist = get_validator()

    return {
        **session_manager.get_stats(),
        "whitelist_entries": whitelist.get_allowed_count()
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
