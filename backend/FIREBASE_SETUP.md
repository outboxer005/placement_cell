# Firebase Service Account Setup

## Backend - firebase-service-account.json

To enable push notifications from the server, you need to add the Firebase Admin SDK service account JSON:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to Project Settings > Service Accounts
4. Click "Generate New Private Key"
5. Download the JSON file
6. Rename it to `firebase-service-account.json`
7. Place it at: `server/firebase-service-account.json`

## Security

This file contains sensitive credentials. It has been added to `.gitignore` to prevent accidental commits.

**NEVER** commit this file to version control!

## Environment Variable

Add this line to `server/.env`:
```
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
```

After adding the file and environment variable, restart the server:
```bash
cd server
npm run dev
```

You should see: `✅ Firebase Admin SDK initialized`
