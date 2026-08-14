# TokTickIT - IT Service Desk

TokTickIT is an IT service desk web application for handling Account and Access, Hardware, Software, and Network requests.

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Bootstrap 5
- **Backend**: Node.js, Express, TypeScript
- **Database & ORM**: PostgreSQL, Prisma ORM
- **Testing**: Vitest, Supertest, React Testing Library

---

## Prerequisites

- [Node.js](https://nodejs.org/) (v20 or higher)
- [PostgreSQL](https://www.postgresql.org/) running locally on port `5432`

---

## Project Structure

```text
toktickit/
├── client/          # Frontend React + Vite application
│   ├── src/
│   └── tests/lab-01/
├── server/          # Backend Express + Prisma application
│   ├── prisma/
│   ├── src/
│   └── tests/lab-01/
├── docs/            # Documentation & lab records
│   └── lab-01/
├── .gitignore
└── README.md
```

---

## Getting Started

### 1. Environment Setup

Copy the example environment files for both server and client:

```bash
# In the server directory
cp server/.env.example server/.env

# In the client directory
cp client/.env.example client/.env
```

Ensure the `DATABASE_URL` in `server/.env` matches your local PostgreSQL credentials:

```env
DATABASE_URL="postgresql://toktickit:toktickit@localhost:5432/toktickit?schema=public"
PORT=3000
```

### 2. Install Dependencies

Install npm packages in both `client` and `server`:

```bash
# Client dependencies
cd client && npm install

# Server dependencies
cd ../server && npm install
```

### 3. Database Migration and Seeding

Run Prisma migrations and database seed from the `server` directory:

```bash
cd server
npm run prisma:migrate
npm run prisma:seed
```

### 4. Running the Development Servers

Start the backend and frontend in separate terminals:

```bash
# Backend (http://localhost:3000)
cd server
npm run dev

# Frontend (http://localhost:5173)
cd client
npm run dev
```

---

## Running Automated Tests

Run Vitest and Supertest test suites:

```bash
# Backend tests (Supertest)
cd server
npm test

# Frontend tests (Vitest)
cd client
npm test
```