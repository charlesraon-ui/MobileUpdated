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
   MONGO_URI=mongodb+srv://levymarcelo555:xtsr8gqeaq1brvBZ@cluster0.lyyf48t.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
   JWT_SECRET=jwtsecretKey@3410404
   PAYMONGO_PUBLIC_KEY=pk_test_xF6nEM4BHEuKPAd7GrbiN9Gk
   PAYMONGO_SECRET_KEY=sk_test_AFe1xWMyhWy9FRzvie9Sr5QP
   CLOUDINARY_CLOUD_NAME=dx9cjcodr
   CLOUDINARY_API_KEY=469988974799918
   CLOUDINARY_API_SECRET=QXnavrd3zFpspQPdYeI1_ZVh95M
   CLOUDINARY_ROOT_FOLDER=goat-app
   ```

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