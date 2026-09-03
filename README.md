# MedTrust SaaS — React Frontend

Production-ready, responsive frontend for patient & doctor authentication, doctor onboarding/verification, document uploads, and SaaS Admin review with feedback.

## Environment Configuration

Create a `.env` file in the `FRONTEND` directory (copied from `.env.example`):

```env
# Backend Base API URL
VITE_API_BASE_URL=http://localhost:8000
```

When deploying to production, simply change `VITE_API_BASE_URL` to your production backend URL (e.g. `https://api.yourdomain.com`). All API endpoints throughout the application will automatically route to the updated URL.

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Local Development Server
```bash
npm run dev
```
Open **http://localhost:5173** in your browser.

### 3. Production Build
```bash
npm run build
```
