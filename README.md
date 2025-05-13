# CRM System

A modern Customer Relationship Management system built with Next.js, Firebase, and React.

## Features

- **User Authentication**: Secure login with Firebase Authentication
- **Dashboard**: Overview of customers, deals, and tasks
- **Customer Management**: Add, edit, and track customer information
- **Deal Pipeline**: Manage sales pipeline with deal tracking
- **Task Management**: Create, assign, and track tasks
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: Firebase Cloud Firestore
- **Database**: Firebase Cloud Firestore
- **Authentication**: Firebase Authentication
- **Form Handling**: React Hook Form + Zod validation

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- Firebase account

### Firebase Setup

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Set up Firebase Authentication with Email/Password method
4. Create a Cloud Firestore database
5. In Project Settings > General, scroll down to "Your apps" section
6. Click the Web icon "</>" to add a new web app
7. Register your app with a nickname (e.g., "CRM System")
8. Copy the Firebase configuration object

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/crm-system.git
   cd crm-system
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your environment variables:
   Create a `.env.local` file in the root directory with the following:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Firestore Security Rules

Add these rules to your Firestore database for basic security:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read and write their own documents
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null;
      allow update: if request.auth != null && request.auth.uid == userId;
    }
    
    // Only authenticated users can access data, and only their own data
    match /customers/{document=**} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    
    match /deals/{document=**} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    
    match /tasks/{document=**} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    
    match /notes/{document=**} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    
    match /contacts/{document=**} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}
```

## Project Structure

- `/src/app` - Next.js App Router pages and API endpoints
- `/src/components` - Reusable UI components
- `/src/contexts` - React context providers
- `/src/lib` - Firebase configuration and utility functions
- `/src/types` - TypeScript type definitions
- `/src/utils` - Helper functions and utilities

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Next.js team for the amazing framework
- Firebase team for the powerful backend-as-a-service
- Tailwind CSS for the utility-first styling approach 