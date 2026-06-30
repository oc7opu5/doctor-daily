@echo off
echo ===================================
echo    Doctor Daily - Starting...
echo ===================================

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo Python not found! Install from https://python.org
    pause
    exit /b 1
)

REM Create virtual environment if not exists
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate venv
call venv\Scripts\activate.bat

REM Install dependencies
echo Installing dependencies...
pip install -r requirements.txt -q

REM Install Node.js dependencies and build frontend
echo Building frontend...
cd frontend
if not exist "node_modules" (
    npm install
)
npm run build
cd ..

REM Copy .env if not exists
if not exist ".env" (
    copy .env.example .env
    echo Created .env from .env.example
    echo Edit .env to set your SECRET_KEY!
)

REM Start server
echo.
echo Starting Doctor Daily on http://localhost:29876
echo Press Ctrl+C to stop
echo.
python -m uvicorn server.main:app --host 0.0.0.0 --port 29876 --reload
pause
