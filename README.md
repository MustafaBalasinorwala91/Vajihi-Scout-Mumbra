# Vajihi Scout Mumbra - BGMM Scout & Band Management App

A comprehensive mobile application for managing the Vajihi Scout Mumbra organization, including attendance tracking, fee management, inventory control, and member profiles.

## 🎯 Features

### For All Members
- **Google OAuth Login** - Secure sign-in with Google accounts via Emergent Auth
- **Profile Management** - Edit name, phone number, and profile photo (stored as base64)
- **Attendance Tracking** - View your own attendance records:
  - Practice Attendance
  - Khidmat Attendance
  - Monthly percentage calculations
  - Calendar view with weekly/monthly filters
- **Fees Dashboard** - View paid and due fees with complete history
- **Inventory View** - Browse musical instruments and equipment
- **Uniform Management** - Select and update your uniform size (S, M, L, XL, XXL)
- **Role Tags** - Display your assigned role/tag (if any)

### Admin-Only Features
- **Mark Attendance** - Mark practice and khidmat attendance for all members
- **Manage Fees** - Create, update, and track fee payments:
  - Individual fee management
  - Bulk fee generation for all members
  - Monthly fee tracking
- **Inventory Management** - Full CRUD operations for musical instruments:
  - Add new instruments
  - Update quantity and condition
  - Track instrument status (Good, Needs Repair, Damaged)
- **Assign Tags/Roles** - Assign leadership roles to members:
  - Captain
  - Vice Captain
  - Band In Charge
  - Instrument In Charge
  - Trainer
- **Member Management** - View all members and their details

## 🏗️ Technology Stack

### Frontend
- **Expo** (React Native) - Cross-platform mobile app
- **Expo Router** - File-based routing
- **React Navigation** - Bottom tabs navigation
- **TypeScript** - Type-safe development
- **Expo Image Picker** - Profile photo selection
- **date-fns** - Date manipulation and formatting
- **Zustand** - State management
- **AsyncStorage** - Local data persistence

### Backend
- **FastAPI** - High-performance Python web framework
- **MongoDB** - NoSQL database
- **Motor** - Async MongoDB driver
- **httpx** - HTTP client for Emergent Auth integration
- **Pydantic** - Data validation

### Authentication
- **Emergent Google OAuth** - Secure authentication flow
- **Session-based auth** - 7-day session tokens
- **HttpOnly cookies** - Secure token storage

## 📱 App Structure

```
/app/frontend/
├── app/
│   ├── (tabs)/                 # Main app screens
│   │   ├── home.tsx           # Dashboard
│   │   ├── attendance.tsx     # Attendance view
│   │   ├── fees.tsx           # Fees view
│   │   ├── inventory.tsx      # Inventory view
│   │   └── profile.tsx        # Profile management
│   ├── admin/                 # Admin-only screens
│   │   ├── mark-attendance.tsx
│   │   ├── manage-fees.tsx
│   │   ├── manage-inventory.tsx
│   │   └── assign-tags.tsx
│   ├── index.tsx              # Splash screen
│   ├── login.tsx              # Login screen
│   ├── auth-callback.tsx      # OAuth callback handler
│   └── _layout.tsx            # Root layout
├── contexts/
│   └── AuthContext.tsx        # Authentication context
└── assets/
    └── logo/
        └── vajihi-scout-logo.png

/app/backend/
└── server.py                  # FastAPI backend with all endpoints
```

## 🔐 Authentication & Authorization

### Admin Account
- **Email**: mansoorkholkawala@gmail.com
- **Password**: man@0423
- Automatically created as admin on first login

### Role-Based Access Control
- **Admin**: Full access to all features + management screens
- **Member**: View own data, edit profile and uniform

## 🗄️ Database Schema

### Collections

**users**
- user_id (custom UUID)
- email
- name
- picture (base64)
- phone
- role (admin/member)
- tag (optional: captain, vice_captain, etc.)
- uniform_size
- created_at

**user_sessions**
- user_id
- session_token
- expires_at (7 days)
- created_at

**attendance**
- attendance_id
- user_id
- attendance_type (practice/khidmat)
- date (YYYY-MM-DD)
- status (present/absent)
- marked_by (admin user_id)
- created_at

**fees**
- fee_id
- user_id
- month (YYYY-MM)
- amount
- status (paid/due)
- paid_date
- updated_by
- created_at

