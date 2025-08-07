# Firebase Setup Instructions

This project uses Firebase for authentication and data storage. Follow these steps to connect it to your existing Firebase project.

## 1. Firebase Project Configuration

### Get Your Firebase Config
1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your existing project
3. Click on the gear icon (Settings) → Project settings
4. In the "Your apps" section, find your web app or create a new one
5. Copy the Firebase configuration object

### Set Environment Variables
1. Copy `.env.example` to `.env.local`
2. Fill in your Firebase configuration values:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

## 2. Authentication Setup

### Enable Authentication Methods
1. In Firebase Console, go to Authentication → Sign-in method
2. Enable the following providers:
   - **Email/Password**: For traditional authentication
   - **Google**: For Google Sign-in
   - **GitHub**: For GitHub Sign-in (optional)

### Configure OAuth Providers
For Google Sign-in:
1. Follow the setup wizard in Firebase Console
2. Add your domain to authorized domains

For GitHub Sign-in:
1. Create a GitHub OAuth App in your GitHub settings
2. Add the client ID and secret in Firebase Console

## 3. Firestore Database Setup

### Create Database
1. Go to Firestore Database in Firebase Console
2. Click "Create database"
3. Choose "Start in production mode" (we'll set rules next)
4. Select a location close to your users

### Security Rules
Replace the default Firestore rules with these:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Ideas are accessible to their creators
    match /ideas/{ideaId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }

    // Favorites are accessible to their owners
    match /favorites/{favoriteId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }

    // Generation history is accessible to owners
    match /generation_history/{historyId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }

    // Recently viewed is accessible to owners
    match /recently_viewed/{viewedId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

## 4. Database Structure

The app will automatically create these collections:

### Collections:
- `users` - User profiles and statistics
- `ideas` - User-generated game ideas
- `favorites` - User's favorited ideas
- `generation_history` - AI generation history
- `recently_viewed` - Recently viewed ideas

### Document Structure:

#### Users Collection (`users/{userId}`)
```javascript
{
  name: string,
  email: string,
  joinDate: timestamp,
  totalGenerations: number,
  ideasSaved: number,
  favoriteCategories: array,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### Favorites Collection (`favorites/{userId}_{ideaId}`)
```javascript
{
  userId: string,
  ideaId: number,
  idea: object, // Complete idea object
  createdAt: timestamp
}
```

## 5. Optional: Analytics Setup

If you want to track user interactions:
1. Go to Analytics in Firebase Console
2. Enable Google Analytics
3. The app will automatically start tracking events

## 6. Testing the Setup

1. Start your development server: `bun run dev`
2. Try creating an account and logging in
3. Generate some ideas and add them to favorites
4. Check your Firestore database to see data being created

## 7. Deployment Considerations

### Environment Variables for Production
Make sure to set all environment variables in your hosting platform:
- Vercel: Add them in Project Settings → Environment Variables
- Netlify: Add them in Site Settings → Environment Variables

### Security
- Never commit your `.env.local` file
- Regularly review your Firestore security rules
- Monitor authentication usage in Firebase Console

## Troubleshooting

### Common Issues:

1. **"Firebase: Error (auth/unauthorized-domain)"**
   - Add your domain to authorized domains in Authentication → Settings

2. **"Missing or insufficient permissions"**
   - Check your Firestore security rules
   - Ensure user is properly authenticated

3. **"Firebase app named '[DEFAULT]' already exists"**
   - This usually happens during development hot reloads
   - Restart your development server

### Getting Help
- Check the browser console for detailed error messages
- Review Firebase Console logs
- Ensure all environment variables are set correctly
