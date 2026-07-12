from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from datetime import datetime
from core.config import Base

class Generation(Base):
    __tablename__ = "generations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    style = Column(String, index=True)
    processing_time = Column(Float)
    image_path = Column(String, nullable=True) # Could store local path if saved
    created_at = Column(DateTime, default=datetime.utcnow)
