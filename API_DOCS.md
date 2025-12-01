# VatavaranTrack API Documentation

Base URL: `http://localhost:4000/api`

## Authentication

### Signup (Public - Staff Only)
- **Endpoint**: `POST /auth/signup`
- **Body**:
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }
  ```
- **Response**: `201 Created` with JWT token. Role is always `STAFF`.

### Create User (Admin Only)
- **Endpoint**: `POST /auth/create-user`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "name": "Supervisor Jane",
    "email": "jane@example.com",
    "password": "password123",
    "role": "SUPERVISOR" // Options: STAFF, SUPERVISOR, ADMIN
  }
  ```
- **Response**: `201 Created` with user details.

### Login
- **Endpoint**: `POST /auth/login`
- **Body**:
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```
- **Response**: `200 OK` with JWT token and user details (including role).

## Admin Setup
To create the initial Admin user, run the seed script:
1. Set `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` in `.env`.
2. Run: `node scripts/create-admin.js`

---

## Pickups

### Create Pickup (Staff Only)
- **Endpoint**: `POST /pickups`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "category": "Plastic",
    "weight": 5.5,
    "latitude": 28.7041,
    "longitude": 77.1025,
    "imageUrl": "http://cloudinary.com/..."
  }
  ```
- **Response**: `201 Created`

### Get My Pickups (Staff Only)
- **Endpoint**: `GET /pickups/my`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK` - List of user's pickups.

### Delete Pickup (Staff Only)
- **Endpoint**: `DELETE /pickups/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Condition**: Can only delete if status is `PENDING`.
- **Response**: `200 OK`

### Get All Pickups (Supervisor/Admin Only)
- **Endpoint**: `GET /pickups`
- **Headers**: `Authorization: Bearer <token>`
- **Query Params**:
  - `page`: Page number (default 1)
  - `limit`: Items per page (default 10)
  - `status`: Filter by status (PENDING, APPROVED, REJECTED)
  - `staffId`: Filter by staff ID
  - `startDate` & `endDate`: Filter by date range
  - `sortBy`: Field to sort by (default `createdAt`)
  - `sortOrder`: `asc` or `desc` (default `desc`)
- **Response**: `200 OK` - Paginated list of pickups.

### Update Pickup Status (Supervisor/Admin Only)
- **Endpoint**: `PATCH /pickups/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "status": "APPROVED" // or REJECTED
  }
  ```
- **Response**: `200 OK`
