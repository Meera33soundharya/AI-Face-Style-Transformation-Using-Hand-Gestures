from fastapi import APIRouter, Depends
from api.auth import get_current_user
from models.user import User

router = APIRouter(prefix="/api/stats", tags=["stats"])

@router.get("/summary")
def get_dashboard_summary(current_user: User = Depends(get_current_user)):
    # In a real app, this would aggregate data from the database
    # For now, we return placeholder data to satisfy the dashboard UI
    return {
        "total_transformations": 0,
        "most_used_style": "None",
        "avg_processing_time": "0s",
        "saved_images": 0,
        "camera_status": "Ready",
        "ai_model_status": "Offline (Module 6)"
    }

@router.get("/recent-activity")
def get_recent_activity(current_user: User = Depends(get_current_user)):
    return []

@router.get("/usage-chart")
def get_usage_chart(current_user: User = Depends(get_current_user)):
    # Mock data for a 7-day period
    return [
        {"day": "Mon", "count": 0},
        {"day": "Tue", "count": 0},
        {"day": "Wed", "count": 0},
        {"day": "Thu", "count": 0},
        {"day": "Fri", "count": 0},
        {"day": "Sat", "count": 0},
        {"day": "Sun", "count": 0}
    ]
