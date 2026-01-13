# MyFunSeller2

Multi-Platform Resale Posting Application for Windows - streamline posting items to multiple resale platforms from a single interface.

## Current Status: Phase 2 - Core Services Complete! 🎉

### ✅ Completed

**Project Structure**
- Electron + React + Vite application with TypeScript
- Proper folder structure for main process, preload, renderer, and shared code
- All dependencies installed (714 packages)
- Tailwind CSS configured with shadcn/ui theming
- Build system configured with electron-vite

**Database Layer (Complete) ✅**
- ✅ SQLite schema with 7 tables: items, images, platforms, listings, analytics_events, templates, scheduled_jobs
- ✅ Full repository classes with CRUD operations:
  - ItemsRepository
  - ImagesRepository
  - ListingsRepository
  - PlatformsRepository
  - TemplatesRepository
  - AnalyticsRepository
- ✅ Database initialization module with WAL mode and foreign keys enabled
- ✅ Default platform (Facebook Marketplace) automatically seeded

**Image Processing Service (Complete) ✅**
- ✅ ImageProcessorService with Sharp library (20x faster than alternatives)
- ✅ Image optimization features:
  - Auto-resize with aspect ratio preservation
  - Smart compression (JPEG, PNG, WebP)
  - Watermark overlay with positioning
  - EXIF data removal for privacy
  - Crop, rotate, brightness, contrast adjustments
- ✅ Batch processing with progress tracking
- ✅ Platform-specific optimization (Facebook, eBay, Depop, Poshmark, Mercari)
- ✅ Thumbnail generation
- ✅ Image validation and metadata extraction
- ✅ Storage management and cleanup utilities
- ✅ Comprehensive error handling
- ✅ Image utility helpers (format validation, size calculation, etc.)

**TypeScript Configuration**
- Strict mode enabled
- Path aliases configured (@main, @renderer, @shared)
- Separate configs for main and renderer processes
- Complete type definitions for all features

### 🔧 Known Issue: Native Module Compilation

**Issue:** `better-sqlite3` needs to be rebuilt for Electron's Node.js version.

**Error:** `The module 'better_sqlite3.node' was compiled against NODE_MODULE_VERSION 127, but Electron requires NODE_MODULE_VERSION 121`

**Solution Options:**

