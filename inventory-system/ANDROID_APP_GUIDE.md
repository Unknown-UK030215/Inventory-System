# PSU Inventory Android App Setup Guide

This guide will help you convert your web app into a native Android APK that can be installed on any Android device.

## Prerequisites

Before starting, make sure you have these installed:

1. **Node.js & npm** - https://nodejs.org/ (you already have this)
2. **Android Studio** - https://developer.android.com/studio
3. **Java Development Kit (JDK)** - Android Studio includes this
4. **Android SDK** - Install via Android Studio SDK Manager

---

## Step 1: Open PowerShell with Execution Policy Bypass

Since your system has PowerShell execution policy restricted, we need to bypass it temporarily:

1. Press `Win + X` and select **Windows PowerShell (Admin)** or **Terminal (Admin)**
2. Navigate to your project folder:
   ```powershell
   cd "c:\Users\santo\Desktop\PSU-Inventory-system\PSU-Inventory\Inventory-System\inventory-system"
   ```
3. Bypass execution policy for this session:
   ```powershell
   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
   ```

---

## Step 2: Install Capacitor Dependencies

In the same PowerShell window, run:

```powershell
npm install @capacitor/core @capacitor/cli @capacitor/android
```

---

## Step 3: Build Your Web App

Build the production version of your app:

```powershell
npm run build
```

This creates the `dist` folder with your optimized web app.

---

## Step 4: Add Android Platform

```powershell
npx cap add android
```

---

## Step 5: Sync Your App

Every time you make changes to your web app, run:

```powershell
npm run build
npx cap sync
```

---

## Step 6: Open in Android Studio

```powershell
npx cap open android
```

This will launch Android Studio with your project.

---

## Step 7: Generate the APK in Android Studio

Once Android Studio opens:

1. **Wait for Gradle sync** to complete (look at bottom-right corner)
2. Go to **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
3. Wait for the build to finish
4. When done, click the **locate** link in the notification that pops up
5. Your APK file will be at:
   ```
   android/app/build/outputs/apk/debug/app-debug.apk
   ```

---

## Step 8: Install on Android Device

1. Copy the `app-debug.apk` file to your Android device
2. On your Android device, enable **Unknown Sources** in Settings → Security
3. Open the APK file and follow the installation prompts
4. The app will appear on your home screen like any other app!

---

## For Future Updates

Whenever you update your web app and want to create a new APK:

```powershell
# 1. Build your web app
npm run build

# 2. Sync to Android
npx cap sync

# 3. Open in Android Studio
npx cap open android

# 4. Build new APK in Android Studio
```

---

## Troubleshooting

**If you get PowerShell execution policy errors:**
- Always run: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` first

**If Gradle sync fails in Android Studio:**
- Make sure you have the latest Android SDK installed
- Check Android Studio SDK Manager (Tools → SDK Manager)

**If the app doesn't load correctly:**
- Make sure you ran `npm run build` before `npx cap sync`

---

## Creating a Release APK (Optional)

For a production-ready APK to distribute:

1. In Android Studio, go to **Build** → **Generate Signed Bundle / APK**
2. Select **APK** and click **Next**
3. Create a keystore file (save it securely!)
4. Fill in the details and build
5. Your release APK will be in:
   ```
   android/app/build/outputs/apk/release/
   ```
