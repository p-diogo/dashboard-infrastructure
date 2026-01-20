"""
Session management and in-memory state storage
"""
import hashlib
import secrets
import os
from datetime import datetime, timedelta
from typing import Dict
import time


class SessionManager:
    """
    Manages OTP codes, rate limiting, and sessions in memory
    """

    def __init__(self):
        # OTP storage: email -> {code_hash, expires}
        self._otp_codes: Dict[str, dict] = {}

        # Rate limiting: email -> {count, window_start}
        self._rate_limits: Dict[str, dict] = {}

        # Active sessions: token -> {email, expires}
        self._sessions: Dict[str, dict] = {}

        # Configuration
        self.otp_expiry_minutes = int(os.getenv('OTP_EXPIRY_MINUTES', '10'))
        self.session_expiry_days = int(os.getenv('SESSION_EXPIRY_DAYS', '7'))
        self.rate_limit_per_hour = int(os.getenv('RATE_LIMIT_PER_HOUR', '5'))
        self.session_secret = os.getenv('SESSION_SECRET', 'change-me-in-production')

        if self.session_secret == 'change-me-in-production':
            import warnings
            warnings.warn("Using default SESSION_SECRET! Set this in production!")

    def _hash_code(self, code: str) -> str:
        """Hash OTP code for storage"""
        return hashlib.sha256(code.encode()).hexdigest()

    def _generate_token(self) -> str:
        """Generate secure session token"""
        return secrets.token_urlsafe(32)

    def _is_rate_limited(self, email: str) -> bool:
        """Check if email has exceeded rate limit"""
        email = email.lower()
        now = time.time()
        hour_in_seconds = 3600

        if email not in self._rate_limits:
            return False

        limit_data = self._rate_limits[email]

        # Reset window if expired
        if now - limit_data['window_start'] >= hour_in_seconds:
            del self._rate_limits[email]
            return False

        return limit_data['count'] >= self.rate_limit_per_hour

    def _increment_rate_limit(self, email: str) -> None:
        """Increment rate limit counter for email"""
        email = email.lower()
        now = time.time()
        hour_in_seconds = 3600

        if email not in self._rate_limits:
            self._rate_limits[email] = {
                'count': 1,
                'window_start': now
            }
        else:
            # Reset window if expired
            if now - self._rate_limits[email]['window_start'] >= hour_in_seconds:
                self._rate_limits[email] = {
                    'count': 1,
                    'window_start': now
                }
            else:
                self._rate_limits[email]['count'] += 1

    def store_otp(self, email: str, code: str) -> None:
        """
        Store OTP code for email

        Raises:
            ValueError: If rate limit exceeded
        """
        email = email.lower()

        if self._is_rate_limited(email):
            raise ValueError(f"Rate limit exceeded: max {self.rate_limit_per_hour} requests per hour")

        self._increment_rate_limit(email)

        # Clean up expired OTPs first
        self._cleanup_expired_otps()

        # Store new OTP
        expires_at = datetime.utcnow() + timedelta(minutes=self.otp_expiry_minutes)
        self._otp_codes[email] = {
            'code_hash': self._hash_code(code),
            'expires': expires_at.isoformat()
        }

    def verify_otp(self, email: str, code: str) -> bool:
        """
        Verify OTP code for email

        Returns True if valid, False otherwise
        """
        email = email.lower()

        if email not in self._otp_codes:
            return False

        otp_data = self._otp_codes[email]

        # Check expiry
        expires = datetime.fromisoformat(otp_data['expires'])
        if datetime.utcnow() > expires:
            del self._otp_codes[email]
            return False

        # Verify code
        if self._hash_code(code) != otp_data['code_hash']:
            return False

        # Valid - remove OTP to prevent reuse
        del self._otp_codes[email]
        return True

    def create_session(self, email: str) -> str:
        """
        Create a new session for email

        Returns session token
        """
        email = email.lower()
        token = self._generate_token()

        # Clean up expired sessions first
        self._cleanup_expired_sessions()

        # Store session
        expires_at = datetime.utcnow() + timedelta(days=self.session_expiry_days)
        self._sessions[token] = {
            'email': email,
            'expires': expires_at.isoformat()
        }

        return token

    def validate_session(self, token: str) -> str | None:
        """
        Validate session token

        Returns email if valid, None otherwise
        """
        if token not in self._sessions:
            return None

        session = self._sessions[token]

        # Check expiry
        expires = datetime.fromisoformat(session['expires'])
        if datetime.utcnow() > expires:
            del self._sessions[token]
            return None

        return session['email']

    def invalidate_session(self, token: str) -> bool:
        """
        Invalidate a session token

        Returns True if session existed, False otherwise
        """
        if token in self._sessions:
            del self._sessions[token]
            return True
        return False

    def _cleanup_expired_otps(self) -> None:
        """Remove expired OTP codes"""
        now = datetime.utcnow()
        expired = [
            email for email, data in self._otp_codes.items()
            if datetime.fromisoformat(data['expires']) < now
        ]
        for email in expired:
            del self._otp_codes[email]

    def _cleanup_expired_sessions(self) -> None:
        """Remove expired sessions"""
        now = datetime.utcnow()
        expired = [
            token for token, data in self._sessions.items()
            if datetime.fromisoformat(data['expires']) < now
        ]
        for token in expired:
            del self._sessions[token]

    def get_stats(self) -> dict:
        """Get current statistics (for debugging/monitoring)"""
        return {
            'active_otps': len(self._otp_codes),
            'active_sessions': len(self._sessions),
            'rate_limit_entries': len(self._rate_limits)
        }


# Global session manager instance
_manager: SessionManager | None = None


def get_session_manager() -> SessionManager:
    """Get or create global session manager instance"""
    global _manager
    if _manager is None:
        _manager = SessionManager()
    return _manager
