# RetailMind Backend

Flask-based backend for the RetailMind AI-powered retail analytics platform.

## 🚀 Quick Start

### 1. Setup Python Environment

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your values:
# - GOOGLE_CLIENT_ID (required for OAuth)
# - SECRET_KEY (change in production)
# - JWT_SECRET_KEY (change in production)
```

### 3. Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Go to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth Client ID**
5. Choose **Web application**
6. Add authorized JavaScript origins:
   - `http://localhost:5173` (Vite dev server)
   - `http://localhost:3000` (alternative)
7. Copy the **Client ID** to your `.env` file

### 4. Run the Server

```bash
python app.py
```

Server will start at `http://localhost:5000`

## 📁 Project Structure

```
backend/
├── app.py              # Main entry point
├── config.py           # Configuration management
├── requirements.txt    # Python dependencies
├── .env.example        # Environment template
│
├── auth/               # Authentication
│   ├── google_auth.py  # Google OAuth verification
│   ├── token_utils.py  # JWT utilities
│   └── auth_guard.py   # Route protection decorator
│
├── database/           # Database layer
│   ├── db.py           # SQLite connection
│   └── models.py       # User & settings models
│
├── routes/             # API endpoints
│   ├── health.py       # Health check
│   ├── auth.py         # Authentication
│   ├── forecast.py     # Sales forecasting
│   ├── segments.py     # Customer segmentation
│   ├── basket.py       # Market basket analysis
│   ├── alerts.py       # Smart alerts
│   └── upload.py       # Data upload & processing
│
├── services/           # Business logic
│   ├── preprocessing.py    # Data cleaning
│   ├── forecasting.py      # ML forecasting
│   ├── segmentation.py     # K-Means clustering
│   ├── basket_analysis.py  # Association rules
│   └── alerts_engine.py    # Alert generation
│
├── models/             # Saved ML models (auto-generated)
├── data/               # Data files (auto-generated)
│   ├── raw/            # Uploaded CSV files
│   └── processed/      # Cleaned data
│
└── database/           # SQLite database (auto-generated)
    └── retailmind.db
```

## 🔌 API Endpoints

### Health
- `GET /api/health` - Server health check

### Authentication
- `POST /api/auth/google` - Authenticate with Google ID token
- `GET /api/auth/verify` - Verify current JWT token
- `POST /api/auth/logout` - Logout

### Analytics (requires authentication)
- `GET /api/forecast?days=7` - Sales forecast
- `GET /api/segments` - Customer segmentation
- `GET /api/basket` - All market basket rules
- `GET /api/basket/<product>` - Search basket rules
- `GET /api/alerts` - Smart alerts

### Data Upload (requires authentication)
- `POST /api/upload` - Upload CSV file

## 🔐 Authentication Flow

1. Frontend initiates Google OAuth
2. Google returns ID token to frontend
3. Frontend sends ID token to `/api/auth/google`
4. Backend verifies token with Google
5. Backend creates/finds user in database
6. Backend returns JWT token
7. Frontend includes JWT in all subsequent requests

## 📊 Sample Data Format

Upload CSV files with these columns:
```csv
InvoiceNo,StockCode,Description,Quantity,InvoiceDate,UnitPrice,CustomerID,Country
536365,85123A,WHITE HANGING HEART,6,12/1/2010 8:26,2.55,17850,United Kingdom
```

## 🧪 Testing

```bash
# Test health endpoint
curl http://localhost:5000/api/health

# Expected response:
# {"service":"RetailMind API","status":"healthy","timestamp":"...","version":"1.0.0"}
```

## 📦 Production Deployment

1. Set `FLASK_ENV=production` in `.env`
2. Use a proper WSGI server (gunicorn, waitress)
3. Set strong `SECRET_KEY` and `JWT_SECRET_KEY`
4. Configure proper `CORS_ORIGINS`
5. Use PostgreSQL instead of SQLite for scale

```bash
# Run with gunicorn (production)
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```
