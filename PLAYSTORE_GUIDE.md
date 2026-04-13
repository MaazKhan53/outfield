# Outfield — Google Play Store Packaging Guide (TWA)

This guide walks through packaging the Outfield PWA (`outfield-weld.vercel.app`) as a
**Trusted Web Activity (TWA)** for the Google Play Store using Bubblewrap.

---

## Prerequisites

- Node.js 18+ and npm installed
- Java JDK 17+ installed (`java -version` to verify)
- Android SDK Command-line Tools (or Android Studio)
- A Google Play Developer account ($25 one-time fee)

---

## Step 1 — Install Bubblewrap

```bash
npm install -g @bubblewrap/cli
```

Verify:
```bash
bubblewrap --version
```

---

## Step 2 — Initialise the TWA project

Create a new directory outside this repo for the Android project:

```bash
mkdir outfield-twa && cd outfield-twa
bubblewrap init --manifest https://outfield-weld.vercel.app/Manifest.json
```

Bubblewrap will read the PWA manifest and prompt you for a few values.
Use the following answers:

| Prompt | Value |
|---|---|
| Application ID (package name) | `com.outfield.app` |
| App name | `Outfield` |
| Short name | `Outfield` |
| Host (domain) | `outfield-weld.vercel.app` |
| Start URL | `/` |
| Version code | `1` |
| Version name | `1.0.0` |
| Signing key path | *(accept default or provide your keystore path)* |
| Signing key alias | `outfield` |

---

## Step 3 — Generate / configure the signing keystore

If you don't have a keystore yet, generate one:

```bash
keytool -genkeypair \
  -alias outfield \
  -keyalg RSA \
  -keysize 2048 \
  -validity 9125 \
  -keystore outfield-release.jks
```

Keep this file safe — you need it for every future update.

---

## Step 4 — Build the signed APK / AAB

```bash
# Build a release Android App Bundle (preferred by Play Store)
bubblewrap build

# This produces:
#   app-release-bundle.aab   ← upload this to Play Console
#   app-release-signed.apk   ← use for sideload testing
```

If prompted for keystore credentials, enter the password you set in Step 3.

---

## Step 5 — Add the Digital Asset Links file (domain verification)

For the TWA to work without the browser URL bar, Google must verify that your
domain trusts the Android app.

### 5a — Get your app's SHA-256 fingerprint

```bash
keytool -list -v \
  -alias outfield \
  -keystore outfield-release.jks \
  | grep "SHA256"
```

Copy the value — it looks like:
`AB:CD:EF:12:34:56:78:90:...` (32 colon-separated hex pairs)

### 5b — Create the Asset Links file

Create `public/.well-known/assetlinks.json` in this repository with the
following content, replacing `YOUR_SHA256_HERE` with your fingerprint
(remove the colons — Play Console expects a lowercase hex string):

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.outfield.app",
      "sha256_cert_fingerprints": [
        "YOUR_SHA256_HERE"
      ]
    }
  }
]
```

**Example fingerprint format:**
`"AB:CD:EF:..." → "abcdef..."` — lowercase, no colons.

### 5c — Make the file publicly accessible

Vercel automatically serves everything in `public/` at the root path, so
once you push this file to GitHub the asset link will be live at:

```
https://outfield-weld.vercel.app/.well-known/assetlinks.json
```

Verify it loads in a browser before submitting to the Play Store.

---

## Step 6 — Upload to Google Play Console

1. Go to https://play.google.com/console
2. Create a new app → **Outfield** → App → Free → Pakistan (or All countries)
3. Navigate to **Release → Production → Create new release**
4. Upload `app-release-bundle.aab`
5. Fill in the store listing (description, screenshots, privacy policy URL)
6. Submit for review

---

## Step 7 — Verify the TWA is working (no URL bar)

After installing the APK from step 4 on a test device:

1. Open the app
2. If the browser URL bar is visible, the Digital Asset Links file is not being
   found — double-check the SHA-256 fingerprint and that the file is accessible
   at `https://outfield-weld.vercel.app/.well-known/assetlinks.json`
3. Once verified, the app launches in full-screen with no browser chrome

---

## Quick-reference commands

```bash
# Install bubblewrap
npm install -g @bubblewrap/cli

# Initialise (run once in the outfield-twa/ directory)
bubblewrap init --manifest https://outfield-weld.vercel.app/Manifest.json

# Build release AAB + APK
bubblewrap build

# Validate asset links are correct
bubblewrap validate
```

---

## Key values for this project

| Property | Value |
|---|---|
| Package name | `com.outfield.app` |
| Domain | `outfield-weld.vercel.app` |
| Manifest URL | `https://outfield-weld.vercel.app/Manifest.json` |
| Asset links path | `public/.well-known/assetlinks.json` |
| Min Android API | 19 (Android 4.4) |
| Target Android API | 34 (Android 14) |
