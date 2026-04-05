from fastapi import FastAPI, APIRouter, HTTPException, Cookie, Response, Request, Depends
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import httpx
import bcrypt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============= MODELS =============

class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    phone: Optional[str] = None
    role: str = "member"  # member or admin
    tag: Optional[str] = None  # captain, vice_captain, band_in_charge, instrument_in_charge, trainer
    uniform_size: Optional[str] = None  # S, M, L, XL, XXL
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserSession(BaseModel):
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SessionDataRequest(BaseModel):
    session_id: str

class AttendanceRecord(BaseModel):
    attendance_id: str = Field(default_factory=lambda: f"att_{uuid.uuid4().hex[:12]}")
    user_id: str
    attendance_type: str  # practice or khidmat
    date: str  # YYYY-MM-DD
    status: str  # present, absent
    marked_by: str  # admin user_id
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FeeRecord(BaseModel):
    fee_id: str = Field(default_factory=lambda: f"fee_{uuid.uuid4().hex[:12]}")
    user_id: str
    month: str  # YYYY-MM
    amount: float
    status: str  # paid, due
    paid_date: Optional[str] = None
    updated_by: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class InventoryItem(BaseModel):
    item_id: str = Field(default_factory=lambda: f"item_{uuid.uuid4().hex[:12]}")
    name: str
    category: str = "musical_instrument"
    quantity: int
    condition: Optional[str] = None  # good, needs_repair, damaged
    added_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Request/Response Models
class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    picture: Optional[str] = None

class UpdateUniformRequest(BaseModel):
    uniform_size: str

class MarkAttendanceRequest(BaseModel):
    user_id: str
    attendance_type: str
    date: str
    status: str

class UpdateFeeRequest(BaseModel):
    user_id: str
    month: str
    amount: float
    status: str
    paid_date: Optional[str] = None

class CreateInventoryRequest(BaseModel):
    name: str
    quantity: int
    condition: Optional[str] = None

class UpdateInventoryRequest(BaseModel):
    name: Optional[str] = None
    quantity: Optional[int] = None
    condition: Optional[str] = None

class AssignTagRequest(BaseModel):
    user_id: str
    tag: str

# ============= AUTHENTICATION HELPERS =============

async def get_current_user(
    request: Request,
    session_token: Optional[str] = Cookie(None)
) -> User:
    """
    Get current authenticated user from session_token cookie or Authorization header.
    REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    """
    token = session_token
    
    # Fallback to Authorization header if cookie not present
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.replace("Bearer ", "")
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Find session
    session_doc = await db.user_sessions.find_one(
        {"session_token": token},
        {"_id": 0}
    )
    
    if not session_doc:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    # Check expiry
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    # Get user
    user_doc = await db.users.find_one(
        {"user_id": session_doc["user_id"]},
        {"_id": 0}
    )
    
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    return User(**user_doc)

async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Require admin role"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

# ============= AUTH ENDPOINTS =============

@api_router.post("/auth/session")
async def create_session(request: SessionDataRequest, response: Response):
    """
    Exchange session_id for session_token and user data.
    REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    """
    try:
        # Call Emergent Auth API
        async with httpx.AsyncClient() as client:
            emergent_response = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": request.session_id}
            )
            emergent_response.raise_for_status()
            session_data = emergent_response.json()
        
        email = session_data["email"]
        name = session_data["name"]
        picture = session_data.get("picture")
        
        # Check if user exists
        user_doc = await db.users.find_one({"email": email}, {"_id": 0})
        
        if user_doc:
            # Update existing user
            await db.users.update_one(
                {"email": email},
                {"$set": {
                    "name": name,
                    "picture": picture
                }}
            )
            user_id = user_doc["user_id"]
            role = user_doc.get("role", "member")
        else:
            # Create new user
            user_id = f"user_{uuid.uuid4().hex[:12]}"
            # Check if this is the admin email
            role = "admin" if email == "mansoorkholkawala@gmail.com" else "member"
            
            new_user = User(
                user_id=user_id,
                email=email,
                name=name,
                picture=picture,
                role=role
            )
            await db.users.insert_one(new_user.dict())
        
        # Create session
        session_token = f"session_{uuid.uuid4().hex}"
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        
        new_session = UserSession(
            user_id=user_id,
            session_token=session_token,
            expires_at=expires_at
        )
        await db.user_sessions.insert_one(new_session.dict())
        
        # Set cookie
        response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            secure=True,
            samesite="none",
            max_age=7 * 24 * 60 * 60,
            path="/"
        )
        
        # Get updated user
        user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
        
        return {
            "user": user_doc,
            "session_token": session_token
        }
        
    except httpx.HTTPError as e:
        logger.error(f"Failed to fetch session data: {e}")
        raise HTTPException(status_code=401, detail="Invalid session_id")

