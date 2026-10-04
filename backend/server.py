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
    session_id: Optional[str] = None
    user_id: str
    attendance_type: str
    event_name: Optional[str] = None
    date: str
    status: str
    marked_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class AttendanceSession(BaseModel):
    session_id: str = Field(default_factory=lambda: f"session_{uuid.uuid4().hex[:12]}")
    attendance_type: str
    event_name: Optional[str] = None
    date: str
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


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


# ============================================================
# UNIFORM MODELS
# ============================================================
class UniformComponent(BaseModel):
    component_id: str = Field(
        default_factory=lambda: f"component_{uuid.uuid4().hex[:12]}"
    )
    name: str
    description: Optional[str] = None
    image: Optional[str] = None
    # Example:
    # ["XS", "S", "M", "L", "XL"]
    available_sizes: List[str] = Field(default_factory=list)
    # Whether this component must be given for a complete uniform
    is_mandatory: bool = True
    display_order: int = 0


class UniformCatalog(BaseModel):
    catalog_id: str = Field(default_factory=lambda: f"cat_{uuid.uuid4().hex[:12]}")
    # Example: BLUE BLAZER UNIFORM
    name: str
    category: str
    description: Optional[str] = None
    guide: Optional[str] = None
    # Package-level images
    images: List[str] = Field(default_factory=list)
    # Components inside this uniform package
    components: List[UniformComponent] = Field(default_factory=list)
    # Package price
    price: float = 0
    currency: str = "INR"
    # Overall package mandatory status
    is_mandatory: bool = True
    display_order: int = 0
    active: bool = True
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class CreateUniformCatalogRequest(BaseModel):
    name: str
    category: str
    description: Optional[str] = None
    guide: Optional[str] = None
    images: List[str] = Field(default_factory=list)
    components: List[UniformComponent] = Field(default_factory=list)
    price: float = 0
    currency: str = "INR"
    is_mandatory: bool = True
    display_order: int = 0


class UpdateUniformCatalogRequest(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    guide: Optional[str] = None
    images: Optional[List[str]] = None
    components: Optional[List[UniformComponent]] = None
    price: Optional[float] = None
    currency: Optional[str] = None
    is_mandatory: Optional[bool] = None
    display_order: Optional[int] = None
    active: Optional[bool] = None


# ============================================================
# UNIFORM INVENTORY
# ============================================================
class CreateUniformInventoryRequest(BaseModel):
    catalog_id: str
    component_id: str
    size: str
    total_quantity: int = Field(ge=0)
    purchase_price: float = Field(ge=0)
    supplier: Optional[str] = None
    purchase_date: str
    notes: Optional[str] = None
    minimum_stock: int = Field(default=5, ge=0)


class UpdateUniformInventoryRequest(BaseModel):
    purchase_price: Optional[float] = Field(default=None, ge=0)
    supplier: Optional[str] = None
    purchase_date: Optional[str] = None
    notes: Optional[str] = None
    minimum_stock: Optional[int] = Field(default=None, ge=0)
    total_quantity: Optional[int] = Field(default=None, ge=0)


class UniformInventory(BaseModel):
    inventory_id: str = Field(default_factory=lambda: f"inv_{uuid.uuid4().hex[:12]}")
    catalog_id: str
    component_id: str
    size: str
    total_quantity: int = 0
    available_quantity: int = 0
    assigned_quantity: int = 0
    repair_quantity: int = 0
    damaged_quantity: int = 0
    minimum_stock: int = 5
    purchase_price: float = 0
    supplier: Optional[str] = None
    purchase_date: str
    notes: Optional[str] = None
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ============================================================
# MEMBER UNIFORM ASSIGNMENT
# ============================================================
class UniformAssignmentComponent(BaseModel):
    component_id: str
    inventory_id: Optional[str] = None
    component_name: str
    size: Optional[str] = None
    assigned: bool = False
    quantity: int = Field(default=0, ge=0)
    paid: bool = False
    condition_given: str = "new"
    condition_returned: Optional[str] = None
    status: str = "pending"
    # pending
    # assigned
    # repair
    # returned
    # lost
    # damaged


class MemberUniform(BaseModel):
    assignment_id: str = Field(
        default_factory=lambda: f"assign_{uuid.uuid4().hex[:12]}"
    )
    user_id: str
    catalog_id: str
    uniform_name: str
    components: List[UniformAssignmentComponent] = Field(default_factory=list)
    # complete / partial / pending / returned
    assignment_status: str = "pending"
    # Overall payment status
    # paid / unpaid / partial
    payment_status: str = "unpaid"
    member_notes: Optional[str] = None
    assigned_date: str
    return_date: Optional[str] = None
    assigned_by: str
    remarks: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class AssignUniformComponentRequest(BaseModel):
    component_id: str
    inventory_id: str
    size: Optional[str] = None
    assigned: bool = False
    quantity: int = Field(default=1, ge=1)
    paid: bool = False
    condition_given: str = "new"


class AssignUniformRequest(BaseModel):
    user_id: str
    catalog_id: str
    components: List[AssignUniformComponentRequest]
    assigned_date: str
    member_notes: Optional[str] = None
    remarks: Optional[str] = None


class UpdateMyUniformComponentRequest(BaseModel):
    component_id: str
    assigned: bool


class UpdateMyUniformRequest(BaseModel):
    components: List[UpdateMyUniformComponentRequest]
    remarks: Optional[str] = None


class ReturnUniformComponentRequest(BaseModel):
    component_id: str
    condition_returned: str


class ReturnUniformRequest(BaseModel):
    components: List[ReturnUniformComponentRequest]
    return_date: str
    remarks: Optional[str] = None


# ============================================================
# REPAIR
# ============================================================
class CreateRepairRequest(BaseModel):
    assignment_id: str
    component_id: str
    issue: str
    description: Optional[str] = None
    priority: str = "Medium"


class UpdateRepairRequest(BaseModel):
    status: str
    repair_cost: Optional[float] = Field(default=0, ge=0)
    remarks: Optional[str] = None
    completed_date: Optional[str] = None
    resolution_message: Optional[str] = None


class UniformRepair(BaseModel):
    repair_id: str = Field(default_factory=lambda: f"repair_{uuid.uuid4().hex[:12]}")
    assignment_id: str
    catalog_id: str
    component_id: str
    inventory_id: str
    user_id: str
    issue: str
    description: Optional[str] = None
    priority: str = "medium"
    status: str = "pending"
    repair_cost: Optional[float] = None
    vendor: Optional[str] = None
    completed_by: Optional[str] = None
    expected_completion: Optional[str] = None
    completed_date: Optional[str] = None
    notes: Optional[str] = None
    resolution_message: Optional[str] = None
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ============================================================
# PURCHASE
# ============================================================
class UniformPurchase(BaseModel):
    purchase_id: str = Field(default_factory=lambda: f"pur_{uuid.uuid4().hex[:12]}")
    catalog_id: str
    component_id: str
    inventory_id: str
    size: str
    quantity: int = Field(ge=1)
    price_per_item: float = Field(ge=0)
    total_price: float = Field(ge=0)
    supplier: str
    invoice_no: Optional[str] = None
    invoice_image: Optional[str] = None
    purchase_date: str
    purchased_by: Optional[str] = None
    notes: Optional[str] = None
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


class UpdateAttendanceItem(BaseModel):
    attendance_id: str
    status: str


class UpdateAttendanceSessionRequest(BaseModel):
    records: List[UpdateAttendanceItem]


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


# ============================================================
# GENERAL INVENTORY - INSTRUMENTS / OTHERS
# ============================================================


class InventoryItem(BaseModel):
    item_id: str = Field(default_factory=lambda: f"item_{uuid.uuid4().hex[:12]}")
    name: str
    category: str  # instrument / other
    description: Optional[str] = None
    images: List[str] = Field(default_factory=list)

    total_quantity: int = Field(default=0, ge=0)
    available_quantity: int = Field(default=0, ge=0)
    assigned_quantity: int = Field(default=0, ge=0)
    repair_quantity: int = Field(default=0, ge=0)
    not_usable_quantity: int = Field(default=0, ge=0)

    condition: str = "good"
    active: bool = True

    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class CreateInventoryItemRequest(BaseModel):
    name: str
    category: str
    description: Optional[str] = None
    images: List[str] = Field(default_factory=list)

    total_quantity: int = Field(default=0, ge=0)
    condition: str = "good"


class UpdateInventoryItemRequest(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    images: Optional[List[str]] = None

    total_quantity: Optional[int] = Field(
        default=None,
        ge=0,
    )

    condition: Optional[str] = None
    active: Optional[bool] = None


class InventoryAssignment(BaseModel):
    assignment_id: str = Field(default_factory=lambda: f"ia_{uuid.uuid4().hex[:12]}")
    item_id: str
    user_id: str
    quantity: int = Field(default=1, ge=1)
    status: str = "assigned"
    assigned_by: str
    assigned_date: str
    remarks: Optional[str] = None

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class AssignInventoryItemRequest(BaseModel):
    user_id: str
    quantity: int = Field(default=1, ge=1)
    assigned_date: str
    remarks: Optional[str] = None


class UpdateMyInventoryAssignmentRequest(BaseModel):
    quantity: int = Field(default=1, ge=1)
    remarks: Optional[str] = None


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


async def notify_all_users(title: str, message: str):
    """Create an in-app notification and send push notification to every user."""
    users = await db.users.find(
        {},
        {
            "_id": 0,
            "user_id": 1,
            "expo_push_token": 1,
        },
    ).to_list(10000)

    notifications = []

    for user in users:
        notification = NotificationRecord(
            user_id=user["user_id"],
            title=title,
            message=message,
        )
        notifications.append(notification.model_dump())

    # Save notifications for everyone
    if notifications:
        await db.notifications.insert_many(notifications)

    # Send push notifications to users who have a token
    for user in users:
        expo_push_token = user.get("expo_push_token")

        if expo_push_token:
            await send_push_notification(
                expo_push_token,
                title,
                message,
            )


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
    """Create a new attendance session and save all member attendance"""
    await require_permission("attendance", current_user)
    # Create a NEW attendance session every time
    session = AttendanceSession(
        attendance_type=data.attendance_type,
        event_name=data.event_name,
        date=data.date,
        created_by=current_user.user_id,
    )
    await db.attendance_sessions.insert_one(session.dict())
    saved = 0
    for record in data.records:
        attendance = AttendanceRecord(
            session_id=session.session_id,
            user_id=record.user_id,
            attendance_type=data.attendance_type,
            event_name=data.event_name,
            date=data.date,
            status=record.status,
            marked_by=current_user.user_id,
        )
        await db.attendance.insert_one(attendance.dict())
        # Save notification
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
        "session_id": session.session_id,
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


@api_router.delete("/attendance/session/{session_id}")
async def delete_attendance_session(
    session_id: str,
    admin: User = Depends(require_admin),
):
    await db.attendance.delete_many({"session_id": session_id})
    await db.attendance_sessions.delete_one({"session_id": session_id})
    return {"message": "Attendance session deleted"}


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
                "session_id": 1,
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
            "session_id": 1,
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


@api_router.get("/attendance/history-details/{session_id}")
async def get_attendance_history_details(
    session_id: str,
    current_user: User = Depends(get_current_user),
):
    records = await db.attendance.find({"session_id": session_id}).to_list(1000)
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
                "session_id": record["session_id"],
                "attendance_type": record["attendance_type"],
                "date": record["date"],
                "event_name": record.get("event_name"),
                "user_id": record["user_id"],
                "name": user["name"] if user else "Unknown",
                "role": user["role"] if user else "",
                "status": record["status"],
            }
        )
    return result


