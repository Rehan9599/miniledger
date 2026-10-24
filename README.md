# 🏦 MiniLedger

A full-stack mobile application to track money lent to friends. Built with an **Express + Prisma** backend and a **React Native (Expo)** mobile frontend.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [1. Start the Database](#1-start-the-database)
  - [2. Set Up the Backend](#2-set-up-the-backend)
  - [3. Set Up the Mobile App](#3-set-up-the-mobile-app)
- [Running Tests](#running-tests)
- [Authentication Flow](#authentication-flow)
- [Environment Variables](#environment-variables)

---

## Overview

MiniLedger helps you keep a personal ledger of money you've lent to friends. You can:

- **Log in** via phone number + OTP (mock OTP — logged to server console)
- **Record loans** — who you lent to, how much, and when it's due
- **Track status** — see which loans are active, repaid, or overdue
- **Mark as repaid** — settle a loan when the money comes back
- **Upload receipts** — attach a photo proof of payment (camera or gallery); tap the thumbnail to view fullscreen
- **View a summary** — total lent, total repaid, and overdue amounts at a glance

---

## Tech Stack

### Backend (`/backend`)

| Technology | Purpose |
|---|---|
| **Express 5** | HTTP server & routing |
| **TypeScript** | Type safety |
| **Prisma** | ORM & database migrations |
| **PostgreSQL 16** | Database (via Docker) |
| **JWT** | Authentication tokens |
| **Zod** | Request body validation |
| **Multer** | File upload handling (receipts) |
| **Jest + Supertest** | API testing |
| **tsx** | Dev server with hot reload |

### Mobile (`/mobile`)

| Technology | Purpose |
|---|---|
| **React Native** | Cross-platform mobile framework |
| **Expo SDK 57** | Managed workflow & tooling |
| **Expo Router** | File-based navigation |
| **Expo Image Picker** | Camera & gallery access for receipt photos |
| **Expo Secure Store** | Encrypted token storage on device |
| **Axios** | HTTP client for API calls |
| **React Native Reanimated** | Smooth animations |

---

## Project Structure

```
miniledger/
├── docker-compose.yml          # PostgreSQL database container
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Database models (User, Otp, Loan)
│   │   └── migrations/         # SQL migration files
│   ├── src/
│   │   ├── index.ts            # Express app entry point
│   │   ├── prisma.ts           # Prisma client singleton
│   │   ├── middleware/
│   │   │   └── auth.ts         # JWT verification middleware
│   │   ├── routes/
│   │   │   ├── auth.ts         # POST /send-otp, /verify-otp
│   │   │   ├── loans.ts        # CRUD operations for loans
│   │   │   └── summary.ts      # GET financial summary
│   │   ├── services/
│   │   │   ├── otp.ts          # OTP generation & verification
│   │   │   └── loan.ts         # Loan business logic
│   │   ├── validators/
│   │   │   └── index.ts        # Zod schemas for request validation
│   │   └── uploads/            # Receipt image storage
│   └── tests/
│       ├── auth.test.ts        # Auth endpoint tests (4 tests)
│       └── loan.test.ts        # Loan + summary tests (5 tests)
└── mobile/
    ├── app/
    │   ├── _layout.tsx         # Root layout with auth guard
    │   ├── index.tsx           # Login screen (phone input)
    │   ├── verify.tsx          # OTP verification screen
    │   └── (tabs)/
    │       ├── _layout.tsx     # Tab navigator (Dashboard + Add Loan)
    │       ├── index.tsx       # Dashboard — loan list & summary
    │       └── add.tsx         # Add new loan form
    ├── context/
    │   └── AuthContext.tsx      # Auth state management (login/logout)
    └── services/
        └── api.ts              # Axios instance with JWT interceptor + SERVER_BASE export
```

---

## Database Schema

Three tables managed by Prisma:

```
┌──────────────┐       ┌──────────────┐
│    users     │       │     otps     │
├──────────────┤       ├──────────────┤
│ id (uuid)    │       │ id (uuid)    │
│ phone (uniq) │       │ phone        │
│ created_at   │       │ code (6-dig) │
│              │       │ expires_at   │
│   ┌─────────┐│       │ verified     │
│   │ loans[] ││       │ created_at   │
│   └─────────┘│       └──────────────┘
└──────┬───────┘
       │ 1:N
       ▼
┌──────────────────┐
│      loans       │
├──────────────────┤
│ id (uuid)        │
│ user_id (FK)     │
│ friend_name      │
│ amount (12,2)    │
│ due_date         │
│ is_repaid        │
│ repaid_at        │
│ receipt_url      │
│ created_at       │
└──────────────────┘
```

---

## API Endpoints

### Auth (no token required)

| Method | Endpoint | Body | Description |
|---|---|---|---|
| `POST` | `/api/auth/send-otp` | `{ "phone": "9876543210" }` | Send a mock OTP (logged to server console) |
| `POST` | `/api/auth/verify-otp` | `{ "phone": "9876543210", "code": "123456" }` | Verify OTP → returns JWT token |

### Loans (Bearer token required)

| Method | Endpoint | Body | Description |
|---|---|---|---|
| `GET` | `/api/loans` | — | List all loans for the authenticated user |
| `POST` | `/api/loans` | `{ "friendName": "Rahul", "amount": 5000, "dueDate": "2027-12-31" }` | Create a new loan entry |
| `PATCH` | `/api/loans/:id/repay` | — | Mark a loan as repaid |
| `POST` | `/api/loans/:id/receipt` | `multipart/form-data` with `receipt` file | Upload a receipt image |

### Summary (Bearer token required)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/summary` | Returns `totalLent`, `totalRepaid`, `overdueAmount`, `activeLoans`, `overdueLoans` |

### Health Check

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Returns `{ "status": "ok" }` |

---

## Getting Started

### Prerequisites

- **Node.js** v18+
- **Docker Desktop** (for PostgreSQL)
- **Expo Go** app on your phone ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) / [iOS](https://apps.apple.com/app/expo-go/id982107779))
- Phone and computer on the **same WiFi network**

### 1. Start the Database

```bash
cd miniledger
docker compose up -d
```

This starts PostgreSQL on port **5433** with:
- User: `miniledger`
- Password: `miniledger123`
- Database: `miniledger`

### 2. Set Up the Backend

```bash
cd backend

# Install dependencies
npm install

# Create .env file from example
cp .env.example .env
# Edit .env if needed (default port is 5433 for Docker)

# Run database migrations
npx prisma migrate dev

# Start the dev server
npm run dev
```

The API will be running at `http://localhost:3000`.

### 3. Set Up the Mobile App

```bash
cd mobile

# Install dependencies
npm install --legacy-peer-deps

# Update the API base URL in services/api.ts
# Change the IP to your computer's local IP address:
#   - Run `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
#   - Look for your WiFi adapter's IPv4 Address (e.g., 192.168.1.42)
#   - Replace the IP in: const API_BASE = "http://<YOUR_IP>:3000/api"

# Start Expo
npx expo start
```

Scan the QR code with **Expo Go** on your phone.

> **Note:** `localhost` won't work from your phone. You must use your computer's local network IP address in `services/api.ts`.
>
> **Receipt uploads:** When you tap **📷 Attach Receipt** on any loan card, the app will prompt you to use the camera or choose from your gallery. The first time you do this, Android will ask for the relevant permission — tap **Allow**. After a successful upload, a thumbnail appears on the card; tap it to view the full image.

---

## Running Tests

The backend has 9 integration tests covering auth and loan operations:

```bash
cd backend
npm test
```

```
PASS  tests/auth.test.ts
  ✓ should send OTP for a valid phone number
  ✓ should reject invalid phone numbers
  ✓ should verify OTP and return a token
  ✓ should reject incorrect OTP

PASS  tests/loan.test.ts
  ✓ should create a loan entry
  ✓ should reject loan creation without auth
  ✓ should list loans for the user
  ✓ should mark a loan as repaid
  ✓ should return correct summary

Test Suites: 2 passed, 2 total
Tests:       9 passed, 9 total
```

Tests use the same database — OTP is extracted from `console.log` spy in tests to complete the auth flow automatically.

---

## Authentication Flow

```
Phone App                     Backend Server                    Database
   │                              │                                │
   ├── POST /send-otp ──────────► │                                │
   │   { phone: "9876543210" }    ├── Generate 6-digit OTP         │
   │                              ├── Store in DB ────────────────►│
   │                              ├── Log OTP to console           │
   │   ◄── { message: "sent" } ──┤                                │
   │                              │                                │
   ├── POST /verify-otp ────────► │                                │
   │   { phone, code }           ├── Check OTP in DB ◄────────────┤
   │                              ├── Find/Create User ◄──────────►│
   │                              ├── Generate JWT                 │
   │   ◄── { token, user } ──────┤                                │
   │                              │                                │
   ├── [Token stored in           │                                │
   │    SecureStore on device]    │                                │
   │                              │                                │
   ├── GET /loans ───────────────►│                                │
   │   Authorization: Bearer xxx  ├── Verify JWT                   │
   │                              ├── Fetch user's loans ◄─────────┤
   │   ◄── { loans: [...] } ─────┤                                │
```

- **OTP is mock** — it prints to the server terminal instead of sending an SMS
- **JWT expires in 7 days** — stored encrypted on the device via `expo-secure-store`
- **All `/api/loans` and `/api/summary` routes** require the Bearer token

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://miniledger:miniledger123@localhost:5433/miniledger?schema=public` |
| `JWT_SECRET` | Secret key for signing JWT tokens | `miniledger-super-secret-key-change-in-production` |
| `PORT` | Server port | `3000` |

### Mobile (`mobile/services/api.ts`)

| Constant | Description |
|---|---|
| `API_BASE` | Your computer's local IP + port (e.g., `http://192.168.1.42:3000/api`) |
