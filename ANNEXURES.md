# Annexures

## Annexure A - Project Repository and Structure
**GitHub Repository Link**: [https://github.com/HarshDawne/SalesPilot_CRM](https://github.com/HarshDawne/SalesPilot_CRM)

**Project Structure**:
```text
SalesPilot_CRM/
├── data/                  # Local JSON database (db.json) and seed data
├── public/                # Static assets, properties, and unit icons
├── scripts/               # Utility scripts for data seeding and verification
├── src/
│   ├── app/               # Next.js App Router (Pages and API Routes)
│   │   ├── api/           # Backend API Endpoints
│   │   ├── calendar/      # Visit scheduling and Temporal Hub
│   │   ├── leads/         # Lead management and scoring
│   │   └── properties/    # Property OS (Towers, Units, Renders)
│   ├── components/        # Reusable UI components (Premium Design System)
│   ├── modules/           # Domain-specific services (Communication, Sales, Visits)
│   ├── lib/               # Shared utilities, DB client, and AI configuration
│   └── types/             # TypeScript interfaces and domain models
├── .env.local             # Environment configuration
├── package.json           # Project dependencies and scripts
└── next.config.ts         # Next.js configuration
```

## Annexure B: Local Setup & Installation Guide
To run the SalesPilot CRM environment locally on a new machine, execute the following steps:

### 1. Clone the Repository
```bash
git clone https://github.com/HarshDawne/SalesPilot_CRM.git
cd SalesPilot_CRM
```

### 2. Environment Configuration
Create a `.env.local` file in the root directory and add the following keys:
```env
# AI & Voice Configuration
BOLNA_API_KEY=your_bolna_api_key
BOLNA_AGENT_ID=your_bolna_agent_id
AI_API_KEY=your_openrouter_or_openai_key

# Communication Services
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
RESEND_API_KEY=your_resend_api_key

# Database
NEXT_PUBLIC_FIREBASE_DATABASE_URL=your_firebase_url
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Launch the Development Server
```bash
npm run dev
```

### 5. Access the Application
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Annexure C: Core API Endpoints

| Module | Endpoint | Method | Description |
| :--- | :--- | :--- | :--- |
| **Leads** | `/api/leads` | GET | Retrieves the prioritized list of leads with AI scoring. |
| **Leads** | `/api/leads/[id]` | GET | Fetches full context for a specific lead, including call transcripts. |
| **Calendar** | `/api/calendar/events` | GET | Returns scheduled site visits and AI follow-ups for the given date range. |
| **Properties** | `/api/properties` | GET | Lists all real estate projects and their current occupancy metrics. |
| **Inventory** | `/api/units/[id]/reserve` | POST | Locks a specific unit for a lead and creates a timeline audit trail. |
| **Communication**| `/api/comm/campaigns` | POST | Launches an AI-powered voice or WhatsApp outreach campaign. |
| **Intelligence** | `/api/reports/metrics` | GET | Aggregates conversion data and sales performance for the dashboard. |
| **Webhooks** | `/api/webhooks/lead` | POST | Ingests new leads from external sources (Website/FB Ads) in real-time. |

**Table C.1: List of Core API Endpoints in SalesPilot CRM Platform**
