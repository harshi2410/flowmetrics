# Flowmetrics — SaaS Full Stack Platform

deployed link - https://flowmetrics-xf93.onrender.com
Email: admin@flowmetrics.io
Password: flowmetrics2026

Flowmetrics is a modern SaaS platform designed for engineering managers and agency owners to monitor team workload, sprint capacity, project health, and operational visibility.

This project was built as a comprehensive Full Stack hiring challenge demonstrating a decoupled **Next.js frontend**, **Express.js TypeScript backend**, **PostgreSQL database (without ORM)**, **Supabase Authentication**, **Role-based Access Control**, **Zod Validation**, and **Rate Limiting**.

---

## 🏗️ Architecture Overview

```
                 NEXT.JS FRONTEND (Port 3000)
              (React, Tailwind CSS, TypeScript)
                           │
                           │ HTTP / JSON
                           ▼
                 EXPRESS.JS BACKEND (Port 5000)
                          (TypeScript)
                           │
      ┌────────────────────┼────────────────────┐
      ▼                    ▼                    ▼
Rate Limiting        Supabase Auth        Zod Validation
(express-rate-limit) (Bearer Token JWT)   (Request Schemas)
                           │
                           ▼
                    Admin Middleware
                (role = "admin" check)
                           │
                           ▼
                  Express Controllers
              (Pricing & Blog CRUD APIs)
                           │
                           ▼
                PostgreSQL Connection
             (node-postgres `pg` Pool)
```

---

## 💻 Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express.js, TypeScript
- **Database**: PostgreSQL (connected via `pg` / `node-postgres` with parameterized SQL queries — **No Prisma / No ORM**)
- **Authentication**: Supabase Auth (JWT access tokens with role verification)
- **Validation**: Zod (strict schema validation on all write endpoints)
- **Rate Limiting**: `express-rate-limit` (protecting write and auth endpoints)
- **Content Format**: Markdown for blog articles

---

## 📁 Folder Structure

```
flowmetrics/
├── app/                        # Next.js App Router pages
│   ├── page.tsx                # Public Landing Page
│   ├── blog/[slug]/page.tsx    # Public Blog Post Details
│   ├── admin/
│   │   ├── login/page.tsx      # Admin Supabase Login
│   │   └── (dashboard)/
│   │       ├── page.tsx        # Admin Dashboard CMS Overview
│   │       ├── pricing/        # Admin Pricing CRUD
│   │       └── blog/           # Admin Blog CRUD
├── components/
│   ├── landing/                # Landing Page sections (Hero, Features, Pricing, Blog, etc.)
│   ├── admin/                  # Admin UI (Sidebar, PricingPlanEditor, BlogPostEditor)
│   └── ui/                     # Shared UI components (Button, ThemeToggle)
├── lib/
│   ├── api-client.ts           # Frontend API client communicating with Express backend
│   └── supabase/client.ts      # Supabase client initialization
│
├── backend/                    # Express.js TypeScript Backend
│   ├── sql/
│   │   ├── schema.sql          # PostgreSQL DDL table definitions
│   │   └── seed.sql            # Initial seed dataset (Pricing & Blog posts)
│   ├── src/
│   │   ├── server.ts           # Server bootstrap and entrypoint
│   │   ├── app.ts              # Express configuration, CORS, and route mounting
│   │   ├── db/
│   │   │   ├── pool.ts         # PostgreSQL connection pool (`pg.Pool`)
│   │   │   └── init.ts         # Automated schema initialization & seed runner
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts       # Supabase JWT token verification
│   │   │   ├── admin.middleware.ts      # Admin role authorization check
│   │   │   ├── rateLimit.middleware.ts  # Express rate limiting
│   │   │   └── error.middleware.ts      # Centralized error handler
│   │   ├── schemas/
│   │   │   ├── pricing.schema.ts        # Zod pricing validation schemas
│   │   │   └── blog.schema.ts           # Zod blog validation schemas
│   │   ├── controllers/
│   │   │   ├── pricing.controller.ts    # Pricing business logic & SQL queries
│   │   │   ├── blog.controller.ts       # Blog business logic & SQL queries
│   │   │   └── stats.controller.ts      # Admin CMS dashboard metrics
│   │   └── routes/
│   │       ├── pricing.routes.ts        # Public pricing routes
│   │       ├── blog.routes.ts           # Public blog routes
│   │       └── admin.routes.ts          # Protected admin CRUD routes
│   ├── package.json
│   └── tsconfig.json
```

---

## 🗄️ PostgreSQL Database Setup

### Tables Schema (`backend/sql/schema.sql`)

