from fastapi import (
    FastAPI,
    APIRouter,
    HTTPException,
    Cookie,
    Response,
    Request,
    Depends,
    Query,
)
from fastapi.responses import FileResponse

from exports.attendance_export import generate_attendance_excel
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
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
import requests
import random

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# MongoDB connection
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# ============= MODELS =============


class UserPermissions(BaseModel):
    attendance: bool = False
    inventory: bool = False
    fees: bool = False
    uniforms: bool = False
    members: bool = False


class User(BaseModel):
    user_id: str
    username: str
    its_no: Optional[str] = None
    name: str
    phone: Optional[str] = None
    email_id: Optional[str] = None
    picture: Optional[str] = None

    age: Optional[str] = None
    birth_date: Optional[str] = None
    parent_contact: Optional[str] = None
    instrument: Optional[str] = None
    joining_year: Optional[str] = None

    role: str = "member"

    permissions: UserPermissions = Field(default_factory=UserPermissions)

    tag: Optional[str] = None
    badge: Optional[str] = None

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class UserSession(BaseModel):
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class AttendanceRecord(BaseModel):
    attendance_id: str = Field(default_factory=lambda: f"att_{uuid.uuid4().hex[:12]}")

    user_id: str

    attendance_type: str

    event_name: Optional[str] = None

    date: str

    status: str

    marked_by: str

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class SavePushTokenRequest(BaseModel):
    expo_push_token: str


class NotificationRecord(BaseModel):

    notification_id: str = Field(
        default_factory=lambda: f"notif_{uuid.uuid4().hex[:12]}"
    )

    user_id: str

    title: str

    message: str

    is_read: bool = False

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
    its_no: str
    password: str
    name: str
    phone: str
    email_id: str
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
    its_no: Optional[str] = None
    name: Optional[str] = None
    phone: Optional[str] = None
    picture: Optional[str] = None
    email_id: Optional[str] = None
    age: Optional[str] = None
    birth_date: Optional[str] = None
    parent_contact: Optional[str] = None
    instrument: Optional[str] = None
    joining_year: Optional[str] = None


class MarkAttendanceRequest(BaseModel):
    user_id: str
    attendance_type: str
    event_name: Optional[str] = None
    date: str
    status: str


class BulkAttendanceItem(BaseModel):
    user_id: str
    status: str


class BulkAttendanceRequest(BaseModel):
    attendance_type: str

    event_name: Optional[str] = None

    date: str

    records: List[BulkAttendanceItem]


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


class UpdatePermissionsRequest(BaseModel):
    user_id: str
    permissions: UserPermissions


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


class SendOTPRequest(BaseModel):
    username: str


class VerifyOTPRequest(BaseModel):
    username: str
    otp: str


class CompleteResetPasswordRequest(BaseModel):
    username: str
    otp: str
    new_password: str


class PasswordResetOTP(BaseModel):
    otp_id: str = Field(default_factory=lambda: f"otp_{uuid.uuid4().hex[:12]}")
    user_id: str
    email: str
    otp: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ============= NOTIFICATION HELPERS =============


async def send_push_notification(
    expo_push_token: str,
    title: str,
    body: str,
):
    try:
        requests.post(
            "https://exp.host/--/api/v2/push/send",
            headers={
                "Accept": "application/json",
                "Accept-Encoding": "gzip, deflate",
                "Content-Type": "application/json",
            },
            json={
                "to": expo_push_token,
                "title": title,
                "body": body,
                "sound": "default",
            },
            timeout=10,
        )
    except Exception as e:
        logger.error(f"Push notification failed: {e}")


async def cleanup_old_notifications():

    twelve_hours_ago = datetime.now(timezone.utc) - timedelta(hours=12)

    result = await db.notifications.delete_many(
        {"created_at": {"$lt": twelve_hours_ago}}
    )

    logger.info(f"Deleted {result.deleted_count} old notifications")


async def send_email(
    to_email: str,
    subject: str,
    body: str,
):
    try:

        smtp_email = os.getenv("SMTP_EMAIL")
        smtp_password = os.getenv("SMTP_PASSWORD")

        message = MIMEMultipart()

        message["From"] = smtp_email
        message["To"] = to_email
        message["Subject"] = subject

        message.attach(MIMEText(body, "plain"))

        server = smtplib.SMTP("smtp.gmail.com", 587)

        server.starttls()

        server.login(smtp_email, smtp_password)

        server.send_message(message)

        server.quit()

        return True

    except Exception as e:

        logger.error(f"Email failed: {e}")

        return False


async def send_reset_otp_email(
    recipient_email: str,
    otp: str,
):
    subject = "Vajihi Scout Password Reset OTP"

    body = f"""
Your password reset OTP is:

{otp}

This OTP will expire in 10 minutes.

If you did not request a password reset, please ignore this email.

Vajihi Scout Mumbra
"""

    return await send_email(
        recipient_email,
        subject,
        body,
    )


# ============= AUTHENTICATION HELPERS =============


def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    """Verify a password against a hash"""
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))


async def get_current_user(
    request: Request, session_token: Optional[str] = Cookie(None)
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
    session_doc = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})

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
        {"user_id": session_doc["user_id"]}, {"_id": 0, "password_hash": 0}
    )

    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")

    return User(**user_doc)


async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Require admin role"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


async def require_permission(permission_name: str, current_user: User):

    # ADMIN ALWAYS ALLOWED
    if current_user.role == "admin":
        return True

    # CHECK CUSTOM PERMISSIONS
    permissions = current_user.permissions

    # Handle dict permissions
    if isinstance(permissions, dict):

        if permissions.get(permission_name):
            return True

    # Handle Pydantic model permissions
    else:

        if getattr(permissions, permission_name, False):
            return True

    raise HTTPException(
        status_code=403, detail=f"{permission_name} permission required"
    )


