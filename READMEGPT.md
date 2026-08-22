# GarageFlow ERP — Garage Management System

A Windows desktop garage management application for a small vehicle service center in Sri Lanka.

The system replaces paper job cards, handwritten invoices, and scattered records with one application for vehicle/customer records, appointments, job cards, parts and labor costing, invoicing, payments, reminders, reports, and administration.

> **Source of requirements:** This README is based on the provided **Garage System Development Flow** and **Garage UI** documents. Where those documents leave implementation details open, this README marks them as decisions to confirm rather than inventing requirements.

---

## 1. Project Overview

### Primary goal

Build an offline-capable Windows `.exe` desktop application that:

- Uses the **vehicle license plate as the primary operational identifier**.
- Stores business data in **Firebase Firestore**.
- Uses **Firebase Authentication** for Admin/Staff login.
- Uses **Firebase Storage** for logos and uploaded job/vehicle photos or documents.
- Provides offline persistence for recent Firestore data.
- Generates printable PDF invoices.
- Provides operational, financial, and mechanic-performance reporting.
- Does **not** implement physical parts inventory or stock management.

### Core business rule

> **Vehicle number / license plate is the entry point for every operation.**

Vehicle search, job cards, invoices, service history, and reminders are all tied back to the vehicle plate.

---

## 2. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Desktop | Electron | Windows desktop shell |
| UI | HTML, CSS, Vanilla JavaScript | Frontend |
| Database | Firebase Firestore | Cloud data storage |
| Authentication | Firebase Authentication | Email/password login |
| File storage | Firebase Storage | Logos, photos, scanned documents |
| Offline | Firebase/IndexedDB persistence | Recent data and queued changes |
| Charts | Chart.js | Dashboard/report charts |
| PDF | pdf-lib | Invoice PDF generation |
| Packaging | Electron Builder | Windows `.exe` installer |
| IDE | Visual Studio Code | Development |
| Version control | Git + GitHub | Source control/collaboration |

The source document specifies Electron + Firebase + Vanilla HTML/CSS/JavaScript rather than React, Next.js, or another frontend framework.

---

## 3. Main Features

### 3.1 Authentication

Two application roles:

- **Admin**
- **Staff**

Authentication is handled through Firebase Authentication using email/password credentials.

The UI reference shows a login screen containing:

- Email address
- Password
- Forgot password
- Remember this station
- Role indicator
- Firebase connection indicator

### 3.2 Dashboard

The dashboard is the operational starting point after login.

The UI reference includes:

- Active jobs
- Today's revenue
- Active workshop workload
- Weekly revenue trend
- Monthly revenue
- Outstanding payments
- Mechanic load allocation
- Upcoming reminders
- New Job Card action
- Labor revenue
- Parts profit

The dashboard should prioritize information that requires immediate staff attention.

### 3.3 Vehicle & Customer Management

Vehicle records are the primary records used by the system.

Required vehicle information from the development document:

- License plate
- Make
- Model
- Year
- Mileage
- Customer reference

Customer information:

- Name
- Phone
- Address

The UI also shows searching by:

- License plate
- Customer name
- Phone

A customer can own multiple vehicles.

A vehicle's service history stays attached to the vehicle, not the customer.

### 3.4 Job Card Management

The job card is the core operational module.

A job card contains:

- Vehicle
- Customer
- Problem/complaint
- Diagnosis
- Assigned mechanic
- Mileage at intake
- Parts
- Labor
- Notes
- Optional inspection photos
- Status
- Open/close dates
- Audit history

Only **one active job card per vehicle** is allowed.

### 3.5 Job Card Status Workflow

The required lifecycle is:

```text
Received
   ↓
Diagnosing
   ↓
In Repair
   ↓
Ready
   ↓
Delivered
```

#### Received

- Vehicle checked in.
- Mileage recorded.
- Customer problem recorded.
- Mechanic assigned.
- Job becomes the active job for that vehicle.

