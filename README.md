# Vatavaran - Backend API

The Vatavaran Backend is a robust RESTful API built with Node.js and Express that powers the waste management platform. It handles secure user authentication, role-based access control (RBAC), data management for waste collection, and AI-assisted waste classification.

## 🏗️ System Architecture

*   **REST API**: Structured endpoints for scalable data interaction.
*   **Database**: PostgreSQL managed via Prisma ORM for type-safe database queries.
*   **Authentication**: Secure JWT-based auth with Bcrypt password hashing.
*   **AI Integration**: Vision API integration for assistive waste categorization.

## 🛠️ Tech Stack

*   **Runtime**: [Node.js](https://nodejs.org/)
*   **Framework**: [Express.js v5](https://expressjs.com/)
*   **ORM**: [Prisma](https://www.prisma.io/)
*   **Database**: PostgreSQL
*   **Auth**: JSON Web Tokens (JWT)
*   **Storage**: Cloudinary (via Multer)

## 🔑 Key Features

### 1. Secure Authentication & RBAC
Implements strong security policies ensuring users can only access data relevant to their role.
*   **Admin**: Full system access.
*   **Supervisor**: Regional data and staff oversight.
*   **Staff**: Field operations and data submission.

### 2. AI-Assisted Classification (Assistive)
The system employs the Google Gemini 1.5 Flash model to *assist* field staff by suggesting waste categories from uploaded images.
*   **Design Philosophy**: The AI acts as a helper, not a blocker.
*   **Reliability**: Includes robust fallback mechanisms. If the AI service is unavailable or rate-limited, the system gracefully defaults to a safe category ("Plastic") to ensure field operations are never interrupted.

## 🔗 Related Repositories

*   **Frontend Client**: [Run the Frontend App](https://github.com/yourusername/vatavaran-frontend)

## 🚦 Getting Started

### Prerequisites
*   Node.js (v18+)
*   PostgreSQL Database

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/vatavaran-backend.git
    cd vatavaran-backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Setup:**
    Create a `.env` file in the root directory:
    ```env
    PORT=4000
    DATABASE_URL="postgresql://user:password@localhost:5432/vatavaran_db"
    JWT_SECRET="your_secure_secret"
    GEMINI_API_KEY="your_api_key"
    CLOUDINARY_CLOUD_NAME="..."
    CLOUDINARY_API_KEY="..."
    CLOUDINARY_API_SECRET="..."
    ```

4.  **Database Migration:**
    ```bash
    npx prisma migrate dev --name init
    ```

5.  **Run Development Server:**
    ```bash
    npm run dev
    ```

    The API will be available at [http://localhost:4000](http://localhost:4000).

## 🛡️ API Endpoints (Overview)

| Method | Endpoint | Description | Role |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | User login | Public |
| `POST` | `/api/pickups` | Log new collection | Staff |
| `GET` | `/api/pickups` | Get collection history | Auth |
| `POST` | `/api/ai/classify` | AI Waste Suggestion | Staff |
