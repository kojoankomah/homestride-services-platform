# HomeStride Services Platform

A full-stack home-services booking and job-management platform for customers, technicians and administrators.

**Live website:** [homestride-services.pages.dev](https://homestride-services.pages.dev/)
**API health check:** [homestride-api.onrender.com/api/health](https://homestride-api.onrender.com/api/health)

> HomeStride is a fictional portfolio project. Its company identity, contact details, prices and operational information do not represent a real home-services business.

## Overview

HomeStride demonstrates how a household service can be managed from the initial customer request through technician assignment and completion.

The platform combines a responsive public website with secure authentication, role-based dashboards, REST API endpoints and persistent PostgreSQL storage.

## Core Features

* Responsive public website
* Seven household service categories
* Customer registration and login
* JWT-based authentication
* Password hashing with bcrypt
* Role-based authorization
* Customer address management
* Service-request booking
* Skill-based technician assignment
* Request search and status filtering
* Technician progress updates
* Request status history and notes
* Separate customer, technician and administrator dashboards
* Form validation and mobile-responsive layouts

## User Roles

### Customer

Customers can:

* Create an account and sign in
* Save service addresses
* Submit household service requests
* Choose a preferred appointment date and time
* Track request status
* View assigned technicians
* Review progress notes and status history

### Administrator

Administrators can:

* View all service requests
* Search and filter requests
* Monitor request statistics
* View registered technicians and their skills
* Assign eligible technicians to pending requests

### Technician

Technicians can:

* View assigned jobs
* Filter jobs by status
* Review customer, location and appointment information
* Start assigned work
* Add progress notes
* Mark work as completed

## Service Workflow

1. A customer submits a service request.
2. The request enters the **Pending** state.
3. An administrator assigns a technician with the required service skill.
4. The request changes to **Assigned**.
5. The technician starts the job and adds a progress note.
6. The request changes to **In Progress**.
7. The technician completes the work.
8. The customer can review the completed request and its full timeline.

## Technology Stack

### Frontend

* HTML5
* CSS3
* Vanilla JavaScript
* Fetch API
* Browser local storage

### Backend

* Node.js
* Express
* PostgreSQL
* `pg`
* JSON Web Tokens
* `bcryptjs`
* Helmet
* CORS
* Express Rate Limit
* dotenv

### Deployment

* **Frontend:** Cloudflare Pages
* **Backend API:** Render Web Service
* **Database:** Render PostgreSQL
* **Version control:** Git and GitHub

## Project Structure

```text
homestride-services-platform/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── validators/
│   │   └── app.js
│   ├── server.js
│   ├── .env.example
│   └── package.json
├── database/
│   ├── schema.sql
│   └── seed.sql
├── frontend/
│   ├── assets/
│   │   ├── css/
│   │   ├── icons/
│   │   ├── images/
│   │   └── js/
│   ├── auth/
│   ├── dashboards/
│   ├── pages/
│   ├── requests/
│   └── index.html
├── .gitignore
├── LICENSE
└── README.md
```

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/kojoankomah/homestride-services-platform.git
cd homestride-services-platform
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Configure environment variables

Create `backend/.env` using `backend/.env.example` as a guide:

```env
PORT=5000
NODE_ENV=development
CLIENT_URLS=http://127.0.0.1:5500,http://localhost:5500
DATABASE_URL=your_postgresql_connection_url
JWT_SECRET=your_secure_random_secret
```

Never commit the `.env` file or expose its values publicly.

### 4. Prepare the database

Run the SQL contained in:

```text
database/schema.sql
database/seed.sql
```

The schema creates the required tables, while the seed file adds the seven service categories.

### 5. Start the backend

From the `backend` directory:

```bash
npm run dev
```

The local API runs at:

```text
http://localhost:5000/api
```

### 6. Start the frontend

Open `frontend/index.html` using VS Code Live Server.

The frontend automatically uses the local API on `localhost` or `127.0.0.1` and the deployed Render API in production.

## Main API Areas

```text
/api/auth
/api/users
/api/services
/api/addresses
/api/requests
/api/technicians
/api/admin/requests
/api/technician/requests
```

Protected routes require a valid bearer token. Administrator and technician operations also require the appropriate role.

## Security Measures

* Passwords are hashed before storage
* Authentication uses signed JSON Web Tokens
* Protected routes validate bearer tokens
* Role middleware restricts privileged actions
* CORS limits permitted browser origins
* Helmet adds security-related HTTP headers
* Rate limiting reduces repeated API requests
* Parameterized PostgreSQL queries reduce injection risk
* Environment secrets remain outside version control

## Portfolio Notes

The public website can be explored without an account. Visitors may create fictional customer accounts to test the customer workflow.

Administrator and technician credentials are intentionally not published in the repository. Role-specific demonstrations can be provided privately when required.

## License

See the repository’s `LICENSE` file for licensing information.