@api_router.put("/attendance/session/{session_id}")
async def update_attendance_session(
    session_id: str,
    data: UpdateAttendanceSessionRequest,
    current_user: User = Depends(get_current_user),
):
    """Update existing attendance session"""
    await require_permission("attendance", current_user)
    session = await db.attendance_sessions.find_one({"session_id": session_id})
    if not session:
        raise HTTPException(
            status_code=404,
            detail="Attendance session not found",
        )
    updated = 0
    for record in data.records:
        result = await db.attendance.update_one(
            {
                "attendance_id": record.attendance_id,
                "session_id": session_id,
            },
            {
                "$set": {
                    "status": record.status,
                    "marked_by": current_user.user_id,
                    "updated_at": datetime.now(timezone.utc),
                }
            },
        )
        if result.matched_count > 0:
            updated += 1
    await db.attendance_sessions.update_one(
        {"session_id": session_id},
        {
            "$set": {
                "updated_at": datetime.now(timezone.utc),
            }
        },
    )
    return {
        "message": "Attendance updated successfully",
        "updated_count": updated,
    }


@api_router.get("/attendance/history/{attendance_type}")
async def get_attendance_history(
    attendance_type: str, current_user: User = Depends(get_current_user)
):
    records = await db.attendance.find(
        {"attendance_type": attendance_type}, {"_id": 0}
    ).to_list(5000)
    grouped = {}
    for record in records:
        session_id = record.get("session_id")
        # Skip old attendance records that were created
        # before session support existed.
        if not session_id:
            continue
        group_key = session_id
        if group_key not in grouped:
            grouped[group_key] = {
                "session_id": session_id,
                "date": record["date"],
                "attendance_type": attendance_type,
                "event_name": record.get("event_name"),
                "present": 0,
                "absent": 0,
                "created_at": record["created_at"],
            }
        if record["status"] == "present":
            grouped[group_key]["present"] += 1
        else:
            grouped[group_key]["absent"] += 1
    result = list(grouped.values())
    result.sort(
        key=lambda x: x["created_at"],
        reverse=True,
    )
    for item in result:
        item.pop("created_at", None)
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
            "session_id": 1,
        },
    ).to_list(10000)
    present = len([r for r in records if r["status"] == "present"])
    absent = len([r for r in records if r["status"] == "absent"])
    total = present + absent
    percentage = round((present / total) * 100, 2) if total > 0 else 0
    sessions = len({r.get("session_id") for r in records if r.get("session_id")})
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
                "session_id": record["session_id"],
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


# ============= UNIFORM CATALOG ENDPOINTS =============
@api_router.post("/uniforms/catalog")
async def create_uniform_catalog(
    data: CreateUniformCatalogRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Create a complete uniform package.
    """
    await require_permission("uniforms", current_user)
    if not data.name.strip():
        raise HTTPException(
            status_code=400,
            detail="Uniform name is required",
        )
    if data.price < 0:
        raise HTTPException(
            status_code=400,
            detail="Price cannot be negative",
        )
    if not data.components:
        raise HTTPException(
            status_code=400,
            detail="At least one uniform component is required",
        )
    catalog = UniformCatalog(
        name=data.name.strip(),
        category=data.category.strip(),
        description=data.description,
        guide=data.guide,
        images=data.images,
        components=data.components,
        price=data.price,
        currency=data.currency,
        is_mandatory=data.is_mandatory,
        display_order=data.display_order,
        created_by=current_user.user_id,
    )
    await db.uniform_catalog.insert_one(catalog.model_dump())

    await notify_all_users(
        "New Uniform Added",
        f"{catalog.name} has been added to the uniform catalogue.",
    )

    return catalog


@api_router.get("/uniforms/catalog")
async def get_uniform_catalog(
    current_user: User = Depends(get_current_user),
):
    """
    Get all active uniform catalogue items with inventory statistics.

    Visible to all authenticated users.

    Statistics:
        total       = total quantity owned by organisation
        available   = currently available quantity
        assigned    = currently assigned quantity
        not_usable  = under repair + damaged quantity
    """

    catalog = (
        await db.uniform_catalog.find(
            {"active": True},
            {"_id": 0},
        )
        .sort("display_order", 1)
        .to_list(1000)
    )

    result = []

    for item in catalog:
        catalog_id = item.get("catalog_id")

        # Get all inventory records belonging to this uniform.
        inventory_items = await db.uniform_inventory.find(
            {
                "catalog_id": catalog_id,
            },
            {
                "_id": 0,
                "total_quantity": 1,
                "available_quantity": 1,
                "assigned_quantity": 1,
                "repair_quantity": 1,
                "damaged_quantity": 1,
            },
        ).to_list(5000)

        # Calculate organisation-wide totals for this uniform.
        total_quantity = sum(
            int(inventory.get("total_quantity", 0) or 0)
            for inventory in inventory_items
        )

        available_quantity = sum(
            int(inventory.get("available_quantity", 0) or 0)
            for inventory in inventory_items
        )

        assigned_quantity = sum(
            int(inventory.get("assigned_quantity", 0) or 0)
            for inventory in inventory_items
        )

        repair_quantity = sum(
            int(inventory.get("repair_quantity", 0) or 0)
            for inventory in inventory_items
        )

        damaged_quantity = sum(
            int(inventory.get("damaged_quantity", 0) or 0)
            for inventory in inventory_items
        )

        not_usable_quantity = repair_quantity + damaged_quantity

        # Add statistics without changing the existing
        # catalogue structure.
        item["stats"] = {
            "total": total_quantity,
            "available": available_quantity,
            "assigned": assigned_quantity,
            "not_usable": not_usable_quantity,
        }

        result.append(item)

    return result


@api_router.get("/uniforms/catalog/{catalog_id}")
async def get_uniform_catalog_item(
    catalog_id: str,
    current_user: User = Depends(get_current_user),
):
    """
    Get complete details for one uniform catalogue item.

    Includes:
        - catalogue information
        - images
        - description
        - organisation inventory statistics
        - component inventory information
        - current user's assignment for this uniform
    """

    # ========================================================
    # CATALOG
    # ========================================================
    item = await db.uniform_catalog.find_one(
        {
            "catalog_id": catalog_id,
            "active": True,
        },
        {
            "_id": 0,
        },
    )

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Catalog item not found",
        )

    # ========================================================
    # INVENTORY
    # ========================================================
    inventory_items = await db.uniform_inventory.find(
        {
            "catalog_id": catalog_id,
        },
        {
            "_id": 0,
        },
    ).to_list(5000)

    # ========================================================
    # ORGANISATION STATISTICS
    # ========================================================
    total_quantity = sum(
        int(item.get("total_quantity", 0) or 0) for item in inventory_items
    )

    available_quantity = sum(
        int(item.get("available_quantity", 0) or 0) for item in inventory_items
    )

    assigned_quantity = sum(
        int(item.get("assigned_quantity", 0) or 0) for item in inventory_items
    )

    repair_quantity = sum(
        int(item.get("repair_quantity", 0) or 0) for item in inventory_items
    )

    damaged_quantity = sum(
        int(item.get("damaged_quantity", 0) or 0) for item in inventory_items
    )

    not_usable_quantity = repair_quantity + damaged_quantity

    # ========================================================
    # COMPONENT DETAILS
    # ========================================================
    detailed_components = []

    for component in item.get("components", []):
        component_id = component.get("component_id")

        component_inventory = [
            inventory
            for inventory in inventory_items
            if inventory.get("component_id") == component_id
        ]

        component_total = sum(
            int(inventory.get("total_quantity", 0) or 0)
            for inventory in component_inventory
        )

        component_available = sum(
            int(inventory.get("available_quantity", 0) or 0)
            for inventory in component_inventory
        )

        component_assigned = sum(
            int(inventory.get("assigned_quantity", 0) or 0)
            for inventory in component_inventory
        )

        component_repair = sum(
            int(inventory.get("repair_quantity", 0) or 0)
            for inventory in component_inventory
        )

        component_damaged = sum(
            int(inventory.get("damaged_quantity", 0) or 0)
            for inventory in component_inventory
        )

        detailed_components.append(
            {
                **component,
                "inventory": component_inventory,
                "stats": {
                    "total": component_total,
                    "available": component_available,
                    "assigned": component_assigned,
                    "not_usable": (component_repair + component_damaged),
                },
            }
        )

    # ========================================================
    # CURRENT USER ASSIGNMENT
    # ========================================================
    my_assignment = await db.member_uniforms.find_one(
        {
            "user_id": current_user.user_id,
            "catalog_id": catalog_id,
            "assignment_status": {"$ne": "returned"},
        },
        {
            "_id": 0,
        },
        sort=[
            ("assigned_date", -1),
        ],
    )

    # ========================================================
    # RESPONSE
    # ========================================================
    return {
        **item,
        "stats": {
            "total": total_quantity,
            "available": available_quantity,
            "assigned": assigned_quantity,
            "not_usable": not_usable_quantity,
        },
        "components": detailed_components,
        "my_assignment": my_assignment,
    }


@api_router.put("/uniforms/catalog/{catalog_id}")
async def update_uniform_catalog(
    catalog_id: str,
    data: UpdateUniformCatalogRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Update uniform catalogue.
    Admin:
        Can update everything including price.
    Permitted uniform user:
        Can update catalogue details/components/images,
        but cannot change price.
    """
    await require_permission("uniforms", current_user)
    existing = await db.uniform_catalog.find_one({"catalog_id": catalog_id})
    if not existing:
        raise HTTPException(
            status_code=404,
            detail="Catalog item not found",
        )
    update_data = data.model_dump(
        exclude_unset=True,
        exclude_none=True,
    )
    # --------------------------------------------------------
    # PRICE PROTECTION
    # --------------------------------------------------------
    if current_user.role != "admin":
        update_data.pop("price", None)
        update_data.pop("currency", None)
    if not update_data:
        return {"message": "No changes provided"}
    update_data["updated_at"] = datetime.now(timezone.utc)
    await db.uniform_catalog.update_one(
        {"catalog_id": catalog_id},
        {"$set": update_data},
    )

    updated_catalog = await db.uniform_catalog.find_one(
        {"catalog_id": catalog_id},
        {"_id": 0},
    )

    await notify_all_users(
        "Uniform Updated",
        f"{updated_catalog['name']} has been updated.",
    )

    return {"message": "Catalog updated successfully"}


@api_router.delete("/uniforms/catalog/{catalog_id}")
async def delete_uniform_catalog(
    catalog_id: str,
    admin: User = Depends(require_admin),
):
    """Delete catalog item"""
    inventory_exists = await db.uniform_inventory.find_one({"catalog_id": catalog_id})
    if inventory_exists:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete. Inventory exists for this catalog item.",
        )
    result = await db.uniform_catalog.delete_one({"catalog_id": catalog_id})
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Catalog item not found",
        )
    return {"message": "Catalog deleted successfully"}


# ============= UNIFORM INVENTORY ENDPOINTS =============
@api_router.post("/uniforms/inventory")
async def create_uniform_inventory(
    data: CreateUniformInventoryRequest,
    current_user: User = Depends(get_current_user),
):
    await require_permission("uniforms", current_user)
    catalog = await db.uniform_catalog.find_one({"catalog_id": data.catalog_id})
    if not catalog:
        raise HTTPException(
            status_code=404,
            detail="Uniform catalog not found",
        )
    component = next(
        (
            c
            for c in catalog.get("components", [])
            if c.get("component_id") == data.component_id
        ),
        None,
    )
    if not component:
        raise HTTPException(
            status_code=404,
            detail="Uniform component not found",
        )
    if data.size not in component.get("available_sizes", []):
        raise HTTPException(
            status_code=400,
            detail="Invalid size for selected component",
        )
    existing = await db.uniform_inventory.find_one(
        {
            "catalog_id": data.catalog_id,
            "component_id": data.component_id,
            "size": data.size,
        }
    )
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Inventory already exists for this component and size",
        )
    inventory = UniformInventory(
        catalog_id=data.catalog_id,
        component_id=data.component_id,
        size=data.size,
        total_quantity=data.total_quantity,
        available_quantity=data.total_quantity,
        purchase_price=data.purchase_price,
        supplier=data.supplier,
        purchase_date=data.purchase_date,
        notes=data.notes,
        minimum_stock=data.minimum_stock,
        created_by=current_user.user_id,
    )
    await db.uniform_inventory.insert_one(inventory.model_dump())

    await notify_all_users(
        "Uniform Stock Added",
        f"New stock added for {catalog.get('name', 'uniform')} - "
        f"{component.get('name', 'component')} ({data.size}), "
        f"quantity: {data.total_quantity}.",
    )

    return inventory


