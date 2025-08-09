from fastapi import Request, HTTPException, status
from fastapi.security.utils import get_authorization_scheme_param
from sqlalchemy.orm import Session
from ..database import SessionLocal
from ..models import User
from ..auth.auth import verify_token

class ManagerAuthMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        request = Request(scope, receive)
        
        # Only check manager auth for /admin routes
        if request.url.path.startswith("/admin"):
            try:
                # Get Authorization header
                authorization = request.headers.get("Authorization")
                if not authorization:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Authorization header required",
                        headers={"WWW-Authenticate": "Bearer"},
                    )

                scheme, token = get_authorization_scheme_param(authorization)
                if scheme.lower() != "bearer":
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Invalid authentication scheme",
                        headers={"WWW-Authenticate": "Bearer"},
                    )

                # Verify token and get user
                email = verify_token(token)
                db = SessionLocal()
                try:
                    user = db.query(User).filter(User.email == email).first()
                    if not user:
                        raise HTTPException(
                            status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="User not found"
                        )
                    
                    # All users are now managers, so just verify they exist
                    
                    # Add user to request state
                    scope["state"] = {"current_manager": user}
                    
                finally:
                    db.close()
                    
            except HTTPException:
                # If authentication fails, return error response
                response = HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Manager authentication required"
                )
                await response(scope, receive, send)
                return

        await self.app(scope, receive, send)