# Deployment Instructions

## For Render (Backend)

Your backend is already running at: `https://medi-mind-reminder-system.onrender.com`

**Ensure these environment variables are set in Render:**
- `MONGODB_URI` - Your MongoDB connection string
- `JWT_SECRET` - A strong secret key
- `GROQ_API_KEY` - Groq API key for AI features
- `TWILIO_ACCOUNT_SID` - Twilio account SID
- `TWILIO_AUTH_TOKEN` - Twilio auth token
- `TWILIO_PHONE_NUMBER` - Your Twilio phone number
- `FRONTEND_URL` - `https://medi-mind-system.vercel.app`
- `NODE_ENV` - `production`

## For Vercel (Frontend)

Your frontend is running at: `https://medi-mind-system.vercel.app`

**Steps to redeploy:**
1. Go to https://vercel.com/dashboard
2. Find the `medi-mind-reminder-system` project
3. Click **Redeploy** or **Rebuild**
4. Wait for the build to complete

**Vercel will automatically:**
- Build the React app with `npm run build`
- Serve the static files
- Use the API URLs configured in your code

## What was fixed:

✅ **Backend CORS** - Now allows requests from `https://medi-mind-system.vercel.app`
✅ **API URLs** - Frontend now uses centralized `API_BASE_URL` from `src/utils/api.js`
✅ **Removed hardcoded localhost** - All pages now use the production Render URL
✅ **Environment variables** - Properly configured for both local and production

## Testing:

1. Go to https://medi-mind-system.vercel.app
2. Try logging in - should work with Render backend
3. Try sending OTP - should work without CORS errors
4. Try fetching medications - should work with the backend

If you still see errors, check:
- Network tab in browser console (F12 → Network)
- Response headers for `Access-Control-Allow-Origin`
- Render logs for backend errors
- Vercel deployment logs
