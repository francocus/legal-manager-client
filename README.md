# Legal Manager — Frontend

React frontend for the Legal Manager web application, a system designed for law firm management. Developed as the final integrated project for the Programming III course at Universidad Tecnológica Nacional (UTN - FRRO), awarded 10/10.

> **Backend:** [legal-manager-api](https://github.com/francocus/legal-manager-api) — .NET REST API

## Tech Stack

- **React 19** + Vite 8
- **React Router 8**
- **Bootstrap 5** + React Bootstrap

## Features

- JWT Authentication with 3 roles: `sysadmin`, `abogado` (lawyer), and `cliente` (client)
- CRUD for users, legal cases, and appointments
- Interactive calendar (week & month views)
- Light and dark theme toggle

## Video Demos

Here you can find the walkthrough videos showing the system's workflow for each user role (recorded at 1.5x speed):

### Lawyer Role (Appointments & Cases)

https://github.com/user-attachments/assets/fdcca43c-3748-4c50-88f0-f06ed5a0aeaa

### Client Role (Portal & Appointment Tracking)

https://github.com/user-attachments/assets/570b5696-d9f4-4ab3-a390-a1cf8f71026e

### Admin Role (User & Role Management)

https://github.com/user-attachments/assets/7ecad9c1-8853-41b7-909d-840bd43d5359

## Getting Started

### Prerequisites

- Node.js v18+
- The [backend API](https://github.com/francocus/legal-manager-api) running locally or deployed

### Installation

```bash
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and set:

| Variable | Description |
| :--- | :--- |
| `VITE_API_URL` | Base URL of the backend API (e.g. `http://localhost:5000/api`) |

### Run

```bash
npm run dev       # development server at http://localhost:5173
npm run build     # production build → dist/
npm run preview   # preview production build locally
```

## Team

- Agustín Angelini
- Franco Cuscianna
- Thiago Cuscianna
