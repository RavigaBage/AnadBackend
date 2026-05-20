
# 📘 Backend API Documentation

## Overview

This API provides:

* Authentication (Register, Login, Logout)
* JWT-based access control
* Refresh token session handling (cookies)
* Rate limiting protection
* User profile access

Base URL:

```
http://localhost:5000
```

All protected routes use:

```http
Authorization: Bearer <accessToken>
```

---

# 🚦 Global Middleware

## Rate Limiter

All `/api` routes are protected by rate limiting:

```http
/app.use("/api", apiLimiter)
```

### Limit rules:

* 100 requests per 15 minutes per IP
* Returns `429 Too Many Requests` when exceeded

### Response:

```json
{
  "status": 429,
  "message": "Too many requests. You are temporarily blocked for 5 minutes.",
  "retryAfter": 300,
  "redirectTo": "/login"
}
```

### Frontend handling:

```ts
if (error.response.status === 429) {
  window.location.href = "/login";
}
```

---

# 🔐 Authentication APIs

## 1. Register User

```http
POST /api/auth/register
```

### Body:

```json
{
  "name": "John Doe",
  "email": "john@gmail.com",
  "password": "123456"
}
```

### Response:

```json
{
  "message": "User registered successfully",
  "accessToken": "jwt_access_token",
  "user": {
    "id": "1",
    "name": "John Doe",
    "email": "john@gmail.com"
  }
}
```

### Notes:

* Automatically sets `refreshToken` in HTTP-only cookie
* Returns `accessToken` for API access

---

## 2. Login User

```http
POST /api/auth/login
```

### Body:

```json
{
  "email": "john@gmail.com",
  "password": "123456"
}
```

### Response:

```json
{
  "message": "Login successful",
  "accessToken": "jwt_access_token",
  "user": {
    "id": "1",
    "name": "John Doe",
    "email": "john@gmail.com"
  }
}
```

### Notes:

* Sets `refreshToken` cookie automatically
* Use `accessToken` for API requests

---

## 3. Refresh Token

```http
POST /api/auth/refresh
```

### Requirements:

* Must include cookies (`refreshToken`)

### Response:

```json
{
  "accessToken": "new_jwt_access_token"
}
```

### Frontend usage:

```ts
axios.post("/api/auth/refresh", {}, { withCredentials: true });
```

---

## 4. Logout User

```http
POST /api/auth/logout
```

### Headers:

```http
Authorization: Bearer <accessToken>
```

### Response:

```json
{
  "message": "Logged out successfully"
}
```

### Effect:

* Clears `refreshToken` cookie

---

## 5. Get Current User

```http
GET /api/auth/me
```

### Headers:

```http
Authorization: Bearer <accessToken>
```

### Response:

```json
{
  "id": "1",
  "name": "John Doe",
  "email": "john@gmail.com",
  "createdAt": "2026-01-01T00:00:00.000Z"
}
```

---

# 🔐 Authorization Rules

## Middleware: `authenticate`

Used on protected routes.

### Required header:

```http
Authorization: Bearer <token>
```

### Errors:

```json
401 No token provided
401 Token missing
401 Invalid or expired token
```

---

## Middleware: `isAdmin`

Admin-only access.

### Rules:

* Must be authenticated
* Must have `role: "admin"`

### Errors:

```json
401 No token provided
403 Access denied. Admins only.
```

---

# 🍪 Cookies

## Refresh Token Cookie

Automatically set on login/register:

```http
Set-Cookie: refreshToken=xxx; HttpOnly; Secure; SameSite=Strict
```

### Properties:

* HTTP-only (not accessible in JS)
* 7 days expiry
* Used for session refresh

---

# 🔄 Token System

## Access Token

* Expires in: 15 minutes
* Used for API requests

## Refresh Token

* Expires in: 7 days
* Stored in cookie
* Used to generate new access tokens

---

# 🌐 Frontend Integration Guide

## 1. Store Access Token

```ts
localStorage.setItem("accessToken", token);
```

---

## 2. Axios Setup

```ts
const api = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

---

## 3. Auto Refresh Flow

```ts
api.interceptors.response.use(
  res => res,
  async (err) => {
    if (err.response?.status === 401) {
      const refresh = await api.post("/auth/refresh");

      localStorage.setItem("accessToken", refresh.data.accessToken);

      err.config.headers.Authorization =
        `Bearer ${refresh.data.accessToken}`;

      return api(err.config);
    }

    return Promise.reject(err);
  }
);
```

---

## 4. Rate Limit Handling

```ts
if (error.response?.status === 429) {
  localStorage.clear();
  window.location.href = "/login";
}
```

---

# 📌 Summary

| Feature      | Description                   |
| ------------ | ----------------------------- |
| Auth         | JWT access + refresh tokens   |
| Security     | Helmet + CORS + Rate limiting |
| Session      | HTTP-only cookies             |
| Protection   | IP-based rate limiting        |
| Admin access | Role-based guard              |

---