# ============= AUTH ENDPOINTS =============


@api_router.get("/auth/test-email")
async def test_email():

    success = await send_email(
        "vajihiscoutmumbra@gmail.com",
        "Vajihi Scout Test",
        "Email system working successfully.",
    )

    return {"success": success}


@api_router.post("/auth/signup")
async def signup(signup_data: SignupRequest):
    """Register a new user"""
    # Check if username already exists
    existing_user = await db.users.find_one(
        {"$or": [{"its_no": signup_data.its_no}, {"username": signup_data.its_no}]}
    )
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")

    # Create new user
    user_id = f"user_{uuid.uuid4().hex[:12]}"

    password_hash = hash_password(signup_data.password)

    # Hash security answer if provided
    security_answer_hash = None

    if signup_data.security_answer:

        security_answer_hash = hash_password(
            signup_data.security_answer.lower().strip()
        )

    # AUTO ADMIN CHECK

    new_user = {
        "user_id": user_id,
        "its_no": signup_data.its_no,
        "username": signup_data.its_no,
        "password_hash": password_hash,
        "name": signup_data.name,
        "phone": signup_data.phone,
        "email_id": signup_data.email_id,
        "picture": None,
        "role": "member",
        "permissions": {
            "attendance": False,
            "inventory": False,
            "fees": False,
            "uniforms": False,
            "members": False,
        },
        "tag": None,
        "expo_push_token": None,
        "security_question": signup_data.security_question,
        "security_answer_hash": security_answer_hash,
        "created_at": datetime.now(timezone.utc),
    }

    await db.users.insert_one(new_user)

    notification = NotificationRecord(
        user_id=user_id,
        title="Welcome",
        message="Welcome to Vajihi Scout. Your account has been created successfully.",
    )

    await db.notifications.insert_one(notification.dict())

    return {"message": "User created successfully", "user_id": user_id}


@api_router.post("/notifications/register-token")
async def register_push_token(
    data: SavePushTokenRequest,
    current_user: User = Depends(get_current_user),
):
    await db.users.update_one(
        {"user_id": current_user.user_id},
        {"$set": {"expo_push_token": data.expo_push_token}},
    )

    return {"message": "Push token saved"}


@api_router.post("/auth/login")
async def login(login_data: LoginRequest, response: Response):
    """Login with ITS and password"""
    # Find user
    user_doc = await db.users.find_one(
        {"$or": [{"username": login_data.username}, {"its_no": login_data.username}]}
    )

    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    # Verify password
    if not verify_password(login_data.password, user_doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    # Create session
    session_token = f"session_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)

    new_session = UserSession(
        user_id=user_doc["user_id"], session_token=session_token, expires_at=expires_at
    )
    await db.user_sessions.insert_one(new_session.dict())

    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=7 * 24 * 60 * 60,
        path="/",
    )

    # Return user data (without password hash)

    return {
        "user": {
            "user_id": user_doc["user_id"],
            "username": user_doc.get("username"),
            "its_no": user_doc.get("its_no"),
            "name": user_doc["name"],
            "phone": user_doc.get("phone"),
            "email_id": user_doc.get("email_id"),
            "picture": user_doc.get("picture"),
            "role": user_doc["role"],
            "permissions": user_doc.get("permissions", {}),
            "tag": user_doc.get("tag"),
            "created_at": user_doc["created_at"],
        },
        "session_token": session_token,
    }


