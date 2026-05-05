# FullStack Intern Coding Challenge

This repository contains a fullstack web application built for the intern coding challenge.

## Tech stack
- Backend: Express.js + TypeScript + Prisma
- Database: PostgreSQL
- Frontend: React + Vite + TypeScript

## Features implemented
- User registration and login with JWT authentication
- Role-based access: `ADMIN`, `USER`, `OWNER`
- Admin dashboard counts for users, stores, and ratings
- Store listing with search filters
- Normal user rating submission and update
- Store owner dashboard showing average rating and rating submissions
- Basic form validation on backend

## Setup

1. Install packages:
   - `cd backend && npm install`
   - `cd ../frontend && npm install`

2. Configure the backend database:
   - Copy `backend/.env.example` to `backend/.env`
   - Update `DATABASE_URL` with your PostgreSQL credentials

3. Run Prisma migrations and generate the client:
   - `cd backend`
   - `npx prisma migrate dev --name init`
   - `npx prisma generate`

4. Start the backend and frontend:
   - `cd backend && npm run dev`
   - `cd ../frontend && npm run dev`

5. Open the frontend in your browser at the Vite URL shown in the terminal.

## Notes
- The backend exposes `/auth/signup`, `/auth/login`, `/stores`, `/ratings`, and admin/owner endpoints.
- Normal users can sign up from the frontend and submit ratings for stores.
- Admin users can be created through the backend API.

