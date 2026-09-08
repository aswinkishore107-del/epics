# VIORA — AI-Powered Smart Health Platform for Elderly Well-being

> **A comprehensive, full-stack connected health platform based on the VIORA smart neckband specification (MAX30102 PPG, AD8232 ECG/EDR, TMP117 Skin Temperature, MPU6050 Accelerometer).**

---

## 🌟 Overview

VIORA provides three interconnected role portals communicating through a single Node.js backend and a Neon PostgreSQL database with real-time Socket.IO:

1. **Elderly / Patient Portal (`/elderly/*`)**: High-contrast, accessible vitals monitoring, voice assistant ("Talk to VIORA"), medication schedule & adherence, animated ECG & EDR respiration oscilloscope, emergency SOS escalation, and entertainment center (music player & phone call/notification simulation).
2. **Caregiver Portal (`/caregiver/*`)**: Comprehensive patient directory, real-time safety alerts feed, medication adherence metrics, team messaging, and configurable safety thresholds.
3. **Doctor Portal (`/doctor/*`)**: Clinical triage workspace with patient categorization (CRITICAL / WARNING / STABLE), interactive historical charts, SOAP consultation notes, and AI clinical synthesis generator.
4. **Admin Portal (`/admin/*`)**: Fleet hardware monitoring, sensor telemetry status, safety rule engine simulator, and platform audit logs.

---

## 🏗️ Architecture & Strict Specifications

- **Skin Temperature (TMP117)**: Strictly labeled as **Skin Temperature** with explicit attribution to the *"TMP117 Precision Sensor"*.
- **Respiratory Rate (EDR)**: Standardized as **Respiratory Rate** derived via *"ECG-Derived Respiration (EDR)"* from AD8232.
- **Safety Rule Engine**: Deterministic rule evaluation pipeline independent of LLM hallucinations. All demo rules carry: *"Demo safety threshold — not a medical diagnosis"*.
- **Dual Voice Architecture**: Grounded in database tools via `BrowserVoiceProvider` (Web Speech API) and `NeckbandVoiceProvider` (future ESP32 hardware bridge).
- **Connected Lifestyle Features**: Elderly entertainment center supporting playback controls (`PLAY`, `PAUSE`, `NEXT`, `PREVIOUS`, `SET_VOLUME`), phone calls, and smartphone notification mirror.

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18+ (tested on Node v22.16.0)
- **Database**: PostgreSQL (Live Neon serverless connection string pre-configured)

### 2. Installation
From the repository root:
```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 3. Database Synchronization & Seed
```bash
# Push Prisma schema to Neon PostgreSQL and seed test data
cd server
npx prisma db push --schema=./prisma/schema.prisma
npm run seed
```

### 4. Running Locally
In two separate terminals:

**Terminal 1 — Backend Server (Port 5000):**
```bash
cd server
npm run dev
```

**Terminal 2 — Frontend Client (Port 5173):**
```bash
cd client
npm run dev
```

Open your browser and navigate to: **[http://localhost:5173](http://localhost:5173)**

---

## 🔑 Demo Accounts & Credentials

The login page (`/login`) includes **1-Click Quick Demo Fill** buttons for each role:

| Role | Email | Password | Primary Dashboard |
| :--- | :--- | :--- | :--- |
| **Elderly Patient** | `elderly@viora.demo` | `Elderly@123` | `/elderly` |
| **Family Caregiver** | `caregiver@viora.demo` | `Caregiver@123` | `/caregiver` |
| **Physician / Doctor** | `doctor@viora.demo` | `Doctor@123` | `/doctor` |
| **System Admin** | `admin@viora.demo` | `Admin@123` | `/admin` |

---

## 🛠️ Tech Stack

### Frontend
- React 18 + Vite + TypeScript
- Tailwind CSS
- Lucide React icons
- Recharts for clinical vital trends
- HTML5 Canvas for real-time ECG oscilloscope animation
- Socket.IO-Client for real-time telemetry and alerts
- Web Audio API for emergency chimes and countdown sirens

### Backend
- Node.js + Express.js + TypeScript
- Prisma ORM 5.22
- Neon Serverless PostgreSQL
- Socket.IO for bi-directional WebSocket streaming
- OpenAI (`gpt-4o-mini`) for tool-grounded AI consultation
- Zod schema validation
- JWT + Bcrypt authentication

---

## 📡 Hardware Simulation & Anomaly Ingestion

Use the floating **Hardware Simulation Drawer** button at the bottom-right of any screen to inject:
- **Normal Vitals**: HR 72 BPM, SpO₂ 98%, Temp 34.2°C, EDR 16 BrPM
- **Tachycardia Anomaly**: HR 128 BPM (threshold >110)
- **Hypoxia Anomaly**: SpO₂ 89% (threshold <92%)
- **Fall Detection**: 15-second countdown with audible siren and false-alarm cancel button
- **Immediate SOS**: Emergency contact escalation chain trigger
- **Phone Calls**: Incoming call notification and neckband audio routing
