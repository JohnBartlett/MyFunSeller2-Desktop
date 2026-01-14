# MyFunSeller2 - Startup Procedures

**Purpose**: This document defines the startup sequence for MyFunSeller2 development environment.

---

## Quick Start Command

When the user says **"start"** or **"startup"**, execute the following procedures automatically:

---

## Startup Sequence

### 1. Start Development Server
```bash
npm run dev
```
- Run in background mode
- Timeout: 300000ms (5 minutes)

### 2. Wait for Initialization
- Wait 5 seconds for processes to initialize
- Allow time for Vite build, database init, and service startup

### 3. Verify All Processes

Read the background process output and verify:

#### ✅ Frontend (Vite Dev Server)
- Main process built successfully
- Preload files built successfully
- Dev server running at http://localhost:5173

#### ✅ Backend (Electron Main Process)
- SQLite database initialized
- Database location: `C:\Users\johnb\AppData\MyFunSeller2\data\myfunseller.db`
- All 7 tables created with indexes
- WAL mode enabled

#### ✅ Services Initialized
- Items IPC handlers registered
- Images IPC handlers registered
- Listings IPC handlers registered
- Platforms IPC handlers registered
- Templates IPC handlers registered
- Claude AI service initialized (with API key from .env)
- ImageProcessorService initialized

#### ✅ Application Status
- Dashboard queries executing
- Database queries responding
- IPC communication working

### 4. Report Status

Provide a clear status report showing:
- Frontend status and URL
- Backend/database status and location
- All initialized services
- Any warnings or errors encountered
- Confirmation that Electron app window is open

---

## Expected Output Markers

Look for these key phrases in the startup logs:

```
✓ built in [time]
build the electron main process successfully
build the electron preload files successfully
dev server running for the electron renderer process at:
Database initialized successfully
[Service] IPC handlers registered
Claude AI service initialized successfully
ImageProcessorService initialized
```

---

## Troubleshooting

### If startup fails:
1. Check for error messages in output
2. Verify `.env` file exists with `ANTHROPIC_API_KEY`
3. Ensure database directory is writable
4. Check Node.js and Python 3.11.9 are installed
5. Try `npm rebuild better-sqlite3` if native module errors

### Common Issues:
- **Port 5173 already in use**: Kill existing process or change port in vite config
- **Database locked**: Close any other instances of the app
- **Missing .env**: Claude AI features won't work but app will start
- **Sharp errors**: Run `npm rebuild sharp`

---

## Post-Startup

After successful startup:
- Electron application window is open
- All services are hot-reloading with HMR
- Database is ready for operations
- User can begin working with the application

---

**Last Updated**: January 14, 2026
