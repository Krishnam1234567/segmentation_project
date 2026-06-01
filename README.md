# LexOS — Legal Operating System

<p align="center">
  <img src="https://img.shields.io/badge/LexOS-Legal%20Operating%20System-blue?style=for-the-badge&logo=scala&logoColor=white" alt="LexOS" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/FastAPI-Backend-009688?style=flat-square&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/React-Frontend-20232A?style=flat-square&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/Gemini-AI%20Copilot-8E75C2?style=flat-square&logo=google&logoColor=white" />
  <img src="https://img.shields.io/badge/SQLite-Database-003B57?style=flat-square&logo=sqlite&logoColor=white" />
</p>

LexOS is an AI-powered **Legal Operating System** that acts as a real-time legal intelligence layer for enterprises. It creates a **Legal Digital Twin** of your organization — continuously monitoring contracts, compliance, litigation risk, and governance so legal problems are predicted before they happen.

---

## ✨ Features

- **Enterprise Dashboard** — Real-time legal risk scores, compliance rates, and AI recommendations
- **Legal Digital Twin** — Interactive corporate mirror showing subsidiaries, obligations, and risk exposure
- **Contract Intelligence** — AI-powered contract analysis, adversarial audits, and renewal tracking
- **Compliance Engine** — Live heatmaps, automated status tracking, and regulatory monitoring
- **Litigation Prediction** — AI-driven risk scoring and dispute forecasting
- **AI Legal Copilot** — Gemini-powered chatbot for legal queries, analysis, and recommendations
- **Autonomous AI Agents** — Compliance, Filing, Contract, Governance, Expansion, and Audit agents
- **Global Expansion Simulator** — Cross-border hiring, tax, and data residency checks
- **Governance & Board Management** — Board resolutions, ESOP tracking, and shareholder voting
- **Knowledge Graph** — Maps legal relationships, statutory connections, and contract dependencies
- **Analytics & Reporting** — Executive dashboards with spend forecasts and compliance trends
- **Enterprise Integrations** — Connect with SAP, Salesforce, Slack, Okta, and more

---

## 🛠️ Tech Stack

| Layer | Technology |
|:------|:-----------|
| Frontend | React 18, Vite, Tailwind CSS, Recharts, Lucide Icons |
| Backend | Python, FastAPI, SQLAlchemy (async), aiosqlite |
| Database | SQLite (`lexos.db`) |
| AI | Google Gemini 2.5 Flash |
| Deployment | Vercel (frontend) + Render (backend) |

---

## 🚀 Quick Start (Local)

### Prerequisites
- Python 3.12+
- Node.js 20+
- A [Gemini API key](https://aistudio.google.com/apikey)

### 1. Clone & Setup

```bash
git clone https://github.com/Krishnam1234567/LexOS.git
cd LexOS
```

### 2. Start the Backend

```bash
cd backend
pip install -r requirements.txt
```

Create a `.env` file:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Run the server:
```bash
uvicorn app.main:app --reload --port 8080
```

> The database (`lexos.db`) is auto-created and seeded with sample data on first run.

### 3. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** and you're in! 🎉

---

## 🌐 Live Deployment

| Service | URL |
|:--------|:----|
| Frontend | [lex-os-ten.vercel.app](https://lex-os-ten.vercel.app) |
| Backend | [lexos-35mp.onrender.com](https://lexos-35mp.onrender.com) |
| API Docs | [lexos-35mp.onrender.com/docs](https://lexos-35mp.onrender.com/docs) |

---

## 📁 Project Structure

```
LexOS/
├── frontend/          # React + Vite frontend
│   ├── src/
│   │   ├── screens/   # All 13 app screens
│   │   ├── components/# Reusable UI components
│   │   └── utils/     # API helpers
│   └── vite.config.js
├── backend/           # FastAPI backend
│   ├── app/
│   │   ├── main.py    # App entry point
│   │   ├── routers/   # API route handlers
│   │   ├── models/    # SQLAlchemy models
│   │   └── database.py
│   └── requirements.txt
└── README.md
```

---

**Built for the AI economy.** 🏛️
