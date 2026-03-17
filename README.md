# RetailMind

RetailMind is a retail analytics dashboard built with React, Vite, Supabase, and a small Flask service for local ML and utility endpoints. It combines sales analytics, live POS capture, notifications, scheduled reporting, and AI-assisted workflows in one app.

## What is included

- Email/password authentication plus Google sign-in
- Dashboard overview with revenue and product metrics
- Sales forecasting
- Customer segmentation
- Market basket analysis
- CSV upload and dataset management
- Live POS transactions with demo barcode seeding
- Realtime notifications, activity feed, and low-stock alerts
- Goal tracking and profile/settings management
- Scheduled report workflow
- Supabase edge functions for analytics, alerts, AI chat, POS, and report sending

## Stack

### Frontend

- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- TanStack Query
- Recharts
- Framer Motion
- Supabase JS

### Backend

- Flask
- Pandas
- NumPy
- scikit-learn

### Platform

- Supabase Auth
- Supabase Postgres
- Supabase Realtime
- Supabase Edge Functions

## Main app flows

### Authentication

- Email/password login and registration are handled through Supabase Auth.
- Google sign-in uses a Google OAuth client on the frontend and Supabase identity sign-in.
- Password reset is routed through `/reset-password`.

### Analytics

- Sales forecasting reads sales history and now falls back gracefully when POS-only data exists.
- Customer segmentation reads uploaded and POS-generated sales records.
- Market basket analysis works from uploaded sales data and multi-item POS transactions.

### Live POS

- Seed demo products directly in the app.
- Start a transaction, scan or simulate a barcode, and watch cart totals, inventory, activity, and alerts update.
- POS writes sales records that feed the analytics modules.

### Reporting and email

- Scheduled reports are stored in Supabase.
- Report delivery depends on the deployed `send-report` edge function and a valid email provider secret.

## Project structure

```text
retail-insight-hub/
|-- src/
|   |-- components/
|   |-- contexts/
|   |-- hooks/
|   |-- integrations/
|   |-- lib/
|   `-- pages/
|-- backend/
|   |-- auth/
|   |-- database/
|   |-- routes/
|   `-- services/
|-- supabase/
|   |-- functions/
|   `-- migrations/
|-- docs/
`-- public/
```

## Local setup

### Prerequisites

- Node.js 18+
- npm
- Python 3.11+
- A Supabase project

### Frontend

```bash
npm install
npm run dev
```

The app runs on `http://localhost:8080` in the current local setup.

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python run_dev_server.py
```

The backend default local URL is `http://localhost:5000`.

## Environment variables

### Frontend `.env`

Use `.env.example` as the template.

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-anon-key
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

### Backend `backend/.env`

Use `backend/.env.example` as the template.

Important values:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `SECRET_KEY`
- `JWT_SECRET_KEY`
- `CORS_ORIGINS`

## Supabase checklist

### 1. Apply migrations

Run the SQL files in `supabase/migrations/` in your Supabase project, including the realtime POS migration:

- `supabase/migrations/20260316103000_realtime_pos.sql`

### 2. Deploy edge functions

Deploy the functions in `supabase/functions/` that your environment needs:

- `forecast`
- `segments`
- `basket`
- `alerts`
- `ai-chat`
- `send-report`
- `pos-terminal`

### 3. Configure Google sign-in

In Google Cloud Console:

- create a Web OAuth client
- add your local origin such as `http://localhost:8080`
- keep the client secret only in secure backend/provider settings

In Supabase:

- enable Google under `Auth -> Providers -> Google`
- use the same Google client ID and secret
- add the correct allowed redirect/callback URLs for your environment

### 4. Configure report email delivery

The report-sending edge function needs its provider secret configured in Supabase secrets. If you are using Resend, set `RESEND_API_KEY` before testing live report delivery.

## Demo POS testing

1. Sign in.
2. Go to `Dashboard -> Live POS`.
3. Click `Seed Demo Products`.
4. Click `Start Transaction`.
5. Simulate a scan or enter a demo barcode manually.
6. Add multiple products to the same transaction to exercise basket analysis.
7. Repeat scans to test low-stock notifications.

Demo barcodes:

- `8901030895489` - Basmati Rice 5kg
- `8906008100012` - Sunflower Oil 1L
- `8901719123456` - Digestive Biscuits
- `8901491102233` - Bath Soap Pack
- `8902080007654` - Toned Milk 1L

## Useful scripts

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

## Docs

- System diagrams: `docs/system-diagrams.md`

## Notes

- Local `.env`, virtual environments, build artifacts, and cache files are intentionally ignored and should not be committed.
- If analytics appear empty after switching Supabase projects, confirm migrations and edge function deployments first.