#### Diagnosing

- Mechanic inspects vehicle.
- Diagnosis is recorded.
- Problem description can be updated if the diagnosed issue differs from the original complaint.

#### In Repair

- Parts are added.
- Labor is added.
- Repair continues.
- Parts can be added in multiple rounds.

#### Ready

- Work is complete.
- Job card becomes locked.
- Invoice is automatically generated.
- Staff contacts customer for pickup.
- Only Admin can reopen the locked job card.

#### Delivered

- Payment is recorded.
- Full or partial payment is supported.
- Final mileage is saved.
- Job card becomes permanent service history.
- Follow-up reminder is created.

### 3.6 Parts & Job Costing

There is **no inventory management**.

Do not build:

- Stock quantities
- Stock-in
- Stock-out
- Warehouse management
- Inventory valuation

Parts are recorded only against a job card.

Each part line contains:

- Part name
- Cost price
- Sell price
- Quantity
- Job card ID

Profit calculation:

```text
Part Profit = (Sell Price - Cost Price) × Quantity
```

The system should also provide a common-parts shortcut list for faster data entry.

### 3.7 Labor

Labor is separate from parts.

Supported approaches:

- Flat-rate labor
- Itemized labor tasks

Each labor line contains:

- Job card ID
- Description
- Amount

Keeping labor separate is important for reporting labor revenue versus parts markup profit.

### 3.8 Appointments

Appointments are booked using the vehicle number.

Appointment information:

- Vehicle plate
- Date
- Time
- Status

When the vehicle arrives, the appointment can be converted directly into a job card.

This avoids entering the same information twice.

The UI reference includes:

- Upcoming bookings
- Today / This Week filtering
- Service type
- Assigned mechanic
- Start Job Card
- Book Appointment

### 3.9 Service Reminders

Reminders are associated with the vehicle plate.

A reminder can be based on:

- Date
- Mileage

Examples from the UI:

- Oil service
- Brake inspection
- Major engine service
- Annual inspection

The dashboard should show vehicles requiring follow-up.

Reminder records contain:

- Vehicle plate
- Reminder type
- Due date
- Notified flag

The development document describes automatic reminder creation after vehicle delivery.

> The UI includes **Send SMS & Email Alert**, but the development document does not specify an SMS/email provider or integration implementation. Treat this as an integration requirement to confirm before implementation.

### 3.10 Billing & Invoicing

Invoices are automatically generated from job card data.

Invoice calculation:

```text
Parts Total
+ Labor Total
- Authorized Discount
+ Tax
= Invoice Total
```

The development document explicitly requires:

- Parts total
- Labor total
- Full payment
- Partial payment
- Payment status
- Payment method
- Printable PDF invoice
- Admin-only discounts

The UI reference additionally displays:

- Subtotal
- Admin discount
- Tax
- Invoice total
- Total paid
- Remaining balance
- Payment transaction log
- Export PDF
- Print Invoice
- Record Payment

### 3.11 Payment Status

The system must support:

```text
Pending
Partially Paid
Paid
```

For partial payments:

```text
Remaining Balance = Invoice Total - Total Paid
```

Supported payment methods specified in the development flow:

- Cash
- Card
- Bank transfer

### 3.12 Reports & Analytics

Reports must be filterable by date range.

Required reports:

- Daily revenue
- Monthly revenue
- Outstanding payments
- Most common repairs
- Parts markup profit
- Mechanic workload

The UI reference shows:

- Total monthly revenue
- Labor revenue
- Parts profit
- Outstanding receivables
- Most common repair
- Completed jobs by technician
- Average turnaround time
- Labor revenue contribution
- Technician status

Chart.js is the specified charting library.

The UI also contains an **Export CSV Report** action.

### 3.13 Settings & User Management

Admin settings include:

- Shop name
- Shop logo
- Contact information/hotline
- Default tax rate
- Currency
- Default labor rates

