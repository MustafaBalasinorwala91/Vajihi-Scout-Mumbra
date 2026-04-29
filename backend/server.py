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
    username: str
    name: str
    phone: Optional[str] = None
    picture: Optional[str] = None
    role: str = "member"  # member or admin
    tag: Optional[str] = None  # captain, vice_captain, band_in_charge, instrument_in_charge, trainer
    badge: Optional[str] = None  # bronze, silver, gold
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserSession(BaseModel):
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

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
    condition: Optional[str] = None
    added_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UniformItem(BaseModel):
    uniform_id: str = Field(default_factory=lambda: f"uniform_{uuid.uuid4().hex[:12]}")
    name: str  # e.g., "Scout Shirt", "Band Jacket"
    size: str  # S, M, L, XL, XXL
    quantity: int
    added_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserUniform(BaseModel):
    user_uniform_id: str = Field(default_factory=lambda: f"uu_{uuid.uuid4().hex[:12]}")
    user_id: str
    uniform_id: str
    assigned_date: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Request/Response Models
class SignupRequest(BaseModel):
    username: str
    password: str
    name: str
    phone: Optional[str] = None
    security_question: Optional[str] = None
    security_answer: Optional[str] = None

class LoginRequest(BaseModel):
    username: str
    password: str

class ForgotPasswordRequest(BaseModel):
    username: str
    security_answer: str
    new_password: str

class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    picture: Optional[str] = None

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

class CreateUniformRequest(BaseModel):
    name: str
    size: str
    quantity: int

class UpdateUniformRequest(BaseModel):
    name: Optional[str] = None
    size: Optional[str] = None
    quantity: Optional[int] = None

class AssignUniformRequest(BaseModel):
    user_id: str
    uniform_id: str

class AssignTagRequest(BaseModel):
    user_id: str
    tag: str

class AssignBadgeRequest(BaseModel):
    user_id: str
    badge: str  # bronze, silver, gold

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str

class SimpleResetPasswordRequest(BaseModel):
    username: str
    new_password: str
    confirm_password: str

class ResetPasswordRequest(BaseModel):
    user_id: str
    new_password: str

# ============= AUTHENTICATION HELPERS =============

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    """Verify a password against a hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

async def get_current_user(
    request: Request,
    session_token: Optional[str] = Cookie(None)
) -> User:
    """Get current authenticated user from session_token cookie or Authorization header"""
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
        {"_id": 0, "password_hash": 0}
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

@api_router.post("/auth/signup")
async def signup(signup_data: SignupRequest):
    """Register a new user"""
    # Check if username already exists
    existing_user = await db.users.find_one({"username": signup_data.username})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    # Create new user
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    password_hash = hash_password(signup_data.password)
    
    # Hash security answer if provided
    security_answer_hash = None
    if signup_data.security_answer:
        security_answer_hash = hash_password(signup_data.security_answer.lower().strip())
    
    new_user = {
        "user_id": user_id,
        "username": signup_data.username,
        "password_hash": password_hash,
        "name": signup_data.name,
        "phone": signup_data.phone,
        "picture": None,
        "role": "member",
        "tag": None,
        "security_question": signup_data.security_question,
        "security_answer_hash": security_answer_hash,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.users.insert_one(new_user)
    
    return {"message": "User created successfully", "user_id": user_id}

@api_router.post("/auth/login")
async def login(login_data: LoginRequest, response: Response):
    """Login with username and password"""
    # Find user
    user_doc = await db.users.find_one({"username": login_data.username})
    
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    # Verify password
    if not verify_password(login_data.password, user_doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    # Create session
    session_token = f"session_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    new_session = UserSession(
        user_id=user_doc["user_id"],
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
    
    # Return user data (without password hash)
    user_data = {k: v for k, v in user_doc.items() if k not in ["_id", "password_hash"]}
    
    return {
        "user": user_data,
        "session_token": session_token
    }

@api_router.get("/auth/me")
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user info"""
    return current_user

@api_router.post("/auth/logout")
async def logout(response: Response, request: Request, session_token: Optional[str] = Cookie(None)):
    """Logout user"""
    token = session_token
    
    # Also check Authorization header
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.replace("Bearer ", "")
    
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    
    # Clear cookie
    response.delete_cookie(key="session_token", path="/", samesite="none")
    
    return {"message": "Logged out successfully"}

