@echo off
REM Run the GPS tracking system: backend, frontend, and optional Java dashboard.

REM Change to repository root (same folder as this batch file).
cd /d "%~dp0"

REM Ensure backend environment is present.
if not exist backend\.env (
    echo Creating backend\.env from .env.example
    copy backend\.env.example backend\.env > nul
    echo Please edit backend\.env and set MONGODB_URI and JWT_SECRET_KEY before running.
)

REM Start backend server in a new command window.
start "GPS Backend" cmd /k "cd /d "%~dp0backend" && python app.py"

REM Start frontend static server in a new command window.
start "Frontend Server" cmd /k "cd /d "%~dp0frontend" && python -m http.server 8000"

REM Open browser to the frontend on this laptop.
start "" "http://10.171.58.245:8000"

echo.
echo =======================================================
echo  SYSTEM STARTED SUCCESSFULLY
echo =======================================================
echo  LAPTOP ACCESS: http://10.171.58.245:8000
echo  MOBILE ACCESS: http://10.171.58.245:8000
echo.
echo  Note: Ensure your phone is on the same hotspot network.
echo =======================================================
echo.

REM Optional: launch Java dashboard if Maven is installed.
echo If you want to launch the Java dashboard, run:
echo   cd /d "%~dp0java-dashboard" ^&^& mvn clean compile javafx:run
echo.
echo Backend and frontend are starting. Close this window to stop.
pause
