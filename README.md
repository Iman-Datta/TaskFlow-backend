<div align="center">

# TaskFlow — Backend

> *A secure, scalable REST API powering TaskFlow — built with Express 5 & MongoDB*

[![Express](https://img.shields.io/badge/Express-5-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![JWT](https://img.shields.io/badge/JWT-Auth-F7B731?style=for-the-badge&logo=jsonwebtokens&logoColor=black)](https://jwt.io/)
[![Node](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)

</div>

---

## 📖 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Authentication Flow](#authentication-flow)
- [Recycle Bin & Cron Job](#recycle-bin--cron-job)
- [Security](#security)
- [Related](#related)

---

## Overview

This is the **backend** of TaskFlow — a production-ready REST API serving the [TaskFlow Frontend](https://github.com/Iman-Datta/TaskFlow). It handles user authentication (with four different methods), full task CRUD, a soft-delete recycle bin with auto-expiry, and transactional emails.

Built with **Express 5**, **MongoDB (Mongoose)**, and a robust JWT-based token strategy using short-lived access tokens and HTTP-only refresh token cookies.

---

## ✨ Features

### 🔐 Authentication — 4 Methods
| Method | How It Works |
|--------|-------------|
| 📧 Email & Password | Register with hashed password (bcryptjs); login returns access + refresh tokens |
| 🔵 Google OAuth | Client sends Google ID token → server verifies via `google-auth-library` → issues JWT |
| 🔗 Magic Link | Server emails a signed one-time link; clicking it logs the user in instantly |
| 🔢 Forgot Password OTP | Server emails a time-limited OTP; user submits OTP + new password to reset |

### 🗂 Task Management
- Full **CRUD** for tasks (create, read, update, delete)
- Support for **due dates** and **priority levels**
- **Filtering** by status, priority, and date

### 🗑 Recycle Bin with Auto-Expiry
- Deleting a task **soft-deletes** it (sets a `deletedAt` timestamp)
- A **cron job** (via `node-cron`) runs on schedule and permanently removes tasks that have been in the bin for **more than 24 hours**
- Users can **restore** tasks from the bin at any time before expiry

### 📧 Transactional Email
- Magic links and OTPs are delivered via **Resend** — a developer-first email API
- Emails are clean, branded, and reliably delivered

### 🛡 Security
- Passwords hashed with **bcryptjs** (never stored in plain text)
- **Rate limiting** on all auth endpoints via `express-rate-limit`
- **HTTP-only cookies** for refresh tokens (not accessible from JavaScript)
- **CORS** configured to only allow requests from the frontend origin
- Access tokens expire in **15 minutes**; refresh tokens rotate on use

---

## 🛠 Tech Stack

| Package | Version | Purpose |
|---------|---------|---------|
| `express` | 5 | Web framework |
| `mongoose` | 9 | MongoDB ODM |
| `jsonwebtoken` | 9 | JWT signing & verification |
| `bcryptjs` | 3 | Password hashing |
| `google-auth-library` | 10 | Google OAuth ID token verification |
| `resend` | 6 | Transactional email delivery |
| `node-cron` | 4 | Scheduled cron jobs (recycle bin cleanup) |
| `cookie-parser` | 1.4 | Parse HTTP-only cookies |
| `cors` | 2.8 | Cross-origin request handling |
| `express-rate-limit` | 8 | Rate limiting for auth routes |
| `dotenv` | 17 | Environment variable management |
| `node-fetch` | 3 | HTTP requests from the server |
| `crypto` | — | Secure random token generation |

---

## 📁 Project Structure

```
TaskFlow-backend/
├── controllers/
│   ├── authController.js      # Register, login, OAuth, magic link, OTP logic
│   └── taskController.js      # Task CRUD + recycle bin handlers
├── middleware/
│   ├── authMiddleware.js      # JWT access token verification
│   └── rateLimiter.js         # Route-level rate limiting config
├── models/
│   ├── User.js                # User schema (email, password, googleId, etc.)
│   └── Task.js                # Task schema (title, priority, dueDate, deletedAt)
├── routes/
│   ├── authRoutes.js          # /api/auth/*
│   └── taskRoutes.js          # /api/tasks/*
├── utils/
│   ├── emailService.js        # Resend email templates & sending logic
│   ├── tokenUtils.js          # JWT generation & cookie helpers
│   └── cronJobs.js            # node-cron scheduled tasks
├── .env.example               # Environment variable template
├── server.js                  # App entry point
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** `v18+`
- **MongoDB** — local instance or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- A [Resend](https://resend.com) account (free tier works)
- Google OAuth credentials from [Google Cloud Console](https://console.cloud.google.com)

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/Iman-Datta/TaskFlow-backend.git
cd TaskFlow-backend

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# → Fill in all values (see Environment Variables below)

# 4. Start the development server
npm run dev
```

The API will be running at **http://localhost:5000**

---

## 🔑 Environment Variables

Create a `.env` file in the project root. Use `.env.example` as a starting point:

```env
# ── Server ──────────────────────────────────────────
PORT=5000
NODE_ENV=development

# ── MongoDB ─────────────────────────────────────────
MONGO_URI=mongodb://localhost:27017/taskflow
# or your Atlas connection string:
# MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/taskflow

# ── JWT ─────────────────────────────────────────────
ACCESS_TOKEN_SECRET=your_strong_access_token_secret
REFRESH_TOKEN_SECRET=your_strong_refresh_token_secret
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# ── Google OAuth ─────────────────────────────────────
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com

# ── Resend (Email) ───────────────────────────────────
RESEND_API_KEY=re_your_resend_api_key
EMAIL_FROM=noreply@yourdomain.com

# ── Frontend URL (CORS + email links) ────────────────
CLIENT_URL=http://localhost:5173
```

> ⚠️ Never commit your `.env` file. It is already included in `.gitignore`.

---

## 📡 API Reference

All routes are prefixed with `/api`.

### Auth Routes — `/api/auth`

| Method | Endpoint | Auth Required | Description |
|--------|----------|:---:|-------------|
| `POST` | `/register` | ❌ | Register a new user |
| `POST` | `/login` | ❌ | Login with email & password |
| `POST` | `/google` | ❌ | Login / register via Google OAuth |
| `POST` | `/magic-link` | ❌ | Send a magic login link to email |
| `GET` | `/magic-link/verify` | ❌ | Verify magic link token & issue JWT |
| `POST` | `/forgot-password` | ❌ | Send OTP for password reset |
| `POST` | `/reset-password` | ❌ | Submit OTP + new password |
| `POST` | `/refresh` | ❌ | Silently refresh access token (uses cookie) |
| `POST` | `/logout` | ✅ | Clear refresh token cookie |

### Task Routes — `/api/tasks`

| Method | Endpoint | Auth Required | Description |
|--------|----------|:---:|-------------|
| `GET` | `/` | ✅ | Get all active tasks for the logged-in user |
| `POST` | `/` | ✅ | Create a new task |
| `PUT` | `/:id` | ✅ | Update a task (title, priority, due date, status) |
| `DELETE` | `/:id` | ✅ | Soft-delete a task (moves to recycle bin) |
| `GET` | `/bin` | ✅ | Get all tasks in the recycle bin |
| `POST` | `/bin/:id/restore` | ✅ | Restore a task from the bin |
| `DELETE` | `/bin/:id` | ✅ | Permanently delete a task from the bin |

---

## 🔐 Authentication Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                         Client Login                             │
│   Email/Pass  │  Google OAuth  │  Magic Link  │  OTP Reset       │
└──────────────────────────────────────────────────────────────────┘
                               │
                               ▼
                  ┌────────────────────────┐
                  │   Server Validates     │
                  │   credentials / token  │
                  └────────────────────────┘
                               │
               ┌───────────────┴───────────────┐
               ▼                               ▼
   ┌─────────────────────┐         ┌───────────────────────┐
   │  Access Token (15m) │         │  Refresh Token (7d)   │
   │  → returned in body │         │  → HTTP-only cookie   │
   └─────────────────────┘         └───────────────────────┘
               │                               │
               │  expires                      │  used silently
               └──────────────┬────────────────┘
                              ▼
                   POST /api/auth/refresh
                   → new access token issued
```

- Access tokens are stored **in memory** on the client (never in localStorage)
- Refresh tokens live in **HTTP-only cookies** — safe from XSS
- Every refresh token use issues a **new refresh token** (rotation)

---

## 🗑 Recycle Bin & Cron Job

When a user deletes a task:

1. The task is **not removed** from the database
2. A `deletedAt` timestamp is set on the document
3. The task disappears from the main task list
4. It appears in the **Recycle Bin** view

A `node-cron` job runs on a schedule and queries for all tasks where:

```js
deletedAt < Date.now() - 24 * 60 * 60 * 1000
```

Those tasks are **permanently deleted**. Users have a 24-hour window to restore any task before it's gone for good.

---

## 🛡 Security

| Concern | Mitigation |
|---------|------------|
| Password storage | bcryptjs hashing (never plain text) |
| Token exposure | HTTP-only cookies for refresh tokens |
| XSS | Access tokens in memory only |
| Brute force | express-rate-limit on all auth endpoints |
| CSRF | SameSite cookie policy + CORS allowlist |
| Data isolation | All queries scoped to `req.user.id` |

---

## 🔗 Related

| Repo / Link | Description |
|-------------|-------------|
| [TaskFlow Frontend](https://github.com/Iman-Datta/TaskFlow) | React + Vite UI |
| [Live App](https://taskflow.imandatta.com) | Deployed production app |

---

<div align="center">

Made with ❤️ by [Iman Datta](https://github.com/Iman-Datta)

</div>