**inventory**
- item_id
- name
- category (musical_instrument)
- quantity
- condition (good/needs_repair/damaged)
- added_by
- created_at
- updated_at

## 🚀 API Endpoints

### Authentication
- `POST /api/auth/session` - Exchange session_id for session_token
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### User Management
- `GET /api/users` - List all users
- `PUT /api/profile` - Update profile
- `PUT /api/profile/uniform` - Update uniform size

### Attendance
- `POST /api/attendance` - Mark attendance (admin)
- `GET /api/attendance/my/{type}` - Get own attendance
- `GET /api/attendance/user/{user_id}/{type}` - Get user attendance (admin)

### Fees
- `POST /api/fees` - Create/update fee (admin)
- `GET /api/fees/my` - Get own fees
- `GET /api/fees/user/{user_id}` - Get user fees (admin)
- `GET /api/fees/all` - Get all fees (admin)
- `POST /api/admin/generate-fees/{month}` - Generate monthly fees for all

### Inventory
- `POST /api/inventory` - Add item (admin)
- `GET /api/inventory` - View all items
- `PUT /api/inventory/{item_id}` - Update item (admin)
- `DELETE /api/inventory/{item_id}` - Delete item (admin)

### Admin
- `POST /api/admin/assign-tag` - Assign tag to user
- `PUT /api/admin/uniform/{user_id}` - Update user's uniform

## 🎨 Design System

### Colors
- **Primary**: #5B4FCE (Purple)
- **Secondary**: #F8D57E (Gold)
- **Background**: #1a1a2e (Dark Navy)
- **Success**: #4CAF50
- **Error**: #F44336
- **Warning**: #FF9800

### Role Tag Colors
- **Captain**: Gold (#FFD700)
- **Vice Captain**: Silver (#C0C0C0)
- **Band In Charge**: Purple (#5B4FCE)
- **Instrument In Charge**: Orange (#FF8C00)
- **Trainer**: Green (#32CD32)

## 📋 Key Features Details

### Attendance System
- Two separate types: Practice and Khidmat
- Calendar view with visual indicators (green=present, red=absent, gray=unmarked)
- Monthly and weekly views
- Automatic percentage calculation
- Admin can mark attendance for any date
- Members can only view their own attendance

### Fees Management
- Fixed monthly fee amount
- Bulk fee generation for all members
- Individual fee tracking
- Payment status (Paid/Due)
- Payment date recording
- Complete payment history

### Inventory System
- Musical instrument tracking
- Quantity management
- Condition tracking (Good, Needs Repair, Damaged)
- Admin-only editing
- Members can view all items

### Profile Management
- Photo upload (base64 storage)
- Name and phone editing
- Uniform size selection
- Role/tag display
- Logout functionality

## 🔧 Environment Variables

### Frontend (.env)
```
EXPO_TUNNEL_SUBDOMAIN=scout-mumbra-hub-1
EXPO_PACKAGER_HOSTNAME=https://scout-mumbra-hub-1.preview.emergentagent.com
EXPO_PUBLIC_BACKEND_URL=https://scout-mumbra-hub-1.preview.emergentagent.com
```

### Backend (.env)
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=test_database
```

## ✅ Testing

All 28 backend tests passed successfully:
- Database connection ✅
- Authentication flow ✅
- User management ✅
- Attendance CRUD ✅
- Fees management ✅
- Inventory CRUD ✅
- Tag assignment ✅
- Role-based access control ✅

## 🔒 Security Features

- HttpOnly cookies for session tokens
- Secure SameSite cookie settings
- Role-based access control
- Admin-only endpoints protected
- Session expiry (7 days)
- MongoDB ObjectID exclusion in responses
- Custom user_id field for clean APIs

## 📱 Mobile-First Design

- Bottom tab navigation
- Touch-friendly 44px minimum touch targets
- Responsive layouts
- Platform-specific handling
- Gesture support
- Native feel and performance

## 🎯 Future Enhancements

Potential features for future versions:
- Push notifications for attendance reminders
- Event calendar
- Photo gallery for scout activities
- Document storage
- Performance analytics
- Export attendance/fee reports
- Multi-language support

## 👥 Credits

**Vajihi Scout Mumbra - BGMM**
"Long Live His Holiness"

Developed for the Vajihi Scout & Band organization in Mumbra.

## 📞 Support

For any issues or questions, please contact the admin at mansoorkholkawala@gmail.com
