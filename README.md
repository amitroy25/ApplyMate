# ApplyMate — Personal Job Application Assistant

ApplyMate is a mobile-first Progressive Web App (PWA) for turning job-post screenshots into reviewed, personalized email applications. The immediate goal is to make it practical to apply to 15–20 suitable jobs a day.

---

## 📱 Implemented Screens & User Flow

The app includes the following screens:

1. **Screen 1 — Welcome / Onboarding (`WelcomeScreen.tsx`)**
   - Brand logo and tagline: *"Turn job posts into applications in seconds."*
   - Illustrated document sheet graphic with paper airplane.
   - Highlights: Screenshot extraction, professional email preparation, and application tracking.
   - **Get Started** button leading into the main app.

2. **Screen 2 — Home (`HomeScreen.tsx`)**
   - Header with brand mark and settings gear icon.
   - Personalized greeting: *"Good Morning, Amit! 👋"*
   - Daily sent count against the configured application target, plus pending and interview counts.
   - **Apply for a job** upload card with dotted dropzone and native device file picker (supports PNG/JPEG/WebP + sample test post toggle).
   - **My Resume** status card and profile shortcut for uploading a PDF.
   - **Recent Applications** list with status badges and quick view.
   - Bottom navigation bar: Home, History, Profile.

3. **Screen 3 — Screenshot Upload (`UploadScreen.tsx`)**
   - High-fidelity preview of the LinkedIn post screenshot (or uploaded image from user gallery).
   - Actions to **Replace Image** or **Remove**.
   - Crop, zoom, or rotate uploaded screenshots before OCR; optional Gemini cleanup runs when a key is configured.
   - **Extract Job Details →** primary CTA with progress and actionable retry/continue options if extraction fails.

4. **Screen 4 — Extracted Job Details (`ExtractedDetailsScreen.tsx`)**
   - Success banner: *"✓ Job details extracted successfully!"*
   - Editable fields: Company, Job Title, Recruiter Email, Location, Experience, Skills tags, Job Description, and Application Instructions.
   - Missing email detection with warning banner and candidate email picker.
   - In-app modal editor for modifying any extracted detail.
   - **Continue to Email →** button.

5. **Screen 5 — Email Review (`ReviewEmailScreen.tsx`)**
   - Recipient email input (`careers@startupx.com`).
   - Subject line (`Application for Software Engineer (Backend) Role`).
   - Editable email body pre-populated with matched skills and user signature.
   - PDF resume chip backed by the user's private Supabase file, with removal and re-attachment controls.
   - **Send Application** primary CTA.

6. **Screen 6 — Confirm & Send Modal (`ConfirmSendModal.tsx`)**
   - Clean confirmation bottom sheet.
   - Summary of Company, Role, Recipient, and Attached Resume file.
   - Prevents double-click submissions while a send is in progress and shows sending state.

7. **Screen 7 — Application Sent Success (`SuccessScreen.tsx`)**
   - Celebratory green check badge and animated confetti burst (`canvas-confetti`).
   - Sent confirmation details with timestamp and recipient address.
   - Actions: **View in History** and **Apply for Another Job**.

8. **Screen 8 — Application History (`HistoryScreen.tsx` & `ApplicationDetailModal.tsx`)**
   - Search bar filtering by company, role, or recruiter email.
   - Status tabs for sent, sending, failed, uncertain, pending, interview, and no reply records.
   - Full detail modal to view past applications, read sent emails, update application status, or delete records.

9. **Screen 9 — Profile (`ProfileScreen.tsx`)**
   - User identity: Amit Roy (`amit.roy@gmail.com`).
   - Role, phone, skills, and saved resume management with file replacement.
   - Connected accounts status: Gmail OAuth indicator.
   - Edit profile modal for updating user information.

10. **Screen 10 — Settings (`SettingsScreen.tsx`)**
    - Gmail OAuth connection controls.
    - Default email signature editor.
    - Default application email template editor with dynamic tokens (`{role}`, `{company}`, `{matched_skills}`, `{signature}`).
    - Daily application goal stepper.
    - Notification preferences.

