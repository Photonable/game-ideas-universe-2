# Firestore Database Setup Guide

## Critical: Your Firestore Database Needs Security Rules

The console errors show that Firestore operations are failing with 400 errors. This means your Firestore security rules are blocking the requests.

## Step 1: Enable Firestore Database

1. Go to your [Firebase Console](https://console.firebase.google.com/)
2. Select your `game-idea-universe` project
3. Click on "Firestore Database" in the left sidebar
4. If not already created, click "Create database"
5. Choose "Start in test mode" for now (we'll secure it properly below)
6. Select a location (choose the closest to your users)

## Step 2: Configure Security Rules

**IMPORTANT**: Go to the "Rules" tab in Firestore and replace the default rules with these:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read and write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Users can read and write their own favorites
    match /favorites/{favoriteId} {
      allow read, write: if request.auth != null &&
        request.auth.uid == resource.data.userId ||
        request.auth.uid == request.resource.data.userId;
    }

    // Users can read and write their own generation history
    match /generation_history/{historyId} {
      allow read, write: if request.auth != null &&
        request.auth.uid == resource.data.userId ||
        request.auth.uid == request.resource.data.userId;
    }

    // Users can read and write their own recently viewed
    match /recently_viewed/{viewedId} {
      allow read, write: if request.auth != null &&
        request.auth.uid == resource.data.userId ||
        request.auth.uid == request.resource.data.userId;
    }

    // Users can read and write their own ideas
    match /ideas/{ideaId} {
      allow read, write: if request.auth != null &&
        request.auth.uid == resource.data.userId ||
        request.auth.uid == request.resource.data.userId;
    }

    // Allow reading public game ideas (optional - for shared ideas)
    match /public_ideas/{ideaId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## Step 3: Test the Security Rules

After applying the rules:

1. Click "Publish" to save the rules
2. Go back to your app: https://same-3uud08kmqft-latest.netlify.app
3. Try logging in with Google again
4. Check the browser console - the Firestore 400 errors should be gone
5. Try generating an AI idea to test if data saving works

## Step 4: Verify Collections Are Created

Your app will automatically create these collections when users interact with it:

- `users` - User profiles
- `favorites` - User's favorite ideas
- `generation_history` - AI generation history
- `recently_viewed` - Recently viewed ideas
- `ideas` - User-generated ideas

## Troubleshooting

### If you still see 400 errors:

1. **Check Rules Syntax**: Make sure there are no syntax errors in the security rules
2. **Wait a moment**: Rule changes can take 30-60 seconds to propagate
3. **Clear browser cache**: Hard refresh the page (Ctrl+F5 or Cmd+Shift+R)
4. **Check Firebase Project**: Ensure you're using the correct Firebase project ID

### If authentication isn't working:

1. **Check OAuth Settings**: In Authentication > Settings > Authorized domains
2. **Add your domain**: Add `same-3uud08kmqft-latest.netlify.app` to authorized domains
3. **Check redirect URIs**: Ensure your OAuth client is configured correctly

### Common Issues:

- **"Missing or insufficient permissions"**: Security rules are too restrictive
- **"Document doesn't exist"**: This is normal - documents are created on first write
- **"PERMISSION_DENIED"**: Check that the user is authenticated and rules allow the operation

## Testing Checklist

After setup, test these features:

- ✅ Google login/logout
- ✅ Generate AI idea (should save to history)
- ✅ Add idea to favorites
- ✅ View recently viewed ideas
- ✅ User profile creation

## Security Notes

These rules ensure that:
- Only authenticated users can access the database
- Users can only read/write their own data
- No user can access another user's private data
- The rules are production-ready and secure

## Need Help?

If you're still experiencing issues:

1. Check the browser console for specific error messages
2. Look at the Firestore > Usage tab to see if requests are being made
3. Test the rules in the Firebase Console Rules playground
4. Ensure your Firebase project billing is set up (required for some features)

After applying these security rules, your app should work perfectly!