@api_router.get("/uniforms/inventory")
async def get_uniform_inventory(
    current_user: User = Depends(get_current_user),
):
    """Get all uniform inventory with catalog/component details."""
    await require_permission("uniforms", current_user)
    inventory = await db.uniform_inventory.find(
        {},
        {"_id": 0},
    ).to_list(5000)
    result = []
    for item in inventory:
        catalog = await db.uniform_catalog.find_one(
            {
                "catalog_id": item["catalog_id"],
            },
            {
                "_id": 0,
                "name": 1,
                "category": 1,
                "components": 1,
            },
        )
        component = None
        if catalog:
            component = next(
                (
                    c
                    for c in catalog.get("components", [])
                    if c.get("component_id") == item["component_id"]
                ),
                None,
            )
        result.append(
            {
                **item,
                "uniform_name": catalog.get("name") if catalog else None,
                "category": catalog.get("category") if catalog else None,
                "component_name": (component.get("name") if component else None),
            }
        )
    return result


@api_router.get("/uniforms/inventory/{inventory_id}")
async def get_uniform_inventory_item(
    inventory_id: str,
    current_user: User = Depends(get_current_user),
):
    """Get one uniform inventory item."""
    await require_permission("uniforms", current_user)
    inventory = await db.uniform_inventory.find_one(
        {
            "inventory_id": inventory_id,
        },
        {
            "_id": 0,
        },
    )
    if not inventory:
        raise HTTPException(
            status_code=404,
            detail="Inventory not found",
        )
    catalog = await db.uniform_catalog.find_one(
        {
            "catalog_id": inventory["catalog_id"],
        },
        {
            "_id": 0,
            "name": 1,
            "category": 1,
            "components": 1,
        },
    )
    component = None
    if catalog:
        component = next(
            (
                c
                for c in catalog.get("components", [])
                if c.get("component_id") == inventory["component_id"]
            ),
            None,
        )
    return {
        **inventory,
        "uniform_name": catalog.get("name") if catalog else None,
        "category": catalog.get("category") if catalog else None,
        "component_name": (component.get("name") if component else None),
    }


@api_router.put("/uniforms/inventory/{inventory_id}")
async def update_uniform_inventory(
    inventory_id: str,
    data: UpdateUniformInventoryRequest,
    current_user: User = Depends(get_current_user),
):
    """Update uniform inventory details."""
    await require_permission("uniforms", current_user)
    existing = await db.uniform_inventory.find_one(
        {
            "inventory_id": inventory_id,
        }
    )
    if not existing:
        raise HTTPException(
            status_code=404,
            detail="Inventory not found",
        )
    update_data = data.model_dump(
        exclude_unset=True,
        exclude_none=True,
    )
    if not update_data:
        return {"message": "No changes provided"}
    # --------------------------------------------------------
    # QUANTITY PROTECTION
    # --------------------------------------------------------
    if "total_quantity" in update_data:
        new_total = update_data["total_quantity"]
        assigned = existing.get(
            "assigned_quantity",
            0,
        )
        repair = existing.get(
            "repair_quantity",
            0,
        )
        damaged = existing.get(
            "damaged_quantity",
            0,
        )
        minimum_required = assigned + repair + damaged
        if new_total < minimum_required:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Total quantity cannot be less than "
                    "assigned, repair and damaged quantity."
                ),
            )
        update_data["available_quantity"] = new_total - assigned - repair - damaged
    update_data["updated_at"] = datetime.now(timezone.utc)
    await db.uniform_inventory.update_one(
        {
            "inventory_id": inventory_id,
        },
        {
            "$set": update_data,
        },
    )

    catalog = await db.uniform_catalog.find_one(
        {"catalog_id": existing["catalog_id"]},
        {"_id": 0, "name": 1, "components": 1},
    )

    component_name = "component"

    if catalog:
        component = next(
            (
                c
                for c in catalog.get("components", [])
                if c.get("component_id") == existing.get("component_id")
            ),
            None,
        )

        if component:
            component_name = component.get("name", "component")

    uniform_name = catalog.get("name", "uniform") if catalog else "uniform"

    await notify_all_users(
        "Uniform Stock Updated",
        f"{uniform_name} - {component_name} ({existing.get('size', 'size')}) stock was updated.",
    )

    return {"message": "Inventory updated successfully"}


# ============================================================
# RETURN UNIFORM COMPONENTS
# ============================================================
@api_router.put("/uniforms/return/{assignment_id}")
async def return_uniform(
    assignment_id: str,
    data: ReturnUniformRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Return selected components from a uniform assignment.
    Admin / permitted users:
        Can return components for any member.
    Normal members:
        Can return components only from their own assignment.
    Supports partial and complete returns.
    """
    # ========================================================
    # FIND ASSIGNMENT
    # ========================================================
    assignment = await db.member_uniforms.find_one(
        {
            "assignment_id": assignment_id,
        },
        {
            "_id": 0,
        },
    )
    if not assignment:
        raise HTTPException(
            status_code=404,
            detail="Assignment not found",
        )
    # ========================================================
    # PERMISSION / OWNERSHIP
    # ========================================================
    is_admin = current_user.role == "admin"
    has_uniform_permission = False
    try:
        await require_permission(
            "uniforms",
            current_user,
        )
        has_uniform_permission = True
    except HTTPException:
        has_uniform_permission = False
    # Normal member can only return their own uniform.
    if not is_admin and not has_uniform_permission:
        if assignment.get("user_id") != current_user.user_id:
            raise HTTPException(
                status_code=403,
                detail=("You can only return " "your own uniform"),
            )
    # ========================================================
    # VALIDATE REQUEST
    # ========================================================
    if not data.components:
        raise HTTPException(
            status_code=400,
            detail="At least one component must be selected",
        )
    components = assignment.get(
        "components",
        [],
    )
    return_updates = {
        item.component_id: item.condition_returned for item in data.components
    }
    # Prevent duplicate component entries.
    if len(return_updates) != len(data.components):
        raise HTTPException(
            status_code=400,
            detail="Duplicate component in return request",
        )
    returned_any = False
    # ========================================================
    # PROCESS RETURNS
    # ========================================================
    for component in components:
        component_id = component.get("component_id")
        if component_id not in return_updates:
            continue
        current_status = component.get("status")
        # Only assigned or repair components can be returned.
        if current_status not in [
            "assigned",
            "repair",
        ]:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"{component.get('component_name', 'Component')} "
                    "is not currently active"
                ),
            )
        inventory_id = component.get("inventory_id")
        quantity = component.get(
            "quantity",
            1,
        )
        condition = (return_updates[component_id] or "").strip().lower()
        # ----------------------------------------------------
        # VALIDATE CONDITION
        # ----------------------------------------------------
        if condition not in [
            "good",
            "new",
            "usable",
            "damaged",
            "lost",
        ]:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Invalid return condition. "
                    "Use good, new, usable, damaged, "
                    "or lost."
                ),
            )
        # ----------------------------------------------------
        # INVENTORY
        # ----------------------------------------------------
        if not inventory_id:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"{component.get('component_name', 'Component')} "
                    "is not linked to inventory"
                ),
            )
        inventory = await db.uniform_inventory.find_one(
            {
                "inventory_id": inventory_id,
            }
        )
        if not inventory:
            raise HTTPException(
                status_code=404,
                detail=(
                    f"Inventory not found for "
                    f"{component.get('component_name', 'component')}"
                ),
            )
        # ----------------------------------------------------
        # INVENTORY MOVEMENT
        # ----------------------------------------------------
        inventory_update = {}
        # Component was assigned and is now being returned.
        if current_status == "assigned":
            inventory_update["assigned_quantity"] = -quantity
        # Component was already moved from assigned
        # into repair when the repair request was created.
        elif current_status == "repair":
            inventory_update["repair_quantity"] = -quantity
        # ----------------------------------------------------
        # GOOD / USABLE
        # ----------------------------------------------------
        if condition in [
            "good",
            "new",
            "usable",
        ]:
            inventory_update["available_quantity"] = quantity
        # ----------------------------------------------------
        # DAMAGED
        # ----------------------------------------------------
        elif condition == "damaged":
            inventory_update["damaged_quantity"] = quantity
        # ----------------------------------------------------
        # LOST
        # ----------------------------------------------------
        elif condition == "lost":
            # Lost inventory leaves active stock and
            # does not return to available stock.
            pass
        # ----------------------------------------------------
        # UPDATE INVENTORY
        # ----------------------------------------------------
        await db.uniform_inventory.update_one(
            {
                "inventory_id": inventory_id,
            },
            {
                "$inc": inventory_update,
                "$set": {
                    "updated_at": datetime.now(timezone.utc),
                },
            },
        )
        # ----------------------------------------------------
        # UPDATE COMPONENT
        # ----------------------------------------------------
        component["status"] = "returned"
        component["condition_returned"] = condition
        returned_any = True
    # ========================================================
    # NOTHING RETURNED
    # ========================================================
    if not returned_any:
        raise HTTPException(
            status_code=400,
            detail=("No active components selected " "for return"),
        )
    # ========================================================
    # ASSIGNMENT STATUS
    # ========================================================
    all_returned = all(
        component.get("status") == "returned" for component in components
    )
    any_active = any(
        component.get("status")
        in [
            "assigned",
            "repair",
        ]
        for component in components
    )
    if all_returned:
        assignment_status = "returned"
    elif any_active:
        assignment_status = "partial"
    else:
        assignment_status = "returned"
    # ========================================================
    # UPDATE ASSIGNMENT
    # ========================================================
    update_data = {
        "components": components,
        "assignment_status": assignment_status,
        "updated_at": datetime.now(timezone.utc),
    }
    # Only set return_date when at least one component
    # has actually been returned.
    if data.return_date:
        update_data["return_date"] = data.return_date
    if data.remarks is not None:
        update_data["remarks"] = data.remarks
    await db.member_uniforms.update_one(
        {
            "assignment_id": assignment_id,
        },
        {
            "$set": update_data,
        },
    )
    # ========================================================
    # RESPONSE
    # ========================================================
    return {
        "message": ("Uniform components returned successfully"),
        "assignment_id": assignment_id,
        "assignment_status": assignment_status,
        "returned_components": [
            {
                "component_id": component.get("component_id"),
                "component_name": component.get("component_name"),
                "condition_returned": component.get("condition_returned"),
            }
            for component in components
            if component.get("status") == "returned"
            and component.get("component_id") in return_updates
        ],
    }


@api_router.delete("/uniforms/inventory/{inventory_id}")
async def delete_uniform_inventory(
    inventory_id: str,
    current_user: User = Depends(require_admin),
):
    """Delete uniform inventory."""
    inventory = await db.uniform_inventory.find_one(
        {
            "inventory_id": inventory_id,
        }
    )
    if not inventory:
        raise HTTPException(
            status_code=404,
            detail="Inventory not found",
        )
    assigned = await db.member_uniforms.count_documents(
        {
            "components": {
                "$elemMatch": {
                    "inventory_id": inventory_id,
                    "status": {
                        "$in": [
                            "assigned",
                            "repair",
                        ]
                    },
                }
            }
        }
    )
    if assigned > 0:
        raise HTTPException(
            status_code=400,
            detail=(
                "Inventory is currently assigned " "to members and cannot be deleted."
            ),
        )
    await db.uniform_inventory.delete_one(
        {
            "inventory_id": inventory_id,
        }
    )
    return {"message": "Inventory deleted successfully"}


# ============================================================
# ASSIGN UNIFORM PACKAGE
# ============================================================
@api_router.post("/uniforms/assign")
async def assign_uniform(
    data: AssignUniformRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Assign a uniform package to a member.
    Supports:
    - Full assignment
    - Partial assignment
    - Mandatory components
    - Component-specific sizes
    - Component-specific payment
    - Component-specific quantities
    Inventory is validated completely before stock is changed.
    """
    await require_permission("uniforms", current_user)
    # ========================================================
    # MEMBER
    # ========================================================
    member = await db.users.find_one(
        {
            "user_id": data.user_id,
            "role": {"$ne": "admin"},
        },
        {
            "_id": 0,
            "user_id": 1,
            "name": 1,
        },
    )
    if not member:
        raise HTTPException(
            status_code=404,
            detail="Member not found",
        )
    # ========================================================
    # CATALOG
    # ========================================================
    catalog = await db.uniform_catalog.find_one(
        {
            "catalog_id": data.catalog_id,
            "active": True,
        },
        {
            "_id": 0,
        },
    )
    if not catalog:
        raise HTTPException(
            status_code=404,
            detail="Uniform catalog not found",
        )
    catalog_components = {
        component["component_id"]: component
        for component in catalog.get("components", [])
    }
    if not catalog_components:
        raise HTTPException(
            status_code=400,
            detail="This uniform package has no components",
        )
    # ========================================================
    # VALIDATE REQUEST
    # ========================================================
    if not data.components:
        raise HTTPException(
            status_code=400,
            detail="At least one component is required",
        )
    requested_component_ids = set()
    for requested in data.components:
        # Prevent duplicate component entries
        if requested.component_id in requested_component_ids:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Component {requested.component_id} " "was provided more than once"
                ),
            )
        requested_component_ids.add(requested.component_id)
        component = catalog_components.get(requested.component_id)
        if not component:
            raise HTTPException(
                status_code=400,
                detail=(f"Invalid component: " f"{requested.component_id}"),
            )
        # ----------------------------------------------------
        # PENDING COMPONENT
        # ----------------------------------------------------
        if not requested.assigned:
            continue
        # ----------------------------------------------------
        # ASSIGNED COMPONENT VALIDATION
        # ----------------------------------------------------
        if not requested.inventory_id:
            raise HTTPException(
                status_code=400,
                detail=(f"Inventory is required for " f"{component['name']}"),
            )
        if not requested.size:
            raise HTTPException(
                status_code=400,
                detail=(f"Size is required for " f"{component['name']}"),
            )
        if requested.quantity < 1:
            raise HTTPException(
                status_code=400,
                detail=(f"Quantity must be at least 1 for " f"{component['name']}"),
            )
        # ----------------------------------------------------
        # INVENTORY
        # ----------------------------------------------------
        inventory = await db.uniform_inventory.find_one(
            {
                "inventory_id": requested.inventory_id,
                "catalog_id": data.catalog_id,
                "component_id": requested.component_id,
            },
            {
                "_id": 0,
            },
        )
        if not inventory:
            raise HTTPException(
                status_code=404,
                detail=(f"Inventory not found for " f"{component['name']}"),
            )
        # ----------------------------------------------------
        # SIZE
        # ----------------------------------------------------
        if requested.size != inventory.get("size"):
            raise HTTPException(
                status_code=400,
                detail=(f"Size mismatch for " f"{component['name']}"),
            )
        # ----------------------------------------------------
        # STOCK
        # ----------------------------------------------------
        available_quantity = inventory.get(
            "available_quantity",
            0,
        )
        if available_quantity < requested.quantity:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Not enough stock for "
                    f"{component['name']}. "
                    f"Available: {available_quantity}, "
                    f"Requested: {requested.quantity}"
                ),
            )
    # ========================================================
    # DUPLICATE ACTIVE PACKAGE
    # ========================================================
    existing = await db.member_uniforms.find_one(
        {
            "user_id": data.user_id,
            "catalog_id": data.catalog_id,
            "assignment_status": {
                "$in": [
                    "pending",
                    "partial",
                    "complete",
                ],
            },
        },
        {
            "_id": 0,
        },
    )
    if existing:
        raise HTTPException(
            status_code=400,
            detail=("This uniform package is already " "assigned to this member"),
        )
    # ========================================================
    # BUILD ASSIGNMENT COMPONENTS
    # ========================================================
    assignment_components = []
    assigned_components = []
    mandatory_components = [
        component
        for component in catalog.get(
            "components",
            [],
        )
        if component.get(
            "is_mandatory",
            True,
        )
    ]
    for requested in data.components:
        component = catalog_components[requested.component_id]
        # ----------------------------------------------------
        # PENDING
        # ----------------------------------------------------
        if not requested.assigned:
            assignment_component = UniformAssignmentComponent(
                component_id=component["component_id"],
                inventory_id=None,
                component_name=component["name"],
                size=None,
                assigned=False,
                quantity=0,
                paid=False,
                condition_given="new",
                status="pending",
            )
            assignment_components.append(assignment_component)
            continue
        # ----------------------------------------------------
        # ASSIGNED
        # ----------------------------------------------------
        inventory = await db.uniform_inventory.find_one(
            {
                "inventory_id": requested.inventory_id,
                "catalog_id": data.catalog_id,
                "component_id": requested.component_id,
            },
            {
                "_id": 0,
            },
        )
        assignment_component = UniformAssignmentComponent(
            component_id=component["component_id"],
            inventory_id=inventory["inventory_id"],
            component_name=component["name"],
            size=requested.size,
            assigned=True,
            quantity=requested.quantity,
            paid=requested.paid,
            condition_given=(requested.condition_given),
            status="assigned",
        )
        assignment_components.append(assignment_component)
        assigned_components.append(assignment_component)
    # ========================================================
    # MANDATORY COMPONENT STATUS
    # ========================================================
    assigned_component_ids = {
        component.component_id for component in assigned_components
    }
    mandatory_complete = all(
        component["component_id"] in assigned_component_ids
        for component in mandatory_components
    )
    if mandatory_complete:
        assignment_status = "complete"
    elif assigned_components:
        assignment_status = "partial"
    else:
        assignment_status = "pending"
    # ========================================================
    # PAYMENT STATUS
    # ========================================================
    if not assigned_components:
        payment_status = "unpaid"
    elif all(component.paid for component in assigned_components):
        payment_status = "paid"
    elif any(component.paid for component in assigned_components):
        payment_status = "partial"
    else:
        payment_status = "unpaid"
    # ========================================================
    # UPDATE INVENTORY
    # ========================================================
    #
    # All validation has already succeeded above.
    #
    for component in assigned_components:
        if not component.inventory_id:
            continue
        result = await db.uniform_inventory.update_one(
            {
                "inventory_id": component.inventory_id,
                "available_quantity": {
                    "$gte": component.quantity,
                },
            },
            {
                "$inc": {
                    "available_quantity": -component.quantity,
                    "assigned_quantity": component.quantity,
                },
                "$set": {
                    "updated_at": datetime.now(timezone.utc),
                },
            },
        )
    if result.modified_count != 1:
        raise HTTPException(
            status_code=400,
            detail="Inventory changed or insufficient stock",
        )
    # ========================================================
    # CREATE ASSIGNMENT
    # ========================================================
    assignment = MemberUniform(
        user_id=data.user_id,
        catalog_id=data.catalog_id,
        uniform_name=catalog["name"],
        components=assignment_components,
        assignment_status=assignment_status,
        payment_status=payment_status,
        member_notes=data.member_notes,
        assigned_date=data.assigned_date,
        assigned_by=current_user.user_id,
        remarks=data.remarks,
    )
    await db.member_uniforms.insert_one(assignment.model_dump())
    return assignment


