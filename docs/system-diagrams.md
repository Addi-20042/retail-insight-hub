# Retail Insight Hub Diagrams (Mermaid)

## 1) ERD
```mermaid
erDiagram
    PROFILES {
      uuid id PK
      uuid user_id UK
      text display_name
      text avatar_url
      timestamptz created_at
      timestamptz updated_at
    }

    SALES_DATA {
      uuid id PK
      uuid user_id
      date date
      text product
      int quantity
      numeric revenue
      text category
      text customer_id
      text transaction_id
      timestamptz created_at
    }

    UPLOAD_HISTORY {
      uuid id PK
      uuid user_id
      text filename
      int rows_count
      text status
      timestamptz created_at
    }

    ACTIVITY_LOG {
      uuid id PK
      uuid user_id
      text type
      text message
      timestamptz created_at
    }

    NOTIFICATIONS {
      uuid id PK
      uuid user_id
      text type
      text title
      text message
      text category
      bool read
      text action_url
      timestamptz created_at
    }

    GOALS {
      uuid id PK
      uuid user_id
      text title
      text description
      numeric target_value
      numeric current_value
      text unit
      text category
      timestamptz due_date
      bool completed
      timestamptz completed_at
      timestamptz created_at
      timestamptz updated_at
    }

    ACHIEVEMENTS {
      uuid id PK
      text name UK
      text description
      text icon
      text category
      int points
      text requirement_type
      int requirement_value
    }

    USER_ACHIEVEMENTS {
      uuid id PK
      uuid user_id
      uuid achievement_id FK
      timestamptz earned_at
    }

    SCHEDULED_REPORTS {
      uuid id PK
      uuid user_id
      text name
      text report_type
      text schedule
      int day_of_week
      time time_of_day
      text[] email_recipients
      bool enabled
      timestamptz last_sent_at
      timestamptz next_run_at
      timestamptz created_at
      timestamptz updated_at
    }

    CHAT_MESSAGES {
      uuid id PK
      uuid user_id
      uuid conversation_id
      text role
      text content
      timestamptz created_at
    }

    PROFILES ||--o{ SALES_DATA : owns
    PROFILES ||--o{ UPLOAD_HISTORY : owns
    PROFILES ||--o{ ACTIVITY_LOG : owns
    PROFILES ||--o{ NOTIFICATIONS : receives
    PROFILES ||--o{ GOALS : tracks
    PROFILES ||--o{ USER_ACHIEVEMENTS : earns
    ACHIEVEMENTS ||--o{ USER_ACHIEVEMENTS : awarded_as
    PROFILES ||--o{ SCHEDULED_REPORTS : configures
    PROFILES ||--o{ CHAT_MESSAGES : writes
```

## 2) DFD Level 0 (Context)
```mermaid
flowchart LR
    User[Retail User] -->|Login, Upload CSV, Requests| RH((Retail Insight Hub))
    RH -->|Dashboards, Alerts, Forecasts, Reports| User

    RH -->|Auth + Data Read/Write| Supabase[(Supabase DB + Auth)]
    Supabase -->|User/Profile/Data| RH

    RH -->|Scheduled Report Trigger| Email[Email Service]
    Email -->|Report Delivered| User
```

## 3) DFD Level 1
```mermaid
flowchart LR
    U[Retail User]

    P1((1.0 Auth & Session))
    P2((2.0 Data Upload & Validation))
    P3((3.0 Analytics Engine))
    P4((4.0 Notification & Goals))
    P5((5.0 Reporting))

    D1[(profiles)]
    D2[(sales_data)]
    D3[(upload_history)]
    D4[(activity_log)]
    D5[(goals)]
    D6[(notifications)]
    D7[(scheduled_reports)]

    U -->|Login/Register| P1
    P1 <--> D1

    U -->|Upload Sales File| P2
    P2 --> D2
    P2 --> D3
    P2 --> D4

    U -->|Forecast/Segments/Basket/Alerts Requests| P3
    P3 <--> D2
    P3 --> D4

    U -->|Goal Update/Read Notifications| P4
    P4 <--> D5
    P4 <--> D6
    P4 --> D4

    U -->|Generate/Manage Reports| P5
    P5 <--> D7
    P5 <--> D2
```

## 4) Class Diagram
```mermaid
classDiagram
    class AuthController {
      +login()
      +register()
      +refreshToken()
    }

    class UploadController {
      +uploadCSV()
      +getUploadHistory()
    }

    class AnalyticsController {
      +getForecast()
      +getSegments()
      +getBasketRules()
      +getAlerts()
    }

    class ReportController {
      +createSchedule()
      +sendReport()
    }

    class SupabaseRepository {
      +getSalesData(userId)
      +insertSalesBatch(rows)
      +getGoals(userId)
      +saveNotification(data)
    }

    class ForecastService {
      +forecastSales(df,days)
    }

    class SegmentationService {
      +segmentCustomers(df)
    }

    class BasketService {
      +findRules(df)
    }

    class AlertsService {
      +generateAlerts(df)
    }

    AuthController --> SupabaseRepository
    UploadController --> SupabaseRepository
    AnalyticsController --> ForecastService
    AnalyticsController --> SegmentationService
    AnalyticsController --> BasketService
    AnalyticsController --> AlertsService
    ForecastService --> SupabaseRepository
    SegmentationService --> SupabaseRepository
    BasketService --> SupabaseRepository
    AlertsService --> SupabaseRepository
    ReportController --> SupabaseRepository
```