User management includes:

- User name
- Email
- Role
- Active status

Admin can:

- Add/manage users
- Change shop settings
- Reopen closed job cards

Staff cannot perform those admin-only actions.

---

## 4. User Roles & Permissions

| Feature | Admin | Staff |
|---|:---:|:---:|
| Search vehicle | ✅ | ✅ |
| Create customer/vehicle | ✅ | ✅ |
| Open job card | ✅ | ✅ |
| Add parts | ✅ | ✅ |
| Add labor | ✅ | ✅ |
| Update job status | ✅ | ✅ |
| Generate invoice | ✅ | ✅ |
| Record payment | ✅ | ✅ |
| Apply discount | ✅ | ❌ |
| Reopen closed job | ✅ | ❌ |
| View reports | ✅ | Limited |
| Manage users | ✅ | ❌ |
| Change settings | ✅ | ❌ |

Authorization must be enforced in application logic and Firebase security rules. Hiding a button in the UI is not sufficient security.

---

## 5. Firestore Data Model

The source requirements define these collections.

### `customers`

```text
customers/{customerId}

name
phone
address
```

One customer can own multiple vehicles.

### `vehicles`

```text
vehicles/{vehicleId}

plate
make
model
year
mileage
customer_id
```

`plate` is the primary business identifier.

### `job_cards`

```text
job_cards/{jobCardId}

vehicle_plate
vehicle_id
mechanic
status
problem
mileage_at_intake
opened_date
closed_date
locked
```

The job card document ID is the anchor for parts, labor, and invoice records.

### `job_card_parts`

```text
job_card_parts/{partId}

job_card_id
part_name
cost_price
sell_price
qty
```

### `job_card_labor`

```text
job_card_labor/{laborId}

job_card_id
description
amount
```

### `invoices`

```text
invoices/{invoiceId}

job_card_id
vehicle_plate
total
paid_amount
status
payment_method
date
```

### `appointments`

```text
appointments/{appointmentId}

vehicle_plate
date
time
status
```

### `reminders`

```text
reminders/{reminderId}

vehicle_plate
type
due_date
notified
```

### `users`

```text
users/{userId}

name
email
role
```

Firebase Authentication credentials should remain managed by Firebase Authentication. The Firestore `users` document stores application profile/role information.

---

## 6. Recommended Project Structure