# ============================================================
# GET ASSIGNED UNIFORMS
# ============================================================
@api_router.get("/uniforms/assigned")
async def get_assigned_uniforms(
    current_user: User = Depends(get_current_user),
):
    """
    Get uniform assignments.
    Admin / permitted users:
        See assignments for all members.
    Normal members:
        See only their own assignments.
    """
    # --------------------------------------------------------
    # DETERMINE ACCESS
    # --------------------------------------------------------
    has_uniform_permission = False
    try:
        await require_permission(
            "uniforms",
            current_user,
        )
        has_uniform_permission = True
    except HTTPException:
        has_uniform_permission = False
    # --------------------------------------------------------
    # QUERY
    # --------------------------------------------------------
    query = {}
    if not has_uniform_permission:
        query = {
            "user_id": current_user.user_id,
        }
    assignments = (
        await db.member_uniforms.find(
            query,
            {
                "_id": 0,
            },
        )
        .sort(
            "assigned_date",
            -1,
        )
        .to_list(5000)
    )
    # --------------------------------------------------------
    # ADD MEMBER DETAILS
    # --------------------------------------------------------
    result = []
    for assignment in assignments:
        member = await db.users.find_one(
            {
                "user_id": assignment.get("user_id"),
            },
            {
                "_id": 0,
                "user_id": 1,
                "name": 1,
                "its_no": 1,
                "picture": 1,
            },
        )
        result.append(
            {
                **assignment,
                "member": member,
            }
        )
    return result


# ============================================================
# GET ASSIGNMENT DETAILS
# ============================================================
@api_router.get("/uniforms/assignment/{assignment_id}")
async def get_assignment_details(
    assignment_id: str,
    current_user: User = Depends(get_current_user),
):
    """
    Get complete details of one uniform assignment.
    Admin / permitted users:
        Can view any assignment.
    Normal members:
        Can view only their own assignment.
    """
    # --------------------------------------------------------
    # FIND ASSIGNMENT
    # --------------------------------------------------------
    assignment = await db.member_uniforms.find_one(
        {
            "assignment_id": assignment_id,
        },
        {
            "_id": 0,
        },
    )
    if not assignment:
        raise HTTPException(
            status_code=404,
            detail="Assignment not found",
        )
    # --------------------------------------------------------
    # PERMISSION / OWNERSHIP
    # --------------------------------------------------------
    has_uniform_permission = False
    try:
        await require_permission(
            "uniforms",
            current_user,
        )
        has_uniform_permission = True
    except HTTPException:
        has_uniform_permission = False
    # Normal member can only access their own assignment.
    if not has_uniform_permission:
        if assignment.get("user_id") != current_user.user_id:
            raise HTTPException(
                status_code=403,
                detail=("You can only view " "your own uniform assignment"),
            )
    # --------------------------------------------------------
    # MEMBER
    # --------------------------------------------------------
    member = await db.users.find_one(
        {
            "user_id": assignment.get("user_id"),
        },
        {
            "_id": 0,
            "user_id": 1,
            "name": 1,
            "its_no": 1,
            "picture": 1,
            "instrument": 1,
        },
    )
    # --------------------------------------------------------
    # CATALOG
    # --------------------------------------------------------
    catalog = await db.uniform_catalog.find_one(
        {
            "catalog_id": assignment.get("catalog_id"),
        },
        {
            "_id": 0,
        },
    )
    # --------------------------------------------------------
    # INVENTORY DETAILS FOR COMPONENTS
    # --------------------------------------------------------
    components = []
    for component in assignment.get(
        "components",
        [],
    ):
        component_data = {
            **component,
        }
        inventory_id = component.get("inventory_id")
        if inventory_id:
            inventory = await db.uniform_inventory.find_one(
                {
                    "inventory_id": inventory_id,
                },
                {
                    "_id": 0,
                    "inventory_id": 1,
                    "size": 1,
                    "available_quantity": 1,
                    "assigned_quantity": 1,
                    "repair_quantity": 1,
                    "damaged_quantity": 1,
                    "purchase_price": 1,
                    "minimum_stock": 1,
                },
            )
            component_data["inventory"] = inventory
        components.append(component_data)
    # --------------------------------------------------------
    # RESPONSE
    # --------------------------------------------------------
    return {
        **assignment,
        "member": member,
        "catalog": catalog,
        "components": components,
    }


# ============================================================
# MY UNIFORM HISTORY
# ============================================================
@api_router.get("/uniforms/my/history")
async def get_my_uniform_history(
    current_user: User = Depends(get_current_user),
):
    """
    Get the current member's complete uniform history.
    Includes:
        - pending
        - partial
        - complete
        - returned
    """
    assignments = (
        await db.member_uniforms.find(
            {
                "user_id": current_user.user_id,
            },
            {
                "_id": 0,
            },
        )
        .sort(
            "assigned_date",
            -1,
        )
        .to_list(5000)
    )
    return assignments


