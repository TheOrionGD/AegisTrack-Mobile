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

REM Read variables from backend\.env
for /f "usebackq tokens=1,2 delims==" %%A in ("backend\.env") do (
    if "%%A"=="SYSTEM_IPV4" set SYSTEM_IPV4=%%B
    if "%%A"=="PORT" set PORT=%%B
)

REM Fallback defaults if not found in .env
if "%SYSTEM_IPV4%"=="" set SYSTEM_IPV4=10.171.58.245
if "%PORT%"=="" set PORT=8000

REM Start frontend static server in a new command window.
start "Frontend Server" cmd /k "cd /d "%~dp0frontend" && python -m http.server %PORT%"

REM Open browser to the frontend on this laptop.
start "" "http://%SYSTEM_IPV4%:%PORT%"

echo.
echo =======================================================
echo  SYSTEM STARTED SUCCESSFULLY
echo =======================================================
echo  LAPTOP ACCESS: http://%SYSTEM_IPV4%:%PORT%
echo  MOBILE ACCESS: http://%SYSTEM_IPV4%:%PORT%
echo.
echo  Note: Ensure your phone is on the same hotspot network.
echo =======================================================
echo.

REM Launch Java dashboard automatically.
start "Java Dashboard" cmd /k "cd /d "%~dp0java-dashboard" && mvn clean compile javafx:run"
echo.
echo Backend and frontend are starting. Close this window to stop.
pause
