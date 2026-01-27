# Google OAuth Setup Guide

Follow these steps to enable Google login in your application:

## 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Click **Select a Project** → **New Project**
4. Enter project name and click **Create**

## 2. Enable Google Identity Services API

1. Go to **APIs & Services** → **Library**
2. Search for "Google Identity Services"
3. Click on it and press **Enable**

## 3. Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Select **Web application**
4. Add **Authorized JavaScript origins**:
   - `http://localhost:5173` (development)
   - `http://localhost:3000` (if using other port)
   - Your production domain (e.g., `https://yourdomain.com`)

5. Add **Authorized redirect URIs**:
   - `http://localhost:5000/api/auth/google-callback` (backend)
   - Your production callback URL

6. Click **Create**
7. Copy your **Client ID** and **Client Secret**

## 4. Configure Environment Variables

### Backend (.env)
```
GOOGLE_CLIENT_ID=your_client_id_from_step_3
GOOGLE_CLIENT_SECRET=your_client_secret_from_step_3
```

### Frontend (.env.local or .env)
```
VITE_GOOGLE_CLIENT_ID=your_client_id_from_step_3
VITE_API_URL=http://localhost:5000
```

## 5. Install Dependencies

### Backend
```bash
cd backend
npm install
```

### Frontend
```bash
cd frontend
npm install
```

## 6. Start the Application

### Backend
```bash
cd backend
npm run dev
```

### Frontend
```bash
cd frontend
npm run dev
```

## 7. Test Google Login

1. Go to `http://localhost:5173` (frontend)
2. Click the Google button (G) on the login page
3. Sign in with your Google account
4. You should be redirected to the form builder

## Troubleshooting

- **"Invalid Google token"**: Make sure `GOOGLE_CLIENT_ID` in backend `.env` matches your actual Client ID
- **CORS errors**: Check that `http://localhost:5173` is added to authorized origins
- **Google button not appearing**: Clear browser cache and ensure the Google Identity Services script loads
- **"Token not found"**: Make sure the frontend sends the credential token correctly

## How It Works

1. **Frontend**: User clicks Google button → Google Identity Services opens OAuth dialog
2. **User authenticates** with Google and grants permission
3. **Frontend receives**: ID token from Google
4. **Frontend sends**: Token to backend at `/api/auth/google-login`
5. **Backend verifies**: Token with Google's servers
6. **Backend creates/updates** user in database
7. **Backend returns**: JWT token to frontend
8. **Frontend stores** JWT and redirects to form builder

## Security Notes

- Never commit `.env` files with real credentials
- Use environment variables for all sensitive data
- Verify Google tokens server-side (already implemented)
- Use HTTPS in production
- Rotate credentials regularly