1. **`pricing_plans`**:
   - `id` (UUID PRIMARY KEY DEFAULT gen_random_uuid())
   - `name` (TEXT NOT NULL)
   - `price` (NUMERIC NOT NULL)
   - `billing_cycle` (TEXT NOT NULL)
   - `description` (TEXT)
   - `features` (JSONB NOT NULL array of strings)
   - `highlighted` (BOOLEAN DEFAULT false)
   - `created_at` (TIMESTAMP DEFAULT NOW())
   - `updated_at` (TIMESTAMP DEFAULT NOW())

2. **`blog_posts`**:
   - `id` (UUID PRIMARY KEY DEFAULT gen_random_uuid())
   - `title` (TEXT NOT NULL)
   - `slug` (TEXT UNIQUE NOT NULL)
   - `excerpt` (TEXT)
   - `content` (TEXT NOT NULL)
   - `featured` (BOOLEAN DEFAULT false)
   - `published` (BOOLEAN DEFAULT false)
   - `created_at` (TIMESTAMP DEFAULT NOW())
   - `updated_at` (TIMESTAMP DEFAULT NOW())

You can execute `backend/sql/schema.sql` and `backend/sql/seed.sql` directly inside **pgAdmin** or PostgreSQL CLI.

---

## 🔐 Supabase Authentication & Admin Role

### How Authentication Works
1. Admin enters credentials on `/admin/login`.
2. Supabase authenticates the user via `supabase.auth.signInWithPassword({ email, password })`.
3. The returned JWT `access_token` is attached as `Authorization: Bearer <token>` on all requests to `/api/admin/*`.
4. **Backend Security Barrier**:
   - `auth.middleware.ts` verifies the token against Supabase (`supabase.auth.getUser(token)`).
   - `admin.middleware.ts` checks `user.user_metadata.role === 'admin'`.
   - If not authenticated → returns `401 Unauthorized`.
   - If authenticated but not an admin → returns `403 Forbidden`.

### Creating an Admin User in Supabase
In your Supabase dashboard:
1. Go to **Authentication** → **Users** → **Add User**.
2. Set email and password.
3. In user metadata, add:
```json
{
  "role": "admin"
}
```

---


---

## 🚀 How to Run Locally

### 1. Start Express Backend
```bash
cd backend
npm install
npm run dev
```
Backend runs on: `http://localhost:5000` (Health check: `http://localhost:5000/api/health`)

### 2. Start Next.js Frontend
```bash
# In the root directory
npm install
npm run dev
```
Frontend runs on: `http://localhost:3000`

---

## 📡 API Endpoints Reference

### Public Endpoints
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service health status |
| `GET` | `/api/pricing` | Active pricing plans from PostgreSQL |
| `GET` | `/api/blog` | Published blog posts (`WHERE published = true`) |
| `GET` | `/api/blog/:slug` | Published blog post detail (returns 404 for drafts) |

### Admin Endpoints (Require Bearer Token + Admin Role)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/admin/stats` | CMS Overview stats (plans count, posts count, etc.) |
| `GET` | `/api/admin/pricing` | Fetch all pricing plans |
| `POST` | `/api/admin/pricing` | Create pricing plan (Zod validated + Rate limited) |
| `PUT` | `/api/admin/pricing/:id` | Update pricing plan (Zod validated + Rate limited) |
| `DELETE` | `/api/admin/pricing/:id` | Delete pricing plan (Rate limited) |
| `GET` | `/api/admin/blog` | Fetch all blog posts (including drafts) |
| `POST` | `/api/admin/blog` | Create blog post (Zod validated + Rate limited) |
| `PUT` | `/api/admin/blog/:id` | Update blog post (Zod validated + Rate limited) |
| `DELETE` | `/api/admin/blog/:id` | Delete blog post (Rate limited) |

---

## 🛡️ Zod Validation & Rate Limiting

- **Pricing Schema**: Validates plan `name`, non-negative `price`, `billing_cycle` (`month` | `year`), `features` (array of non-empty strings), and `highlighted` boolean.
- **Blog Schema**: Validates `title`, kebab-case `slug`, `content` (Markdown), and boolean flags `featured` and `published`.
- **Rate Limiting**: `express-rate-limit` enforces a window of 15 minutes with a maximum of 100 write requests per IP, returning `429 Too Many Requests` if exceeded.

---

## 🚀 Deployment Guide

- **Frontend (Next.js)**: Deploy to **Vercel** or **Netlify**. Set `NEXT_PUBLIC_API_URL` to your live Express backend URL.
- **Backend (Express.js)**: Deploy to **Render**, **Railway**, or **Fly.io**. Run `npm run build` and start with `npm start`.
- **Database**: Host PostgreSQL on **Supabase**, **Neon**, or **Railway**.

---


