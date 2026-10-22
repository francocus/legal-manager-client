# Legal Manager — Frontend

React frontend for [legal-manager-api](https://github.com/francocus/legal-manager-api).

## Tech Stack

- React 19 + Vite 8
- React Router 8
- Bootstrap 5 + React Bootstrap

## Getting Started

### Prerequisites

- Node.js v18+
- [legal-manager-api](https://github.com/francocus/legal-manager-api) running locally or deployed

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
npm run dev       # development server → http://localhost:5173
npm run build     # production build → dist/
npm run preview   # preview production build locally
```
