@echo off
echo ========================================
echo PSU Inventory Android App Setup
echo ========================================
echo.

echo [1/5] Installing dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo Dependencies installed successfully!
echo.

echo [2/5] Building web app...
call npm run build
if errorlevel 1 (
    echo ERROR: Failed to build web app
    pause
    exit /b 1
)
echo Web app built successfully!
echo.

echo [3/5] Adding Android platform...
call npx cap add android
if errorlevel 1 (
    echo ERROR: Failed to add Android platform
    pause
    exit /b 1
)
echo Android platform added successfully!
echo.

echo [4/5] Syncing app...
call npx cap sync
if errorlevel 1 (
    echo ERROR: Failed to sync app
    pause
    exit /b 1
)
echo App synced successfully!
echo.

echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Run "npx cap open android" to open in Android Studio
echo 2. In Android Studio, go to Build -^> Build Bundle(s) / APK(s) -^> Build APK(s)
echo.
pause
