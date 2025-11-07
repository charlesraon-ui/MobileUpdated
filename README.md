# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
# MobileUpdated
## OTP Email Setup (Registration)

To require OTP for every registration and deliver codes reliably to Gmail:

- Backend environment variables (in `backend/.env`):
  - `MAIL_FROM` — verified sender email address in SendGrid
  - `SMTP_HOST=smtp.sendgrid.net`
  - `SMTP_PORT=587`
  - `SMTP_USER=apikey`
  - `SMTP_PASS=<SENDGRID_API_KEY>`
  - `SENDGRID_API_KEY=<SENDGRID_API_KEY>`
  - `REG_OTP_TTL_MIN=10` (optional, OTP expiry in minutes)
  - `DEBUG_LOG_OTP=1` (optional, logs OTP in dev for testing)

- Notes:
  - The server sends OTP via SMTP first; if unavailable or fails, it falls back to SendGrid API.
  - `MAIL_FROM` must be a verified sender in your SendGrid account, otherwise Gmail may reject or mark as spam.
  - Twilio SMS is supported (optional): set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_FROM_NUMBER` to send SMS in addition to email.

- Start backend for local testing:
  - In `backend/`: `npm run dev`
  - Mobile `API_URL` should point to your backend: set `EXPO_PUBLIC_API_URL=http://localhost:5000` in the mobile env.

- Test flow:
  1) Open the mobile web app, go to Register.
  2) Submit details using a real Gmail address.
  3) You’ll be redirected to the OTP screen; enter the 6‑digit code from your inbox.
  4) On success, you’re logged in and redirected to Home.
