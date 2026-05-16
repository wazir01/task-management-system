# TaskFlow — Task Management System

A full-stack web application for creating projects, assigning tasks, and tracking progress with **role-based access control** (Admin / Member).

## Live demo

> Deploy to Railway and add your live URL here after deployment.

## Features

- **Authentication** — Sign up, log in, JWT sessions
- **Projects & teams** — Create projects, invite members by email, assign Admin or Member roles
- **Tasks** — Create, assign, update status, due dates; overdue highlighting
- **Dashboard** — Project count, active tasks, status breakdown, overdue list
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

# Run (two terminals)
npm run dev:api    # http://localhost:3001
npm run dev:web    # http://localhost:5173
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
git commit -m "Initial commit: TaskFlow full-stack app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/task-management-system.git
git push -u origin main
```

Replace `YOUR_USERNAME` and the repo name with yours.

## Deploy on Railway

1. Sign in at [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo** → select your repo.
2. In the project, click **+ New** → **Database** → **PostgreSQL**.
3. Open your **web service** (the repo deploy) → **Variables** → **Add Reference** → link `DATABASE_URL` from the PostgreSQL service.
4. Add these variables on the web service:

| Variable     | Value                                      |
| ------------ | ------------------------------------------ |
| `JWT_SECRET` | Long random string (32+ chars)             |
| `NODE_ENV`   | `production`                               |

5. **Settings** → ensure the service root is the repo root (where `railway.toml` lives). Railway builds with `npm run install:all && npm run build` and starts with `npm start` (migrations + API + static frontend).
6. **Settings** → **Networking** → **Generate Domain** for your public URL.
7. Optional demo data: open the service → **Shell** and run `npm run db:seed`.

`railway.toml` health check: `GET /api/health`

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