@api_router.post("/auth/change-password")
async def change_password(
    password_data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user)
):
    """Change password for logged-in user"""
    # Get user with password hash
    user_doc = await db.users.find_one({"user_id": current_user.user_id})
    
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify old password
    if not verify_password(password_data.old_password, user_doc["password_hash"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Validate new password
    if len(password_data.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
    
    # Hash and update new password
    new_password_hash = hash_password(password_data.new_password)
    await db.users.update_one(
        {"user_id": current_user.user_id},
        {"$set": {"password_hash": new_password_hash}}
    )
    
    return {"message": "Password changed successfully"}

@api_router.post("/auth/simple-reset-password")
async def simple_reset_password(reset_data: SimpleResetPasswordRequest):
    """Simple password reset - just username and new password"""
    # Find user
    user_doc = await db.users.find_one({"username": reset_data.username})
    
    if not user_doc:
        raise HTTPException(status_code=404, detail="Username not found")
    
    # Validate passwords match
    if reset_data.new_password != reset_data.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
    
    # Validate new password
    if len(reset_data.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
    
    # Hash and update new password
    new_password_hash = hash_password(reset_data.new_password)
    await db.users.update_one(
        {"user_id": user_doc["user_id"]},
        {"$set": {"password_hash": new_password_hash}}
    )
    
    # Invalidate all sessions for this user
    await db.user_sessions.delete_many({"user_id": user_doc["user_id"]})
    
    return {"message": "Password reset successfully. Please login with your new password"}

@api_router.get("/auth/forgot-password")
async def forgot_password(forgot_data: ForgotPasswordRequest):
    """Reset password using security answer"""
    # Find user
    user_doc = await db.users.find_one({"username": forgot_data.username})
    
    if not user_doc:
        raise HTTPException(status_code=404, detail="Username not found")
    
    # Check if user has security question set
    if not user_doc.get("security_answer_hash"):
        raise HTTPException(
            status_code=400, 
            detail="No security question set. Please contact admin to reset your password"
        )
    
    # Verify security answer
    answer_to_verify = forgot_data.security_answer.lower().strip()
    if not verify_password(answer_to_verify, user_doc["security_answer_hash"]):
        raise HTTPException(status_code=400, detail="Incorrect security answer")
    
    # Validate new password
    if len(forgot_data.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
    
    # Hash and update new password
    new_password_hash = hash_password(forgot_data.new_password)
    await db.users.update_one(
        {"user_id": user_doc["user_id"]},
        {"$set": {"password_hash": new_password_hash}}
    )
    
    # Invalidate all sessions for this user
    await db.user_sessions.delete_many({"user_id": user_doc["user_id"]})
    
    return {"message": "Password reset successfully. Please login with your new password"}

@api_router.get("/auth/check-security-question/{username}")
async def check_security_question(username: str):
    """Check if user has security question set"""
    user_doc = await db.users.find_one({"username": username})
    
    if not user_doc:
        raise HTTPException(status_code=404, detail="Username not found")
    
    has_security_question = bool(user_doc.get("security_question"))
    
    return {
        "has_security_question": has_security_question,
        "security_question": user_doc.get("security_question") if has_security_question else None,
        "message": "Contact admin to reset password" if not has_security_question else None
    }

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
    user_doc = await db.users.find_one(
        {"user_id": current_user.user_id},
        {"_id": 0, "password_hash": 0}
    )
    return User(**user_doc)

@api_router.get("/users")
async def get_all_users(current_user: User = Depends(get_current_user)):
    """Get all users"""
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    return users

# ============= ATTENDANCE ENDPOINTS =============

@api_router.post("/attendance")
async def mark_attendance(
    attendance: MarkAttendanceRequest,
    admin: User = Depends(require_admin)
):
    """Mark attendance (admin only)"""
    existing = await db.attendance.find_one({
        "user_id": attendance.user_id,
        "attendance_type": attendance.attendance_type,
        "date": attendance.date
    })
    
    if existing:
        await db.attendance.update_one(
            {"attendance_id": existing["attendance_id"]},
            {"$set": {
                "status": attendance.status,
                "marked_by": admin.user_id
            }}
        )
        return {"message": "Attendance updated"}
    else:
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
    """Get user's own attendance"""
    query = {
        "user_id": current_user.user_id,
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

@api_router.delete("/attendance/{attendance_id}")
async def delete_attendance(
    attendance_id: str,
    admin: User = Depends(require_admin)
):
    """Delete attendance record (admin only)"""
    result = await db.attendance.delete_one({"attendance_id": attendance_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    
    return {"message": "Attendance record deleted successfully"}

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

@api_router.delete("/fees/{fee_id}")
async def delete_fee(
    fee_id: str,
    admin: User = Depends(require_admin)
):
    """Delete fee record (admin only)"""
    result = await db.fees.delete_one({"fee_id": fee_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Fee record not found")
    
    return {"message": "Fee record deleted successfully"}

@api_router.post("/admin/generate-fees/{month}")
async def generate_monthly_fees(
    month: str,
    amount: float,
    admin: User = Depends(require_admin)
):
    """Generate fee records for all members"""
    users = await db.users.find({"role": "member"}, {"_id": 0}).to_list(1000)
    
    created_count = 0
    for user in users:
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

# ============= UNIFORM ENDPOINTS =============

@api_router.post("/uniforms")
async def create_uniform_item(
    uniform_data: CreateUniformRequest,
    admin: User = Depends(require_admin)
):
    """Create uniform item (admin only)"""
    new_uniform = UniformItem(
        name=uniform_data.name,
        size=uniform_data.size,
        quantity=uniform_data.quantity,
        added_by=admin.user_id
    )
    await db.uniforms.insert_one(new_uniform.dict())
    return new_uniform

@api_router.get("/uniforms")
async def get_uniforms(current_user: User = Depends(get_current_user)):
    """Get all uniform items"""
    uniforms = await db.uniforms.find({}, {"_id": 0}).to_list(1000)
    return uniforms

@api_router.put("/uniforms/{uniform_id}")
async def update_uniform_item(
    uniform_id: str,
    update_data: UpdateUniformRequest,
    admin: User = Depends(require_admin)
):
    """Update uniform item (admin only)"""
    update_dict = {"updated_at": datetime.now(timezone.utc)}
    
    if update_data.name:
        update_dict["name"] = update_data.name
    if update_data.size:
        update_dict["size"] = update_data.size
    if update_data.quantity is not None:
        update_dict["quantity"] = update_data.quantity
    
    await db.uniforms.update_one(
        {"uniform_id": uniform_id},
        {"$set": update_dict}
    )
    
    return {"message": "Uniform updated"}

@api_router.delete("/uniforms/{uniform_id}")
async def delete_uniform_item(
    uniform_id: str,
    admin: User = Depends(require_admin)
):
    """Delete uniform item (admin only)"""
    await db.uniforms.delete_one({"uniform_id": uniform_id})
    await db.user_uniforms.delete_many({"uniform_id": uniform_id})
    return {"message": "Uniform deleted"}

@api_router.get("/uniforms/my")
async def get_my_uniforms(current_user: User = Depends(get_current_user)):
    """Get user's assigned uniforms"""
    user_uniforms = await db.user_uniforms.find(
        {"user_id": current_user.user_id},
        {"_id": 0}
    ).to_list(1000)
    
    # Get full uniform details
    result = []
    for uu in user_uniforms:
        uniform = await db.uniforms.find_one(
            {"uniform_id": uu["uniform_id"]},
            {"_id": 0}
        )
        if uniform:
            result.append({
                "user_uniform_id": uu["user_uniform_id"],
                "uniform": uniform,
                "assigned_date": uu["assigned_date"]
            })
    
    return result

@api_router.post("/uniforms/assign")
async def assign_uniform(
    assign_data: AssignUniformRequest,
    admin: User = Depends(require_admin)
):
    """Assign uniform to user (admin only)"""
    # Check if already assigned
    existing = await db.user_uniforms.find_one({
        "user_id": assign_data.user_id,
        "uniform_id": assign_data.uniform_id
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Uniform already assigned to this user")
    
    new_assignment = UserUniform(
        user_id=assign_data.user_id,
        uniform_id=assign_data.uniform_id,
        assigned_date=datetime.now(timezone.utc).strftime("%Y-%m-%d")
    )
    await db.user_uniforms.insert_one(new_assignment.dict())
    
    return {"message": "Uniform assigned successfully"}

@api_router.delete("/uniforms/unassign/{user_uniform_id}")
async def unassign_uniform(
    user_uniform_id: str,
    admin: User = Depends(require_admin)
):
    """Unassign uniform from user (admin only)"""
    await db.user_uniforms.delete_one({"user_uniform_id": user_uniform_id})
    return {"message": "Uniform unassigned"}

@api_router.get("/uniforms/user/{user_id}")
async def get_user_uniforms(
    user_id: str,
    admin: User = Depends(require_admin)
):
    """Get user's assigned uniforms (admin only)"""
    user_uniforms = await db.user_uniforms.find(
        {"user_id": user_id},
        {"_id": 0}
    ).to_list(1000)
    
    result = []
    for uu in user_uniforms:
        uniform = await db.uniforms.find_one(
            {"uniform_id": uu["uniform_id"]},
            {"_id": 0}
        )
        if uniform:
            result.append({
                "user_uniform_id": uu["user_uniform_id"],
                "uniform": uniform,
                "assigned_date": uu["assigned_date"]
            })
    
    return result

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

@api_router.post("/admin/assign-badge")
async def assign_badge(
    badge_data: AssignBadgeRequest,
    admin: User = Depends(require_admin)
):
    """Assign badge to user (admin only)"""
    await db.users.update_one(
        {"user_id": badge_data.user_id},
        {"$set": {"badge": badge_data.badge}}
    )
    return {"message": "Badge assigned successfully"}

@api_router.delete("/admin/delete-user/{user_id}")
async def delete_user(
    user_id: str,
    admin: User = Depends(require_admin)
):
    """Delete a user (admin only)"""
    # Prevent admin from deleting themselves
    if user_id == admin.user_id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    # Delete user
    result = await db.users.delete_one({"user_id": user_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Clean up related data
    await db.user_sessions.delete_many({"user_id": user_id})
    await db.attendance.delete_many({"user_id": user_id})
    await db.fees.delete_many({"user_id": user_id})
    await db.user_uniforms.delete_many({"user_id": user_id})
    
    return {"message": "User deleted successfully"}

@api_router.get("/admin/user-profile/{user_id}")
async def get_user_profile(
    user_id: str,
    admin: User = Depends(require_admin)
):
    """Get detailed user profile (admin only)"""
    user_doc = await db.users.find_one(
        {"user_id": user_id},
        {"_id": 0, "password_hash": 0}
    )
    
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get user's attendance stats
    practice_attendance = await db.attendance.find({
        "user_id": user_id,
        "attendance_type": "practice"
    }, {"_id": 0}).to_list(1000)
    
    khidmat_attendance = await db.attendance.find({
        "user_id": user_id,
        "attendance_type": "khidmat"
    }, {"_id": 0}).to_list(1000)
    
    # Get user's fees
    fees = await db.fees.find(
        {"user_id": user_id},
        {"_id": 0}
    ).to_list(1000)
    
    # Get user's uniforms
    user_uniforms = await db.user_uniforms.find(
        {"user_id": user_id},
        {"_id": 0}
    ).to_list(1000)
    
    uniforms = []
    for uu in user_uniforms:
        uniform = await db.uniforms.find_one(
            {"uniform_id": uu["uniform_id"]},
            {"_id": 0}
        )
        if uniform:
            uniforms.append({
                "user_uniform_id": uu["user_uniform_id"],
                "uniform": uniform,
                "assigned_date": uu["assigned_date"]
            })
    
    practice_total = len(practice_attendance)
    practice_present = len([r for r in practice_attendance if r["status"] == "present"])
    practice_percentage = (practice_present / practice_total * 100) if practice_total > 0 else 0
    
    khidmat_total = len(khidmat_attendance)
    khidmat_present = len([r for r in khidmat_attendance if r["status"] == "present"])
    khidmat_percentage = (khidmat_present / khidmat_total * 100) if khidmat_total > 0 else 0
    
    total_due = sum(f["amount"] for f in fees if f["status"] == "due")
    total_paid = sum(f["amount"] for f in fees if f["status"] == "paid")
    
    return {
        "user": user_doc,
        "attendance": {
            "practice": {
                "total": practice_total,
                "present": practice_present,
                "percentage": round(practice_percentage, 2)
            },
            "khidmat": {
                "total": khidmat_total,
                "present": khidmat_present,
                "percentage": round(khidmat_percentage, 2)
            }
        },
        "fees": {
            "records": fees,
            "total_due": total_due,
            "total_paid": total_paid
        },
        "uniforms": uniforms
    }

@api_router.post("/admin/reset-password")
async def admin_reset_password(
    reset_data: ResetPasswordRequest,
    admin: User = Depends(require_admin)
):
    """Admin reset member password (admin only)"""
    # Validate new password
    if len(reset_data.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
    
    # Get user
    user_doc = await db.users.find_one({"user_id": reset_data.user_id})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Hash and update new password
    new_password_hash = hash_password(reset_data.new_password)
    await db.users.update_one(
        {"user_id": reset_data.user_id},
        {"$set": {"password_hash": new_password_hash}}
    )
    
    # Invalidate all sessions for this user
    await db.user_sessions.delete_many({"user_id": reset_data.user_id})
    
    return {"message": "Password reset successfully"}

# ============= STARTUP - CREATE ADMIN =============

@app.on_event("startup")
async def create_admin():
    """Create admin user if not exists"""
    admin_username = "vajihiadmin@53"
    admin_password = "vajihiscout53"
    
    existing_admin = await db.users.find_one({"username": admin_username})
    
    if not existing_admin:
        admin_id = f"admin_{uuid.uuid4().hex[:12]}"
        password_hash = hash_password(admin_password)
        
        admin_user = {
            "user_id": admin_id,
            "username": admin_username,
            "password_hash": password_hash,
            "name": "Vajihi Admin",
            "phone": None,
            "picture": None,
            "role": "admin",
            "tag": None,
            "created_at": datetime.now(timezone.utc)
        }
        
        await db.users.insert_one(admin_user)
        logger.info(f"Admin user created: {admin_username}")

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