@api_router.get("/auth/me")
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user info"""
    return current_user


@api_router.post("/auth/logout")
async def logout(
    response: Response, request: Request, session_token: Optional[str] = Cookie(None)
):
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
    response.delete_cookie(key="session_token", path="/", samesite="lax")

    return {"message": "Logged out successfully"}


@api_router.post("/auth/change-password")
async def change_password(
    password_data: ChangePasswordRequest, current_user: User = Depends(get_current_user)
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
        raise HTTPException(
            status_code=400, detail="New password must be at least 6 characters"
        )

    # Hash and update new password
    new_password_hash = hash_password(password_data.new_password)
    await db.users.update_one(
        {"user_id": current_user.user_id},
        {"$set": {"password_hash": new_password_hash}},
    )

    return {"message": "Password changed successfully"}


@api_router.post("/auth/send-reset-otp")
async def send_reset_otp(data: SendOTPRequest):

    user = await db.users.find_one({"username": data.username})

    if not user:
        raise HTTPException(status_code=404, detail="Invalid username or OTP")

    email = user.get("email_id")

    if not email:
        raise HTTPException(status_code=400, detail="Email not found for this account")

    otp = str(random.randint(100000, 999999))

    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

    await db.password_reset_otps.delete_many({"user_id": user["user_id"]})

    await db.password_reset_otps.insert_one(
        {
            "user_id": user["user_id"],
            "email": email,
            "otp": otp,
            "expires_at": expires_at,
            "created_at": datetime.now(timezone.utc),
        }
    )

    email_sent = await send_reset_otp_email(
        email,
        otp,
    )

    if not email_sent:
        raise HTTPException(status_code=500, detail="Failed to send OTP email")

    return {"message": "OTP sent successfully"}


@api_router.post("/auth/verify-reset-otp")
async def verify_reset_otp(data: VerifyOTPRequest):

    user = await db.users.find_one({"username": data.username})

    if not user:
        raise HTTPException(status_code=404, detail="Invalid username or OTP")

    otp_doc = await db.password_reset_otps.find_one(
        {
            "user_id": user["user_id"],
            "otp": data.otp,
        }
    )

    if not otp_doc:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    expires_at = otp_doc["expires_at"]

    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="OTP expired")

    return {"verified": True, "message": "OTP verified successfully"}


@api_router.post("/auth/reset-password-with-otp")
async def reset_password_with_otp(data: CompleteResetPasswordRequest):

    user = await db.users.find_one({"username": data.username})
    if data.new_password.strip() == "":
        raise HTTPException(status_code=400, detail="Password cannot be empty")

    if not user:
        raise HTTPException(status_code=404, detail="Invalid username or OTP")

    otp_doc = await db.password_reset_otps.find_one(
        {
            "user_id": user["user_id"],
            "otp": data.otp,
        }
    )

    if not otp_doc:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    expires_at = otp_doc["expires_at"]

    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="OTP expired")

    if len(data.new_password) < 6:
        raise HTTPException(
            status_code=400, detail="Password must be at least 6 characters"
        )

    password_hash = hash_password(data.new_password)

    await db.users.update_one(
        {"user_id": user["user_id"]}, {"$set": {"password_hash": password_hash}}
    )

    await db.user_sessions.delete_many({"user_id": user["user_id"]})

    await db.password_reset_otps.delete_many({"user_id": user["user_id"]})

    return {"message": "Password reset successfully"}


# ============= USER/PROFILE ENDPOINTS =============


@api_router.put("/profile")
async def update_profile(
    update_data: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
):
    """Update user profile"""

    update_dict = {}

    # CHECK ITS NUMBER DUPLICATE
    existing = None

    if update_data.its_no:

        existing = await db.users.find_one(
            {
                "its_no": update_data.its_no,
                "user_id": {"$ne": current_user.user_id},
            }
        )

        if existing:
            raise HTTPException(
                status_code=400,
                detail="ITS Number already exists",
            )

        update_dict["its_no"] = update_data.its_no
        update_dict["username"] = update_data.its_no

    # OTHER PROFILE FIELDS

    if update_data.name:
        update_dict["name"] = update_data.name

    if update_data.phone:
        update_dict["phone"] = update_data.phone

    if update_data.picture:
        update_dict["picture"] = update_data.picture

    if update_data.email_id:
        update_dict["email_id"] = update_data.email_id

    if update_data.age:
        update_dict["age"] = update_data.age

    if update_data.birth_date:
        update_dict["birth_date"] = update_data.birth_date

    if update_data.parent_contact:
        update_dict["parent_contact"] = update_data.parent_contact

    if update_data.instrument:
        update_dict["instrument"] = update_data.instrument

    if update_data.joining_year:
        update_dict["joining_year"] = update_data.joining_year

    # UPDATE DATABASE
    if update_dict:

        await db.users.update_one(
            {"user_id": current_user.user_id},
            {"$set": update_dict},
        )

        # RETURN UPDATED USER

    user_doc = await db.users.find_one(
        {"user_id": current_user.user_id},
        {"_id": 0, "password_hash": 0},
    )

    notification = NotificationRecord(
        user_id=current_user.user_id,
        title="Profile Updated",
        message="Your profile information was updated successfully",
    )

    await db.notifications.insert_one(notification.dict())

    return User(**user_doc)


@api_router.get("/users")
async def get_all_users(current_user: User = Depends(get_current_user)):
    """Get all users"""
    await require_permission("members", current_user)

    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)

    return users


@api_router.get("/attendance/members")
async def get_attendance_members(current_user: User = Depends(get_current_user)):

    members = await db.users.find(
        {"role": {"$ne": "admin"}},
        {
            "_id": 0,
            "user_id": 1,
            "name": 1,
            "role": 1,
            "instrument": 1,
            "picture": 1,
            "permissions": 1,
        },
    ).to_list(1000)

    return members


# ============= ATTENDANCE ENDPOINTS =============


@api_router.post("/attendance")
async def mark_attendance(
    attendance: MarkAttendanceRequest, current_user: User = Depends(get_current_user)
):
    """Mark attendance (single member)"""

    await require_permission("attendance", current_user)

    existing = await db.attendance.find_one(
        {
            "user_id": attendance.user_id,
            "attendance_type": attendance.attendance_type,
            "event_name": attendance.event_name,
            "date": attendance.date,
        }
    )

    if existing:

        await db.attendance.update_one(
            {"attendance_id": existing["attendance_id"]},
            {"$set": {"status": attendance.status, "marked_by": current_user.user_id}},
        )

        return {"message": "Attendance updated"}

    else:

        new_attendance = AttendanceRecord(
            user_id=attendance.user_id,
            attendance_type=attendance.attendance_type,
            event_name=attendance.event_name,
            date=attendance.date,
            status=attendance.status,
            marked_by=current_user.user_id,
        )

        await db.attendance.insert_one(new_attendance.dict())

        return {"message": "Attendance marked"}


@api_router.post("/attendance/bulk")
async def mark_bulk_attendance(
    data: BulkAttendanceRequest,
    current_user: User = Depends(get_current_user),
):
    """Bulk attendance save"""

    await require_permission("attendance", current_user)

    saved = 0

    for record in data.records:

        existing = await db.attendance.find_one(
            {
                "user_id": record.user_id,
                "attendance_type": data.attendance_type,
                "event_name": data.event_name,
                "date": data.date,
            }
        )

        if existing:

            await db.attendance.update_one(
                {"attendance_id": existing["attendance_id"]},
                {
                    "$set": {
                        "status": record.status,
                        "marked_by": current_user.user_id,
                        "event_name": data.event_name,
                    }
                },
            )

        else:

            attendance = AttendanceRecord(
                user_id=record.user_id,
                attendance_type=data.attendance_type,
                event_name=data.event_name,
                date=data.date,
                status=record.status,
                marked_by=current_user.user_id,
            )

            await db.attendance.insert_one(attendance.dict())

        # Save notification in database
        notification = NotificationRecord(
            user_id=record.user_id,
            title="Attendance Updated",
            message=f"Your {data.attendance_type} attendance for {data.date} marked {record.status}",
        )

        await db.notifications.insert_one(notification.dict())

        # Send push notification
        user = await db.users.find_one({"user_id": record.user_id})

        if user and user.get("expo_push_token"):
            await send_push_notification(
                user["expo_push_token"],
                "Attendance Updated",
                f"Your {data.attendance_type} attendance for {data.date} marked {record.status}",
            )

        saved += 1

    return {
        "message": "Attendance saved successfully",
        "saved_count": saved,
    }


@api_router.get("/notifications/my")
async def get_my_notifications(current_user: User = Depends(get_current_user)):

    notifications = (
        await db.notifications.find(
            {"user_id": current_user.user_id},
            {"_id": 0},
        )
        .sort("created_at", -1)
        .to_list(100)
    )

    for notification in notifications:

        created_at = notification.get("created_at")

        if isinstance(created_at, datetime):

            if created_at.tzinfo is None:
                created_at = created_at.replace(tzinfo=timezone.utc)

            notification["created_at"] = created_at.isoformat().replace("+00:00", "Z")

    return notifications


@api_router.put("/notifications/read-all")
async def mark_notifications_read(current_user: User = Depends(get_current_user)):

    result = await db.notifications.update_many(
        {
            "user_id": current_user.user_id,
            "is_read": False,
        },
        {
            "$set": {
                "is_read": True,
            }
        },
    )

    return {"message": "Notifications marked as read", "updated": result.modified_count}


@api_router.put("/notifications/read/{notification_id}")
async def mark_notification_read(
    notification_id: str,
    current_user: User = Depends(get_current_user),
):

    await db.notifications.update_one(
        {
            "notification_id": notification_id,
            "user_id": current_user.user_id,
        },
        {"$set": {"is_read": True}},
    )

    return {"message": "Notification marked as read"}


@api_router.get("/notifications/unread-count")
async def get_unread_count(current_user: User = Depends(get_current_user)):

    count = await db.notifications.count_documents(
        {
            "user_id": current_user.user_id,
            "is_read": False,
        }
    )

    return {"count": count}


@api_router.get("/attendance/my/{attendance_type}")
async def get_my_attendance(
    attendance_type: str,
    month: Optional[str] = None,
    current_user: User = Depends(get_current_user),
):
    """Get user's own attendance"""

    query = {"user_id": current_user.user_id, "attendance_type": attendance_type}

    if month:
        query["date"] = {"$regex": f"^{month}"}

    records = await db.attendance.find(query, {"_id": 0}).to_list(1000)

    total = len(records)

    present = len([r for r in records if r["status"] == "present"])

    absent = len([r for r in records if r["status"] == "absent"])

    percentage = (present / total * 100) if total > 0 else 0

    return {
        "records": records,
        "total": total,
        "present": present,
        "absent": absent,
        "percentage": round(percentage, 2),
    }


