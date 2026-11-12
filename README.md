# haheho-mobile

Capacitor native shell for the Haheho patient/caregiver apps. Each app is a native iOS/Android
binary whose WebView loads the Django-served UI (currently **https://dev.haheho.ai** for test builds —
see "Changing the domain" below).

This repo builds **two store apps from the same code** — see "Two apps" below.

- **Bundle ID / package name:** `ai.haheho.app` (permanent after first store upload)
- **Display name:** Haheho AI
- **Scope of this repo at Step 2:** shell only. Push (Step 4 JIRA), local reminders (Step 5),
  native auth (Step 6) land later as plugins in this same repo.

---

## 0. Prerequisites (build machine)

- macOS with **Xcode 15+** (App Store version is fine) and command line tools
- **CocoaPods**: `sudo gem install cocoapods` (or `brew install cocoapods`)
- **Node 20+**
- **Android Studio** (for the Android build; can be done later or on another machine)
- A physical iPhone with a cable for on-device testing

> The Apple Developer *organization* account (Step 1 doc) is **not** required to run on a test
> device — Xcode's free "Personal Team" signing works for development. The org account is needed
> for TestFlight and store submission.

## 1. Install dependencies

```bash
npm install
```

If npm reports that a `@capacitor/*@^8.0.0` version cannot be resolved, install latest explicitly:

```bash
npm install @capacitor/core@latest @capacitor/ios@latest @capacitor/android@latest @capacitor/splash-screen@latest
npm install -D @capacitor/cli@latest @capacitor/assets@latest
```

## 2. Generate the native projects

```bash
npx cap add ios
npx cap add android
```

This creates `ios/` and `android/` — **commit both** to git. They are real native projects we own
and will edit (permissions now; push/auth plugins later).

## 3. iOS permissions (required for voice + QR)

Open `ios/App/App/Info.plist` and add inside the top-level `<dict>`:

```xml
<key>NSMicrophoneUsageDescription</key>
<string>Haheho AI uses the microphone so you can talk with your care agent.</string>
<key>NSCameraUsageDescription</key>
<string>Haheho AI uses the camera to scan QR codes for sign-in.</string>
```

(Korean localization of these strings via `InfoPlist.strings` is a later polish item; the English
strings are sufficient for development and review.)

## 4. Android permissions

Open `android/app/src/main/AndroidManifest.xml` and add alongside the existing
`<uses-permission android:name="android.permission.INTERNET" />`:

```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
<uses-permission android:name="android.permission.CAMERA" />
```

## 5. App icon & splash

Place two source images in `assets/`:

- `assets/icon.png` — 1024×1024, no transparency, no rounded corners (stores apply masking)
- `assets/splash.png` — 2732×2732, logo centered, generous margins

Then:

```bash
npx capacitor-assets generate
```

## 6. Sync config into the native projects

```bash
npx cap sync
```

Run this again any time `capacitor.config.ts` or installed plugins change.

## 7. Run on iOS

```bash
npx cap open ios
```

In Xcode: select the **App** target → *Signing & Capabilities* → choose a team (Personal Team is
fine pre-Step-1) → select your plugged-in iPhone → **Run**. First run on a personal team requires
trusting the developer profile on the phone (Settings → General → VPN & Device Management).

## 8. Run on Android

```bash
npx cap open android
```

Run on a device or emulator from Android Studio.

---

## Step 2 verification checklist (the milestone)

- [ ] App launches, splash shows, and lands on the site's login page
- [ ] Email/password login succeeds; post-login navigation works normally
- [ ] **Session persists**: force-quit the app, relaunch → still logged in (cookie retained)
- [ ] **Voice agent turn**: mic permission prompt appears once; a full STT → LLM → TTS turn
      records and plays back
- [ ] **QR sign-in** (if exposed on the login page): camera permission prompt appears; scan works
- [ ] User agent contains `HahehoApp/0.1` (verify in Django access logs — this is how the backend
      will detect the native app)

## Expected failures at this stage — do not debug

- **Google login fails inside the app.** Google blocks OAuth in embedded WebViews. This is fixed
  by native sign-in in Step 6 (JIRA) — not a bug in the shell.
- **Offline shows a WebView error page.** Polished offline handling is Step 8 (store readiness).
- **No push notifications.** Step 4.

## Two apps