```text
garageflow-erp/
│
├── electron/
│   ├── main.js
│   ├── preload.js
│   └── ipc/
│
├── src/
│   ├── index.html
│   ├── css/
│   │   ├── main.css
│   │   ├── components.css
│   │   └── responsive.css
│   │
│   ├── js/
│   │   ├── app.js
│   │   ├── router.js
│   │   │
│   │   ├── config/
│   │   │   └── firebase.js
│   │   │
│   │   ├── auth/
│   │   │   ├── auth.js
│   │   │   └── permissions.js
│   │   │
│   │   ├── services/
│   │   │   ├── customerService.js
│   │   │   ├── vehicleService.js
│   │   │   ├── jobCardService.js
│   │   │   ├── partsService.js
│   │   │   ├── laborService.js
│   │   │   ├── invoiceService.js
│   │   │   ├── appointmentService.js
│   │   │   ├── reminderService.js
│   │   │   ├── reportService.js
│   │   │   └── settingsService.js
│   │   │
│   │   ├── utils/
│   │   │   ├── calculations.js
│   │   │   ├── validation.js
│   │   │   ├── date.js
│   │   │   └── formatters.js
│   │   │
│   │   └── views/
│   │       ├── login/
│   │       ├── dashboard/
│   │       ├── vehicles/
│   │       ├── jobCards/
│   │       ├── appointments/
│   │       ├── invoices/
│   │       ├── reports/
│   │       └── settings/
│   │
│   ├── assets/
│   │   ├── images/
│   │   └── icons/
│   │
│   └── components/
│       ├── sidebar.js
│       ├── header.js
│       ├── modal.js
│       ├── table.js
│       ├── statusBadge.js
│       └── charts.js
│
├── firebase/
│   ├── firestore.rules
│   ├── firestore.indexes.json
│   └── storage.rules
│
├── scripts/
│   └── seed.js
│
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

This structure is an implementation recommendation for keeping the Vanilla JavaScript project maintainable; the source documents do not prescribe a specific folder structure.

---

## 7. Prerequisites

Install the following before development:

### Required

- Windows development machine
- Node.js
- npm
- Git
- Visual Studio Code
- Firebase project
- Firebase Authentication enabled
- Firebase Firestore enabled
- Firebase Storage enabled

### Recommended

- GitHub repository
- A test Firebase project/environment
- A Windows test machine for `.exe` validation
- Realistic fake garage data for testing

The source project plan identifies Visual Studio Code and Git/GitHub as the development environment and version-control tools.

---

## 8. Initial Setup

### Step 1 — Clone the project

```bash
git clone <YOUR_REPOSITORY_URL>
cd garageflow-erp
```

### Step 2 — Install dependencies

```bash
npm install
```

### Step 3 — Create Firebase project

Create a Firebase project and enable:

1. Authentication
2. Firestore Database
3. Storage

The project requires Firebase to provide:

- Authentication
- Firestore
- Storage
- Offline persistence

### Step 4 — Configure Firebase

Create:

```text
.env
```

Use the Firebase configuration values required by the application.

Example:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

> Use the exact environment-variable naming expected by the implemented Firebase configuration. Never commit real Firebase credentials or secrets to Git.

### Step 5 — Configure Firestore

Create the required collections:

```text
customers
vehicles
job_cards
job_card_parts
job_card_labor
invoices
appointments
reminders
users
```

Apply Firestore security rules before using the application with real data.

### Step 6 — Create the first Admin account

Create an Admin user through Firebase Authentication.

Then create the corresponding Firestore user profile:

```text
users/{firebaseUserUid}
```

Example:

```json
{
  "name": "Garage Administrator",
  "email": "admin@example.com",
  "role": "admin"
}
```

Do not use the sample password shown in the UI document for production.

---

## 9. Development Commands

The final commands depend on the package scripts implemented in `package.json`.

Recommended scripts:

```bash
npm run dev
```

Starts the application in development mode.

```bash
npm run build
```

Builds the production application.

```bash
npm run start
```

Starts the built application.

```bash
npm run dist
```

Creates the Windows installer/package through Electron Builder.

If the project uses different script names, update this section to match `package.json`.

---

## 10. Electron Configuration

Electron should:

- Create the desktop application window.
- Load the frontend.
- Manage the application lifecycle.
- Provide system tray support.
- Manage local window behavior.
- Keep privileged Node/Electron APIs out of the renderer where possible.

Recommended security configuration:

- `contextIsolation: true`
- `nodeIntegration: false`
- Use a preload bridge for approved IPC operations.
- Do not expose unrestricted Node.js APIs to the renderer.

---

## 11. Offline Behaviour

The application is designed for brief WiFi interruptions.

Expected behaviour:

```text
Firebase Firestore
       ↕
Local IndexedDB persistence
       ↕
Electron application
```

When WiFi is temporarily unavailable:

1. Recently cached data remains accessible.
2. Local changes are queued where supported by Firestore persistence.
3. Firebase synchronizes changes when connectivity returns.

The source document specifically describes this as protection against brief WiFi outages.

> Offline support should not be treated as an independent local database. Firebase remains the authoritative cloud data store.

---

## 12. Vehicle Workflow

### Returning vehicle

```text
Search Plate
    ↓
Vehicle Found
    ↓
Show Customer + Vehicle + Service History
    ↓
Create Job Card
```

### New vehicle

```text
Search Plate
    ↓
Vehicle Not Found
    ↓
Create Customer
    ↓
