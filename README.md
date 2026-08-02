# Full-Stack Trello/Planka-Inspired Collaborative Kanban Application

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/Node.js-v18+-green.svg)
![Express](https://img.shields.io/badge/Express.js-v4-lightgrey.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-v14+-blue.svg)
![Socket.io](https://img.shields.io/badge/Socket.io-v4-black.svg)
![React](https://img.shields.io/badge/React-v18-blue.svg)

A production-grade, collaborative task management application taking architectural and design reference from [Planka (plankanban/planka)](https://github.com/plankanban/planka). Built with **Node.js, Express.js, PostgreSQL, Socket.io, JWT Authentication**, and a modern **React (Vite)** frontend. Features a modular **Controller-Service-Repository** layered architecture, role-based access control (RBAC), request validation, audit activity logging, and real-time WebSocket synchronization.

---

## 🌟 Resume Feature Consistency

This project accurately reflects the core technologies and features listed on your engineering resume:

- 🚀 **Full-Stack Trello & Planka-Inspired Task Management**
- ⚡ **Node.js & Express.js REST API Backend**
- 🗄️ **PostgreSQL Relational Database** with foreign keys and cascading deletes
- 🔄 **Real-Time Collaboration** powered by **Socket.io**
- 🔐 **JWT Authentication** with Access & Refresh Token rotation
- 👑 **Role-Based Access Control (RBAC)**: Owner, Editor, Viewer
- 📋 **Boards, Lists, and Cards** with dynamic HTML5 Drag and Drop
- 💬 **Card Comments, Labels, Due Dates, Search, & Soft Delete Archiving**

---

## 📐 Planka-Inspired Software Architecture

The application adopts a **Clean Layered Architecture** inspired by open-source systems like Planka to enforce separation of concerns across HTTP routing, business logic, database queries, and real-time events.

```
[ Client Browser / SPA ]
       │
       ▼ (HTTP REST API / Socket.io WebSockets)
┌─────────────────────────────────────────────────────────────┐
│                       Express App                           │
│  ├── Middleware (Cors, Auth, RBAC, Joi Validator, Logger)  │
│  └── Routes (/api/auth, /api/boards, /api/lists, etc.)     │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Controller Layer                         │
│  (Parses requests, handles HTTP codes, calls Services)     │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      Service Layer                          │
│  (Business logic, RBAC rules, activity logs, validation)    │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Repository Layer                         │
│  (Raw SQL Queries & PostgreSQL Pool Abstraction)            │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                  PostgreSQL Database                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 📂 Project Folder Structure

```
.
├── backend/
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── config/          # Database pool, JWT, Winston Logger, Swagger configuration
│       ├── controllers/     # HTTP Request & Response handlers
│       ├── middleware/      # JWT Authentication, RBAC, Joi Validation, Error Handlers
│       ├── models/          # PostgreSQL DDL Schema definitions
│       ├── repositories/    # Raw SQL Data Access Layer
│       ├── routes/          # Express Routers
│       ├── services/        # Business Logic & Activity Triggers
│       ├── socket/          # Socket.io Room & Real-time Handlers
│       ├── validators/      # Joi Request Validation Schemas
│       ├── utils/           # JWT, Response Formatter, AppError classes
│       ├── app.js           # Express App configuration
│       └── server.js        # Server entrypoint & Socket initializer
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── components/      # UI components (BoardCard, ListContainer, CardModal, etc.)
│       ├── context/         # AuthContext, SocketContext, ThemeContext
│       ├── hooks/           # Custom React hooks (useAuth, useSocket, useToast)
│       ├── pages/           # Page views (LoginPage, RegisterPage, DashboardPage, BoardPage)
│       ├── styles/          # Planka CSS design system with Dark/Light theme tokens
│       ├── utils/           # API fetch wrapper with auto token refresh
│       ├── App.jsx          # SPA root navigation
│       └── main.jsx         # App DOM renderer
├── tests/                   # Unit & Integration test suites
└── README.md
```

---

## 🗄️ PostgreSQL Database Schema (ERD)

```
+--------------------+       +--------------------+       +--------------------+
|       USERS        |       |       BOARDS       |       |   BOARD_MEMBERS    |
+--------------------+       +--------------------+       +--------------------+
| id (PK)            |<──┐   | id (PK)            |<──┐   | id (PK)            |
| username           |   └───| owner_id (FK)      |   └───| board_id (FK)      |
| email              |       | title              |       | user_id (FK)       |
| password_hash      |       | description        |       | role               |
| refresh_token      |       +--------------------+       +--------------------+
+--------------------+                 │
                                       ▼
                             +--------------------+
                             |       LISTS        |
                             +--------------------+
                             | id (PK)            |
                             | board_id (FK)      |
                             | title              |
                             | position           |
                             +--------------------+
                                       │
                                       ▼
                             +--------------------+
                             |       CARDS        |
                             +--------------------+
                             | id (PK)            |
                             | list_id (FK)       |
                             | title              |
                             | description        |
                             | due_date           |
                             | completed_at       |
                             | is_archived        |
                             | position           |
                             +--------------------+
                                 │            │
             ┌───────────────────┘            └───────────────────┐
             ▼                                                    ▼
+--------------------+      +--------------------+      +--------------------+
|      COMMENTS      |      |    CARD_LABELS     |      |       LABELS       |
+--------------------+      +--------------------+      +--------------------+
| id (PK)            |      | card_id (FK)       |─────>| id (PK)            |
| card_id (FK)       |      | label_id (FK)      |      | name               |
| user_id (FK)       |      +--------------------+      | color              |
| content            |                                  +--------------------+
+--------------------+
```

---

## ⚡ Socket.io Real-Time Event Contract

| Event Name | Direction | Payload Description |
|---|---|---|
| `board:join` | Client -> Server | Join board room `{ boardId, user }` |
| `board:leave` | Client -> Server | Leave board room `{ boardId }` |
| `card:create` | Client -> Server -> Room | Broadcast newly created card |
| `card:move` | Client -> Server -> Room | Broadcast card relocation `{ cardId, targetListId, newPosition }` |
| `card:update` | Client -> Server -> Room | Broadcast card property or label updates |
| `card:delete` | Client -> Server -> Room | Broadcast card deletion `{ cardId }` |
| `user:typing` | Client -> Server -> Room | Broadcast user typing status |

---

## 🚀 Local Setup & Installation

### Prerequisites
- Node.js (v18.0.0+)
- PostgreSQL Database Server

### 1. Configure Environment Variables
Copy `.env.example` to `.env` inside `backend/`:
```bash
cp backend/.env.example backend/.env
```

### 2. Install Dependencies
```bash
# Install backend packages
cd backend
npm install

# Install frontend packages
cd ../frontend
npm install
```

### 3. Run Development Servers
```bash
# Start backend server (Port 5000)
cd backend
npm run dev

# Start frontend application (Port 3000)
cd ../frontend
npm run dev
```

### 4. Open Application
Navigate to `http://localhost:3000` in your web browser.
Swagger API Documentation is accessible at `http://localhost:5000/api-docs`.

---

## 🧪 Running Automated Tests

Run the test suite via Node.js test runner:
```bash
cd backend
npm test
```

---

## 📜 Realistic 15-Step Git Commit Plan

1. `feat(setup): initialize Express project structure and package configs`
2. `feat(db): configure PostgreSQL pool and schema migrations`
3. `feat(auth): implement JWT authentication with bcrypt password hashing`
4. `feat(auth): add refresh token rotation and authentication middleware`
5. `feat(rbac): create board role-based authorization middleware`
6. `feat(boards): implement Board CRUD in Controller-Service-Repository pattern`
7. `feat(lists): implement List management and position reordering`
8. `feat(cards): implement Card CRUD, soft-delete archive, and restoration`
9. `feat(comments): add paginated card comment endpoints`
10. `feat(labels): integrate default and custom card labels`
11. `feat(activity): add automated board audit activity logging`
12. `feat(socket): configure Socket.io real-time event engine`
13. `feat(ui): build Planka-inspired React Vite SPA with dark/light themes`
14. `feat(dnd): integrate drag-and-drop card and list interactions`
15. `docs(swagger): generate OpenAPI documentation and final README`

---

## 📝 Reference & License
This project takes open-source architectural inspiration from [Planka](https://github.com/plankanban/planka).
Licensed under the [MIT License](LICENSE).