---

## 🛠️ Project Structure

```text
c:\Users\amitr\Downloads\project
├── public/
│   ├── favicon.svg
│   ├── icon.svg                     # PWA vector app icon
│   └── manifest.json                # Android PWA Web App Manifest
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Badge.tsx            # Status pills (Sent, Pending, Interview, etc.)
│   │   │   ├── BottomNav.tsx        # Persistent mobile navigation
│   │   │   ├── HeaderBar.tsx        # Responsive app header
│   │   │   └── MobileContainer.tsx  # Device viewport wrapper & status bar
│   │   ├── modals/
│   │   │   └── ApplicationDetailModal.tsx # Application history viewer & status manager
│   │   └── screens/
│   │       ├── ConfirmSendModal.tsx # Screen 6 confirmation modal
│   │       ├── ExtractedDetailsScreen.tsx # Screen 4 extracted details
│   │       ├── HistoryScreen.tsx    # Screen 8 application tracker
│   │       ├── HomeScreen.tsx       # Screen 2 main home dashboard
│   │       ├── ProfileScreen.tsx    # Screen 9 user profile & resume
│   │       ├── ReviewEmailScreen.tsx# Screen 5 email composer
│   │       ├── SettingsScreen.tsx   # Screen 10 preferences
│   │       ├── SuccessScreen.tsx    # Screen 7 celebration & confetti
│   │       ├── UploadScreen.tsx     # Screen 3 screenshot preview
│   │       └── WelcomeScreen.tsx    # Screen 1 onboarding
│   ├── mock/
│   │   └── initialData.ts           # Realistic mock data matching design mockups
│   ├── styles/
│   │   └── index.css                # CSS design system (tokens, cards, responsive frames)
│   ├── types/
│   │   └── index.ts                 # TypeScript interfaces and data models
│   ├── App.tsx                      # Root screen controller & workflow state machine
│   └── main.tsx                     # React 18 DOM root
├── index.html                       # HTML5 entry with mobile meta tags & font imports
├── package.json                     # Dependencies & build scripts
├── tsconfig.json                    # TypeScript compiler configuration
├── tsconfig.node.json
└── vite.config.ts                   # Vite bundler configuration
```

---

## 🚀 How to Run

1. **Install dependencies** (if not already installed):
   ```powershell
   npm install
   ```

2. **Start the local development server**:
   ```powershell
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

3. **Run Unit Tests**:
   ```powershell
   npm test
   ```

4. **Production build**:
   ```powershell
   npm run build
   ```

---

## 🔐 Configure Gmail and Supabase

Users sign up or sign in from the app's welcome screen with **Continue with Google**. The same Google authorization grants access to their personal workspace and, after explicit consent, Gmail send permission. The app uses Supabase Auth, Postgres for profile/settings/application data, and a private Supabase Storage bucket for PDF resumes. The app owner configures the shared Supabase/Google OAuth project once; each user then authorizes their own Google account in the app. Sending and persistence require the owner's external project setup; without it, sending is blocked rather than simulated.

### Simple setup for a small team (up to 5 people)

**The app owner does the Supabase and Google Cloud setup below once.** Every user does not need a Supabase account, dashboard access, API key, or separate Supabase project. Once the app is configured and hosted, a user opens the app, signs in with their own Google account, uploads their resume once, and then uses the screenshot → review → send flow. Their profile, resume, settings, and application history are scoped to their own account by row-level security.

If Google's OAuth consent screen is still in **Testing** mode, the app owner adds each of the five Google email addresses to the OAuth audience's **Test users** list once. After that, those users sign in through the app; they do not revisit Supabase or Google Cloud setup. For users beyond the test allowlist, Google may require publishing and verifying the OAuth app before Gmail send permission is available.

For production, the owner deploys this app once and adds the hosted app URL to the Supabase and Google OAuth redirect configuration. Users share that one app URL; do not give users the Supabase project dashboard or keys.

1. Create one Supabase project and one Google OAuth web client in Google Cloud. Enable the Gmail API and configure the OAuth consent screen. While the consent screen is in testing mode, add your account and each of your five users once as test users.
2. In Supabase **Authentication → Providers → Google**, enable Google and enter the OAuth client ID and client secret. In **Authentication → URL Configuration**, set the local site URL to `http://localhost:3000` and allow `http://localhost:3000/**` as a redirect URL. The Google OAuth client's redirect URI must be `https://<your-project-ref>.supabase.co/auth/v1/callback`.
3. Run [`supabase/migrations/202610240001_initial_jobapply.sql`](./supabase/migrations/202610240001_initial_jobapply.sql) in the Supabase SQL editor. It creates the tables, per-user row-level security policies, and a private `resumes` bucket.
4. Copy `.env.example` to `.env.local` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from **Project Settings → API**. These are the project URL and publishable/anon key. **Never put a Supabase service-role key or Google client secret in a `VITE_` variable.**
5. Restart Vite and open the app. Select **Sign up or sign in with Google** and grant the requested permissions. New Google users get an account on first authorization. Upload your PDF from the Profile screen before sending.

