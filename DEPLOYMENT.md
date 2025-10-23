# Deployment Guide - Render

## Backend Deployment to Render

Your backend is configured to deploy to Render at: `https://goagritrading-backend.onrender.com`

### Steps to Deploy:

1. **Push your code to GitHub** (if not already done)
   ```bash
   git add .
   git commit -m "Configure for Render deployment"
   git push origin main
   ```

2. **Connect to Render**
   - Go to [render.com](https://render.com)
   - Sign in with your GitHub account
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

3. **Configure Environment Variables in Render Dashboard**
   Set these sensitive environment variables in your Render service settings:
   
   ```
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   PAYMONGO_PUBLIC_KEY=your_paymongo_public_key
   PAYMONGO_SECRET_KEY=your_paymongo_secret_key
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   CLOUDINARY_ROOT_FOLDER=your_cloudinary_folder
   ```
   
   **Note**: Use the actual values from your backend/.env file when setting these in Render dashboard.

4. **Deployment Configuration**
   - Render will automatically detect the `render.yaml` file
   - The service will build from the `/backend` directory
   - Health checks are configured at `/healthz`
   - Auto-deploy is enabled for main branch

### What's Been Updated:

✅ **render.yaml** - Updated with all non-sensitive environment variables
✅ **app.json** - Updated API URL to use Render deployment
✅ **mobile/.env** - Updated API URLs to use Render deployment  
✅ **PromoService.js** - Updated to use Render deployment URL
✅ **Root .env** - Created with Render deployment URLs

### API Endpoints Available:

Once deployed, your API will be available at:
- Base URL: `https://goagritrading-backend.onrender.com`
- Health Check: `https://goagritrading-backend.onrender.com/healthz`
- API Routes: `https://goagritrading-backend.onrender.com/api/*`

### Mobile App Configuration:

The mobile app is now configured to use the Render deployment:
- All API calls will go to `https://goagritrading-backend.onrender.com`
- Environment variables are set correctly
- Socket.io connections will use the production URL

### Testing After Deployment:

1. Test health endpoint: `https://goagritrading-backend.onrender.com/healthz`
2. Test API endpoints: `https://goagritrading-backend.onrender.com/api/products`
3. Test promo codes: `https://goagritrading-backend.onrender.com/api/promo/apply`
4. Test mobile app connectivity

### Important Notes:

- First deployment may take 5-10 minutes
- Render free tier may have cold starts (service sleeps after inactivity)
- Monitor logs in Render dashboard for any issues
- Database connections should work automatically with the MongoDB URI

### Troubleshooting:

If deployment fails:
1. Check Render build logs
2. Verify all environment variables are set
3. Ensure MongoDB URI is accessible from Render
4. Check that all dependencies are in package.json