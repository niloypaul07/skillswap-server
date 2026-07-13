# SkillSwap Server 📡

> **Live API:** [https://skillswap-server-zeta.vercel.app/](https://skillswap-server-zeta.vercel.app/)

The Node.js + Express + MongoDB REST API backend for **SkillSwap**, a peer-to-peer tutoring and mentorship marketplace. Deployed on Vercel as a serverless function.

---

## 🌐 Live Links

| | Link |
|---|---|
| 📡 **Backend (API Server)** | [https://skillswap-server-zeta.vercel.app/](https://skillswap-server-zeta.vercel.app/) |
| 🖥️ **Frontend (Client)** | [https://skillswap-client-navy.vercel.app/](https://skillswap-client-navy.vercel.app/) |

---

## 🚀 Key Features

- **Database Integration** — Native MongoDB driver with serverless-optimized connection caching.
- **User Registration & Secure Authentication** — Passwords hashed with `bcryptjs`, sessions managed with JSON Web Tokens (JWT).
- **Request Authorization Middleware** — Custom Express middleware validates JWT tokens from `Authorization: Bearer <token>` headers.
- **Comprehensive CRUD API** — Full create, read, update, and delete support for skill listings with owner-level authorization checks.
- **Database Seeding Script** — Ready-to-use seed script to populate the database with sample listings.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js v4 |
| Language | TypeScript |
| Database | MongoDB (Native Driver) |
| Authentication | jsonwebtoken (JWT) |
| Password Hashing | bcryptjs |
| Hosting | Vercel (Serverless) |

---

## ⚙️ Configuration & Environment Variables

Create a `.env` file in the root of the server folder:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/skillswapDB?appName=Cluster0
JWT_SECRET=your_custom_jwt_secret_key_string
```

> **Vercel Deployment**: Set these same variables in your Vercel project under **Settings → Environment Variables**.

---

## 🚀 Getting Started (Local)

1. Install dependencies:
   ```bash
   npm install
   ```

2. Seed your MongoDB database with sample data:
   ```bash
   npm run seed
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```
   *The API will run on `http://localhost:5000`.*

---

## 📡 API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/` | No | API info & status |
| `GET` | `/api/health` | No | Health check |
| `POST` | `/api/auth/register` | No | Create a new user account |
| `POST` | `/api/auth/login` | No | Authenticate & receive JWT token |
| `GET` | `/api/auth/me` | ✅ Yes | Get current user profile |
| `GET` | `/api/skills` | No | Fetch listings (search, sort, filter, paging) |
| `GET` | `/api/skills/my-skills` | ✅ Yes | Fetch listings by logged-in user |
| `GET` | `/api/skills/:id` | No | Fetch a single listing |
| `POST` | `/api/skills` | ✅ Yes | Create a new listing |
| `PUT` | `/api/skills/:id` | ✅ Yes | Update an existing listing |
| `DELETE` | `/api/skills/:id` | ✅ Yes | Delete a listing |

---

## 🔐 Security

- Passwords are **never stored in plaintext** — hashed with `bcryptjs` (10 salt rounds).
- JWT tokens expire after **7 days**.
- All protected routes verify token ownership before allowing modifications.
- MongoDB Atlas is configured with **network access control** to restrict connections.
- Production deployments enforce **HTTPS only** via Vercel.