Create Vehicle
    ↓
Link Vehicle → Customer
    ↓
Create Job Card
```

Both workflows eventually reach the same job-card creation process.

---

## 13. Appointment → Job Card Workflow

```text
Book Appointment
      ↓
Vehicle Arrives
      ↓
Find Appointment
      ↓
Start Job Card
      ↓
Preserve Appointment Information
      ↓
Job Card = Received
```

The system should avoid creating duplicate vehicle/customer records when an existing vehicle is already registered.

---

## 14. Job Card → Invoice Workflow

```text
Received
   ↓
Diagnosing
   ↓
In Repair
   ├── Parts
   └── Labor
        ↓
Ready
        ↓
Lock Job Card
        ↓
Calculate Invoice
        ↓
Generate Invoice
        ↓
Payment
        ↓
Delivered
```

---

## 15. Financial Calculations

### Parts

```text
Part Line Total = Sell Price × Quantity
```

### Parts profit

```text
Part Profit = (Sell Price - Cost Price) × Quantity
```

### Labor

```text
Labor Total = Sum of all labor line amounts
```

### Subtotal

```text
Subtotal = Parts Total + Labor Total
```

### Invoice total

The UI reference shows:

```text
Invoice Total = Subtotal - Discount + Tax
```

The exact tax/discount policy should be configured through Admin settings.

### Outstanding balance

```text
Outstanding Balance = Invoice Total - Paid Amount
```

### Payment status

```text
Paid Amount = 0
→ Pending

Paid Amount > 0 AND Paid Amount < Invoice Total
→ Partially Paid

Paid Amount >= Invoice Total
→ Paid
```

---

## 16. UI Requirements

The provided UI reference should be treated as the visual direction for the application.

### Global layout

The main application UI contains:

- Left sidebar navigation
- Top header/search area
- Active station indicator
- Main content area
- User/profile information

Main navigation:

```text
Dashboard
Job Card Management
Vehicles & Customers
Appointments & Reminders
Invoices & Payments
Reports & Analytics
Settings & Users
```

### Visual priorities

The UI should make these actions easy to find:

1. Search vehicle
2. Create job card
3. View active jobs
4. Update job status
5. Add parts/labor
6. Generate invoice
7. Record payment
8. View reminders

The UI reference uses status badges, dashboard cards, tables, timelines, charts, modals/actions, and financial summary sections.

---

## 17. Login Screen

The supplied UI reference shows:

```text
GarageFlow ERP
Enterprise Garage Management System

Email Address
Password
Forgot Password?

Remember this station

Role: Administrator

Authenticate & Launch

AES-256 Encryption Active
Firebase Connected
```

The exact text and branding can be configured according to the final shop/client requirements.

> The sample UI contains example credentials. They are demonstration data only and must not be used as production credentials.

---

## 18. Security Requirements

### Authentication

Use Firebase Authentication.

### Authorization

Use role-based authorization:

```text
admin
staff
```

Admin-only actions:

- Discounts
- Reopening locked jobs
- User management
- Settings

### Firestore rules

Rules must prevent unauthorized users from:

- Reading protected business data.
- Modifying records they should not modify.
- Changing their own role to Admin.
- Performing Admin-only operations.

### Storage rules

Uploaded files should be accessible only to authenticated/authorized application users.

### Secrets

Never commit:

```text
.env
Firebase private credentials
Service account JSON files
Private keys
Production secrets
```

to Git.

---

## 19. Data Integrity Rules

The following rules are important business constraints.

### One active job per vehicle

Before creating a new job card:

```text
Search for active job card for vehicle_plate
        ↓
If one exists → prevent duplicate active job
        ↓
