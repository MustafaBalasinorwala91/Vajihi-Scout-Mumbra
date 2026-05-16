# Transfer Vajihi Scout App to Visual Studio Code - Complete Guide

## 🚀 Quick Overview

You have **3 methods** to transfer your code to VS Code:

1. **GitHub Push** (Recommended - Easiest)
2. **Manual Download** (File by file)
3. **ZIP Export** (If available)

---

## Method 1: GitHub Push (RECOMMENDED) ⭐

### Step 1: Connect GitHub Account
1. Go to your **Emergent Profile Settings**
2. Find **"GitHub Integration"** section
3. Click **"Connect GitHub Account"**
4. Authorize Emergent to access your GitHub

### Step 2: Push Code to GitHub
1. Click **"Save to GitHub"** button in Emergent
2. Create a new repository name: `vajihi-scout-mumbra`
3. Choose **Private** or **Public**
4. Click **Push** - All code will be uploaded!

### Step 3: Clone to Your Computer
Open terminal/command prompt and run:

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/vajihi-scout-mumbra.git

# Navigate into the folder
cd vajihi-scout-mumbra

# Open in VS Code
code .
```

✅ **Done!** All your code is now in VS Code!

---

## Method 2: Manual Download

If GitHub push is not available, download files manually:

### Project Structure
```
vajihi-scout-mumbra/
├── backend/
│   ├── server.py
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── app/
│   │   ├── (tabs)/
│   │   ├── admin/
│   │   ├── index.tsx
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   └── forgot-password.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── assets/
│   │   └── logo/
│   ├── package.json
│   ├── app.json
│   ├── tsconfig.json
│   └── .env
├── README.md
└── COMPLETE_APP_DOCUMENTATION.md
```

### Download Steps
1. Create empty folder on your computer: `vajihi-scout-mumbra`
2. Create subfolders: `backend`, `frontend`
3. Copy each file content from Emergent
4. Paste into corresponding files in VS Code

---

## 🛠️ Setup After Transfer

### Prerequisites to Install

1. **Node.js** (for frontend)
   - Download: https://nodejs.org/
   - Version: 18+ or 20+
   - Check: `node --version`

2. **Python** (for backend)
   - Download: https://www.python.org/
   - Version: 3.11+
   - Check: `python --version`

3. **MongoDB** (for database)
   - Download: https://www.mongodb.com/try/download/community
   - OR use MongoDB Atlas (cloud): https://www.mongodb.com/cloud/atlas

4. **VS Code**
   - Download: https://code.visualstudio.com/

5. **Git** (for version control)
   - Download: https://git-scm.com/

### VS Code Extensions (Recommended)
Install these extensions in VS Code:
- **Python** (by Microsoft)
- **Pylance** (Python IntelliSense)
- **ES7+ React/Redux/React-Native** snippets
- **Expo Tools**
- **MongoDB for VS Code**
- **GitLens**
- **Prettier** (Code formatter)

---

## 📦 Install Dependencies

### Backend Setup

1. Open terminal in VS Code (`Ctrl+` ` or View → Terminal)
2. Navigate to backend folder:

```bash
cd backend
```

3. Create Python virtual environment:

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Mac/Linux
python3 -m venv venv
source venv/bin/activate
```

4. Install dependencies:

```bash
pip install -r requirements.txt
```

### Frontend Setup

1. Open **new terminal** in VS Code
2. Navigate to frontend folder:

```bash
cd frontend
```

3. Install Node packages:

```bash
npm install
# OR
yarn install
```

---

## 🔧 Configure Environment Variables

### Backend `.env` File

Create/Edit `backend/.env`:

```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=vajihi_scout_db
```

**If using MongoDB Atlas (Cloud):**
```env
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/
DB_NAME=vajihi_scout_db
```

### Frontend `.env` File

Create/Edit `frontend/.env`:

```env
EXPO_PUBLIC_BACKEND_URL=http://localhost:8001
```

---

## ▶️ Run the Application Locally

### Start MongoDB

**Option 1: Local MongoDB**
```bash
# Windows
"C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe"

# Mac
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

**Option 2: MongoDB Atlas**
- Already running in cloud (no action needed)

### Start Backend Server

Open terminal in `backend` folder:

```bash
# Make sure virtual environment is activated
# You should see (venv) in terminal

# Run FastAPI server
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

✅ Backend running at: `http://localhost:8001`

### Start Frontend App

Open **new terminal** in `frontend` folder:

```bash
# Start Expo
npx expo start
```

You'll see:
```
Metro waiting on exp://192.168.x.x:8081
› Press w │ open web

› Press a │ open Android
› Press i │ open iOS simulator
```

**Options:**
- Press `w` - Open in web browser
- Press `a` - Open in Android emulator
- Press `i` - Open in iOS simulator (Mac only)
- Scan QR code with Expo Go app on phone

✅ Frontend running!

---

## 📱 Test on Your Phone

### Install Expo Go App

**Android:**
- Google Play Store → "Expo Go"

**iOS:**
- App Store → "Expo Go"

### Connect
1. Make sure phone and computer are on **same WiFi**
2. Open Expo Go app
3. Scan QR code from terminal
4. App will load on your phone!

---

## 🐛 Common Issues & Solutions

### Issue 1: MongoDB Connection Failed

**Error:** `MongoServerError: connect ECONNREFUSED`

