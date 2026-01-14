# MyFunSeller2 - Claude Context

**Version**: v1.0.0
**Type**: Electron Desktop Application
**Repository**: https://github.com/JohnBartlett/MyFunSeller2-Desktop
**Status**: Phase 3 Complete (100%), Overall ~80% Complete

---

## Context

MyFunSeller2 is a multi-platform resale posting desktop application for Windows. It streamlines posting items to multiple marketplaces (Facebook Marketplace, eBay, etc.) from a single interface. Users can manage inventory, upload images, and track listings across platforms.

**Key Capabilities**:
- Local SQLite database for item catalog
- Image processing with Sharp (resize, compress, watermark, EXIF removal)
- Type-safe IPC communication between main and renderer processes
- Full CRUD operations for items with validation
- Drag-and-drop image upload (up to 10 images per item)
- Primary image selection and reordering

**Database Location**: `C:\Users\johnb\AppData\MyFunSeller2\data\`

---

## 🚀 Startup Protocol

**IMPORTANT**: When the user says **"start"**, **"startup"**, or **"start the server"**:

1. **Immediately run**: `npm run dev` in background mode (timeout: 300000ms)
2. **Wait 5 seconds** for initialization
3. **Read the background process output** to verify all services started correctly
4. **Report status** with clear indicators for:
   - ✅ Frontend (Vite dev server at http://localhost:5173)
   - ✅ Backend (SQLite database initialized)
   - ✅ All 6 IPC service handlers registered
   - ✅ Claude AI service initialized
   - ✅ ImageProcessorService initialized
   - ✅ Application queries executing successfully

**See `STARTUP.md` for detailed startup procedures and troubleshooting.**

---

## Tech Stack

### Core
- **Electron 29** - Desktop framework
- **React 18** - UI library
- **Vite 5** - Build tool
- **TypeScript 5** - Type safety
- **Tailwind CSS** - Styling

### Backend (Main Process)
- **better-sqlite3** - SQLite database (requires Python 3.11.9 for native compilation)
- **Sharp** - Image processing (600+ lines, 20x faster than alternatives)
- **Playwright** - Browser automation (planned for Facebook Marketplace)
- **BullMQ + ioredis** - Job queue for scheduled posting (planned)
- **Winston** - Logging (configured but not implemented)

### Frontend (Renderer)
- **React Router v6** - Navigation
- **react-hook-form** - Form state management
- **Zod** - Schema validation
- **@hookform/resolvers** - Form validation integration
- **react-dropzone** - File uploads
- **Zustand** - State management (planned)
- **lucide-react** - Icons

### Database Schema (7 Tables)
1. **items** - Master catalog (title, description, category, condition, price, etc.)
2. **images** - Photo metadata (paths, dimensions, processing status)
3. **platforms** - Platform configs (Facebook Marketplace pre-configured)
4. **listings** - Posted items per platform (status, analytics)
5. **analytics_events** - Engagement tracking
6. **templates** - Reusable item configurations
7. **scheduled_jobs** - BullMQ job tracking

---

## Current Status

### ✅ Completed (Phase 1-3)

**Foundation**:
- Electron + React + Vite setup with 811 npm packages
- Build system configured (electron-vite)
- Git repository initialized and pushed

**Backend (100%)**:
- All 7 database tables with indexes and foreign keys
- 6 repository classes with CRUD operations
- ImageProcessorService with platform-specific optimization
- ClaudeService for AI-powered image analysis
- Custom error classes (ImageProcessingError, DatabaseError, etc.)
- IPC handlers for all core features + AI

**UI Foundation (100%)**:
- Type-safe IPC API in preload layer
- React Router with 6 pages (Dashboard, Items, ItemDetail, Platforms, Templates, Settings)
- Layout with responsive sidebar navigation
- Dashboard with live stats (items, listings, revenue)
- Items page with search and grid (1-4 columns)
- ItemForm component with 15+ fields and Zod validation
- **AI Auto-fill**: Claude vision API analyzes images and fills item details
- ImageUploader component with drag-and-drop
- Modal dialog system with toast notifications (Sonner)
- Form components (Input, Select, Textarea)
- Full CRUD operations working
- Primary images display in grid
- Item Detail page with lightbox gallery and keyboard navigation

### 🔄 In Progress / Planned

**Near-Term (Phase 4)**:
- Zustand stores for state management (optional optimization)
- Template system (create and use templates)
- Settings page (preferences, theme, API keys UI)
- Enhanced Dashboard with charts

**Medium-Term (Phase 4-5)**:
- Facebook Marketplace integration (Playwright automation)
- Scheduled posting with BullMQ
- Additional platform integrations
- Analytics dashboard with charts

**Long-Term (Phase 6+)**:
- eBay, Depop, Poshmark, Mercari integrations
- Advanced analytics with historical data
- Data export functionality (CSV, JSON)
- Windows installer packaging (electron-builder)
- Auto-updates functionality
- Multi-language support

---

## Invariants / Don'ts

### Critical Requirements
1. **Python 3.11.9 Required**: Native modules (better-sqlite3, Sharp) require Python for compilation
2. **Rebuild After Install**: Always run `npm rebuild better-sqlite3` or `npx electron-rebuild` after installing dependencies
3. **File Paths**: Windows paths must be normalized (backslash to forward slash) for file:/// URLs in Electron

### Code Standards
- **Type Safety**: All components and functions must have TypeScript types
- **Validation**: Use Zod schemas for all form validation
- **IPC Communication**: Always use type-safe window.api methods (defined in preload)
- **Error Handling**: Use custom error classes and try-catch blocks
- **No Direct Node.js**: Renderer process must never access Node.js directly (context isolation)

### Don'ts
- ❌ Don't use better-sqlite3 directly in renderer (always via IPC)
- ❌ Don't skip validation on user inputs
- ❌ Don't commit large files or node_modules
- ❌ Don't use inline styles (use Tailwind classes)
- ❌ Don't create new error types without extending base error classes
- ❌ Don't bypass context isolation

### Development Workflow
1. Changes auto-reload with HMR in dev mode
2. Always test builds with `npm run build` before committing
3. Use `npm run dev` for development server
4. Database persists at AppData location (not project directory)

---

## AI Auto-Fill Feature 🤖

**NEW in v0.75.0**: Claude AI-powered auto-fill

### How It Works
1. Upload product images to the item form (1-10 images)
2. Click "Auto-fill with AI" button
3. Claude 3.5 Sonnet analyzes images and extracts:
   - Title, description, category, condition
   - Price suggestion, brand, color, size, weight
   - Confidence score (0-100%)
4. Review and adjust auto-filled data
5. Save item

### Setup Required
- Create `.env` file in project root
- Add: `ANTHROPIC_API_KEY=sk-ant-...`
- Get API key from https://console.anthropic.com/
- See `AI-SETUP.md` for detailed instructions

### Technical Details
- Service: `src/main/services/claude.service.ts`
- Handler: `src/main/ipc/handlers/claude.handler.ts`
- UI: "Auto-fill with AI" button in ItemForm
- Cost: ~$0.01-0.05 per item analysis
- Max 5 images analyzed per request

---

## To-Do (Near-Term Priority)

### High Priority (Next 3-5 Tasks)

**1. Zustand Stores** (1-2 hours) [Optional]
- Items store with caching
- UI state store (modals, toasts, loading states)
- Platform store
- Optimize re-renders

**2. Template System** (2-3 hours)
- Create templates from existing items
- Template library page
- Use template to pre-fill ItemForm
- CRUD operations for templates

**3. Settings Page** (2-3 hours)
- App preferences (theme, notifications)
- API key management UI (Claude, future platforms)
- Data management (backup, export, clear)
- Platform connections management
- About/version info

**4. Enhanced Dashboard** (2-3 hours)
- Charts for revenue over time
- Category breakdown pie chart
- Listing status visualization
- Quick stats cards with trends

**5. Facebook Marketplace Integration** (8-12 hours)
- Playwright automation setup
- Login flow with session persistence
- Create listing automation
- Image upload handling
- Error handling and retry logic

### Medium Priority (Future)

- Enhanced Dashboard with charts (recharts or similar)
- Bulk operations (multi-select items)
- Item duplication feature
- CSV import/export
- Keyboard shortcuts
- Dark mode toggle

### Long-Term

- Facebook Marketplace automation (Playwright)
- Scheduled posting (BullMQ + Redis)
- Additional platform integrations
- Analytics with historical data
- Windows installer (electron-builder)
- Auto-updates

---

## Quick Start Commands

```bash
# Startup (or just say "start" to Claude)
npm run dev                 # Start app in dev mode (see Startup Protocol above)

# Development
npm run build              # Build for production
npm run preview            # Preview production build

# Maintenance
npm rebuild better-sqlite3  # Rebuild native modules
npx electron-rebuild       # Rebuild all Electron modules

# Git
git status                 # Check status
git add -A && git commit   # Commit changes
git push                   # Push to GitHub
```

---

**Last Updated**: January 14, 2026
**App Status**: ✅ Running successfully in development mode
**Database**: ✅ Initialized with 7 tables
**Build**: ✅ Compiling successfully (~600KB bundle)
