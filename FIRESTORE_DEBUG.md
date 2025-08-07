# Firestore Rules Debug Guide

## Step 1: Test with Open Rules First

**TEMPORARILY** apply these very permissive rules to test if basic operations work:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to all authenticated users
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**Apply these rules and test:**
1. Login with test@example.com
2. Try saving a favorite
3. Generate an AI idea
4. Check browser console for errors

If this works, the issue is with our secure rules syntax.
If this fails, there's a deeper authentication or Firebase config issue.

## Step 2: If Open Rules Work, Apply Secure Rules

**Then replace with the secure rules:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, update, delete: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null;
    }

    match /favorites/{favoriteId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }

    match /generation_history/{historyId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }

    match /recently_viewed/{viewId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}
```

## Debug Info Added
I've added debug logging to see:
- User authentication state
- Document paths being created
- Data structures being written
- Exact userId values

Check the browser console after applying rules to see detailed debug info.

## Common Issues to Check
1. **Rule Propagation**: Wait 30-60 seconds after publishing rules
2. **Authentication Timing**: Make sure user is fully authenticated before operations
3. **Document Structure**: Verify userId field is properly set
4. **Collection Names**: Check that collection names match exactly
5. **Document IDs**: Verify document ID patterns match rule patterns