@api_router.get("/attendance/my-history/{attendance_type}")
async def get_my_attendance_history(
    attendance_type: str, current_user: User = Depends(get_current_user)
):

    records = (
        await db.attendance.find(
            {
                "user_id": current_user.user_id,
                "attendance_type": attendance_type,
            },
            {
                "_id": 0,
                "date": 1,
                "status": 1,
                "event_name": 1,
            },
        )
        .sort("date", -1)
        .to_list(5000)
    )

    result = []

    for record in records:

        result.append(
            {
                "date": record["date"],
                "attendance_type": attendance_type,
                "event_name": record.get("event_name"),
                "present": 1 if record["status"] == "present" else 0,
                "absent": 1 if record["status"] == "absent" else 0,
                "my_status": record["status"],
            }
        )
    return result


@api_router.get("/attendance/my-stats/{attendance_type}")
async def get_my_attendance_stats(
    attendance_type: str, current_user: User = Depends(get_current_user)
):
    """Get attendance stats for current logged-in user"""

    records = await db.attendance.find(
        {
            "user_id": current_user.user_id,
            "attendance_type": attendance_type,
        },
        {"_id": 0},
    ).to_list(5000)

    present = len([r for r in records if r["status"] == "present"])

    absent = len([r for r in records if r["status"] == "absent"])

    total = present + absent

    percentage = round((present / total) * 100) if total > 0 else 0

    return {
        "present": present,
        "absent": absent,
        "total": total,
        "percentage": percentage,
    }


@api_router.get("/attendance/user/{user_id}/{attendance_type}")
async def get_user_attendance(
    user_id: str,
    attendance_type: str,
    month: Optional[str] = None,
    current_user: User = Depends(get_current_user),
):
    """Get specific user's attendance"""

    await require_permission("attendance", current_user)

    query = {"user_id": user_id, "attendance_type": attendance_type}

    if month:
        query["date"] = {"$regex": f"^{month}"}

    records = await db.attendance.find(query, {"_id": 0}).to_list(1000)

    total = len(records)

    present = len([r for r in records if r["status"] == "present"])

    absent = len([r for r in records if r["status"] == "absent"])

    percentage = (present / total * 100) if total > 0 else 0

    return {
        "records": records,
        "total": total,
        "present": present,
        "absent": absent,
        "percentage": round(percentage, 2),
    }


@api_router.delete("/attendance/{attendance_id}")
async def delete_attendance(attendance_id: str, admin: User = Depends(require_admin)):
    """Delete attendance record"""

    result = await db.attendance.delete_one({"attendance_id": attendance_id})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Attendance record not found")

    return {"message": "Attendance record deleted successfully"}


@api_router.delete("/attendance/session/{attendance_type}/{date}")
async def delete_attendance_session(
    attendance_type: str,
    date: str,
    event_name: Optional[str] = Query(None),
    admin: User = Depends(require_admin),
):

    query = {
        "attendance_type": attendance_type,
        "date": date,
    }

    if event_name:
        query["event_name"] = event_name

    result = await db.attendance.delete_many(query)

    return {"message": f"Deleted {result.deleted_count} attendance records"}


