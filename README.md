# Healthcare Appointment & Queue Management System

A full-stack MERN (MongoDB, Express, React, Node.js) application for hospital appointment booking and real-time queue management.

## Features

- **Role-based Authentication**: Secure access for Patients, Doctors, and Admins using JWT.
- **Patient Workflow**: Book, view, reschedule, and cancel appointments. Search doctors by department.
- **Doctor Workflow**: Real-time waiting queue, start/complete consultations, mark no-shows.
- **Admin Dashboard**: Visualize hospital statistics using Recharts (Appointments, Departments, Doctors).
- **Real-time Queue**: Socket.IO integration for live queue updates and estimated waiting times.
- **Intelligent Slot Generation**: Automatic time-slot calculation based on doctor availability, duration, and break times.
- **Double Booking Prevention**: MongoDB atomic indexes and backend validation prevent overlapping appointments.
- **Modern UI/UX**: Built with Tailwind CSS, Lucide React icons, loading states, error handling, and responsive design.

## Tech Stack

- **Frontend**: React (Vite), React Router, Tailwind CSS, Axios, Recharts, Socket.IO Client, Lucide React.
- **Backend**: Node.js, Express.js, MongoDB, Mongoose, Socket.IO, JWT, bcrypt.

## Setup Instructions

### Prerequisites
- Node.js installed
- MongoDB installed locally (or a MongoDB Atlas URI)

### 1. Clone & Install Dependencies
Navigate to the `server` directory and install dependencies:
```bash
cd server
npm install
```

Navigate to the `client` directory and install dependencies:
```bash
cd client
npm install
```

### 2. Configure Environment Variables
Inside the `server` directory, create a `.env` file (if not already present):
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/healthcare-appointment
JWT_SECRET=supersecretjwtkey123
```
*Note: Replace `MONGO_URI` with your own MongoDB connection string if you are using Atlas or a different local port.*

### 3. Seed the Database
To populate the database with realistic demo data (Admin, Doctors, Patients, Departments, Rooms):
```bash
cd server
node utils/seeder.js
```

### 4. Run the Application
Start the backend server (runs on port 5000):
```bash
cd server
npm start
```
*(If you have nodemon installed, you can use `npm run dev` if configured in package.json)*

Start the frontend (runs on port 5173 by default):
```bash
cd client
npm run dev
```

### Demo Accounts
- **Admin**: `admin@hospital.com` / `password123`
- **Doctor**: `john@hospital.com` / `password123`
- **Patient**: `patient1@test.com` / `password123`