If none exists → create new job
```

### Locked job cards

When status becomes `Ready`:

```text
locked = true
```

Staff cannot edit it.

Admin can explicitly reopen it.

### Vehicle history

Do not attach historical job records to a customer only.

Each job must retain the vehicle reference/plate.

### Invoice source

Invoice totals must be calculated from job card parts/labor rather than manually typed totals.

---

## 20. Firebase Indexing

Firestore indexes should be created for queries required by:

- Vehicle plate search
- Job cards by vehicle
- Active job cards
- Job cards by status
- Appointments by date/status
- Reminders by due date
- Invoices by payment status/date
- Reports by date ranges

Exact composite indexes should be generated from actual Firestore queries during implementation and committed to:

```text
firebase/firestore.indexes.json
```

Do not invent index definitions until the queries are implemented.

---

## 21. Reports

The reporting layer should provide filters such as:

```text
Start Date
End Date
Apply Filter
Export CSV
```

Core metrics:

### Revenue

```text
Total Revenue
Labor Revenue
Parts Profit
```

### Receivables

```text
Outstanding Invoices
Outstanding Amount
```

### Repair analysis

```text
Most Common Repairs
Number of Completed Repairs
```

### Mechanic performance

```text
Completed Jobs
Average Turnaround Time
Labor Revenue Contribution
Current Workload
```

---

## 22. PDF Invoice

Use `pdf-lib`.

The invoice should contain at minimum:

- Shop name/header
- Vehicle plate
- Customer information
- Invoice number
- Date
- Job card reference
- Parts
- Labor
- Quantity/hours
- Unit price
- Line totals
- Subtotal
- Discount
- Tax
- Invoice total
- Paid amount
- Remaining balance
- Payment status

The PDF should be printable and suitable for customer handover.

---

## 23. File Uploads

Firebase Storage is intended for:

- Shop logo
- Inspection photos
- Scanned documents
- Vehicle/job attachments

Recommended logical storage paths:

```text
shops/{shopId}/logo/
vehicles/{vehicleId}/
job-cards/{jobCardId}/
```

The exact path structure is an implementation decision and should be finalized before production.

---

## 24. Error Handling

The application must clearly handle:

- Invalid login
- Firebase unavailable
- WiFi disconnected
- Missing vehicle
- Duplicate active job card
- Invalid payment amount
- Payment greater than allowed balance
- Unauthorized Admin action
- Locked job modification
- Failed PDF generation
- Failed file upload
- Firestore permission errors

User-facing errors should be understandable to non-technical garage staff.

Avoid exposing raw Firebase error messages where a clear business message can be shown instead.

---

## 25. Testing Requirements

Before pilot deployment, test with realistic fake data.

### Vehicle/customer tests

- New customer
- Existing customer
- One customer with multiple vehicles
- Vehicle search by plate
- Vehicle search by customer
- Vehicle search by phone
- Vehicle service history

### Job card tests

- Create job
- Assign mechanic
- Status progression
- Prevent duplicate active jobs
- Add diagnosis
- Add multiple parts
- Add multiple labor lines
- Lock Ready job
- Admin reopen

### Billing tests

- Parts calculation
- Labor calculation
- Discount permission
- Tax calculation
- Full payment
- Partial payment
- Remaining balance
- Payment status
- PDF invoice

### Appointment tests

- Create appointment
- View upcoming appointments
- Convert appointment to job card
- Avoid duplicate records

### Reminder tests

- Date-based reminder
- Mileage-based reminder
- Due reminder
- Overdue reminder
- Notified state

### Role tests

Test every Admin/Staff permission listed in the requirements.

### Offline tests

Simulate:

```text
Online
  ↓
Load data
  ↓
Disconnect WiFi
  ↓
Continue supported operations
  ↓
Reconnect WiFi
  ↓
Verify synchronization
```

### Desktop tests

Test:

- Windows installation
- Application launch
- Window resizing
- Closing/reopening
- Printer workflow
- PDF printing
- File uploads
- Reinstallation on another PC

---

## 26. Build & Release

Electron Builder is the specified packaging tool.

Production flow:

```text
Development
    ↓
