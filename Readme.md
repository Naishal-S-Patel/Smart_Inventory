# 🏭 Smart Inventory Management System

<div align="center">

![Smart Inventory Banner](https://img.shields.io/badge/Smart_Inventory-v1.0-6366f1?style=for-the-badge&logo=databricks&logoColor=white)

[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.3.2-6DB33F?style=flat-square&logo=spring-boot&logoColor=white)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

**A production-grade, full-stack inventory management platform with ML-powered demand forecasting, real-time WebSocket alerts, and role-based access control.**

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Getting Started](#-getting-started)
  - [1. Backend (Spring Boot)](#1-backend-spring-boot)
  - [2. ML Service (FastAPI)](#2-ml-service-fastapi)
  - [3. Frontend (React + Vite)](#3-frontend-react--vite)
- [Configuration](#-configuration)
- [API Documentation](#-api-documentation)
- [Demo Credentials](#-demo-credentials)
- [Role-Based Access](#-role-based-access)
- [ML Forecasting](#-ml-forecasting)
- [Contributing](#-contributing)

---

## 🌟 Overview

Smart Inventory is a **three-tier monorepo** application designed for enterprises that need intelligent, real-time inventory control. It combines a robust Java backend, a modern React frontend, and a dedicated Python ML microservice to deliver:

- ✅ **Real-time inventory tracking** across multiple warehouses
- ✅ **ML-powered demand forecasting** using Prophet & XGBoost
- ✅ **Automated low-stock alerts** via WebSockets
- ✅ **Purchase & sales order lifecycle management**
- ✅ **Role-based dashboards** for Admin, Manager, Staff, and Analyst
- ✅ **Anomaly detection** on sales patterns

---

## 🏗 Architecture

```
┌────────────────────────────────────────────────────────────┐
│                     Frontend (React)                        │
│          Vite · TypeScript · Tailwind · React Query         │
│                    localhost:3000                            │
└───────────────────┬───────────────────┬────────────────────┘
                    │  /api/*            │  /ml/*
                    ▼                   ▼
┌───────────────────────┐   ┌───────────────────────────────┐
│   Backend (Spring)    │   │    ML Service (FastAPI)        │
│  Spring Boot 3.3.2    │   │  Prophet · XGBoost · MLflow    │
│  JWT · WebSocket      │   │  pandas · scikit-learn         │
│  Flyway · JPA         │◄──│  SQLAlchemy · psycopg2         │
│  localhost:8080        │   │  localhost:8000                 │
└───────────┬───────────┘   └───────────────────────────────┘
            │
            ▼
┌───────────────────────┐
│  PostgreSQL Database  │
│  smart_inventory DB   │
└───────────────────────┘
```

---

## ✨ Features

### 📦 Inventory Management
- Multi-warehouse inventory tracking with real-time stock levels
- Inventory adjustments, transfers between warehouses
- Low-stock threshold monitoring with automated alerts
- Version-locked optimistic concurrency control

### 📊 Order Management
- **Sales Orders**: Create → Confirm → Complete lifecycle
- **Purchase Orders**: Create → Approve → Send → Receive lifecycle
- Supplier management with performance tracking

### 🤖 ML Forecasting (FastAPI Microservice)
- **Prophet** time-series forecasting per product × warehouse
- **XGBoost** demand prediction with feature engineering
- Reorder quantity recommendations with confidence intervals
- Dead-stock detection & anomaly flagging
- MLflow experiment tracking

### 🔔 Real-time Alerts
- WebSocket-based push notifications for inventory events
- Low-stock alerts, sales anomaly detection
- Configurable thresholds per product

### 🔐 Security
- JWT authentication (access + refresh token rotation)
- Role-based access control (Admin / Manager / Staff / Analyst)
- Rate limiting middleware
- CORS configuration

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript 5.6, Vite 6, Tailwind CSS 3, Radix UI, Recharts, Zustand, React Query, Framer Motion |
| **Backend** | Spring Boot 3.3.2, Java 21, Spring Security, Spring Data JPA, Spring WebSocket, Flyway, Lombok, JWT (JJWT 0.11) |
| **ML Service** | Python 3.11+, FastAPI 0.115, Prophet, XGBoost, scikit-learn, MLflow, pandas, SQLAlchemy, psycopg2 |
| **Database** | PostgreSQL 16 |
| **API Docs** | SpringDoc OpenAPI (Swagger UI) |

---

## 📁 Project Structure

```
smartInventory/
├── Backend/                          # Spring Boot application
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/smartinventory/
│   │   │   │   ├── controller/       # REST controllers
│   │   │   │   ├── service/          # Business logic
│   │   │   │   ├── repository/       # JPA repositories
│   │   │   │   ├── entity/           # JPA entities
│   │   │   │   ├── dto/              # Data Transfer Objects
│   │   │   │   ├── security/         # JWT + Spring Security config
│   │   │   │   ├── websocket/        # WebSocket config & publishers
│   │   │   │   ├── config/           # App-level configuration beans
│   │   │   │   ├── exception/        # Global exception handling
│   │   │   │   └── aspect/           # AOP (logging, rate limiting)
│   │   │   └── resources/
│   │   │       ├── application.yml.example   # Config template (copy → application.yml)
│   │   │       └── db/migration/             # Flyway SQL migrations
│   │   └── test/                             # Integration tests
│   └── pom.xml
│
├── Frontend/                         # React + Vite SPA
│   ├── src/
│   │   ├── components/               # Reusable UI components
│   │   ├── pages/                    # Route-level page components
│   │   ├── services/                 # API service layer (Axios)
│   │   ├── hooks/                    # Custom React hooks
│   │   ├── store/                    # Zustand global state
│   │   ├── routes/                   # Route definitions & guards
│   │   ├── types/                    # TypeScript type definitions
│   │   └── lib/                      # Utility helpers, API clients
│   ├── package.json
│   └── vite.config.ts
│
├── ML/
│   └── ml_service/                   # FastAPI microservice
│       ├── app/
│       │   ├── main.py               # FastAPI app entry point
│       │   ├── api/                  # API route handlers
│       │   ├── services/             # Forecast & analytics logic
│       │   ├── models/               # SQLAlchemy ORM models
│       │   ├── schemas/              # Pydantic request/response schemas
│       │   ├── db/                   # Database session & table setup
│       │   └── core/                 # Config, security
│       ├── requirements.txt
│       ├── .env.example              # Environment variable template
│       └── Dockerfile
│
└── README.md
```

---

## ✅ Prerequisites

| Tool | Minimum Version |
|------|----------------|
| Java JDK | 21 |
| Maven | 3.9+ (or use `./mvnw`) |
| Node.js | 20+ |
| npm | 10+ |
| Python | 3.11+ |
| PostgreSQL | 14+ |

---

## 🚀 Getting Started

### Database Setup

Create the PostgreSQL database before starting any service:

```sql
CREATE DATABASE smart_inventory;
CREATE USER your_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE smart_inventory TO your_user;
```

---

### 1. Backend (Spring Boot)

```bash
cd Backend

# 1. Copy the config template and fill in your credentials
cp src/main/resources/application.yml.example src/main/resources/application.yml
# Edit application.yml → set your DB username/password and a strong JWT secret

# 2. Run the application
./mvnw spring-boot:run          # Linux/Mac
.\mvnw.cmd spring-boot:run      # Windows PowerShell
```

The backend starts on **http://localhost:8080**

> **Seed data**: A `SeedDataRunner` runs on first startup and populates products, warehouses, suppliers, and demo users.

---

### 2. ML Service (FastAPI)

```bash
cd ML/ml_service

# 1. Create and activate a virtual environment
python -m venv .venv
.venv\Scripts\activate          # Windows
source .venv/bin/activate       # Linux/Mac

# 2. Install dependencies
pip install -r requirements.txt

# 3. Copy env template and configure
cp .env.example .env
# Edit .env → set DATABASE_URL and JWT_SECRET matching your backend

# 4. Start the service
uvicorn app.main:app --reload --port 8000
```

The ML service starts on **http://localhost:8000**  
Interactive docs available at **http://localhost:8000/docs**

---

### 3. Frontend (React + Vite)

```bash
cd Frontend

# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev
```

The frontend starts on **http://localhost:3000**

The Vite dev server proxies:
- `/api/*` → `http://localhost:8080` (Spring Boot)
- `/ml/*` → `http://localhost:8000` (FastAPI)

---

## ⚙️ Configuration

### Backend — `application.yml`

Copy `application.yml.example` to `application.yml` and set:

| Key | Description |
|-----|-------------|
| `spring.datasource.url` | PostgreSQL JDBC URL |
| `spring.datasource.username` | DB user |
| `spring.datasource.password` | DB password |
| `jwt.secret` | HS256 signing key (≥ 64 random chars) |
| `jwt.access-token-exp-minutes` | Access token TTL |
| `jwt.refresh-token-exp-days` | Refresh token TTL |

### ML Service — `.env`

Copy `.env.example` to `.env` and set:

| Key | Description |
|-----|-------------|
| `DATABASE_URL` | PostgreSQL SQLAlchemy URL |
| `JWT_SECRET` | **Must match** backend JWT secret |
| `MLFLOW_TRACKING_URI` | MLflow backend (default: `sqlite:///mlruns.db`) |

---

## 📖 API Documentation

| Service | URL | Notes |
|---------|-----|-------|
| Spring Boot Swagger UI | http://localhost:8080/swagger-ui.html | All REST endpoints |
| FastAPI Docs (Swagger) | http://localhost:8000/docs | ML endpoints |
| FastAPI Docs (ReDoc) | http://localhost:8000/redoc | Alternative view |

---

## 🔑 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@smartinventory.com | Password123! |
| **Manager** | manager@smartinventory.com | Password123! |
| **Staff** | staff@smartinventory.com | Password123! |
| **Analyst** | analyst@smartinventory.com | Password123! |

> ⚠️ Change all demo passwords before deploying to production.

---

## 👥 Role-Based Access

| Feature | Admin | Manager | Staff | Analyst |
|---------|:-----:|:-------:|:-----:|:-------:|
| View Dashboard | ✅ | ✅ | ✅ | ✅ |
| View Products | ✅ | ✅ | ✅ | ✅ |
| Create/Edit Products | ✅ | ✅ | ❌ | ❌ |
| Delete Products | ✅ | ❌ | ❌ | ❌ |
| Manage Inventory | ✅ | ✅ | ✅ | ❌ |
| Purchase Orders | ✅ | ✅ | ✅ | ❌ |
| Approve Orders | ✅ | ✅ | ❌ | ❌ |
| View Analytics | ✅ | ✅ | ❌ | ✅ |
| ML Forecasting | ✅ | ✅ | ❌ | ✅ |
| User Management | ✅ | ❌ | ❌ | ❌ |
| System Settings | ✅ | ❌ | ❌ | ❌ |

---

## 🤖 ML Forecasting

The ML service exposes the following endpoints (prefix: `/ml`):

| Endpoint | Description |
|----------|-------------|
| `GET /forecast/{product_id}` | Prophet time-series forecast for a product |
| `GET /reorder-recommendations` | Reorder quantities with confidence intervals |
| `GET /low-stock-alerts` | Products below reorder threshold |
| `GET /dashboard/summary` | Aggregated KPIs for dashboard |
| `GET /analytics/top-products` | Top-selling products by revenue |
| `GET /analytics/category-sales` | Sales breakdown by category |
| `GET /analytics/warehouse-performance` | Per-warehouse metrics |
| `GET /analytics/fast-moving` | Fast-moving SKUs |
| `GET /analytics/dead-stock` | Stagnant / dead-stock detection |
| `GET /analytics/anomalies` | Sales anomaly detection |
| `GET /analytics/insights` | AI-generated inventory insights |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to your branch: `git push origin feature/your-feature`
5. Open a Pull Request

Please follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  Built with ❤️ by <strong>Naishal S. Patel</strong>
</div>
