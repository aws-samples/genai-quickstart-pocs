"""Custom exceptions for the application"""


class AppException(Exception):
    """Base exception for application errors"""
    def __init__(self, message: str, code: str = "INTERNAL_ERROR"):
        self.message = message
        self.code = code
        super().__init__(self.message)


class AuthenticationError(AppException):
    """Raised when authentication fails"""
    def __init__(self, message: str = "Authentication failed"):
        super().__init__(message, code="AUTH_FAILED")


class AuthorizationError(AppException):
    """Raised when authorization fails"""
    def __init__(self, message: str = "Not authorized"):
        super().__init__(message, code="UNAUTHORIZED")


class ValidationError(AppException):
    """Raised when input validation fails"""
    def __init__(self, message: str, details: dict = None):
        super().__init__(message, code="VALIDATION_ERROR")
        self.details = details or {}


class NotFoundError(AppException):
    """Raised when a resource is not found"""
    def __init__(self, message: str = "Resource not found"):
        super().__init__(message, code="NOT_FOUND")


class ServiceError(AppException):
    """Raised when a service operation fails"""
    def __init__(self, message: str = "Service temporarily unavailable"):
        super().__init__(message, code="SERVICE_UNAVAILABLE")
