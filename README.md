# RetailMind - AI-Powered Retail Analytics Platform

RetailMind is a comprehensive retail analytics web application that leverages machine learning and AI to provide actionable insights for retail businesses. It combines powerful data analysis with an intuitive interface to help businesses make data-driven decisions.

## 🌟 Features

### Core Analytics
- **Sales Forecasting** - Linear regression-based demand prediction with interactive visualizations
- **Customer Segmentation** - K-Means clustering to identify customer groups and behaviors
- **Market Basket Analysis** - Association rule mining to discover product relationships
- **Smart Alerts** - Automated anomaly detection for demand spikes and inventory issues

### AI Assistant
- **RetailMind AI** - Gemini-powered chat assistant for real-time analytics guidance
- Natural language queries about your retail data
- Contextual help and recommendations

### Productivity Tools
- **Command Palette** (⌘K) - Quick navigation and actions
- **Quick Notes** - Persistent note-taking with local storage
- **Keyboard Shortcuts** - Efficient navigation throughout the app
- **Real-time Notifications** - Live alerts for anomalies and insights

### Goals & Gamification
- **Goal Tracking** - Set and monitor analytics goals
- **Achievements** - Unlock badges as you explore features
- **Progress Tracking** - Visual progress indicators

### Reporting & Automation
- **PDF Export** - Branded analytics reports using jsPDF
- **Scheduled Reports** - Automated email delivery of reports
- **Data Export** - Export your data in multiple formats

### Authentication & Security
- **Multi-Provider Auth** - Google, GitHub, Facebook, and Email/Password
- **Two-Factor Authentication** - Enhanced account security (UI ready)
- **Session Management** - Track and manage active sessions
- **Password Reset** - Complete password recovery flow

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI framework |
| TypeScript | Type-safe development |
| Vite | Build tool and dev server |
| Tailwind CSS | Utility-first styling |
| shadcn/ui | Component library |
| React Router | Client-side routing |
| TanStack Query | Data fetching and caching |
| Recharts | Data visualization |
| Framer Motion | Animations |
| Lucide React | Icon library |
| jsPDF + AutoTable | PDF generation |
| react-markdown | Markdown rendering |

### Backend (Flask)
| Technology | Purpose |
|------------|---------|
| Python 3.11+ | Programming language |
| Flask 3.0 | Web framework |
| Flask-CORS | Cross-origin support |
| Pandas | Data manipulation |
| NumPy | Numerical computing |
| Scikit-learn | Machine learning |
| PyJWT | JWT authentication |
| SQLite | Local database |

### Cloud Services (Cloud)
| Service | Purpose |
|---------|---------|
| PostgreSQL | Production database |
| Edge Functions | Serverless backend logic |
| Authentication | User management |
| Real-time | Live notifications |
| AI Gateway | Gemini AI integration |

## 📁 Project Structure

```
retailmind/
├── src/                          # Frontend source code
│   ├── components/               # React components
│   │   ├── ui/                   # shadcn/ui components
│   │   ├── layout/               # Layout components
│   │   ├── AIChatAssistant.tsx   # AI chat interface
│   │   ├── GoalsAchievements.tsx # Gamification
│   │   └── ScheduledReports.tsx  # Report automation
│   ├── contexts/                 # React contexts
│   │   ├── AuthContext.tsx       # Authentication state
│   │   ├── ThemeContext.tsx      # Theme management
│   │   └── NotificationContext.tsx # Notifications
│   ├── pages/                    # Page components
│   │   ├── dashboard/            # Dashboard pages
│   │   └── Login.tsx             # Authentication
│   ├── hooks/                    # Custom React hooks
│   ├── lib/                      # Utilities and API clients
│   └── integrations/             # External integrations
├── backend/                      # Flask backend
│   ├── routes/                   # API endpoints
│   ├── services/                 # Business logic
│   ├── auth/                     # Authentication
│   └── database/                 # Database models
├── supabase/                     # Lovable Cloud config
│   ├── functions/                # Edge functions
│   │   └── ai-chat/              # AI assistant endpoint
│   └── config.toml               # Supabase configuration
└── public/                       # Static assets
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+ (for Flask backend)

### Frontend Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Backend Setup (Optional - for local ML processing)
```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run Flask server
python app.py
```

### Environment Variables

Create a `.env` file in the root directory:

```env
# Optional: For Google OAuth
VITE_GOOGLE_CLIENT_ID=your-google-client-id

# Auto-configured by Lovable Cloud
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

## 📊 Database Schema

The application uses the following main tables:

| Table | Description |
|-------|-------------|
| `profiles` | User profile information |
| `notifications` | Real-time notification storage |
| `goals` | User-defined analytics goals |
| `achievements` | Achievement definitions |
| `user_achievements` | Earned achievements per user |
| `scheduled_reports` | Automated report configurations |
| `chat_messages` | AI chat conversation history |

## 🔒 Security Features

- Row Level Security (RLS) on all user tables
- JWT-based authentication
- Secure password hashing with salt
- Session timeout configuration
- CORS protection

## 🎨 Theming

RetailMind supports three themes:
- **Light Mode** - Clean, bright interface
- **Dark Mode** - Easy on the eyes
- **System** - Follows OS preference

Customize colors via CSS variables in `src/index.css`.

## 📱 Responsive Design

Fully responsive across all devices:
- Desktop (1280px+)
- Tablet (768px - 1279px)
- Mobile (< 768px)

Mobile-specific features:
- Hamburger menu with slide-out sidebar
- Touch-optimized interactions
- Collapsible sections

## 🤖 AI Integration

The RetailMind AI assistant uses Google's Gemini 3 Flash model via Lovable AI Gateway:

- Real-time streaming responses
- Context-aware retail analytics guidance
- Natural language data queries
- Markdown-formatted responses

## 📈 Analytics Modules

### Sales Forecasting
- Linear regression model
- Time series visualization
- Trend analysis
- Demand prediction

### Customer Segmentation
- K-Means clustering
- RFM analysis
- Behavioral grouping
- Marketing recommendations

### Market Basket Analysis
- Association rule mining
- Cross-sell opportunities
- Product affinity mapping
- Bundle suggestions

## 🔗 API Endpoints

### Flask Backend
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/auth/login` | POST | Email login |
| `/api/auth/register` | POST | User registration |
| `/api/forecast` | POST | Generate forecast |
| `/api/segments` | POST | Customer segmentation |
| `/api/basket` | POST | Basket analysis |
| `/api/alerts` | GET | Get smart alerts |
| `/api/upload` | POST | Upload CSV data |

### Edge Functions
| Function | Description |
|----------|-------------|
| `ai-chat` | AI assistant endpoint |

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🙏 Acknowledgments

- Built with [Lovable](https://lovable.dev)
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Icons from [Lucide](https://lucide.dev)
- AI powered by Google Gemini via Lovable AI