@api_router.get("/attendance/dates/{attendance_type}")
async def get_attendance_dates(
    attendance_type: str, current_user: User = Depends(get_current_user)
):

    if current_user.role == "admin":

        records = await db.attendance.find(
            {"attendance_type": attendance_type},
            {
                "_id": 0,
                "date": 1,
                "status": 1,
            },
        ).to_list(5000)

        grouped = {}

        for record in records:

            date = record["date"]

            if date not in grouped:
                grouped[date] = {
                    "date": date,
                    "presentCount": 0,
                    "absentCount": 0,
                }

            if record["status"] == "present":
                grouped[date]["presentCount"] += 1

            elif record["status"] == "absent":
                grouped[date]["absentCount"] += 1

        return list(grouped.values())

    records = await db.attendance.find(
        {
            "attendance_type": attendance_type,
            "user_id": current_user.user_id,
        },
        {
            "_id": 0,
            "date": 1,
            "status": 1,
        },
    ).to_list(5000)

    grouped = {}

    for record in records:

        date = record["date"]

        if date not in grouped:
            grouped[date] = {
                "date": date,
                "present": False,
                "absent": False,
            }

        if record["status"] == "present":
            grouped[date]["present"] = True

        elif record["status"] == "absent":
            grouped[date]["absent"] = True

    return list(grouped.values())


@api_router.get("/attendance/history-details/{attendance_type}/{date}")
async def get_attendance_history_details(
    attendance_type: str,
    date: str,
    event_name: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
):
    query = {
        "attendance_type": attendance_type,
        "date": date,
    }

    if event_name:
        query["event_name"] = event_name

    records = await db.attendance.find(query, {"_id": 0}).to_list(1000)

    result = []

    for record in records:

        user = await db.users.find_one(
            {"user_id": record["user_id"]},
            {
                "_id": 0,
                "name": 1,
                "role": 1,
            },
        )

        result.append(
            {
                "attendance_id": record["attendance_id"],
                "user_id": record["user_id"],
                "name": user["name"] if user else "Unknown",
                "role": user["role"] if user else "",
                "status": record["status"],
                "event_name": record.get("event_name"),
            }
        )

    return result


@api_router.get("/attendance/history/{attendance_type}")
async def get_attendance_history(
    attendance_type: str, current_user: User = Depends(get_current_user)
):

    records = await db.attendance.find(
        {"attendance_type": attendance_type}, {"_id": 0}
    ).to_list(5000)

    grouped = {}

    for record in records:

        group_key = (record["date"], record.get("event_name") or "")

        if group_key not in grouped:
            grouped[group_key] = {
                "date": record["date"],
                "attendance_type": attendance_type,
                "event_name": record.get("event_name"),
                "present": 0,
                "absent": 0,
            }

        if record["status"] == "present":
            grouped[group_key]["present"] += 1
        else:
            grouped[group_key]["absent"] += 1

    result = list(grouped.values())

    result.sort(
        key=lambda x: (x["date"], x.get("event_name") or ""),
        reverse=True,
    )

    return result


@api_router.get("/attendance/overall-stats/{attendance_type}")
async def get_overall_attendance_stats(
    attendance_type: str,
    current_user: User = Depends(get_current_user),
):
    await require_permission("attendance", current_user)

    records = await db.attendance.find(
        {"attendance_type": attendance_type},
        {
            "_id": 0,
            "date": 1,
            "event_name": 1,
            "status": 1,
        },
    ).to_list(10000)

    present = len([r for r in records if r["status"] == "present"])

    absent = len([r for r in records if r["status"] == "absent"])

    total = present + absent

    percentage = round((present / total) * 100, 2) if total > 0 else 0

    sessions = len(set((r["date"], r.get("event_name")) for r in records))

    return {
        "sessions": sessions,
        "present": present,
        "absent": absent,
        "percentage": percentage,
    }


@api_router.get("/attendance/export")
async def export_attendance(
    attendance_type: str,
    start_month: Optional[str] = None,
    end_month: Optional[str] = None,
    current_user: User = Depends(get_current_user),
):
    await require_permission(
        "attendance",
        current_user,
    )

    query = {"attendance_type": attendance_type}

    if start_month and end_month:
        query["date"] = {"$gte": f"{start_month}-01", "$lte": f"{end_month}-31"}

    records = await db.attendance.find(query).to_list(10000)

    if start_month and end_month:
        query["date"] = {"$gte": f"{start_month}-01", "$lte": f"{end_month}-31"}

    export_rows = []

    for record in records:

        user = await db.users.find_one(
            {"user_id": record["user_id"]},
            {
                "_id": 0,
                "name": 1,
                "its_no": 1,
            },
        )

        export_rows.append(
            {
                "date": record["date"],
                "attendance_type": record["attendance_type"],
                "event_name": record.get("event_name"),
                "name": user.get("name", "") if user else "",
                "its_no": user.get("its_no", "") if user else "",
                "status": record["status"],
            }
        )

    filename = f"attendance_{attendance_type}.xlsx"

    file_path = generate_attendance_excel(
        export_rows,
        filename,
    )

    return FileResponse(
        path=file_path,
        filename=filename,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )


# ============= FEES ENDPOINTS =============