Google may require OAuth app verification before allowing Gmail scopes for general users. This setup is intended for your own test account; complete Google's verification requirements before opening access to other users and configure production redirect URLs.

### Sending and token handling

The browser uses a short-lived Google access token from the Supabase OAuth session and calls Gmail only after you confirm the final recipient, subject, body, and resume attachment. ApplyMate does not save Google refresh tokens in its tables. If Gmail authorization expires, reconnect from Settings. The resume remains in private storage and is downloaded only for the current send.

Before calling Gmail, the app saves an application as `Sending`. A successful Gmail response updates it to `Sent` and stores the Gmail message ID; a reported failure updates it to `Failed` and displays the error. If the connection drops while sending or Gmail responds without a message ID, the record is marked `Unknown` and the app tells you to check Gmail Sent before retrying. If Gmail sends but Supabase cannot record the final status, the success screen warns that the history record may need attention.

### Implemented

* OCR text recognition and parsing, optional Gemini cleanup, and editable generated email drafts.
* Android PWA screenshot sharing through the installed app, with in-browser crop, zoom, rotation, OCR, and job-detail review.
* Supabase Google OAuth, per-user Postgres data, and private PDF resume storage (requires setup above).
* Confirmed Gmail API sending with a PDF MIME attachment, plain-text and formatted HTML email alternatives, and explicit sending/sent/failed states.
* Responsive full-height phone layout with dynamic viewport and safe-area support.
* Daily sent count, with a default target of 20 applications.

### Share a screenshot from Android

1. Deploy the app over HTTPS. The Web Share Target requires a supported browser and an installed PWA; a normal browser tab may not appear in Android's share sheet.
2. Open the deployed app in Chrome on Android, sign in, then choose Chrome's **Install app** / **Add to Home screen** option. Launch ApplyMate once after installing so its service worker can take control.
3. In Photos, Gallery, LinkedIn, or another app, choose a screenshot and tap **Share → ApplyMate**. ApplyMate opens the screenshot in its crop editor. Adjust the crop, zoom, or rotation, then extract and review the detected details before preparing an email.
4. If ApplyMate is not listed in the share sheet, open the installed app once and try again. You can always choose **Replace Image** in ApplyMate to upload manually.

Shared screenshots are limited to PNG, JPEG, or WebP and 15 MB. The service worker stores a temporary copy in that browser's IndexedDB and removes expired copies after 24 hours; the app deletes a consumed copy after loading it. Sharing requires the installed PWA, browser support, and a service worker controlling the app. Verify the share-sheet flow on the target Android device after deployment; desktop build checks cannot confirm device-specific share behavior.

### Remaining before public launch

* Add integration tests using a Supabase test project and Google OAuth test account.
* Decide whether public multi-user launch needs a server-side Gmail send/token design for reliable token refresh.
* Add production URLs, Google's OAuth verification, monitoring, and recovery for uncertain network outcomes.
