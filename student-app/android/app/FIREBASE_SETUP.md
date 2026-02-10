# Firebase Configuration Instructions

## Mobile App - google-services.json

To enable push notifications, you need to add the Firebase configuration file:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project (or create a new one)
3. Add an Android app with package name: `com.example.placement_student`
4. Download `google-services.json`
5. Place it at: `student-app/android/app/google-services.json`

## What this file contains:

The `google-services.json` file contains Firebase project configuration including:
- Project ID
- API keys
- Client information
- Firebase Cloud Messaging sender ID

## After adding the file:

Run:
```bash
cd student-app
flutter pub get
flutter build apk --debug
```

The app will now be able to receive push notifications.
