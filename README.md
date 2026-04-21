# Naya Awasar

Naya Awasar is a MERN-based job portal with a separate Python recommendation service.  
It supports job seekers, recruiters, and admins with role-based dashboards, KYC workflows, job posting and application management, interview scheduling, notifications, promotions, and AI-assisted recommendations.

Developer: Kriti Bista  
Project: Final year Project 

## Project Overview

Based on the current codebase:

- Frontend is a React + Vite SPA with role-based layouts and route guards.
- Backend is an Express + MongoDB API with JWT auth and modular route groups.
- Recommendation service is a FastAPI service using embeddings/similarity and MongoDB.
- The platform includes:
  - Authentication (email/password, Google, Facebook, OTP flows)
  - Job seeker dashboard (jobs, applications, profile, interviews, calendar)
  - Recruiter dashboard (post/edit/close jobs, applicants, analytics, promotions)
  - Admin panel (users, jobs, KYC, companies, location, testimonials, team, promotion requests)
  - KYC and company verification workflows
  - Interview and reschedule flows
  - Notifications and activity tracking
  - Public pages and policy/help pages

## Tech Stack

## Backend (`backend/package.json`)

- Runtime: Node.js (ES Modules)
- Framework: Express
- Database: MongoDB + Mongoose
- Auth/Security: `jsonwebtoken`, `bcryptjs`
- Integrations: `google-auth-library`, `cloudinary`, `nodemailer`
- Files/Parsing: `multer`, `pdf-parse`
- Jobs/Cron: `node-cron`
- Browser tooling: `puppeteer`
- Testing: `jest`, `supertest`

## Frontend (`frontend/package.json`)

- Framework: React 19
- Build tool: Vite
- Routing: `react-router-dom`
- Forms/Validation: `react-hook-form`, `zod`, `@hookform/resolvers`
- UI/Charts/Maps: `lucide-react`, `recharts`, `leaflet`, `react-leaflet`
- Notifications/UX: `react-hot-toast`, `react-toastify`
- Auth integrations: `@react-oauth/google`, `jwt-decode`
- RTC/Video: `@zegocloud/zego-uikit-prebuilt`
- Styling: Tailwind CSS + PostCSS + Autoprefixer
- Linting: ESLint

## Recommendation Service (`recommendation-service/requirements.txt`)

- API: `fastapi`, `uvicorn[standard]`
- DB client: `motor`, `pymongo`
- ML/NLP: `scikit-learn`, `numpy`, `sentence-transformers`, `huggingface_hub`
- Config/validation: `python-dotenv`, `pydantic`

## Project Structure

```text
NayaAwasar/
├─ backend/
│  ├─ server.js
│  ├─ package.json
│  ├─ .env.example
│  ├─ routes/
│  ├─ controllers/
│  ├─ models/
│  ├─ middleware/
│  ├─ services/
│  ├─ utils/
│  ├─ jobs/
│  └─ __tests__/
├─ frontend/
│  ├─ package.json
│  ├─ .env.example
│  ├─ vite.config.js
│  ├─ tailwind.config.js
│  └─ src/
│     ├─ routes/
│     ├─ pages/
│     ├─ components/
│     ├─ contexts/
│     ├─ services/
│     └─ utils/
├─ recommendation-service/
│  ├─ main.py
│  ├─ requirements.txt
│  ├─ recommender.py
│  ├─ embeddings.py
│  ├─ database.py
│  └─ models.py
├─ scripts/
│  └─ run-python.js
├─ package.json
└─ package-lock.json
```

## API and Routing Snapshot

### Frontend Routes

From `frontend/src/routes/AppRoutes.jsx`:

- Public: `/`, `/about`, `/contact`, `/jobs`, `/jobs/:id`, `/help-center`, `/terms`, `/privacy`, `/cookies`, `/help`
- Shared protected user-info: `/user/terms`, `/user/privacy`, `/user/cookies`, `/user/help` (jobseeker + recruiter)
- Job seeker: dashboard, applications, profile, jobs, interviews, calendar, notifications, apply flow
- Recruiter: dashboard, profile/company, post/edit jobs, applicants, interviews, analytics, promotions, calendar, notifications
- Admin: dashboard, users, KYC, companies, jobs, promoted jobs, promotion requests, contact messages, testimonials, team