@api_router.post("/fees")
async def update_fee(
    fee_data: UpdateFeeRequest,
    current_user: User = Depends(get_current_user),
):
    """Create or update fee record"""

    await require_permission("fees", current_user)

    existing = await db.fees.find_one(
        {
            "user_id": fee_data.user_id,
            "month": fee_data.month,
        }
    )

    if existing:

        await db.fees.update_one(
            {"fee_id": existing["fee_id"]},
            {
                "$set": {
                    "amount": fee_data.amount,
                    "status": fee_data.status,
                    "paid_date": fee_data.paid_date,
                    "updated_by": current_user.user_id,
                }
            },
        )

        message = "Fee updated successfully"

    else:

        new_fee = FeeRecord(
            user_id=fee_data.user_id,
            month=fee_data.month,
            amount=fee_data.amount,
            status=fee_data.status,
            paid_date=fee_data.paid_date,
            updated_by=current_user.user_id,
        )

        await db.fees.insert_one(new_fee.dict())

        message = "Fee created successfully"

    # Notification
    notification = NotificationRecord(
        user_id=fee_data.user_id,
        title="Fee Updated",
        message=f"Fee status for {fee_data.month} changed to {fee_data.status}",
    )

    await db.notifications.insert_one(notification.dict())

    return {"message": message}


@api_router.get("/fees/my")
async def get_my_fees(current_user: User = Depends(get_current_user)):
    """Get user's own fee records"""

    fees = (
        await db.fees.find({"user_id": current_user.user_id}, {"_id": 0})
        .sort("month", -1)
        .to_list(1000)
    )

    total_due = sum(f["amount"] for f in fees if f["status"] == "due")

    total_paid = sum(f["amount"] for f in fees if f["status"] == "paid")

    return {"fees": fees, "total_due": total_due, "total_paid": total_paid}


@api_router.get("/fees/user/{user_id}")
async def get_user_fees(user_id: str, current_user: User = Depends(get_current_user)):
    """Get specific user's fees"""

    await require_permission("fees", current_user)

    fees = (
        await db.fees.find({"user_id": user_id}, {"_id": 0})
        .sort("month", -1)
        .to_list(1000)
    )

    return fees


@api_router.get("/fees/all")
async def get_all_fees(current_user: User = Depends(get_current_user)):
    """Get all fee records"""

    await require_permission("fees", current_user)

    fees = await db.fees.find({}, {"_id": 0}).sort("month", -1).to_list(1000)

    return fees


@api_router.get("/fees/all-detailed")
async def get_all_fees_detailed(current_user: User = Depends(get_current_user)):
    await require_permission("fees", current_user)

    fees = await db.fees.find({}, {"_id": 0}).sort("month", -1).to_list(1000)

    result = []

    for fee in fees:

        user = await db.users.find_one(
            {"user_id": fee["user_id"]},
            {
                "_id": 0,
                "name": 1,
                "its_no": 1,
                "role": 1,
            },
        )

        result.append(
            {
                **fee,
                "member_name": user.get("name", "Unknown") if user else "Unknown",
                "its_no": user.get("its_no") if user else None,
                "role": user.get("role") if user else None,
            }
        )

    return result


@api_router.delete("/fees/{fee_id}")
async def delete_fee(fee_id: str, admin: User = Depends(require_admin)):
    """Delete fee record"""

    result = await db.fees.delete_one({"fee_id": fee_id})

    if result.deleted_count == 0:

        raise HTTPException(status_code=404, detail="Fee record not found")

    return {"message": "Fee record deleted successfully"}


@api_router.post("/admin/generate-fees/{month}")
async def generate_monthly_fees(
    month: str, amount: float, current_user: User = Depends(get_current_user)
):
    """Generate fee records for all members"""

    await require_permission("fees", current_user)

    users = await db.users.find({"role": "member"}, {"_id": 0}).to_list(1000)

    created_count = 0

    for user in users:

        existing = await db.fees.find_one({"user_id": user["user_id"], "month": month})

        if not existing:

            new_fee = FeeRecord(
                user_id=user["user_id"],
                month=month,
                amount=amount,
                status="due",
                updated_by=current_user.user_id,
            )

            await db.fees.insert_one(new_fee.dict())

            created_count += 1

    return {
        "message": f"Generated {created_count} fee records for {month}",
        "total_members": len(users),
        "created": created_count,
    }


@api_router.post("/fees/send-reminders")
async def send_fee_reminders(current_user: User = Depends(get_current_user)):
    await require_permission("fees", current_user)

    due_fees = await db.fees.find({"status": "due"}, {"_id": 0}).to_list(1000)

    sent = 0

    for fee in due_fees:

        notification = NotificationRecord(
            user_id=fee["user_id"],
            title="Fee Reminder",
            message=f"Your fee for {fee['month']} is still pending.",
        )

        await db.notifications.insert_one(notification.dict())

        sent += 1

    return {"message": f"{sent} reminders sent"}


# ============= INVENTORY ENDPOINTS =============


@api_router.post("/inventory")
async def create_inventory_item(
    item_data: CreateInventoryRequest, current_user: User = Depends(get_current_user)
):
    """Create inventory item"""

    await require_permission("inventory", current_user)

    new_item = InventoryItem(
        name=item_data.name,
        quantity=item_data.quantity,
        condition=item_data.condition or "good",
        added_by=current_user.user_id,
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
    current_user: User = Depends(get_current_user),
):
    """Update inventory item"""

    await require_permission("inventory", current_user)

    update_dict = {"updated_at": datetime.now(timezone.utc)}

    if update_data.name:
        update_dict["name"] = update_data.name

    if update_data.quantity is not None:
        update_dict["quantity"] = update_data.quantity

    if update_data.condition:
        update_dict["condition"] = update_data.condition

    await db.inventory.update_one({"item_id": item_id}, {"$set": update_dict})

    return {"message": "Inventory updated"}


@api_router.delete("/inventory/{item_id}")
async def delete_inventory_item(item_id: str, admin: User = Depends(require_admin)):
    """Delete inventory item"""

    await db.inventory.delete_one({"item_id": item_id})

    return {"message": "Item deleted"}