# ============================================================
# MY UNIFORMS
# ============================================================
@api_router.get("/uniforms/my")
async def get_my_uniforms(
    current_user: User = Depends(get_current_user),
):
    """
    Return only the uniforms assigned to the logged-in member.
    This endpoint is intentionally different from the admin/
    permitted inventory endpoint.
    A normal member can see:
        - their own uniform assignments
        - component names
        - sizes
        - assigned/pending/repair/returned status
        - payment status
        - mandatory status
        - assignment dates
        - remarks
    It never returns another member's assignments.
    """
    assignments = (
        await db.member_uniforms.find(
            {
                "user_id": current_user.user_id,
            },
            {
                "_id": 0,
            },
        )
        .sort(
            "assigned_date",
            -1,
        )
        .to_list(1000)
    )
    result = []
    for assignment in assignments:
        catalog = await db.uniform_catalog.find_one(
            {
                "catalog_id": assignment.get("catalog_id"),
            },
            {
                "_id": 0,
                "name": 1,
                "category": 1,
                "description": 1,
                "images": 1,
                "available_sizes": 1,
                "is_mandatory": 1,
            },
        )
        components = assignment.get(
            "components",
            [],
        )
        # ====================================================
        # COMPONENT COUNTS
        # ====================================================
        total_components = len(components)
        assigned_components = sum(
            1 for component in components if component.get("status") == "assigned"
        )
        pending_components = sum(
            1 for component in components if component.get("status") == "pending"
        )
        repair_components = sum(
            1 for component in components if component.get("status") == "repair"
        )
        returned_components = sum(
            1 for component in components if component.get("status") == "returned"
        )
        lost_components = sum(
            1 for component in components if component.get("status") == "lost"
        )
        damaged_components = sum(
            1 for component in components if component.get("status") == "damaged"
        )
        # ====================================================
        # PAYMENT COUNTS
        # ====================================================
        paid_components = sum(
            1 for component in components if component.get("paid") is True
        )
        unpaid_components = sum(
            1 for component in components if component.get("paid") is not True
        )
        # ====================================================
        # ASSIGNMENT STATUS
        # ====================================================
        if total_components == 0:
            assignment_status = "pending"
        elif assigned_components == total_components:
            assignment_status = "complete"
        elif assigned_components > 0:
            assignment_status = "partial"
        elif returned_components == total_components:
            assignment_status = "returned"
        elif lost_components + damaged_components == total_components:
            assignment_status = "returned"
        else:
            assignment_status = "pending"
        # ====================================================
        # PAYMENT STATUS
        # ====================================================
        if total_components == 0:
            payment_status = "unpaid"
        elif paid_components == total_components:
            payment_status = "paid"
        elif paid_components > 0:
            payment_status = "partial"
        else:
            payment_status = "unpaid"
        # ====================================================
        # RESPONSE
        # ====================================================
        result.append(
            {
                **assignment,
                "uniform_name": (
                    catalog.get("name")
                    if catalog
                    else assignment.get(
                        "uniform_name",
                        "",
                    )
                ),
                "category": (catalog.get("category") if catalog else None),
                "description": (catalog.get("description") if catalog else None),
                "images": (catalog.get("images", []) if catalog else []),
                "is_mandatory": (
                    catalog.get(
                        "is_mandatory",
                        False,
                    )
                    if catalog
                    else False
                ),
                "assignment_status": assignment_status,
                "payment_status": payment_status,
                "component_summary": {
                    "total": total_components,
                    "assigned": assigned_components,
                    "pending": pending_components,
                    "repair": repair_components,
                    "returned": returned_components,
                    "lost": lost_components,
                    "damaged": damaged_components,
                },
                "payment_summary": {
                    "paid": paid_components,
                    "unpaid": unpaid_components,
                },
            }
        )
    return result


# ============================================================
# MY UNIFORM DETAILS
# ============================================================
@api_router.get("/uniforms/my/{assignment_id}")
async def get_my_uniform_details(
    assignment_id: str,
    current_user: User = Depends(get_current_user),
):
    """
    Get detailed information for one uniform assignment.
    A member can only access their own assignment.
    """
    assignment = await db.member_uniforms.find_one(
        {
            "assignment_id": assignment_id,
            "user_id": current_user.user_id,
        },
        {
            "_id": 0,
        },
    )
    if not assignment:
        raise HTTPException(
            status_code=404,
            detail="Uniform assignment not found",
        )
    # --------------------------------------------------------
    # CATALOG
    # --------------------------------------------------------
    catalog = await db.uniform_catalog.find_one(
        {
            "catalog_id": assignment.get("catalog_id"),
        },
        {
            "_id": 0,
            "catalog_id": 1,
            "name": 1,
            "category": 1,
            "description": 1,
            "available_sizes": 1,
            "images": 1,
            "is_mandatory": 1,
        },
    )
    components = assignment.get(
        "components",
        [],
    )
    # --------------------------------------------------------
    # COMPONENT DETAILS
    # --------------------------------------------------------
    detailed_components = []
    for component in components:
        inventory = None
        inventory_id = component.get("inventory_id")
        if inventory_id:
            inventory = await db.uniform_inventory.find_one(
                {
                    "inventory_id": inventory_id,
                },
                {
                    "_id": 0,
                    "inventory_id": 1,
                    "catalog_id": 1,
                    "size": 1,
                    "purchase_price": 1,
                },
            )
        detailed_components.append(
            {
                **component,
                "inventory": inventory,
                "status": component.get(
                    "status",
                    "pending",
                ),
                "assigned": component.get(
                    "assigned",
                    False,
                ),
                "paid": component.get(
                    "paid",
                    False,
                ),
                "quantity": component.get(
                    "quantity",
                    1,
                ),
                "condition_given": component.get(
                    "condition_given",
                    "new",
                ),
                "condition_returned": component.get("condition_returned"),
            }
        )
    # --------------------------------------------------------
    # COMPONENT STATUS COUNTS
    # --------------------------------------------------------
    total = len(detailed_components)
    assigned_count = sum(
        1 for component in detailed_components if component["status"] == "assigned"
    )
    pending_count = sum(
        1 for component in detailed_components if component["status"] == "pending"
    )
    repair_count = sum(
        1 for component in detailed_components if component["status"] == "repair"
    )
    returned_count = sum(
        1 for component in detailed_components if component["status"] == "returned"
    )
    lost_count = sum(
        1 for component in detailed_components if component["status"] == "lost"
    )
    damaged_count = sum(
        1 for component in detailed_components if component["status"] == "damaged"
    )
    paid_count = sum(
        1 for component in detailed_components if component["paid"] is True
    )
    unpaid_count = total - paid_count
    # --------------------------------------------------------
    # STATUS
    # --------------------------------------------------------
    if total == 0:
        assignment_status = "pending"
    elif assigned_count == total:
        assignment_status = "complete"
    elif assigned_count > 0:
        assignment_status = "partial"
    elif returned_count == total:
        assignment_status = "returned"
    elif lost_count + damaged_count == total:
        assignment_status = "returned"
    else:
        assignment_status = "pending"
    # --------------------------------------------------------
    # PAYMENT STATUS
    # --------------------------------------------------------
    if total == 0:
        payment_status = "unpaid"
    elif paid_count == total:
        payment_status = "paid"
    elif paid_count > 0:
        payment_status = "partial"
    else:
        payment_status = "unpaid"
    # --------------------------------------------------------
    # RESPONSE
    # --------------------------------------------------------
    return {
        **assignment,
        "uniform_name": (
            catalog.get("name")
            if catalog
            else assignment.get(
                "uniform_name",
                "",
            )
        ),
        "category": (catalog.get("category") if catalog else None),
        "description": (catalog.get("description") if catalog else None),
        "images": (catalog.get("images", []) if catalog else []),
        "is_mandatory": (
            catalog.get(
                "is_mandatory",
                False,
            )
            if catalog
            else False
        ),
        "components": detailed_components,
        "assignment_status": assignment_status,
        "payment_status": payment_status,
        "component_summary": {
            "total": total,
            "assigned": assigned_count,
            "pending": pending_count,
            "repair": repair_count,
            "returned": returned_count,
            "lost": lost_count,
            "damaged": damaged_count,
        },
        "payment_summary": {
            "paid": paid_count,
            "unpaid": unpaid_count,
        },
    }


