# Dev Tunnel Setup

This guide exposes local services through Microsoft Dev Tunnels.

## Confirmed local ports

- Frontend (`frontend` / Vite): `5173`
- Backend (`backend` / Express): `5001` (from `backend/.env`)
- Recommendation service (`recommendation-service` / FastAPI): `8000`

## Step 1: Start recommendation service

```powershell
cd recommendation-service
python main.py
```

## Step 2: Start backend

```powershell
cd backend
npm run dev
```

## Step 3: Create devtunnel for backend

```powershell
devtunnel host -p 5001 --allow-anonymous
```

Copy the URL and set it as `VITE_API_URL` in `frontend/.env`.

## Step 4: Create devtunnel for recommendation service

```powershell
devtunnel host -p 8000 --allow-anonymous
```

Copy the URL and set it as both:

- `FLASK_AI_URL` in `backend/.env`
- `PYTHON_SERVICE_URL` in `backend/.env`

## Step 5: Restart backend after updating .env

```powershell
cd backend
npm run dev
```

## Step 6: Start frontend

```powershell
cd frontend
npm run dev
```