Run Tests
    ↓
Production Build
    ↓
Electron Builder
    ↓
Windows Installer / .exe
    ↓
Install on Shop PC
    ↓
Firebase Login
    ↓
Production Use
```

The development document describes a single Windows `.exe` installer with auto-update capability.

Auto-update implementation details are not defined in the source documents and should be finalized separately before release.

---

## 27. Deployment to a New Shop PC

If the existing shop PC fails:

1. Install the application on the replacement Windows PC.
2. Launch GarageFlow ERP.
3. Log in using an existing Firebase account.
4. Firebase provides access to the cloud-stored records.

No manual local database migration should be required.

---

## 28. Backup Strategy

The project is designed around Firebase cloud persistence.

The source requirements state that:

- Data is stored in Firestore.
- Firebase infrastructure handles replication.
- The shop does not need a daily USB/manual backup routine.
- Reinstalling the application and logging in restores access.
- Firebase Console can be used for a Firestore export when an offline copy is required.

For production, the team should still verify the exact Firebase billing, retention, export, and disaster-recovery configuration appropriate to the final deployment.

---

## 29. Suggested Development Order

Follow the implementation order from the project document:

```text
1. Vehicle & Customer Management
        ↓
2. Job Card Management
        ↓
3. Parts & Labor
        ↓
4. Billing & Invoice
        ↓
5. Appointments
        ↓
6. Reminders
        ↓
7. Reports
        ↓
8. Admin & Settings
```

Then:

```text
Internal Testing
      ↓
Real Shop Pilot
      ↓
UX Fixes
      ↓
Production Build
      ↓
