# TaskNest — Task Management System

A full-stack web application for creating projects, assigning tasks, and tracking progress with **role-based access control** (Admin / Member).

## Live demo

> Deploy to Railway and add your live URL here after deployment.

## Features

- **Authentication** — Sign up, log in, JWT sessions
- **Projects & teams** — Create, edit, and delete projects; invite members by email; assign Admin or Member roles
- **Tasks** — Create, assign, update status (`To Do` / `In Progress` / `Done`), priorities, due dates; overdue highlighting
- **Dashboard** — Total/completed/active/overdue counts, weekly chart, task search & status filter
- **RBAC** — Admins manage members and all task fields; Members update assigned tasks (status) and create tasks

## Tech stack

| Layer    | Technology                          |
| -------- | ----------------------------------- |
| Frontend | React 19, React Router, Vite        |
| Backend  | Node.js, Express, Prisma            |
| Database | PostgreSQL                          |
| Auth     | JWT + bcrypt                        |
| Deploy   | Railway                             |

## API overview

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| POST | `/api/auth/signup` | Register |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Current user |
| GET | `/api/projects` | List my projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:id` | Project detail |
| POST | `/api/projects/:id/members` | Invite member (Admin) |
| GET | `/api/tasks/projects/:projectId/tasks` | List tasks |
| POST | `/api/tasks/projects/:projectId/tasks` | Create task |
| PUT | `/api/tasks/:id` | Update task |
| GET | `/api/dashboard` | Dashboard stats |

## Local development

### Prerequisites

- Node.js 18+
- PostgreSQL

### Setup

```bash
# Clone and install
git clone <your-repo-url>
cd task-management-system
npm run install:all

# Configure backend
cp backend/.env.example backend/.env
# Edit DATABASE_URL and JWT_SECRET in backend/.env

# Database
cd backend
npx prisma migrate deploy
npm run db:seed
cd ..

# Run (single command — API + Vite)
npm run dev        # API http://localhost:3001 · UI http://localhost:5173

# Or run separately:
npm run dev:api
npm run dev:web
```

### Demo accounts (after seed)

| Email | Password | Role in demo project |
| ----- | -------- | -------------------- |
| admin@demo.com | password123 | Admin |
| member@demo.com | password123 | Member |

## Push to GitHub

1. Create an empty repo on [GitHub](https://github.com/new) (no README — this project already has one).
2. From the project folder:

```bash
git add -A
git commit -m "Initial commit: TaskNest full-stack app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/task-management-system.git
git push -u origin main
```

Replace `YOUR_USERNAME` and the repo name with yours.

## Deploy on Railway

### Prerequisites

- Code pushed to a **GitHub** repository (see [Push to GitHub](#push-to-github) above).
- A [Railway](https://railway.app) account (GitHub login works).

### Step 1 — Create the project

1. Go to [railway.app/new](https://railway.app/new).
2. Choose **Deploy from GitHub repo** and authorize Railway if prompted.
3. Select your `task-management-system` repository.
4. Railway creates a **web service** from the repo root (where `railway.toml` and `package.json` live).

### Step 2 — Add PostgreSQL

1. In the same Railway project, click **+ New** → **Database** → **PostgreSQL**.
2. Wait until the database shows as **Active**.

### Step 3 — Connect the database to the app

1. Open your **web service** (not the Postgres service).
2. Go to **Variables**.
3. Click **+ New Variable** → **Add Reference**.
4. Select the PostgreSQL service and choose **`DATABASE_URL`**.
5. Add these variables manually:

| Variable       | Value |
| -------------- | ----- |
| `JWT_SECRET`   | A long random secret (e.g. 32+ characters). Generate one and keep it private. |
| `NODE_ENV`     | `production` |

6. Click **Deploy** (or wait for an automatic redeploy) so the app picks up the new variables.

### Step 4 — Public URL

1. On the web service, open **Settings** → **Networking**.
2. Click **Generate Domain**.
3. Open the URL (e.g. `https://your-app.up.railway.app`) — you should see the TaskNest login page.

### Step 5 — Seed demo users (optional)

1. On the web service, open the **Shell** tab.
2. Run:

```bash
npm run db:seed
```

3. Sign in with `admin@demo.com` / `password123`.

### How the deploy works

| Phase | What runs |
| ----- | --------- |
| **Build** | `npm run install:all` → `npm run build` (React → `backend/public`, Prisma client) |
| **Start** | `npm start` → `prisma migrate deploy` → Express on `PORT` (serves API + SPA) |
| **Health** | Railway checks `GET /api/health` |

### Troubleshooting

| Problem | Fix |
| ------- | --- |
| Build fails on Prisma | Ensure `DATABASE_URL` is linked to the web service (reference from Postgres). Redeploy. |
| App crashes on start / “migrate” errors | Postgres must be running; `DATABASE_URL` must be on the **web** service, not only on the DB service. |
| Login works locally but not on Railway | Run `npm run db:seed` in the Railway shell, or sign up a new user on the live site. |
| Blank page | Check deploy logs; confirm the build step completed and `backend/public` was created during build. |
| Health check timeout | Open **Deploy Logs**; first boot runs DB migrations and can take 1–2 minutes. |

### After deploy

Add your live URL under **Live demo** at the top of this README.

## Project structure

```
task-management-system/
├── backend/           # Express API + Prisma
│   ├── prisma/
│   ├── public/        # Built frontend (generated)
│   └── src/
├── frontend/          # React SPA
├── railway.toml
└── package.json
```

## License

MIT