@api_router.get("/auth/me")
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user info"""
    return current_user

@api_router.post("/auth/logout")
async def logout(response: Response, session_token: Optional[str] = Cookie(None)):
    """Logout user"""
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}

# ============= USER/PROFILE ENDPOINTS =============

@api_router.put("/profile")
async def update_profile(
    update_data: UpdateProfileRequest,
    current_user: User = Depends(get_current_user)
):
    """Update user profile"""
    update_dict = {}
    if update_data.name:
        update_dict["name"] = update_data.name
    if update_data.phone:
        update_dict["phone"] = update_data.phone
    if update_data.picture:
        update_dict["picture"] = update_data.picture
    
    if update_dict:
        await db.users.update_one(
            {"user_id": current_user.user_id},
            {"$set": update_dict}
        )
    
    # Return updated user
    user_doc = await db.users.find_one({"user_id": current_user.user_id}, {"_id": 0})
    return User(**user_doc)

@api_router.put("/profile/uniform")
async def update_uniform(
    update_data: UpdateUniformRequest,
    current_user: User = Depends(get_current_user)
):
    """Update uniform size (member can edit)"""
    await db.users.update_one(
        {"user_id": current_user.user_id},
        {"$set": {"uniform_size": update_data.uniform_size}}
    )
    
    user_doc = await db.users.find_one({"user_id": current_user.user_id}, {"_id": 0})
    return User(**user_doc)

@api_router.get("/users")
async def get_all_users(current_user: User = Depends(get_current_user)):
    """Get all users (for admin to view)"""
    users = await db.users.find({}, {"_id": 0}).to_list(1000)
    return users

# ============= ATTENDANCE ENDPOINTS =============

@api_router.post("/attendance")
async def mark_attendance(
    attendance: MarkAttendanceRequest,
    admin: User = Depends(require_admin)
):
    """Mark attendance (admin only)"""
    # Check if attendance already exists for this user, type, and date
    existing = await db.attendance.find_one({
        "user_id": attendance.user_id,
        "attendance_type": attendance.attendance_type,
        "date": attendance.date
    })
    
    if existing:
        # Update existing
        await db.attendance.update_one(
            {"attendance_id": existing["attendance_id"]},
            {"$set": {
                "status": attendance.status,
                "marked_by": admin.user_id
            }}
        )
        return {"message": "Attendance updated"}
    else:
        # Create new
        new_attendance = AttendanceRecord(
            user_id=attendance.user_id,
            attendance_type=attendance.attendance_type,
            date=attendance.date,
            status=attendance.status,
            marked_by=admin.user_id
        )
        await db.attendance.insert_one(new_attendance.dict())
        return {"message": "Attendance marked"}

@api_router.get("/attendance/my/{attendance_type}")
async def get_my_attendance(
    attendance_type: str,
    month: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get user's own attendance for a specific type"""
    query = {
        "user_id": current_user.user_id,
        "attendance_type": attendance_type
    }
    
    if month:
        # Filter by month (YYYY-MM)
        query["date"] = {"$regex": f"^{month}"}
    
    records = await db.attendance.find(query, {"_id": 0}).to_list(1000)
    
    # Calculate percentage
    total = len(records)
    present = len([r for r in records if r["status"] == "present"])
    percentage = (present / total * 100) if total > 0 else 0
    
    return {
        "records": records,
        "total": total,
        "present": present,
        "percentage": round(percentage, 2)
    }

@api_router.get("/attendance/user/{user_id}/{attendance_type}")
async def get_user_attendance(
    user_id: str,
    attendance_type: str,
    month: Optional[str] = None,
    admin: User = Depends(require_admin)
):
    """Get specific user's attendance (admin only)"""
    query = {
        "user_id": user_id,
        "attendance_type": attendance_type
    }
    
    if month:
        query["date"] = {"$regex": f"^{month}"}
    
    records = await db.attendance.find(query, {"_id": 0}).to_list(1000)
    
    total = len(records)
    present = len([r for r in records if r["status"] == "present"])
    percentage = (present / total * 100) if total > 0 else 0
    
    return {
        "records": records,
        "total": total,
        "present": present,
        "percentage": round(percentage, 2)
    }

# ============= FEES ENDPOINTS =============

@api_router.post("/fees")
async def update_fee(
    fee_data: UpdateFeeRequest,
    admin: User = Depends(require_admin)
):
    """Update fee record (admin only)"""
    existing = await db.fees.find_one({
        "user_id": fee_data.user_id,
        "month": fee_data.month
    })
    
    if existing:
        await db.fees.update_one(
            {"fee_id": existing["fee_id"]},
            {"$set": {
                "amount": fee_data.amount,
                "status": fee_data.status,
                "paid_date": fee_data.paid_date,
                "updated_by": admin.user_id
            }}
        )
        return {"message": "Fee updated"}
    else:
        new_fee = FeeRecord(
            user_id=fee_data.user_id,
            month=fee_data.month,
            amount=fee_data.amount,
            status=fee_data.status,
            paid_date=fee_data.paid_date,
            updated_by=admin.user_id
        )
        await db.fees.insert_one(new_fee.dict())
        return {"message": "Fee record created"}