**Solution:**
```bash
# Check if MongoDB is running
# Windows
tasklist | findstr mongod

# Mac/Linux
ps aux | grep mongod

# If not running, start MongoDB
# Windows
net start MongoDB

# Mac
brew services start mongodb-community
```

### Issue 2: Backend Port Already in Use

**Error:** `Address already in use: 8001`

**Solution:**
```bash
# Windows
netstat -ano | findstr :8001
taskkill /PID <PID_NUMBER> /F

# Mac/Linux
lsof -ti:8001 | xargs kill
```

### Issue 3: Frontend Can't Connect to Backend

**Error:** `Network request failed`

**Solution:**
1. Check backend is running at `http://localhost:8001`
2. Update frontend `.env`:
   ```env
   EXPO_PUBLIC_BACKEND_URL=http://localhost:8001
   ```
3. Restart frontend: `npx expo start --clear`

### Issue 4: Module Not Found

**Error:** `Cannot find module 'expo-router'`

**Solution:**
```bash
cd frontend
rm -rf node_modules
npm install
# OR
yarn install
```

### Issue 5: Python Dependencies Error

**Error:** `ModuleNotFoundError: No module named 'fastapi'`

**Solution:**
```bash
cd backend
pip install -r requirements.txt --force-reinstall
```

---

## 🔄 Development Workflow

### Making Changes

1. **Edit Code** in VS Code
2. **Save File** (`Ctrl+S`)
3. **Auto-Reload** happens automatically
   - Backend: FastAPI reloads with `--reload` flag
   - Frontend: Metro bundler hot-reloads

### Testing

1. **Backend API Testing:**
   ```bash
   # Test endpoints with curl
   curl http://localhost:8001/api/users
   ```

2. **Frontend Testing:**
   - Changes reflect immediately in app
   - Check browser console for errors

### Git Version Control

```bash
# Initialize git (if not using GitHub method)
git init
git add .
git commit -m "Initial commit"

# Save changes
git add .
git commit -m "Added new feature"

# Push to GitHub
git remote add origin https://github.com/YOUR_USERNAME/vajihi-scout-mumbra.git
git push -u origin main
```

---

## 📂 File Structure Explanation

### Backend Files
```
backend/
├── server.py          # Main FastAPI application (ALL APIs)
├── requirements.txt   # Python dependencies
└── .env              # Environment variables (MongoDB URL)
```

### Frontend Files
```
frontend/
├── app/              # All screens (Expo Router)
│   ├── (tabs)/      # Bottom tab screens
│   ├── admin/       # Admin-only screens
│   ├── index.tsx    # Splash screen
│   ├── login.tsx    # Login screen
│   └── signup.tsx   # Signup screen
├── contexts/        # React contexts (Auth)
├── assets/          # Images, logo
├── package.json     # Node dependencies
└── .env            # Environment variables
```

---

## 🚀 Deployment (Optional)

### Deploy Backend

**Options:**
1. **Railway** - https://railway.app
2. **Render** - https://render.com
3. **Heroku** - https://heroku.com
4. **AWS/Google Cloud/Azure**

### Deploy Frontend

**Options:**
1. **Expo EAS Build** (Recommended)
   ```bash
   npx eas build --platform android
   npx eas build --platform ios
   ```

2. **Netlify/Vercel** (for web version)

---

## 📚 Additional Resources

### Documentation
- **Expo Docs:** https://docs.expo.dev
- **FastAPI Docs:** https://fastapi.tiangolo.com
- **MongoDB Docs:** https://www.mongodb.com/docs
- **React Native Docs:** https://reactnative.dev

### Tutorials
- **Expo Tutorial:** https://docs.expo.dev/tutorial/introduction/
- **FastAPI Tutorial:** https://fastapi.tiangolo.com/tutorial/
- **MongoDB Tutorial:** https://university.mongodb.com

### Community Support
- **Expo Discord:** https://chat.expo.dev
- **Stack Overflow:** Tag with `expo`, `fastapi`, `mongodb`
- **GitHub Issues:** Report bugs in your repository

---

## ✅ Checklist

Before starting development, make sure:

- [ ] Node.js installed (`node --version`)
- [ ] Python installed (`python --version`)
- [ ] MongoDB installed/configured
- [ ] VS Code installed
- [ ] Code transferred from Emergent
- [ ] Backend dependencies installed (`pip install -r requirements.txt`)
- [ ] Frontend dependencies installed (`npm install`)
- [ ] Environment variables configured (`.env` files)
- [ ] MongoDB running
- [ ] Backend server running (`http://localhost:8001`)
- [ ] Frontend app running (Expo)
- [ ] Git initialized (optional)

---

## 🆘 Need Help?

If you face any issues:

1. **Check Backend Logs** - Look at terminal where backend is running
2. **Check Frontend Logs** - Look at Metro bundler terminal
3. **Check Browser Console** - Press F12 in browser
4. **Search Error** - Google the error message
5. **Ask Community** - Stack Overflow, Expo Discord

---

## 🎉 You're All Set!

Your Vajihi Scout Mumbra app is now running locally in VS Code!

**Next Steps:**
1. Explore the code
2. Make modifications
3. Test changes
4. Deploy when ready
5. Share with your team!

**Happy Coding! 🚀**

---

**App Details:**
- **Name:** Vajihi Scout Mumbra
- **Frontend:** Expo (React Native + TypeScript)
- **Backend:** FastAPI (Python)
- **Database:** MongoDB
- **Admin:** vajihiadmin@53 / vajihiscout53