#### Option 1: Install Python 3.11 (Recommended)
1. Download and install Python 3.11 from [python.org](https://www.python.org/downloads/)
2. Run: `npm rebuild better-sqlite3`

#### Option 2: Use electron-rebuild
```bash
npm install --save-dev @electron/rebuild
npx electron-rebuild -f -w better-sqlite3
```

#### Option 3: Fresh install
```bash
rm -rf node_modules package-lock.json
npm install
npm rebuild better-sqlite3
```

## Development

### Start Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
npm run package:win
```

### Run Tests
```bash
npm test              # Unit tests
npm run test:ui       # Tests with UI
npm run test:e2e      # End-to-end tests
```

## Project Structure

```
MyFunSeller2/
├── src/
│   ├── main/                              # Electron main process (Node.js)
│   │   ├── index.ts                       # Main entry point
│   │   ├── database/
│   │   │   ├── index.ts                  # Database initialization
│   │   │   ├── schema.ts                 # SQLite schema
│   │   │   └── repositories/             # Data access layer
│   │   │       ├── items.repository.ts
│   │   │       ├── images.repository.ts
│   │   │       ├── listings.repository.ts
│   │   │       ├── platforms.repository.ts
│   │   │       ├── templates.repository.ts
│   │   │       └── analytics.repository.ts
│   │   ├── services/                     # Business logic services
│   │   ├── platforms/                    # Platform integrations
│   │   ├── ipc/                          # IPC handlers
│   │   └── utils/                        # Utilities
│   ├── preload/
│   │   └── index.ts                      # Context bridge setup
│   ├── renderer/                          # React application
│   │   ├── src/
│   │   │   ├── main.tsx                  # React entry point
│   │   │   ├── App.tsx                   # Root component
│   │   │   ├── pages/                    # Route components
│   │   │   ├── components/               # UI components
│   │   │   ├── hooks/                    # Custom React hooks
│   │   │   ├── store/                    # Zustand stores
│   │   │   ├── api/                      # IPC communication layer
│   │   │   └── types/                    # TypeScript types
│   │   └── index.html
│   └── shared/                            # Shared types/constants
│       └── types/index.ts                # Shared TypeScript interfaces
├── data/                                  # SQLite database location
├── logs/                                  # Application logs
└── resources/                             # App assets

```

## Database Schema

### Items Table
Master catalog of items with fields: title, description, category, condition, price, SKU, brand, size, color, dimensions, tags, and more.

### Images Table
Photo metadata with paths, dimensions, processing status, and display order.

### Platforms Table
Platform configurations including Facebook Marketplace (pre-configured), with auth settings, rate limits, and image requirements.

### Listings Table
Posted items per platform with status tracking (draft, scheduled, active, sold), analytics (views, likes, messages), and platform-specific data.

### Templates Table
Reusable item configurations for quick listing creation.

### Analytics Events Table
Timestamped engagement events (views, likes, messages, shares).

### Scheduled Jobs Table
BullMQ job tracking for scheduled posting.

## Technology Stack

### Core
- **Electron 29** - Desktop app framework
- **React 18** - UI library
- **Vite 5** - Build tool
- **TypeScript 5** - Type safety

### Database & Storage
- **better-sqlite3** - Fast SQLite for Node.js
- **Electron safeStorage** - Encrypted credential storage

### Automation & Jobs
- **Playwright** - Browser automation for platforms without APIs
- **BullMQ** - Job queue for scheduled posting
- **ioredis** - Redis client for BullMQ

### Image Processing
- **Sharp** - High-performance image processing (resize, compress, watermark)

### UI & Forms
- **Tailwind CSS** - Utility-first CSS
- **shadcn/ui** - Component library
- **Zustand** - State management
- **react-hook-form** - Form handling
- **Zod** - Schema validation
- **react-dropzone** - File uploads

### Utilities
- **axios** - HTTP client
- **date-fns** - Date manipulation
- **winston** - Logging
- **uuid** - Unique IDs

## Next Steps (According to Implementation Plan)

### Phase 2: Core Services (Weeks 5-6)
- [ ] Implement ImageProcessorService with Sharp
- [ ] Set up IPC communication handlers
- [ ] Implement CredentialService with safeStorage
- [ ] Configure Winston logging

### Phase 3: UI Foundation (Weeks 7-8)
- [ ] Build ItemForm with validation
- [ ] Create ImageUploader component
- [ ] Implement Zustand stores
- [ ] Build Dashboard and Item management pages

### Phase 4: Template System (Weeks 9-10)
- [ ] Create Templates page UI
- [ ] Integrate "Use Template" in ItemForm

### Phase 5: Facebook Integration (Weeks 11-12)
- [ ] Configure Playwright
- [ ] Implement FacebookMarketplacePlatform with automation
- [ ] Build Platform Settings UI

### Phase 6: Scheduling (Weeks 13-14)
- [ ] Set up Redis and BullMQ
- [ ] Implement SchedulerService
- [ ] Build scheduling UI

### Phase 7: Analytics & Polish (Weeks 15-16)
- [ ] Implement analytics tracking
- [ ] Build Analytics dashboard
- [ ] Testing and optimization
- [ ] Build and package application

## Features (Planned for Phase 1)

- ✅ Local SQLite database for item catalog
- ✅ Complete data model for items, images, listings, platforms, analytics, templates
- ⏳ Single item entry form with validation
- ⏳ Bulk photo upload with drag-and-drop
- ⏳ Image processing (resize, compress, watermark, EXIF removal)
- ⏳ Template system for common item types
- ⏳ Facebook Marketplace integration (Playwright automation)
- ⏳ Scheduled posting with staggered timing
- ⏳ Listing analytics dashboard
- ⏳ Platform connection management

## Platform Integration Strategy

### Facebook Marketplace
- **Approach:** Playwright browser automation (no official API available)
- **Authentication:** Persistent browser context with manual login
- **Rate Limiting:** Max 50 posts/day, 5-10 minute intervals between posts
- **Risk Mitigation:** Human-like delays, clear TOS warnings, manual review options

### Future Platforms (Phase 2+)
- eBay (official API)
- Depop
- Poshmark
- Mercari
- Craigslist

## Security

- Credentials encrypted using Electron safeStorage (Windows DPAPI)
- Context isolation and sandboxing for renderer process
- No direct Node.js access from renderer
- Automatic EXIF removal from images
- Input validation with Zod schemas

## Contributing

This is a private project currently in active development (Phase 1).

## License

MIT

## Support

For issues with native module compilation, see the "Known Issue" section above.