# ============= UNIFORM ENDPOINTS =============


@api_router.post("/uniforms")
async def create_uniform_item(
    uniform_data: CreateUniformRequest, current_user: User = Depends(get_current_user)
):
    """Create uniform item"""

    await require_permission("uniforms", current_user)

    new_uniform = UniformItem(
        name=uniform_data.name,
        size=uniform_data.size,
        quantity=uniform_data.quantity,
        added_by=current_user.user_id,
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
    current_user: User = Depends(get_current_user),
):
    """Update uniform item"""

    await require_permission("uniforms", current_user)

    update_dict = {"updated_at": datetime.now(timezone.utc)}

    if update_data.name:
        update_dict["name"] = update_data.name

    if update_data.size:
        update_dict["size"] = update_data.size

    if update_data.quantity is not None:
        update_dict["quantity"] = update_data.quantity

    await db.uniforms.update_one({"uniform_id": uniform_id}, {"$set": update_dict})

    return {"message": "Uniform updated"}


@api_router.delete("/uniforms/{uniform_id}")
async def delete_uniform_item(uniform_id: str, admin: User = Depends(require_admin)):
    """Delete uniform item"""

    await db.uniforms.delete_one({"uniform_id": uniform_id})

    await db.user_uniforms.delete_many({"uniform_id": uniform_id})

    return {"message": "Uniform deleted"}


# ============= ADMIN - TAG MANAGEMENT =============


@api_router.put("/admin/update-permissions")
async def update_user_permissions(
    data: UpdatePermissionsRequest,
    current_user: User = Depends(get_current_user),
):
    """Update user permissions"""

    await require_permission("members", current_user)

    # Prevent editing own permissions
    if data.user_id == current_user.user_id:

        raise HTTPException(
            status_code=400,
            detail="Cannot modify your own permissions",
        )

    user = await db.users.find_one({"user_id": data.user_id})

    if not user:

        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    await db.users.update_one(
        {"user_id": data.user_id},
        {"$set": {"permissions": data.permissions.model_dump()}},
    )

    granted_permissions = []

    if data.permissions.attendance:
        granted_permissions.append("Attendance")

    if data.permissions.members:
        granted_permissions.append("Members")

    if data.permissions.fees:
        granted_permissions.append("Fees")

    if data.permissions.inventory:
        granted_permissions.append("Inventory")

    if data.permissions.uniforms:
        granted_permissions.append("Uniforms")

    permission_text = ", ".join(granted_permissions)

    notification = NotificationRecord(
        user_id=data.user_id,
        title="Permission Updated",
        message=f"You were granted access to: {permission_text}",
    )

    await db.notifications.insert_one(notification.dict())

    return {"message": "Permissions updated successfully"}


@api_router.post("/admin/assign-tag")
async def assign_tag(
    tag_data: AssignTagRequest, current_user: User = Depends(get_current_user)
):
    """Assign tag to user"""

    await require_permission("members", current_user)

    await db.users.update_one(
        {"user_id": tag_data.user_id}, {"$set": {"tag": tag_data.tag}}
    )
    notification = NotificationRecord(
        user_id=tag_data.user_id,
        title="Tag Assigned",
        message=f"You have been assigned tag: {tag_data.tag}",
    )

    await db.notifications.insert_one(notification.dict())

    return {"message": "Tag assigned"}


@api_router.post("/admin/assign-badge")
async def assign_badge(
    badge_data: AssignBadgeRequest, current_user: User = Depends(get_current_user)
):
    """Assign badge to user"""

    await require_permission("members", current_user)

    await db.users.update_one(
        {"user_id": badge_data.user_id}, {"$set": {"badge": badge_data.badge}}
    )
    notification = NotificationRecord(
        user_id=badge_data.user_id,
        title="Badge Awarded",
        message=f"You have received {badge_data.badge} badge",
    )

    await db.notifications.insert_one(notification.dict())

    return {"message": "Badge assigned successfully"}


@api_router.delete("/admin/delete-user/{user_id}")
async def delete_user(user_id: str, admin: User = Depends(require_admin)):
    """Delete a user"""

    # Prevent self delete
    if user_id == admin.user_id:

        raise HTTPException(status_code=400, detail="Cannot delete your own account")

    result = await db.users.delete_one({"user_id": user_id})

    if result.deleted_count == 0:

        raise HTTPException(status_code=404, detail="User not found")

    # CLEAN RELATED DATA

    await db.user_sessions.delete_many({"user_id": user_id})

    await db.attendance.delete_many({"user_id": user_id})

    await db.fees.delete_many({"user_id": user_id})

    await db.user_uniforms.delete_many({"user_id": user_id})

    return {"message": "User deleted successfully"}