# ============================================================
# UNIFORM REPAIR ENDPOINTS
# ============================================================
@api_router.post("/uniforms/repair")
async def create_uniform_repair(
    data: CreateRepairRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Create a repair request for an assigned uniform component.
    Normal members:
        Can request repair only for their own uniforms.
    Admin / permitted uniform users:
        Can create repair requests for members.
    """
    # --------------------------------------------------------
    # FIND ASSIGNMENT
    # --------------------------------------------------------
    assignment = await db.member_uniforms.find_one(
        {
            "assignment_id": data.assignment_id,
        },
        {
            "_id": 0,
        },
    )
    if not assignment:
        raise HTTPException(
            status_code=404,
            detail="Uniform assignment not found",
        )
    # --------------------------------------------------------
    # PERMISSION / OWNERSHIP
    # --------------------------------------------------------
    is_admin = current_user.role == "admin"
    has_uniform_permission = False
    try:
        await require_permission("uniforms", current_user)
        has_uniform_permission = True
    except HTTPException:
        has_uniform_permission = False
    # Normal member can only request repair for own uniform.
    if not is_admin and not has_uniform_permission:
        if assignment.get("user_id") != current_user.user_id:
            raise HTTPException(
                status_code=403,
                detail="You can only request repair for your own uniform",
            )
    # --------------------------------------------------------
    # FIND COMPONENT
    # --------------------------------------------------------
    components = assignment.get("components", [])
    component = next(
        (item for item in components if item.get("component_id") == data.component_id),
        None,
    )
    if not component:
        raise HTTPException(
            status_code=404,
            detail="Uniform component not found in assignment",
        )
    # --------------------------------------------------------
    # VALIDATE COMPONENT STATUS
    # --------------------------------------------------------
    if component.get("status") not in [
        "assigned",
    ]:
        raise HTTPException(
            status_code=400,
            detail="Only an assigned uniform can be sent for repair",
        )
    # --------------------------------------------------------
    # INVENTORY
    # --------------------------------------------------------
    inventory_id = component.get("inventory_id")
    if not inventory_id:
        raise HTTPException(
            status_code=400,
            detail="This uniform component is not linked to inventory",
        )
    inventory = await db.uniform_inventory.find_one(
        {
            "inventory_id": inventory_id,
        },
        {
            "_id": 0,
        },
    )
    if not inventory:
        raise HTTPException(
            status_code=404,
            detail="Inventory record not found",
        )
    # --------------------------------------------------------
    # PREVENT DUPLICATE ACTIVE REPAIR
    # --------------------------------------------------------
    existing = await db.uniform_repairs.find_one(
        {
            "assignment_id": data.assignment_id,
            "component_id": data.component_id,
            "status": {
                "$in": [
                    "pending",
                    "in_progress",
                ]
            },
        }
    )
    if existing:
        raise HTTPException(
            status_code=400,
            detail="A repair request already exists for this uniform component",
        )
    # --------------------------------------------------------
    # CREATE REPAIR
    # --------------------------------------------------------
    repair = UniformRepair(
        assignment_id=data.assignment_id,
        catalog_id=assignment["catalog_id"],
        component_id=data.component_id,
        inventory_id=inventory_id,
        user_id=assignment["user_id"],
        issue=data.issue.strip(),
        description=data.description.strip() if data.description else None,
        priority=data.priority.lower(),
        status="pending",
        created_by=current_user.user_id,
    )
    await db.uniform_repairs.insert_one(repair.model_dump())
    # --------------------------------------------------------
    # MOVE COMPONENT TO REPAIR
    # --------------------------------------------------------
    quantity = component.get("quantity", 1)
    for item in components:
        if item.get("component_id") == data.component_id:
            item["status"] = "repair"
    await db.member_uniforms.update_one(
        {
            "assignment_id": data.assignment_id,
        },
        {
            "$set": {
                "components": components,
                "updated_at": datetime.now(timezone.utc),
            }
        },
    )
    # --------------------------------------------------------
    # UPDATE INVENTORY
    # --------------------------------------------------------
    await db.uniform_inventory.update_one(
        {
            "inventory_id": inventory_id,
        },
        {
            "$inc": {
                "assigned_quantity": -quantity,
                "repair_quantity": quantity,
            },
            "$set": {
                "updated_at": datetime.now(timezone.utc),
            },
        },
    )
    return repair


@api_router.get("/uniforms/repairs")
async def get_uniform_repairs(
    current_user: User = Depends(get_current_user),
):
    """Get all uniform repairs with assignment/member/inventory details."""
    await require_permission("uniforms", current_user)
    repairs = (
        await db.uniform_repairs.find(
            {},
            {"_id": 0},
        )
        .sort("created_at", -1)
        .to_list(5000)
    )
    result = []
    for repair in repairs:
        assignment = await db.member_uniforms.find_one(
            {
                "assignment_id": repair["assignment_id"],
            },
            {
                "_id": 0,
            },
        )
        member = None
        if assignment:
            member = await db.users.find_one(
                {
                    "user_id": assignment["user_id"],
                },
                {
                    "_id": 0,
                    "name": 1,
                    "its_no": 1,
                    "picture": 1,
                },
            )
        inventory = await db.uniform_inventory.find_one(
            {
                "inventory_id": repair["inventory_id"],
            },
            {
                "_id": 0,
            },
        )
        catalog = None
        if inventory:
            catalog = await db.uniform_catalog.find_one(
                {
                    "catalog_id": inventory["catalog_id"],
                },
                {
                    "_id": 0,
                    "name": 1,
                    "images": 1,
                    "category": 1,
                    "components": 1,
                },
            )
        # Find the specific component involved in this repair
        component = None
        if assignment:
            for item in assignment.get("components", []):
                if item.get("inventory_id") == repair["inventory_id"]:
                    component = item
                    break
        result.append(
            {
                **repair,
                "assignment": assignment,
                "member": member,
                "inventory": inventory,
                "catalog": catalog,
                "component": component,
            }
        )
    return result


@api_router.get("/uniforms/repair/{repair_id}")
async def get_repair_details(
    repair_id: str,
    current_user: User = Depends(get_current_user),
):
    """Get details of one uniform repair."""
    await require_permission("uniforms", current_user)
    repair = await db.uniform_repairs.find_one(
        {
            "repair_id": repair_id,
        },
        {
            "_id": 0,
        },
    )
    if not repair:
        raise HTTPException(
            status_code=404,
            detail="Repair not found",
        )
    assignment = await db.member_uniforms.find_one(
        {
            "assignment_id": repair["assignment_id"],
        },
        {
            "_id": 0,
        },
    )
    if not assignment:
        raise HTTPException(
            status_code=404,
            detail="Assignment not found",
        )
    inventory = await db.uniform_inventory.find_one(
        {
            "inventory_id": repair["inventory_id"],
        },
        {
            "_id": 0,
        },
    )
    if not inventory:
        raise HTTPException(
            status_code=404,
            detail="Inventory not found",
        )
    # Find the exact component being repaired
    component = None
    for item in assignment.get("components", []):
        if item.get("inventory_id") == repair["inventory_id"]:
            component = item
            break
    return {
        "repair": repair,
        "assignment": assignment,
        "inventory": inventory,
        "component": component,
    }


# ============================================================
# UPDATE UNIFORM REPAIR
# ============================================================
@api_router.put("/uniforms/repair/{repair_id}")
async def update_uniform_repair(
    repair_id: str,
    data: UpdateRepairRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Update an existing uniform repair.
    Admin / permitted uniform users can:
    - Change repair status
    - Set repair cost
    - Add remarks
    - Add resolution message
    - Set completed date
    The actual inventory movement is handled when the repair
    is completed through the complete endpoint.
    """
    await require_permission("uniforms", current_user)
    # --------------------------------------------------------
    # FIND REPAIR
    # --------------------------------------------------------
    repair = await db.uniform_repairs.find_one(
        {
            "repair_id": repair_id,
        },
        {
            "_id": 0,
        },
    )
    if not repair:
        raise HTTPException(
            status_code=404,
            detail="Repair not found",
        )
    # --------------------------------------------------------
    # VALIDATE STATUS
    # --------------------------------------------------------
    allowed_statuses = {
        "pending",
        "in_progress",
        "completed",
    }
    if data.status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid repair status. " "Use pending, in_progress, or completed."
            ),
        )
    # --------------------------------------------------------
    # PREVENT MANUAL COMPLETION THROUGH THIS ENDPOINT
    # --------------------------------------------------------
    if data.status == "completed" and repair.get("status") != "completed":
        raise HTTPException(
            status_code=400,
            detail=("Use the complete repair action to mark " "a repair as completed."),
        )
    # --------------------------------------------------------
    # BUILD UPDATE
    # --------------------------------------------------------
    update_data = {
        "status": data.status,
        "repair_cost": data.repair_cost or 0,
        "updated_at": datetime.now(timezone.utc),
    }
    if data.remarks is not None:
        update_data["notes"] = data.remarks.strip()
    if data.resolution_message is not None:
        update_data["resolution_message"] = data.resolution_message.strip()
    if data.completed_date is not None:
        update_data["completed_date"] = data.completed_date
    # --------------------------------------------------------
    # SAVE
    # --------------------------------------------------------
    await db.uniform_repairs.update_one(
        {
            "repair_id": repair_id,
        },
        {
            "$set": update_data,
        },
    )
    updated = await db.uniform_repairs.find_one(
        {
            "repair_id": repair_id,
        },
        {
            "_id": 0,
        },
    )
    return {
        "message": "Repair updated successfully",
        "repair": updated,
    }


# ============================================================
# COMPLETE UNIFORM REPAIR
# ============================================================
@api_router.put("/uniforms/repair/complete/{repair_id}")
async def complete_uniform_repair(
    repair_id: str,
    data: Optional[UpdateRepairRequest] = None,
    current_user: User = Depends(get_current_user),
):
    """
    Complete a uniform repair.
    This performs the actual workflow:
    Repair:
        pending / in_progress
            ↓
        completed
    Assignment component:
        repair
            ↓
        assigned
    Inventory:
        repair_quantity decreases
        assigned_quantity increases
    Also stores:
    - resolution message
    - repair cost
    - completed by
    - completed date
    """
    await require_permission("uniforms", current_user)
    # --------------------------------------------------------
    # FIND REPAIR
    # --------------------------------------------------------
    repair = await db.uniform_repairs.find_one(
        {
            "repair_id": repair_id,
        },
        {
            "_id": 0,
        },
    )
    if not repair:
        raise HTTPException(
            status_code=404,
            detail="Repair not found",
        )
    # --------------------------------------------------------
    # PREVENT DUPLICATE COMPLETION
    # --------------------------------------------------------
    if repair.get("status") == "completed":
        raise HTTPException(
            status_code=400,
            detail="Repair is already completed",
        )
    # --------------------------------------------------------
    # FIND ASSIGNMENT
    # --------------------------------------------------------
    assignment = await db.member_uniforms.find_one(
        {
            "assignment_id": repair["assignment_id"],
        },
        {
            "_id": 0,
        },
    )
    if not assignment:
        raise HTTPException(
            status_code=404,
            detail="Assignment not found",
        )
    # --------------------------------------------------------
    # FIND COMPONENT
    # --------------------------------------------------------
    components = assignment.get(
        "components",
        [],
    )
    repaired_component = None
    for component in components:
        if (
            component.get("component_id") == repair["component_id"]
            and component.get("status") == "repair"
        ):
            repaired_component = component
            break
    # --------------------------------------------------------
    # FALLBACK BY INVENTORY ID
    # --------------------------------------------------------
    if not repaired_component:
        for component in components:
            if (
                component.get("inventory_id") == repair["inventory_id"]
                and component.get("status") == "repair"
            ):
                repaired_component = component
                break
    if not repaired_component:
        raise HTTPException(
            status_code=404,
            detail=(
                "Repair component not found in assignment "
                "or it is no longer in repair status"
            ),
        )
    # --------------------------------------------------------
    # FIND INVENTORY
    # --------------------------------------------------------
    inventory = await db.uniform_inventory.find_one(
        {
            "inventory_id": repair["inventory_id"],
        },
        {
            "_id": 0,
        },
    )
    if not inventory:
        raise HTTPException(
            status_code=404,
            detail="Inventory not found",
        )
    # --------------------------------------------------------
    # QUANTITY
    # --------------------------------------------------------
    quantity = repaired_component.get(
        "quantity",
        1,
    )
    if quantity < 1:
        raise HTTPException(
            status_code=400,
            detail="Invalid repair quantity",
        )
    # --------------------------------------------------------
    # UPDATE COMPONENT
    # --------------------------------------------------------
    for component in components:
        if (
            component.get("component_id") == repaired_component.get("component_id")
            and component.get("status") == "repair"
        ):
            component["status"] = "assigned"
    # --------------------------------------------------------
    # UPDATE ASSIGNMENT
    # --------------------------------------------------------
    await db.member_uniforms.update_one(
        {
            "assignment_id": assignment["assignment_id"],
        },
        {
            "$set": {
                "components": components,
                "updated_at": datetime.now(timezone.utc),
            }
        },
    )
    # --------------------------------------------------------
    # UPDATE INVENTORY
    # --------------------------------------------------------
    await db.uniform_inventory.update_one(
        {
            "inventory_id": repair["inventory_id"],
        },
        {
            "$inc": {
                "repair_quantity": -quantity,
                "assigned_quantity": quantity,
            },
            "$set": {
                "updated_at": datetime.now(timezone.utc),
            },
        },
    )
    # --------------------------------------------------------
    # REPAIR COMPLETION DATA
    # --------------------------------------------------------
    completed_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    repair_update = {
        "status": "completed",
        "completed_by": current_user.user_id,
        "completed_date": completed_date,
        "updated_at": datetime.now(timezone.utc),
    }
    # --------------------------------------------------------
    # OPTIONAL COMPLETION MESSAGE / COST
    # --------------------------------------------------------
    if data is not None:
        if data.repair_cost is not None:
            repair_update["repair_cost"] = data.repair_cost
        if data.remarks is not None:
            repair_update["notes"] = data.remarks.strip()
        if data.resolution_message is not None:
            repair_update["resolution_message"] = data.resolution_message.strip()
        if data.completed_date:
            repair_update["completed_date"] = data.completed_date
    # --------------------------------------------------------
    # SAVE REPAIR
    # --------------------------------------------------------
    await db.uniform_repairs.update_one(
        {
            "repair_id": repair_id,
        },
        {
            "$set": repair_update,
        },
    )
    # --------------------------------------------------------
    # RETURN
    # --------------------------------------------------------
    updated_repair = await db.uniform_repairs.find_one(
        {
            "repair_id": repair_id,
        },
        {
            "_id": 0,
        },
    )
    return {
        "message": "Repair completed successfully",
        "repair_id": repair_id,
        "inventory_id": repair["inventory_id"],
        "quantity": quantity,
        "repair": updated_repair,
    }


@api_router.delete("/uniforms/repair/{repair_id}")
async def delete_uniform_repair(
    repair_id: str,
    current_user: User = Depends(require_admin),
):
    """Delete a uniform repair."""
    repair = await db.uniform_repairs.find_one(
        {
            "repair_id": repair_id,
        }
    )
    if not repair:
        raise HTTPException(
            status_code=404,
            detail="Repair not found",
        )
    if repair.get("status") == "in_progress":
        raise HTTPException(
            status_code=400,
            detail="Repair is currently in progress",
        )
    await db.uniform_repairs.delete_one(
        {
            "repair_id": repair_id,
        }
    )
    return {
        "message": "Repair deleted successfully",
    }


