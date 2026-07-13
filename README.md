# SkillSwap Server 📡 (Backend API)

This repository contains the Node.js, Express, and MongoDB backend API for **SkillSwap**, a peer-to-peer tutoring and mentorship marketplace.

## 🚀 Key Features
*   **Database Integration**: Direct native MongoDB connections with optimized connection pooling.
*   **User Registration & Secure Authentication**: Uses SHA-256 (or cryptographically secure hashing) and generates JSON Web Tokens (JWT) for secure authentication.
*   **Request Authorization**: Custom Express middleware validating JWT tokens in HTTP headers (`Authorization: Bearer <token>`) and attaching the active session details to routing contexts.
*   **Comprehensive CRUD Routing**: Handles posting, reading, updating, and deleting listings with user validation checks.
*   **Database Seeding Script**: Ready-to-use seed script to populate databases on initialization with sample listings.

---

## 🛠️ Tech Stack
*   **Runtime**: Node.js & Express.js
*   **Language**: TypeScript (Type-safe compilation)
*   **Database**: MongoDB (Native Driver)
*   **Authentication**: jsonwebtoken (JWT)
*   **Dev Server**: ts-node-dev (hot reload)

---

## ⚙️ Configuration & Environment Variables

Create a `.env` file in the root of the server folder:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/databaseName?appName=Cluster0
JWT_SECRET=your_custom_jwt_secret_key_string
```

---

## 🚀 Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Seed your MongoDB Database:
   ```bash
   npm run seed
   ```

3. Run the development API server:
   ```bash
   npm run dev
   ```
   *The API will run on `http://localhost:5000`.*

---

## 📡 API Reference endpoints

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| **POST** | `/api/auth/register` | No | Creates a new user |
| **POST** | `/api/auth/login` | No | Authenticates user & returns token |
| **GET** | `/api/auth/me` | Yes | Retrieves user account profile |
| **GET** | `/api/skills` | No | Fetches listings (supports search, sort, paging, category) |
| **GET** | `/api/skills/my-skills`| Yes | Fetches listings created by the logged-in user |
| **GET** | `/api/skills/:id` | No | Fetches a single listing details |
| **POST** | `/api/skills` | Yes | Publishes a new tutoring listing |
| **PUT** | `/api/skills/:id` | Yes | Modifies an existing listing |
| **DELETE** | `/api/skills/:id` | Yes | Deletes a listing |