### Backend Route Mounts

From `backend/server.js`:

- `/api/auth`
- `/api/jobs`
- `/api/applications`
- `/api/dashboard`
- `/api/upload`
- `/api/admin`, `/api/admin/moderation`
- `/api/users`, `/api/profile`, `/api/projects`, `/api/activity`
- `/api/interviews`, `/api/interviews/reschedule`
- `/api/notifications`
- `/api/kyc`, `/api/kyc/identity`
- `/api/location`, `/api/companies`, `/api/recruiter`
- `/api/contact`, `/api/chatbot`, `/api/testimonials`, `/api/team`
- `/api/promotions`, `/api/promotion-payment-requests`
- `/api/recommendations`, `/api/ai`
- `/api` (analytics routes for job views and recruiter analytics)

## Environment Variables

## Backend (`backend/.env`)

Template is provided in `backend/.env.example`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/your_database_name
JWT_SECRET=your_jwt_secret_use_a_long_random_string

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

FRONTEND_URL=http://localhost:5173

RECOMMENDATION_SERVICE_URL=http://127.0.0.1:8001
# RECOMMENDATION_SERVICE_TIMEOUT_MS=90000

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_app_password
EMAIL_FROM=your_email@example.com

ZEGO_APP_ID=your_zego_app_id
ZEGO_SERVER_SECRET=your_zego_server_secret
```

Notes from `backend/server.js`:

- Backend defaults to `PORT=5001` if not set.
- CORS also supports optional `FRONTEND_URLS` and `CORS_ORIGIN_REGEX`.

## Frontend (`frontend/.env`)

Template in `frontend/.env.example`:

```env
VITE_API_URL=https://DEVTUNNEL_BACKEND_URL
VITE_API_BASE_URL=https://YOUR_PRODUCTION_API_URL
```

## Recommendation Service (`recommendation-service`)

From `recommendation-service/database.py` and `main.py`:

```env
MONGODB_URI=mongodb://localhost:27017
DB_NAME=nayaawasar
PORT=8001
```

## Run Locally

Run commands from the repository root (`NayaAwasar/`) unless noted.

## 1) Install dependencies

```bash
npm install
npm install --prefix backend
npm install --prefix frontend
```

## 2) Python recommendation service setup

```bash
python -m venv .venv
```

Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
python -m pip install -r recommendation-service/requirements.txt
```

## 3) Create environment files

- Copy `backend/.env.example` to `backend/.env` and fill values.
- Copy `frontend/.env.example` to `frontend/.env` and fill values.
- Add recommendation-service env vars (or a root `.env` used by Python process) for `MONGODB_URI`, `DB_NAME`, and optional `PORT`.

## 4) Start services

### Option A: Start all services together (recommended)

```bash
npm run dev:all
```

This runs:
- Backend (`npm run dev --prefix backend`)
- Frontend (`npm run dev --prefix frontend`)
- Recommendation service (`uvicorn main:app` via `scripts/run-python.js`)

### Option B: Start individually

Backend:

```bash
npm run dev:backend
```

Frontend:

```bash
npm run dev:frontend
```

Recommendation service:

```bash
npm run dev:recommendation-service
```

## Helpful root scripts (`package.json`)

- `npm run dev` -> frontend only
- `npm run dev:stack` -> backend + frontend
- `npm run dev:all` -> backend + frontend + recommendation service
- `npm run dev:all:fresh` -> free API port then run all
- `npm run free:api` -> kill port 5001

## Service URLs (local)

- Frontend (Vite default): `http://localhost:5173`
- Backend health: `http://localhost:5001/api/health`
- Recommendation service health: `http://127.0.0.1:8001/health`

## Testing

Backend tests:

```bash
npm test --prefix backend
```

Frontend lint:

```bash
npm run lint --prefix frontend
```