@api_router.get("/fees/my")
async def get_my_fees(current_user: User = Depends(get_current_user)):
    """Get user's own fee records"""
    fees = await db.fees.find(
        {"user_id": current_user.user_id},
        {"_id": 0}
    ).sort("month", -1).to_list(1000)
    
    total_due = sum(f["amount"] for f in fees if f["status"] == "due")
    total_paid = sum(f["amount"] for f in fees if f["status"] == "paid")
    
    return {
        "fees": fees,
        "total_due": total_due,
        "total_paid": total_paid
    }

@api_router.get("/fees/user/{user_id}")
async def get_user_fees(
    user_id: str,
    admin: User = Depends(require_admin)
):
    """Get specific user's fees (admin only)"""
    fees = await db.fees.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("month", -1).to_list(1000)
    
    return fees

@api_router.get("/fees/all")
async def get_all_fees(admin: User = Depends(require_admin)):
    """Get all fee records (admin only)"""
    fees = await db.fees.find({}, {"_id": 0}).sort("month", -1).to_list(1000)
    return fees

# ============= INVENTORY ENDPOINTS =============

@api_router.post("/inventory")
async def create_inventory_item(
    item_data: CreateInventoryRequest,
    admin: User = Depends(require_admin)
):
    """Create inventory item (admin only)"""
    new_item = InventoryItem(
        name=item_data.name,
        quantity=item_data.quantity,
        condition=item_data.condition or "good",
        added_by=admin.user_id
    )
    await db.inventory.insert_one(new_item.dict())
    return new_item

@api_router.get("/inventory")
async def get_inventory(current_user: User = Depends(get_current_user)):
    """Get all inventory items"""
    items = await db.inventory.find({}, {"_id": 0}).to_list(1000)
    return items

@api_router.put("/inventory/{item_id}")
async def update_inventory_item(
    item_id: str,
    update_data: UpdateInventoryRequest,
    admin: User = Depends(require_admin)
):
    """Update inventory item (admin only)"""
    update_dict = {"updated_at": datetime.now(timezone.utc)}
    
    if update_data.name:
        update_dict["name"] = update_data.name
    if update_data.quantity is not None:
        update_dict["quantity"] = update_data.quantity
    if update_data.condition:
        update_dict["condition"] = update_data.condition
    
    await db.inventory.update_one(
        {"item_id": item_id},
        {"$set": update_dict}
    )
    
    return {"message": "Inventory updated"}

@api_router.delete("/inventory/{item_id}")
async def delete_inventory_item(
    item_id: str,
    admin: User = Depends(require_admin)
):
    """Delete inventory item (admin only)"""
    await db.inventory.delete_one({"item_id": item_id})
    return {"message": "Item deleted"}

# ============= ADMIN - TAG MANAGEMENT =============

@api_router.post("/admin/assign-tag")
async def assign_tag(
    tag_data: AssignTagRequest,
    admin: User = Depends(require_admin)
):
    """Assign tag to user (admin only)"""
    await db.users.update_one(
        {"user_id": tag_data.user_id},
        {"$set": {"tag": tag_data.tag}}
    )
    return {"message": "Tag assigned"}

@api_router.put("/admin/uniform/{user_id}")
async def admin_update_uniform(
    user_id: str,
    update_data: UpdateUniformRequest,
    admin: User = Depends(require_admin)
):
    """Admin update user's uniform size"""
    await db.users.update_one(
        {"user_id": user_id},
        {"$set": {"uniform_size": update_data.uniform_size}}
    )
    return {"message": "Uniform size updated"}

# ============= ADMIN - BATCH OPERATIONS =============

@api_router.post("/admin/generate-fees/{month}")
async def generate_monthly_fees(
    month: str,
    amount: float,
    admin: User = Depends(require_admin)
):
    """Generate fee records for all members for a specific month"""
    # Get all non-admin users
    users = await db.users.find({"role": "member"}, {"_id": 0}).to_list(1000)
    
    created_count = 0
    for user in users:
        # Check if fee already exists
        existing = await db.fees.find_one({
            "user_id": user["user_id"],
            "month": month
        })
        
        if not existing:
            new_fee = FeeRecord(
                user_id=user["user_id"],
                month=month,
                amount=amount,
                status="due",
                updated_by=admin.user_id
            )
            await db.fees.insert_one(new_fee.dict())
            created_count += 1
    
    return {
        "message": f"Generated {created_count} fee records for {month}",
        "total_members": len(users),
        "created": created_count
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