## 5) Use Case Diagram
```mermaid
flowchart LR
    User([Retail User])
    Admin([Admin])

    UC1((Authenticate))
    UC2((Upload Sales Data))
    UC3((View Dashboard))
    UC4((Run Forecast))
    UC5((Run Customer Segmentation))
    UC6((Run Market Basket Analysis))
    UC7((View Smart Alerts))
    UC8((Manage Goals))
    UC9((Configure Scheduled Reports))
    UC10((Use AI Chat Assistant))

    User --> UC1
    User --> UC2
    User --> UC3
    User --> UC4
    User --> UC5
    User --> UC6
    User --> UC7
    User --> UC8
    User --> UC9
    User --> UC10

    Admin --> UC3
    Admin --> UC9
```

## 6) Activity Diagram
```mermaid
flowchart TD
    A([Start]) --> B[User logs in]
    B --> C[Upload CSV file]
    C --> D{Valid format?}
    D -- No --> E[Show validation error]
    E --> C
    D -- Yes --> F[Store records in sales_data]
    F --> G[Update upload_history]
    G --> H[Run analytics pipeline]
    H --> I[Generate alerts/forecast/segments/basket rules]
    I --> J[Display dashboard insights]
    J --> K{Create scheduled report?}
    K -- Yes --> L[Save schedule and recipients]
    K -- No --> M([End])
    L --> M([End])
```

## 7) Sequence Diagram
```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant FE as Frontend (React)
    participant BE as Backend API
    participant SB as Supabase
    participant AN as Analytics Service

    U->>FE: Upload sales CSV
    FE->>BE: POST /upload (file, token)
    BE->>SB: Validate user + insert sales rows
    SB-->>BE: Insert result
    BE->>AN: Trigger preprocessing + model pipeline
    AN-->>BE: Forecast, segments, basket rules, alerts
    BE->>SB: Save activity/metadata
    BE-->>FE: 200 + computed insights
    FE-->>U: Render dashboard cards/charts
```

## 8) Collaboration Diagram (Communication-Style)
```mermaid
flowchart LR
    U[User]
    FE[Frontend]
    BE[Backend API]
    SB[(Supabase)]
    ML[Analytics Services]

    U -->|1. Upload request| FE
    FE -->|2. POST /upload| BE
    BE -->|3. Persist sales_data| SB
    SB -->|4. Ack| BE
    BE -->|5. Execute forecast/segments/basket| ML
    ML -->|6. Results| BE
    BE -->|7. Response payload| FE
    FE -->|8. Dashboard update| U
```

## 9) State Chart Diagram
```mermaid
stateDiagram-v2
    [*] --> New
    New --> Processing : upload_started
    Processing --> Failed : validation_error
    Processing --> Stored : records_saved
    Stored --> Analyzing : analytics_triggered
    Analyzing --> Ready : insights_generated
    Ready --> Reporting : schedule_created
    Reporting --> Ready : report_sent
    Failed --> Processing : retry
    Ready --> [*]
```

## 10) Package Diagram
```mermaid
classDiagram
    namespace Frontend {
      class Pages
      class Components
      class Hooks
      class ApiClient
    }

    namespace Backend {
      class Routes
      class Auth
      class Services
      class DatabaseLayer
    }

    namespace Supabase {
      class Tables
      class EdgeFunctions
      class RLSPolicies
    }

    namespace Shared {
      class Types
      class Config
    }

    Frontend.ApiClient --> Backend.Routes
    Backend.DatabaseLayer --> Supabase.Tables
    Backend.Routes --> Backend.Services
    Frontend.Hooks --> Shared.Types
    Backend.Services --> Shared.Config
    Supabase.EdgeFunctions --> Supabase.Tables
```

## 11) Deployment Diagram
```mermaid
flowchart TB
    subgraph Client["Client Device"]
      Browser[Web Browser]
    end

    subgraph Web["Frontend Hosting"]
      SPA[React + Vite App]
    end

    subgraph API["Backend Runtime"]
      Flask[Flask API Service]
      ML[Python Analytics Modules]
    end

    subgraph Data["Supabase Cloud"]
      Auth[Supabase Auth]
      DB[(Postgres + RLS)]
      Edge[Edge Functions]
    end

    subgraph External["External Service"]
      Email[Email Provider]
    end

    Browser --> SPA
    SPA --> Flask
    SPA --> Auth
    Flask --> DB
    Flask --> ML
    SPA --> Edge
    Edge --> DB
    Edge --> Email
```

