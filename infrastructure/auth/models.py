"""
Pydantic models for request/response validation
"""
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime


class OtpRequest(BaseModel):
    """Request model for OTP code generation"""
    email: EmailStr = Field(..., description="User email address")


class OtpVerify(BaseModel):
    """Request model for OTP verification"""
    email: EmailStr = Field(..., description="User email address")
    code: str = Field(..., min_length=6, max_length=6, description="6-digit OTP code")


class OtpResponse(BaseModel):
    """Response model for OTP requests"""
    message: str
    expires_in: int = Field(..., description="OTP expiry time in seconds")


class SessionResponse(BaseModel):
    """Response model for successful authentication"""
    message: str
    email: str


class ErrorResponse(BaseModel):
    """Standard error response"""
    error: str
    detail: str | None = None
