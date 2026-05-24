from __future__ import annotations


class UnauthorizedException(Exception):
    def __init__(self, message: str = "Invalid or expired token") -> None:
        super().__init__(message)
        self.message = message
        self.code = "UNAUTHORIZED"
        self.status_code = 401


class TokenExpiredException(UnauthorizedException):
    pass


class InvalidTokenException(UnauthorizedException):
    pass