Installation & Training
```

---

## 30. Project Timeline

The source project plan estimates:

| Phase | Duration |
|---|---:|
| Requirements Lock | 3–5 days |
| Design | 1 week |
| Core Build | 3–4 weeks |
| Internal Testing | 1 week |
| Real Shop Pilot | 1–2 weeks |
| Delivery & Handover | 2–3 days |
| **Total** | **6–9 weeks part-time** |

The estimate assumes two developers working concurrently.

---

## 31. Requirements Still to Confirm

Do not silently implement the following without client confirmation because the provided documents do not fully specify them:

### Business decisions

- Single-user versus multi-user deployment
- Final shop name
- Final logo
- Final contact number
- Final currency
- Final tax rules
- Default labor rates
- Final invoice design
- Final payment methods

### Reminder integrations

The UI shows SMS/email alerts, but the development document does not specify:

- SMS provider
- Email provider
- Sender account
- Message templates
- API credentials
- Costs
- Trigger rules

### Printer

The pilot plan mentions testing a receipt printer, but the exact:

- Printer model
- Paper size
- Driver
- Print format

are not specified.

### Auto-update

Electron Builder is specified and auto-update capability is mentioned, but:

- Update server/provider
- Release channel
- Version strategy
- Rollback process

are not specified.

### Offline edge cases

The documents describe offline persistence for brief WiFi outages, but the exact conflict-resolution rules for simultaneous edits are not defined.

---

## 32. Important Scope Boundaries

### Included

- Vehicle/customer records
- Vehicle service history
- Appointments
- Job cards
- Diagnosis
- Mechanic assignment
- Parts costing
- Labor costing
- Invoices
- Partial payments
- Discounts for Admin
- Reminders
- Reports
- User roles
- Shop settings
- Firebase authentication
- Firebase storage
- Offline persistence
- Windows `.exe` packaging

### Explicitly excluded

- Physical parts inventory
- Stock-in/stock-out
- Warehouse management
- Inventory quantity tracking

### Not fully specified

- SMS integration
- Email integration
- Receipt-printer implementation
- Auto-update backend
- Exact conflict resolution for offline concurrent edits

---

## 33. Definition of Done

The project can be considered ready for pilot when:

- [ ] Admin can log in.
- [ ] Staff can log in.
- [ ] Role permissions are enforced.
- [ ] Vehicle can be created and searched by plate.
- [ ] Customer can own multiple vehicles.
- [ ] Vehicle service history is available.
- [ ] Only one active job exists per vehicle.
- [ ] Job card progresses through all required statuses.
- [ ] Mechanic can be assigned.
- [ ] Parts can be added without inventory tracking.
- [ ] Labor can be added separately.
- [ ] Parts profit is calculated correctly.
- [ ] Job card locks at Ready.
- [ ] Admin can reopen a locked job.
- [ ] Invoice is generated automatically.
- [ ] Discounts are Admin-only.
- [ ] Full payment works.
- [ ] Partial payment works.
- [ ] Remaining balance is correct.
- [ ] PDF invoice can be generated and printed.
- [ ] Appointments can become job cards.
- [ ] Service reminders are created.
- [ ] Dashboard displays operational information.
- [ ] Reports can be filtered by date.
- [ ] CSV export works if included in the final build.
- [ ] Firebase Storage uploads work.
- [ ] Offline persistence works for the supported scenarios.
- [ ] Firebase security rules are tested.
- [ ] Windows installer builds successfully.
- [ ] Application has been tested on the target shop PC.

---

## 34. Quick Start

For a developer starting the project:

```bash
git clone <YOUR_REPOSITORY_URL>
cd garageflow-erp
npm install
```

Configure Firebase:

```text
Firebase Authentication
Firebase Firestore
Firebase Storage
Firestore Rules
Storage Rules
Environment Variables
```

Then:

```bash
npm run dev
```

After development:

```bash
npm run build
npm run dist
```

Install the generated Windows package on the test PC and verify Firebase login, data access, PDF printing, and offline behavior.

---

## 35. Source Documents

This README was prepared from:

1. **Garage System Development Flow.pdf**
   - Project overview
   - Modules
   - Technology stack
   - Firestore structure
   - Job card workflow
   - Real-life workflow
   - Project plan
   - Roles/permissions
   - Backup policy

2. **Garage UI.pdf**
   - Login screen
   - Dashboard
   - Job card UI
   - Vehicle/customer UI
   - Appointment/reminder UI
   - Invoice/payment UI
   - Reports UI
   - Settings/user management UI

The development-flow document is the primary source for functional requirements and workflow. The UI document is the primary source for screen structure and visual/content direction.

---

## 36. Final Architecture

```text
                     ┌─────────────────────────┐
                     │     GarageFlow ERP       │
                     │   Windows Desktop App   │
                     └────────────┬────────────┘
                                  │
                              Electron
                                  │
                     ┌────────────▼────────────┐
                     │ HTML / CSS / JavaScript │
                     │      Application UI     │
                     └────────────┬────────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              │                   │                   │
              ▼                   ▼                   ▼
       Firebase Auth        Firestore             Storage
       Admin / Staff       Business Data       Photos / Logo
                              │
       ┌──────────────────────┼──────────────────────────┐
       │                      │                          │
       ▼                      ▼                          ▼
 Customers / Vehicles     Job Cards / Costs       Invoices / Reminders
       │                      │                          │
       └──────────────────────┼──────────────────────────┘
                              ▼
                       Reports / Analytics
                              │
                         Chart.js / CSV
                              │
                         pdf-lib Invoice
                              │
                       Electron Builder
                              │
                              ▼
                       Windows .exe
```

---

## 37. Development Principle

Keep the application simple and optimized for a real garage front desk.

The most important workflow is:

```text
SEARCH PLATE
     ↓
VEHICLE
     ↓
JOB CARD
     ↓
DIAGNOSIS
     ↓
PARTS + LABOR
     ↓
READY
     ↓
INVOICE
     ↓
PAYMENT
     ↓
DELIVERY
     ↓
REMINDER
     ↓
RETURNING VEHICLE
```

Every major screen should make this workflow obvious, fast, and difficult to break accidentally.