@api_router.get("/admin/user-profile/{user_id}")
async def get_user_profile(
    user_id: str, current_user: User = Depends(get_current_user)
):
    """Get detailed user profile"""

    can_view_private = current_user.role == "admin"

    user_doc = await db.users.find_one(
        {"user_id": user_id}, {"_id": 0, "password_hash": 0}
    )

    if not user_doc:

        raise HTTPException(status_code=404, detail="User not found")

    # ATTENDANCE

    practice_attendance = await db.attendance.find(
        {"user_id": user_id, "attendance_type": "practice"}, {"_id": 0}
    ).to_list(1000)

    khidmat_attendance = await db.attendance.find(
        {"user_id": user_id, "attendance_type": "khidmat"}, {"_id": 0}
    ).to_list(1000)

    duties_attendance = await db.attendance.find(
        {"user_id": user_id, "attendance_type": "duties"}, {"_id": 0}
    ).to_list(1000)

    # FEES

    fees = await db.fees.find({"user_id": user_id}, {"_id": 0}).to_list(1000)

    # UNIFORMS

    user_uniforms = await db.user_uniforms.find(
        {"user_id": user_id}, {"_id": 0}
    ).to_list(1000)

    uniforms = []

    for uu in user_uniforms:

        uniform = await db.uniforms.find_one(
            {"uniform_id": uu["uniform_id"]}, {"_id": 0}
        )

        if uniform:

            uniforms.append(
                {
                    "user_uniform_id": uu["user_uniform_id"],
                    "uniform": uniform,
                    "assigned_date": uu["assigned_date"],
                }
            )

    # STATS

    practice_total = len(practice_attendance)

    practice_present = len([r for r in practice_attendance if r["status"] == "present"])

    practice_percentage = (
        (practice_present / practice_total * 100) if practice_total > 0 else 0
    )

    khidmat_total = len(khidmat_attendance)

    khidmat_present = len([r for r in khidmat_attendance if r["status"] == "present"])

    khidmat_percentage = (
        (khidmat_present / khidmat_total * 100) if khidmat_total > 0 else 0
    )
    duties_total = len(duties_attendance)

    duties_present = len([r for r in duties_attendance if r["status"] == "present"])

    duties_percentage = (duties_present / duties_total * 100) if duties_total > 0 else 0
    total_due = sum(f["amount"] for f in fees if f["status"] == "due")

    total_paid = sum(f["amount"] for f in fees if f["status"] == "paid")
    public_user = {
        "user_id": user_doc.get("user_id"),
        "name": user_doc.get("name"),
        "role": user_doc.get("role"),
        "picture": user_doc.get("picture"),
        "instrument": user_doc.get("instrument"),
        "joining_year": user_doc.get("joining_year"),
        "badge": user_doc.get("badge"),
        "birth_date": user_doc.get("birth_date"),
        "age": user_doc.get("age"),
        "tag": user_doc.get("tag"),
    }
    if can_view_private:
        public_user.update(
            {
                "its_no": user_doc.get("its_no"),
                "phone": user_doc.get("phone"),
                "email_id": user_doc.get("email_id"),
                "parent_contact": user_doc.get("parent_contact"),
                "permissions": user_doc.get("permissions"),
            }
        )

    return {
        "user": public_user,
        "attendance": {
            "practice": {
                "total": practice_total,
                "present": practice_present,
                "percentage": round(practice_percentage, 2),
            },
            "khidmat": {
                "total": khidmat_total,
                "present": khidmat_present,
                "percentage": round(khidmat_percentage, 2),
            },
            "duties": {
                "total": duties_total,
                "present": duties_present,
                "percentage": round(duties_percentage, 2),
            },
        },
        "fees": {
            "records": fees,
            "total_due": total_due,
            "total_paid": total_paid,
        },
        "uniforms": uniforms,
        "can_view_private": can_view_private,
    }


@api_router.post("/admin/reset-password")
async def admin_reset_password(
    reset_data: ResetPasswordRequest, admin: User = Depends(require_admin)
):
    """Admin reset member password (admin only)"""
    # Validate new password
    if len(reset_data.new_password) < 6:
        raise HTTPException(
            status_code=400, detail="New password must be at least 6 characters"
        )

    # Get user
    user_doc = await db.users.find_one({"user_id": reset_data.user_id})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")

    # Hash and update new password
    new_password_hash = hash_password(reset_data.new_password)
    await db.users.update_one(
        {"user_id": reset_data.user_id}, {"$set": {"password_hash": new_password_hash}}
    )

    # Invalidate all sessions for this user
    await db.user_sessions.delete_many({"user_id": reset_data.user_id})

    return {"message": "Password reset successfully"}


# ============= STARTUP - CREATE ADMIN =============


@app.on_event("startup")
async def create_admin():
    await db.users.create_index("its_no")
    await db.users.create_index("role")
    await db.password_reset_otps.create_index("expires_at", expireAfterSeconds=0)
    await db.notifications.create_index("created_at", expireAfterSeconds=43200)
    await db.user_sessions.create_index("expires_at", expireAfterSeconds=0)
    await db.users.create_index("user_id", unique=True)
    await db.users.create_index("username", unique=True)
    await db.attendance.create_index(
        [
            ("user_id", 1),
            ("attendance_type", 1),
            ("event_name", 1),
            ("date", 1),
        ],
        unique=True,
    )
    await db.attendance.create_index([("attendance_type", 1), ("date", -1)])

    await db.attendance.create_index([("date", -1)])

    await db.attendance.create_index([("user_id", 1), ("date", -1)])
    await db.fees.create_index([("user_id", 1), ("month", 1)], unique=True)

    await db.notifications.create_index([("user_id", 1)])
    await db.notifications.create_index([("created_at", -1)])

    admin_username = os.getenv("ADMIN_USERNAME", "")
    admin_password = os.getenv("ADMIN_PASSWORD", "")

    existing_admin = await db.users.find_one({"username": admin_username})

    if not existing_admin:

        admin_id = f"admin_{uuid.uuid4().hex[:12]}"
        password_hash = hash_password(admin_password)

        admin_user = {
            "user_id": admin_id,
            "its_no": admin_username,
            "username": admin_username,
            "password_hash": password_hash,
            "name": "Vajihi Admin",
            "phone": None,
            "picture": None,
            "role": "admin",
            "permissions": {
                "attendance": True,
                "inventory": True,
                "fees": True,
                "uniforms": True,
                "members": True,
            },
            "tag": None,
            "expo_push_token": None,
            "created_at": datetime.now(timezone.utc),
        }

        await db.users.insert_one(admin_user)

        logger.info(f"Admin user created: {admin_username}")
        """Create admin user if not exists"""


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8081",
        "http://localhost:19006",
        "http://192.168.0.110:8081",
        "exp://192.168.0.110:8081",
        "https://vajihi-scout-mumbra.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8001)