# ============================================================
# MY REPAIR REQUESTS
# ============================================================
@api_router.get("/uniforms/my/repairs")
async def get_my_uniform_repairs(
    current_user: User = Depends(get_current_user),
):
    """
    Get repair requests belonging only to the logged-in member.
    Normal members can see:
        - their repair requests
        - uniform/package name
        - component name
        - issue
        - description
        - priority
        - repair status
        - repair cost
        - resolution message
        - dates
    """
    repairs = (
        await db.uniform_repairs.find(
            {
                "user_id": current_user.user_id,
            },
            {
                "_id": 0,
            },
        )
        .sort(
            "created_at",
            -1,
        )
        .to_list(1000)
    )
    result = []
    for repair in repairs:
        catalog = await db.uniform_catalog.find_one(
            {
                "catalog_id": repair.get("catalog_id"),
            },
            {
                "_id": 0,
                "name": 1,
                "category": 1,
                "images": 1,
            },
        )
        assignment = await db.member_uniforms.find_one(
            {
                "assignment_id": repair.get("assignment_id"),
                "user_id": current_user.user_id,
            },
            {
                "_id": 0,
                "assignment_id": 1,
                "uniform_name": 1,
                "components": 1,
            },
        )
        component = None
        if assignment:
            for item in assignment.get(
                "components",
                [],
            ):
                if item.get("component_id") == repair.get("component_id"):
                    component = item
                    break
        result.append(
            {
                **repair,
                "uniform_name": (
                    catalog.get("name")
                    if catalog
                    else repair.get(
                        "uniform_name",
                        "",
                    )
                ),
                "category": (catalog.get("category") if catalog else None),
                "images": (catalog.get("images", []) if catalog else []),
                "component": component,
            }
        )
    return result


# ============================================================
# MY REPAIR DETAILS
# ============================================================
@api_router.get("/uniforms/my/repairs/{repair_id}")
async def get_my_uniform_repair_details(
    repair_id: str,
    current_user: User = Depends(get_current_user),
):
    """
    Get one repair request belonging to the logged-in member.
    Ownership is enforced directly in the database query.
    """
    repair = await db.uniform_repairs.find_one(
        {
            "repair_id": repair_id,
            "user_id": current_user.user_id,
        },
        {
            "_id": 0,
        },
    )
    if not repair:
        raise HTTPException(
            status_code=404,
            detail="Repair request not found",
        )
    assignment = await db.member_uniforms.find_one(
        {
            "assignment_id": repair.get("assignment_id"),
            "user_id": current_user.user_id,
        },
        {
            "_id": 0,
        },
    )
    if not assignment:
        raise HTTPException(
            status_code=404,
            detail="Uniform assignment not found",
        )
    catalog = await db.uniform_catalog.find_one(
        {
            "catalog_id": repair.get("catalog_id"),
        },
        {
            "_id": 0,
        },
    )
    component = None
    for item in assignment.get(
        "components",
        [],
    ):
        if item.get("component_id") == repair.get("component_id"):
            component = item
            break
    return {
        "repair": repair,
        "uniform": {
            "catalog_id": assignment.get("catalog_id"),
            "name": (
                catalog.get("name")
                if catalog
                else assignment.get(
                    "uniform_name",
                    "",
                )
            ),
            "category": (catalog.get("category") if catalog else None),
            "images": (catalog.get("images", []) if catalog else []),
        },
        "component": component,
        "assignment": assignment,
    }


# ============= UNIFORM PURCHASE ENDPOINTS =============
@api_router.post("/uniforms/purchase")
async def purchase_uniform_stock(
    data: UniformPurchase,
    current_user: User = Depends(get_current_user),
):
    """Purchase new stock for a specific uniform component and size."""
    await require_permission("uniforms", current_user)
    # --------------------------------------------------------
    # CATALOG
    # --------------------------------------------------------
    catalog = await db.uniform_catalog.find_one(
        {
            "catalog_id": data.catalog_id,
            "active": True,
        },
        {
            "_id": 0,
        },
    )
    if not catalog:
        raise HTTPException(
            status_code=404,
            detail="Uniform catalog not found",
        )
    # --------------------------------------------------------
    # COMPONENT
    # --------------------------------------------------------
    component = next(
        (
            component
            for component in catalog.get("components", [])
            if component.get("component_id") == data.component_id
        ),
        None,
    )
    if not component:
        raise HTTPException(
            status_code=404,
            detail="Uniform component not found in this catalog",
        )
    # --------------------------------------------------------
    # INVENTORY
    # --------------------------------------------------------
    inventory = await db.uniform_inventory.find_one(
        {
            "inventory_id": data.inventory_id,
            "catalog_id": data.catalog_id,
            "component_id": data.component_id,
            "size": data.size,
        }
    )
    if not inventory:
        raise HTTPException(
            status_code=404,
            detail=(
                f"Inventory not found for "
                f"{component.get('name', 'component')} "
                f"size {data.size}"
            ),
        )
    # --------------------------------------------------------
    # VALIDATE QUANTITY
    # --------------------------------------------------------
    if data.quantity < 1:
        raise HTTPException(
            status_code=400,
            detail="Purchase quantity must be at least 1",
        )
    # --------------------------------------------------------
    # VALIDATE PRICE
    # --------------------------------------------------------
    if data.price_per_item < 0:
        raise HTTPException(
            status_code=400,
            detail="Price per item cannot be negative",
        )
    expected_total = round(
        data.price_per_item * data.quantity,
        2,
    )
    # Do not trust an incorrect total sent by frontend.
    purchase_total_price = expected_total
    # --------------------------------------------------------
    # CREATE PURCHASE RECORD
    # --------------------------------------------------------
    purchase = data.model_dump()
    purchase["total_price"] = purchase_total_price
    purchase["purchased_by"] = current_user.user_id
    purchase["created_at"] = datetime.now(timezone.utc)
    await db.uniform_purchases.insert_one(purchase)
    # --------------------------------------------------------
    # UPDATE INVENTORY
    # --------------------------------------------------------
    result = await db.uniform_inventory.update_one(
        {
            "inventory_id": inventory["inventory_id"],
        },
        {
            "$inc": {
                "total_quantity": data.quantity,
                "available_quantity": data.quantity,
            },
            "$set": {
                "updated_at": datetime.now(timezone.utc),
            },
        },
    )
    if result.modified_count != 1:
        # Roll back purchase if inventory update failed.
        await db.uniform_purchases.delete_one(
            {
                "purchase_id": purchase["purchase_id"],
            }
        )
        raise HTTPException(
            status_code=500,
            detail="Failed to update inventory after purchase",
        )
    return {
        "message": "Purchase added successfully",
        "purchase_id": purchase["purchase_id"],
        "inventory_id": inventory["inventory_id"],
        "component_id": data.component_id,
        "quantity_added": data.quantity,
        "total_price": purchase_total_price,
    }


# ============================================================
# GET UNIFORM PURCHASE HISTORY
# ============================================================
@api_router.get("/uniforms/purchases")
async def get_uniform_purchases(
    current_user: User = Depends(get_current_user),
):
    """
    Get uniform purchase history.
    Admin / permitted uniform users only.
    Includes catalog and component information.
    """
    await require_permission("uniforms", current_user)
    purchases = (
        await db.uniform_purchases.find(
            {},
            {
                "_id": 0,
            },
        )
        .sort(
            "purchase_date",
            -1,
        )
        .to_list(5000)
    )
    result = []
    for purchase in purchases:
        # ----------------------------------------------------
        # CATALOG
        # ----------------------------------------------------
        catalog = await db.uniform_catalog.find_one(
            {
                "catalog_id": purchase.get("catalog_id"),
            },
            {
                "_id": 0,
                "catalog_id": 1,
                "name": 1,
                "category": 1,
                "images": 1,
                "components": 1,
            },
        )
        # ----------------------------------------------------
        # COMPONENT
        # ----------------------------------------------------
        component = None
        if catalog:
            for item in catalog.get(
                "components",
                [],
            ):
                if item.get("component_id") == purchase.get("component_id"):
                    component = item
                    break
        # ----------------------------------------------------
        # INVENTORY
        # ----------------------------------------------------
        inventory = await db.uniform_inventory.find_one(
            {
                "inventory_id": purchase.get("inventory_id"),
            },
            {
                "_id": 0,
                "inventory_id": 1,
                "size": 1,
                "total_quantity": 1,
                "available_quantity": 1,
                "assigned_quantity": 1,
                "repair_quantity": 1,
                "damaged_quantity": 1,
            },
        )
        # ----------------------------------------------------
        # RESULT
        # ----------------------------------------------------
        result.append(
            {
                **purchase,
                "uniform_name": (catalog.get("name") if catalog else ""),
                "category": (catalog.get("category") if catalog else ""),
                "uniform_image": (catalog.get("image") if catalog else None),
                "component_name": (component.get("name") if component else ""),
                "component": component,
                "inventory": inventory,
            }
        )
    return result


# ============================================================
# GET PURCHASE DETAILS
# ============================================================
@api_router.get("/uniforms/purchase/{purchase_id}")
async def get_purchase_details(
    purchase_id: str,
    current_user: User = Depends(get_current_user),
):
    """
    Get complete details of one uniform purchase.
    Admin / permitted uniform users only.
    """
    await require_permission("uniforms", current_user)
    # --------------------------------------------------------
    # PURCHASE
    # --------------------------------------------------------
    purchase = await db.uniform_purchases.find_one(
        {
            "purchase_id": purchase_id,
        },
        {
            "_id": 0,
        },
    )
    if not purchase:
        raise HTTPException(
            status_code=404,
            detail="Purchase not found",
        )
    # --------------------------------------------------------
    # CATALOG
    # --------------------------------------------------------
    catalog = await db.uniform_catalog.find_one(
        {
            "catalog_id": purchase.get("catalog_id"),
        },
        {
            "_id": 0,
        },
    )
    # --------------------------------------------------------
    # COMPONENT
    # --------------------------------------------------------
    component = None
    if catalog:
        for item in catalog.get(
            "components",
            [],
        ):
            if item.get("component_id") == purchase.get("component_id"):
                component = item
                break
    # --------------------------------------------------------
    # INVENTORY
    # --------------------------------------------------------
    inventory = await db.uniform_inventory.find_one(
        {
            "inventory_id": purchase.get("inventory_id"),
        },
        {
            "_id": 0,
        },
    )
    # --------------------------------------------------------
    # RESPONSE
    # --------------------------------------------------------
    return {
        "purchase": purchase,
        "catalog": catalog,
        "component": component,
        "inventory": inventory,
    }


# ============================================================
# GENERAL INVENTORY - INSTRUMENTS / OTHERS
# ============================================================

INVENTORY_CATEGORIES = {"instrument", "other"}


def normalize_inventory_category(category: str) -> str:
    value = (category or "").strip().lower()
    if value not in INVENTORY_CATEGORIES:
        raise HTTPException(
            status_code=400, detail="Category must be 'instrument' or 'other'"
        )
    return value


@api_router.get("/inventory")
async def get_inventory_items(
    category: Optional[str] = None, current_user: User = Depends(get_current_user)
):
    query = {"active": True}
    if category is not None:
        query["category"] = normalize_inventory_category(category)
    return (
        await db.inventory_items.find(query, {"_id": 0}).sort("name", 1).to_list(5000)
    )


@api_router.get("/inventory/my")
async def get_my_inventory_assignments(current_user: User = Depends(get_current_user)):
    assignments = (
        await db.inventory_assignments.find(
            {"user_id": current_user.user_id}, {"_id": 0}
        )
        .sort("assigned_date", -1)
        .to_list(5000)
    )
    result = []
    for assignment in assignments:
        item = await db.inventory_items.find_one(
            {"item_id": assignment.get("item_id")}, {"_id": 0}
        )
        result.append({**assignment, "item": item})
    return result


