# GarageFlow ERP — Garage Management System

> **Enterprise / Workshop Desktop Application (.exe)** for small-to-medium vehicle service centers, built with **Electron**, **Vanilla JS / HTML5 / CSS3**, and **Google Firebase (Firestore, Auth, Storage, IndexedDB Persistence)**.

---

## 📌 Table of Contents
1. [Project Overview](#-project-overview)
2. [Key Architecture & Core Principles](#-key-architecture--core-principles)
3. [Technology Stack](#-technology-stack)
4. [System Modules](#-system-modules)
5. [Job Card Lifecycle & Workflow](#-job-card-lifecycle--workflow)
6. [Firestore Database Schema](#-firestore-database-schema)
7. [User Roles & Security Permissions](#-user-roles--security-permissions)
8. [Prerequisites & System Requirements](#-prerequisites--system-requirements)
9. [Installation & Setup Guide](#-installation--setup-guide)
10. [Firebase Setup & Configuration](#-firebase-setup--configuration)
11. [Running the Application](#-running-the-application)
12. [Building the Windows Installer (.exe)](#-building-the-windows-installer-exe)
13. [Project Directory Structure](#-project-directory-structure)
14. [Development & Handover Roadmap](#-development--handover-roadmap)

---

## 📖 Project Overview

**GarageFlow ERP** replaces error-prone paper job cards, handwritten invoices, and scattered spreadsheets with a fast, unified, offline-resilient desktop management software. Designed specifically for vehicle workshops and service stations, the system anchors all workflows around the **Vehicle License Plate Number**.

### Primary Benefits:
- **Zero Local Maintenance:** All data syncs to Google Cloud Firestore with real-time replication.
- **No Stock/Inventory Headaches:** Parts are tracked on a per-job basis (Cost Price vs. Sell Price) to calculate pure profit without cumbersome warehouse inventory management.
- **Offline Persistence:** Works seamlessly through intermittent shop Wi-Fi outages with automatic background synchronization via Firebase IndexedDB persistence.
- **Single Executable Deployment:** Distributed as a standalone Windows `.exe` installer.

---

## ⚡ Key Architecture & Core Principles

1. **Plate-Centric Data Model:** The vehicle registration number (e.g., `TX-782-LM`) is the primary key and entry point for all workflows (search, intake, job cards, billing, and reminders).
2. **One Active Job Card per Vehicle:** Prevents conflicting duplicate repair workflows.
3. **Split Revenue & Profit Tracking:** Explicit separation between **Labor Revenue** and **Parts Markup Profit** (`(Sell Price - Cost Price) * Qty`).
4. **Role-Based Access Control:** Strict division between Administrator and Staff permissions (e.g., discounting, reopening closed job cards, and global settings).

---

## 🛠 Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Desktop Shell** | [Electron](https://www.electronjs.org/) | Native desktop windowing, system tray, local OS hardware integration. |
| **Frontend UI** | HTML5, CSS3, Vanilla JavaScript | High-speed, lightweight UI without heavy framework runtime overhead. |
| **Charts & Analytics**| [Chart.js](https://www.chartjs.org/) | Renders weekly revenue trends, mechanic workloads, and service analytics. |
| **PDF Generation** | [pdf-lib](https://pdf-lib.js.org/) | Direct client-side creation and printing of itemized PDF invoices. |
| **Backend / Database**| [Firebase Firestore](https://firebase.google.com/docs/firestore) | Cloud NoSQL database with real-time sync and indexed offline cache. |
| **Authentication** | [Firebase Auth](https://firebase.google.com/docs/auth) | Secure email/password login and session management. |
| **File Storage** | [Firebase Storage](https://firebase.google.com/docs/storage) | Cloud storage for workshop logos, inspection photos, and attachments. |
| **Packaging** | [Electron Builder](https://www.electron.build/) | Packages source into a production-ready Windows `.exe` installer. |

---

## 🧩 System Modules

1. **Authentication & Session:** Secure AES-256 styled interface with session persistence ("Remember this station").
2. **Operational Dashboard:** Live metrics displaying active jobs in progress, today's revenue, monthly targets, overdue receivables, mechanic allocation, and revenue trends.
3. **Vehicle & Customer Management:** Customer directory linked to vehicle registries; full historical repair log attached to vehicle plates.
4. **Job Card Center:** Real-time lifecycle management (Intake, Problem notes, Mechanic assignment, Photo uploads, Internal staff notes).
5. **Parts & Job Costing:** Per-line item tracking with shortcut lists for rapid entry and real-time margin calculation.
6. **Labor Charges Module:** Supports itemized hourly labor tasks and flat-rate charges.
7. **Billing & Invoices:** Instant PDF export, printable itemized bills, tax calculation, partial payment logging, and balance tracking.
8. **Appointments & Automated Reminders:** Converts future bookings to active job cards with a single click; triggers reminders based on calendar date or mileage milestones.
9. **Reports & Analytics:** Date-filtered summaries for technician turnaround, parts profit, labor revenue, and most common repairs.
10. **Global Settings & Administration:** Workshop profile (Name, Hotline, Tax %, Currency Code) and staff access control.

---

## 🔄 Job Card Lifecycle & Workflow

```mermaid
graph LR
    A[1. Received] --> B[2. Diagnosing]
    B --> C[3. In Repair]
    C --> D[4. Ready / Locked]
    D --> E[5. Delivered]
```

1. **Received (Check-in):** Staff searches vehicle plate (or registers new vehicle/owner). Records current odometer mileage, problem description, and assigns technician. Active job card created.
2. **Diagnosing (Inspection):** Mechanic inspects vehicle, notes actual root causes, and updates diagnosis notes.
3. **In Repair (Work Underway):** External parts purchased are logged (Cost vs. Sell). Labor tasks/hours recorded. Photos uploaded.
4. **Ready (Completed):** Job card locked from regular edits. Auto-generates invoice and alerts front desk to call customer. *(Admin override required to reopen).*
5. **Delivered (Handover):** Staff captures payment (full or partial). Final mileage updated in database. Follow-up maintenance reminder auto-scheduled.

---

## 🗄 Firestore Database Schema

### `customers`
```json
{
  "name": "Jonathan Reed",
  "phone": "+1 (555) 482-1920",
  "address": "Colombo, Sri Lanka",
  "created_at": "Timestamp"
}
```

### `vehicles`
```json
{
  "plate": "TX-782-LM", // Primary identifier
  "make": "BMW",
  "model": "320i",
  "year": 2018,
  "mileage": 42500,
  "customer_id": "CUSTOMER_DOC_ID",
  "last_service_date": "Timestamp"
}
```

### `job_cards`
```json
{
  "job_card_id": "JC-4820",
  "vehicle_plate": "TX-782-LM",
  "vehicle_id": "VEHICLE_DOC_ID",
  "mechanic": "Dave Mercer",
  "status": "Received | Diagnosing | In Repair | Ready | Delivered",
  "problem": "Customer reports squeaking sound from front brakes",
  "diagnosis": "Front brake pads worn down to 2mm. Rotors require resurfacing.",
  "mileage_at_intake": 42500,
  "locked": false,
  "opened_date": "Timestamp",
  "closed_date": "Timestamp"
}
```

### `job_card_parts`
```json
{
  "job_card_id": "JC-4820",
  "part_name": "OEM Front Brake Pads (BMW-320i)",
  "cost_price": 70.00,
  "sell_price": 120.00,
  "qty": 1
}
```

### `job_card_labor`
```json
{
  "job_card_id": "JC-4820",
  "description": "Front Brake Pad Replacement & Resurfacing",
  "hours": 2.5,
  "rate": 85.00,
  "amount": 212.50
}
```

### `invoices`
```json
{
  "invoice_no": "GF-2023-984",
  "job_card_id": "JC-4820",
  "vehicle_plate": "TX-782-LM",
  "subtotal": 332.50,
  "tax_rate": 10,
  "tax_amount": 33.25,
  "discount": 0.00,
  "total": 365.75,
  "paid_amount": 200.00,
  "balance": 165.75,
  "status": "Pending | Partially Paid | Paid",
  "payment_method": "Cash | Card | Bank Transfer",
  "date": "Timestamp"
}
```

### `appointments` & `reminders`
- **`appointments`**: `{ vehicle_plate, date, time, service_type, mechanic, status }`
- **`reminders`**: `{ vehicle_plate, type, trigger_type, due_date, due_mileage, notified: false }`

### `users`
- **`users`**: `{ name, email, role: "admin" | "staff", status: "Active" }`

---

## 🔒 User Roles & Security Permissions

| Feature / Action | Admin | Staff |
| :--- | :---: | :---: |
| Search Vehicle & History | ✅ | ✅ |
| Register New Customer / Vehicle | ✅ | ✅ |
| Open & Update Active Job Cards | ✅ | ✅ |
| Add Parts & Labor Line Items | ✅ | ✅ |
| Upload Inspection Photos | ✅ | ✅ |
| Generate Standard Invoices | ✅ | ✅ |
| Record Payments (Full / Partial) | ✅ | ✅ |
| **Apply Invoice Discounts** | ✅ | ❌ |
| **Reopen Locked / Ready Job Cards** | ✅ | ❌ |
| **View Financial & Profit Analytics**| ✅ | Limited |
| **Manage User Accounts & Roles** | ✅ | ❌ |
| **Modify Global Shop Configuration** | ✅ | ❌ |

---

## 💻 Prerequisites & System Requirements

### Development Environment:
- **Node.js**: `v18.x` or `v20.x` LTS
- **npm**: `v9.x`+ or **yarn**
- **Git**
- **Firebase Account** (Free Spark Plan is sufficient)
- **Visual Studio Code** (recommended)

### Production Target Machine:
- **OS**: Windows 10 / 11 (64-bit)
- **Memory**: Minimum 4 GB RAM
- **Network**: Wi-Fi / Ethernet for real-time Firebase sync (operates offline during temporary network loss)

---

## 🚀 Installation & Setup Guide

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/garageflow-erp.git
cd garageflow-erp
```

### 2. Install Project Dependencies
```bash
npm install
```

---

## 🔥 Firebase Setup & Configuration

1. Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project (e.g., `garageflow-erp`).
2. **Enable Authentication:**
   - Go to **Build > Authentication > Sign-in method**.
   - Enable **Email/Password**.
   - Create your initial admin user (e.g., `admin@garageflow.com`).
3. **Enable Firestore Database:**
   - Go to **Build > Firestore Database > Create Database**.
   - Select production or test mode in your preferred region.
4. **Enable Firebase Storage:**
   - Go to **Build > Storage > Get Started** to enable workshop asset and photo uploads.
5. **Configure Environment Variables:**
   - Copy the sample environment file:
     ```bash
     cp .env.example .env
     ```
   - Populate `.env` (or `src/config/firebase-config.js`) with your web application credentials:
     ```env
     FIREBASE_API_KEY=your_api_key
     FIREBASE_AUTH_DOMAIN=garageflow-erp.firebaseapp.com
     FIREBASE_PROJECT_ID=garageflow-erp
     FIREBASE_STORAGE_BUCKET=garageflow-erp.appspot.com
     FIREBASE_MESSAGING_SENDER_ID=your_sender_id
     FIREBASE_APP_ID=your_app_id
     ```
6. **Enable Offline Persistence:**
   Ensure `enableIndexedDbPersistence(db)` is enabled in your Firestore initialization script to guarantee offline data caching.

---

## 🖥 Running the Application

### Development Mode (with Hot Reload / DevTools):
```bash
npm run dev
```
*(Starts the Electron desktop window and loads the local frontend interface).*

### Standard Start:
```bash
npm start
```

---

## 📦 Building the Windows Installer (.exe)

Package the Electron application into a production-ready Windows installer with **Electron Builder**:

```bash
# Package for Windows 64-bit
npm run build:win
```

The output `.exe` installer will be generated in the `dist/` directory:
- `dist/GarageFlow-ERP-Setup-1.4.2.exe`

---

## 📁 Project Directory Structure

```text
garageflow-erp/
├── assets/                  # Icons, fonts, branding images
│   └── icon.ico
├── src/
│   ├── main/                # Electron main process
│   │   ├── main.js          # Desktop window management & lifecycle
│   │   └── preload.js       # Context bridge & secure IPC
│   ├── renderer/            # Frontend UI (Vanilla JS + HTML5 + CSS3)
│   │   ├── index.html       # Single Page Application container
│   │   ├── css/
│   │   │   ├── style.css    # Global stylesheet & design system
│   │   │   └── modules.css  # Component-specific styles
│   │   ├── js/
│   │   │   ├── app.js       # App router & event listeners
│   │   │   ├── auth.js      # Authentication & session handlers
│   │   │   ├── dashboard.js # Dashboard statistics & chart rendering
│   │   │   ├── jobcards.js  # Job card workflow & modal logic
│   │   │   ├── billing.js   # PDF invoice generation via pdf-lib
│   │   │   ├── customers.js # Customer & vehicle registries
│   │   │   └── reports.js   # Analytics & CSV export
│   │   └── config/
│   │       └── firebase.js  # Firebase SDK initialization & offline cache
├── package.json             # Scripts and dependencies
├── .env.example             # Template for Firebase credentials
├── .gitignore               # Git exclusions
└── README.md                # Project documentation
```

---

## 📅 Development & Handover Roadmap

- **Phase 0 — Requirements Lock (3–5 Days):** Confirm client workflows, fields, and invoice formats.
- **Phase 1 — Architecture & Design (1 Week):** Finalize Firestore indexing, wireframes, and security rules.
- **Phase 2 — Core Module Build (3–4 Weeks):** Pair programming across Vehicles, Job Cards, Costing, PDF Invoicing, and Dashboard.
- **Phase 3 — Internal QA & Offline Testing (1 Week):** Stress test partial payments, network dropouts, and admin privilege overrides.
- **Phase 4 — Live Workshop Pilot (1–2 Weeks):** Front-desk deployment, observation of typing speed, thermal/laser receipt printing, and UX refinement.
- **Phase 5 — Delivery & Staff Handover (2–3 Days):** Final configuration, staff walkthrough, user manual handover, and 30-day warranty support.

---

## 📄 License & Team
- **Client:** Small Vehicle Service Center, Sri Lanka
- **Engineering Team:** Two-Person Development Team
- **Version:** v1.4.2-stable (July 2026)