| | Haheho AI | Inpatient AI Agent / 병동 AI 에이전트 |
|---|---|---|
| For | All programs | Hospital inpatients only |
| App ID | `ai.haheho.app` | `ai.haheho.inpatient` (**confirm before first upload — permanent after**) |
| User agent | `… HahehoApp/0.1` | `… HahehoApp/0.1 HahehoInpatient` |

Both load the same site and share everything native: permissions, plugins, `MainActivity` /
`HahehoBridgeViewController`, and `capacitor.config.ts` (server URL, base user agent, splash).
The offline page (`www/offline.html`, shown when the site can't load) is shared too; its "Try again"
target is filled in from `server.url` on every `npx cap sync` (`scripts/set-offline-server-url.mjs`).
A fix in any of those applies to both apps. Only these differ per app (incl. launch/splash screen):

- **Android** — product flavors `haheho` / `inpatient` in `android/app/build.gradle` (app ID +
  `USER_AGENT_TAG`). Names/icons: `src/main/res` is the Haheho AI default; the inpatient app
  overrides them in `android/app/src/inpatient/res` (`values/` English, `values-ko/` Korean).
- **iOS** — one Xcode target per app: `App` (Haheho AI) and `Inpatient`. Both compile the same
  Swift files, storyboard, Info.plist and web assets. Per target: `PRODUCT_BUNDLE_IDENTIFIER`,
  `HAHEHO_DISPLAY_NAME`, `HAHEHO_USER_AGENT_TAG`, app icon (`AppIcon` / `AppIcon-Inpatient` in
  `Assets.xcassets`). Inpatient's Korean name and permission texts: `ios/App/Inpatient/*.lproj/InfoPlist.strings`.

### Build commands — Android

```bash
npm run android:haheho          # build + install Haheho AI on the running emulator/phone
npm run android:inpatient       # build + install Inpatient AI Agent (installs alongside)
npm run release:android:haheho     # store bundle → android/app/build/outputs/bundle/hahehoRelease/
npm run release:android:inpatient  # store bundle → android/app/build/outputs/bundle/inpatientRelease/
```

In Android Studio: **View → Tool Windows → Build Variants** → pick `hahehoDebug` or
`inpatientDebug`, then ▶ Run. Release bundles need a signing key before the Play Console accepts them.

### Build commands — iOS

```bash
npx cap sync ios && npx cap open ios
```

In Xcode, pick the **App** or **Inpatient** scheme at the top, then a simulator/iPhone → ▶ Run.
For the store: select the scheme → **Product → Archive** (needs the Apple developer team set under
Signing & Capabilities for that target).

Icon source for the inpatient app: `assets/inpatient/icon.png`. Splash screens: Android
`android/app/src/inpatient/res/drawable*/splash.png`, iOS `ios/App/Inpatient/Splash.xcassets`
(Haheho AI's iOS splash is in `ios/App/App/Splash.xcassets`).

## Push notifications

Plugin: `@capacitor-firebase/messaging` (what the backend's `haheho-native.js` expects — not the stock
`@capacitor/push-notifications`). Firebase project: **haheho-mobile-temp**, the one the server's FCM key
(`FCM_SECRET_NAME`) belongs to — every app must be registered in that same project.

| | Haheho AI (`ai.haheho.app`) | Inpatient (`ai.haheho.inpatient`) |
|---|---|---|
| Android `android/app/google-services.json` | ✅ | ❌ not registered yet |
| iOS `GoogleService-Info.plist` | ❌ | ❌ |

- **Android:** one `google-services.json` lists all registered apps. After registering a new app in
  Firebase, re-download it and replace the file. An app missing from it still builds, with push off
  (Gradle prints "push disabled in …").
- **iOS:** one `GoogleService-Info.plist` per app — `ios/App/App/` (Haheho AI) and `ios/App/Inpatient/`
  (inpatient), each added to its own target's resources. Without it the app runs normally and logs
  "Firebase was not configured". Push also needs the APNs key uploaded in Firebase (Project settings →
  Cloud Messaging) and a signing team set in Xcode (entitlements: `App/App.entitlements`,
  `Inpatient/Inpatient.entitlements`).
- Status-bar icon/colour (Android): `res/drawable*/ic_notification`, `res/values/notification.xml`
  (inpatient overrides in `src/inpatient/res`).

## Changing the domain later

1. Edit `server.url` in `capacitor.config.ts`
2. `npx cap sync`
3. Rebuild both platforms

## Note for the accounts team (Step 1 doc)

The Firebase app registrations need these exact values:

- iOS bundle ID: `ai.haheho.app`
- Android package name: `ai.haheho.app`
