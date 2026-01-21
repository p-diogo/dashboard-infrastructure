"""
Email whitelist validation with wildcard domain support
"""
import os
from pathlib import Path
from typing import List


class WhitelistValidator:
    """Validates email addresses against a whitelist"""

    def __init__(self):
        self._entries: List[str] = []
        self._load_whitelist()

    def _load_whitelist(self) -> None:
        """Load whitelist from environment variable or file"""
        # Try environment variable first (Docker-friendly)
        env_whitelist = os.getenv('ALLOWED_EMAILS')
        if env_whitelist:
            # Support both newline and semicolon separators
            entries = env_whitelist.replace(';', '\n').split('\n')
            for line in entries:
                line = line.strip()
                if line and not line.startswith('#'):
                    self._entries.append(line.lower())
            return

        # Fallback to file
        whitelist_path = os.getenv('WHITELIST_PATH', '/app/config/allowed_emails.txt')
        if not Path(whitelist_path).exists():
            raise ValueError(
                f"No whitelist configured. Set ALLOWED_EMAILS environment variable "
                f"or provide whitelist file at {whitelist_path}"
            )

        with open(whitelist_path, 'r') as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#'):
                    continue
                self._entries.append(line.lower())

    def is_allowed(self, email: str) -> bool:
        """
        Check if email is in whitelist

        Args:
            email: Email address to validate

        Returns:
            True if email is allowed, False otherwise
        """
        email = email.lower().strip()

        # Check exact match first
        if email in self._entries:
            return True

        # Check wildcard patterns
        user, domain = email.split('@', 1) if '@' in email else (None, email)

        for entry in self._entries:
            if entry.startswith('*@'):
                # Wildcard domain match
                wildcard_domain = entry[2:]  # Remove '*@'
                if domain == wildcard_domain:
                    return True

        return False

    def get_allowed_count(self) -> int:
        """Return number of whitelist entries"""
        return len(self._entries)


# Global validator instance
_validator: WhitelistValidator | None = None


def get_validator() -> WhitelistValidator:
    """Get or create global validator instance"""
    global _validator
    if _validator is None:
        whitelist_path = os.getenv('WHITELIST_PATH', '/app/config/allowed_emails.txt')
        _validator = WhitelistValidator(whitelist_path)
    return _validator