@api_router.get("/inventory/assigned")
async def get_assigned_inventory(current_user: User = Depends(get_current_user)):
    await require_permission("inventory", current_user)
    assignments = (
        await db.inventory_assignments.find({}, {"_id": 0})
        .sort("assigned_date", -1)
        .to_list(5000)
    )
    result = []
    for assignment in assignments:
        item = await db.inventory_items.find_one(
            {"item_id": assignment.get("item_id")}, {"_id": 0}
        )
        member = await db.users.find_one(
            {"user_id": assignment.get("user_id")},
            {"_id": 0, "user_id": 1, "name": 1, "its_no": 1, "picture": 1},
        )
        result.append({**assignment, "item": item, "member": member})
    return result


@api_router.get("/inventory/{item_id}")
async def get_inventory_item(
    item_id: str, current_user: User = Depends(get_current_user)
):
    item = await db.inventory_items.find_one({"item_id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    return item


@api_router.post("/inventory")
async def create_inventory_item(
    data: CreateInventoryItemRequest, current_user: User = Depends(get_current_user)
):
    await require_permission("inventory", current_user)
    category = normalize_inventory_category(data.category)
    name = data.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Item name cannot be empty")
    now = datetime.now(timezone.utc)
    item = InventoryItem(
        name=name,
        category=category,
        description=data.description,
        images=data.images,
        total_quantity=data.total_quantity,
        available_quantity=data.total_quantity,
        assigned_quantity=0,
        repair_quantity=0,
        not_usable_quantity=0,
        condition=data.condition,
        active=True,
        created_by=current_user.user_id,
        created_at=now,
        updated_at=now,
    )
    await db.inventory_items.insert_one(item.model_dump())

    await notify_all_users(
        "New Inventory Item",
        f"{item.name} has been added to inventory.",
    )

    return item


@api_router.put("/inventory/{item_id}")
async def update_inventory_item(
    item_id: str,
    data: UpdateInventoryItemRequest,
    current_user: User = Depends(get_current_user),
):
    await require_permission("inventory", current_user)
    item = await db.inventory_items.find_one({"item_id": item_id})
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    updates = {}
    if data.name is not None:
        name = data.name.strip()
        if not name:
            raise HTTPException(status_code=400, detail="Item name cannot be empty")
        updates["name"] = name
    if data.category is not None:
        updates["category"] = normalize_inventory_category(data.category)
    if data.description is not None:
        updates["description"] = data.description
    if data.images is not None:
        updates["images"] = data.images
    if data.condition is not None:
        updates["condition"] = data.condition
    if data.active is not None:
        updates["active"] = data.active
    if data.total_quantity is not None:
        reserved = (
            int(item.get("assigned_quantity", 0) or 0)
            + int(item.get("repair_quantity", 0) or 0)
            + int(item.get("not_usable_quantity", 0) or 0)
        )
        if data.total_quantity < reserved:
            raise HTTPException(
                status_code=400,
                detail="Total quantity cannot be less than quantity currently assigned, under repair, or not usable",
            )
        updates["total_quantity"] = data.total_quantity
        updates["available_quantity"] = data.total_quantity - reserved
    if not updates:
        return {k: v for k, v in item.items() if k != "_id"}
    updates["updated_at"] = datetime.now(timezone.utc)

    await db.inventory_items.update_one(
        {"item_id": item_id},
        {"$set": updates},
    )

    updated_item = await db.inventory_items.find_one(
        {"item_id": item_id},
        {"_id": 0},
    )

    await notify_all_users(
        "Inventory Item Updated",
        f"{updated_item['name']} has been updated.",
    )

    return updated_item


@api_router.delete("/inventory/{item_id}")
async def delete_inventory_item(
    item_id: str, current_user: User = Depends(get_current_user)
):
    await require_admin(current_user)
    item = await db.inventory_items.find_one({"item_id": item_id})
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    active_usage = (
        int(item.get("assigned_quantity", 0) or 0)
        + int(item.get("repair_quantity", 0) or 0)
        + int(item.get("not_usable_quantity", 0) or 0)
    )
    if active_usage > 0:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete an item while stock is assigned, under repair, or not usable",
        )
    await db.inventory_items.update_one(
        {"item_id": item_id},
        {"$set": {"active": False, "updated_at": datetime.now(timezone.utc)}},
    )
    return {"message": "Inventory item deleted successfully"}


@api_router.post("/inventory/{item_id}/assign")
async def assign_inventory_item(
    item_id: str,
    data: AssignInventoryItemRequest,
    current_user: User = Depends(get_current_user),
):
    await require_permission("inventory", current_user)
    item = await db.inventory_items.find_one({"item_id": item_id})
    if not item or not item.get("active", True):
        raise HTTPException(status_code=404, detail="Active inventory item not found")
    member = await db.users.find_one({"user_id": data.user_id})
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    existing = await db.inventory_assignments.find_one(
        {"item_id": item_id, "user_id": data.user_id, "status": "assigned"}
    )
    if existing:
        raise HTTPException(
            status_code=400, detail="This item is already assigned to this member"
        )
    now = datetime.now(timezone.utc)
    assignment = InventoryAssignment(
        item_id=item_id,
        user_id=data.user_id,
        quantity=data.quantity,
        status="assigned",
        assigned_by=current_user.user_id,
        assigned_date=data.assigned_date,
        remarks=data.remarks,
        created_at=now,
        updated_at=now,
    )
    stock = await db.inventory_items.update_one(
        {
            "item_id": item_id,
            "active": True,
            "available_quantity": {"$gte": data.quantity},
        },
        {
            "$inc": {
                "available_quantity": -data.quantity,
                "assigned_quantity": data.quantity,
            },
            "$set": {"updated_at": now},
        },
    )
    if stock.modified_count != 1:
        raise HTTPException(status_code=400, detail="Not enough stock available")
    try:
        await db.inventory_assignments.insert_one(assignment.model_dump())
    except Exception:
        await db.inventory_items.update_one(
            {"item_id": item_id},
            {
                "$inc": {
                    "available_quantity": data.quantity,
                    "assigned_quantity": -data.quantity,
                },
                "$set": {"updated_at": datetime.now(timezone.utc)},
            },
        )
        raise HTTPException(
            status_code=500, detail="Failed to create inventory assignment"
        )
    return assignment


@api_router.put("/inventory/assignment/{assignment_id}/return")
async def return_inventory_assignment(
    assignment_id: str, current_user: User = Depends(get_current_user)
):
    assignment = await db.inventory_assignments.find_one(
        {"assignment_id": assignment_id}
    )
    if not assignment:
        raise HTTPException(status_code=404, detail="Inventory assignment not found")
    has_permission = False
    try:
        await require_permission("inventory", current_user)
        has_permission = True
    except HTTPException:
        pass
    if not has_permission and assignment.get("user_id") != current_user.user_id:
        raise HTTPException(
            status_code=403, detail="You can only return your own assignment"
        )
    if assignment.get("status") != "assigned":
        raise HTTPException(
            status_code=400, detail="Inventory is not currently assigned"
        )
    quantity = int(assignment.get("quantity", 0) or 0)
    now = datetime.now(timezone.utc)
    changed = await db.inventory_assignments.update_one(
        {"assignment_id": assignment_id, "status": "assigned"},
        {"$set": {"status": "returned", "updated_at": now}},
    )
    if changed.modified_count != 1:
        raise HTTPException(
            status_code=400, detail="Inventory assignment was already returned"
        )
    stock = await db.inventory_items.update_one(
        {"item_id": assignment.get("item_id"), "assigned_quantity": {"$gte": quantity}},
        {
            "$inc": {"assigned_quantity": -quantity, "available_quantity": quantity},
            "$set": {"updated_at": now},
        },
    )
    if stock.modified_count != 1:
        await db.inventory_assignments.update_one(
            {"assignment_id": assignment_id, "status": "returned"},
            {"$set": {"status": "assigned", "updated_at": datetime.now(timezone.utc)}},
        )
        raise HTTPException(status_code=500, detail="Failed to restore inventory stock")
    return {"message": "Inventory returned successfully"}


# ============= UNIFORM DASHBOARD ANALYTICS =============
@api_router.get("/uniforms/dashboard")
async def get_uniform_dashboard(
    current_user: User = Depends(get_current_user),
):
    """Uniform Dashboard"""
    await require_permission("uniforms", current_user)
    inventory = await db.uniform_inventory.find(
        {},
        {"_id": 0},
    ).to_list(5000)
    repairs = await db.uniform_repairs.find(
        {},
        {"_id": 0},
    ).to_list(5000)
    purchases = await db.uniform_purchases.find(
        {},
        {"_id": 0},
    ).to_list(5000)
    assignments = await db.member_uniforms.find(
        {},
        {"_id": 0},
    ).to_list(5000)
    total_items = len(inventory)
    total_stock = sum(i["total_quantity"] for i in inventory)
    available_stock = sum(i["available_quantity"] for i in inventory)
    assigned_stock = sum(i["assigned_quantity"] for i in inventory)
    repair_stock = sum(i["repair_quantity"] for i in inventory)
    damaged_stock = sum(i["damaged_quantity"] for i in inventory)
    total_inventory_value = sum(
        (i.get("purchase_price") or 0) * (i.get("total_quantity") or 0)
        for i in inventory
    )
    total_purchase_cost = sum(p["total_price"] for p in purchases)
    pending_repairs = len([r for r in repairs if r["status"] != "completed"])
    completed_repairs = len([r for r in repairs if r["status"] == "completed"])
    total_repair_cost = sum(r.get("repair_cost") or 0 for r in repairs)
    low_stock = []
    out_of_stock = []
    for item in inventory:
        catalog = await db.uniform_catalog.find_one({"catalog_id": item["catalog_id"]})
        name = catalog["name"] if catalog else "Unknown"
        if item["available_quantity"] <= 0:
            out_of_stock.append(
                {
                    "inventory_id": item["inventory_id"],
                    "uniform_name": name,
                    "size": item["size"],
                }
            )
        elif item["available_quantity"] <= item["minimum_stock"]:
            low_stock.append(
                {
                    "inventory_id": item["inventory_id"],
                    "uniform_name": name,
                    "size": item["size"],
                    "available": item["available_quantity"],
                    "minimum": item["minimum_stock"],
                }
            )
    return {
        "summary": {
            "inventory_items": total_items,
            "total_stock": total_stock,
            "available_stock": available_stock,
            "assigned_stock": assigned_stock,
            "repair_stock": repair_stock,
            "damaged_stock": damaged_stock,
            "inventory_value": total_inventory_value,
            "purchase_cost": total_purchase_cost,
            "repair_cost": total_repair_cost,
            "pending_repairs": pending_repairs,
            "completed_repairs": completed_repairs,
            "assignments": len(assignments),
        },
        "alerts": {
            "low_stock": low_stock,
            "out_of_stock": out_of_stock,
        },
    }


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
    await db.member_uniforms.delete_many({"user_id": user_id})
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
    uniforms = []
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
    await db.attendance.create_index([("session_id", 1)])
    await db.attendance.create_index([("attendance_type", 1), ("date", -1)])
    await db.attendance.create_index([("date", -1)])
    await db.attendance.create_index([("user_id", 1), ("date", -1)])
    await db.fees.create_index([("user_id", 1), ("month", 1)], unique=True)
    await db.notifications.create_index([("user_id", 1)])
    await db.notifications.create_index([("created_at", -1)])
    await db.uniform_catalog.create_index("catalog_id", unique=True)
    await db.uniform_inventory.create_index("inventory_id", unique=True)
    await db.uniform_inventory.create_index(
        [
            ("catalog_id", 1),
            ("component_id", 1),
            ("size", 1),
        ],
        unique=True,
    )
    await db.member_uniforms.create_index("assignment_id", unique=True)
    await db.member_uniforms.create_index("user_id")
    await db.member_uniforms.create_index("components.inventory_id")
    await db.uniform_repairs.create_index("repair_id", unique=True)
    await db.uniform_repairs.create_index("assignment_id")
    await db.uniform_purchases.create_index("purchase_id", unique=True)
    await db.uniform_purchases.create_index("catalog_id")
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
        # Render backend
        "https://vajihi-scout-mumbra.onrender.com",
        # Vercel frontend
        "https://vajihi-scout-mumbra.vercel.app",
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
