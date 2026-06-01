"""
Health check route.
"""

from fastapi import APIRouter

router = APIRouter(tags=["health"])

@router.get("/health")
async def health_check():
    """
    Basic health check.
    """
    return {
        "platform": "LexOS",
        "status": "operational",
    }
