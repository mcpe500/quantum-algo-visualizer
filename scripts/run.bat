@echo off
REM ============================================================
REM Quantum Algorithm Visualizer - Run Script (Windows)
REM ============================================================
REM Usage:
REM   run.bat              - Run both frontend and backend
REM   run.bat frontend     - Run frontend only
REM   run.bat backend      - Run backend only
REM ============================================================

setlocal enabledelayedexpansion

set "SCRIPT_DIR=%~dp0"
set "PROJECT_ROOT=%SCRIPT_DIR%.."
set "BACKEND_DIR=%PROJECT_ROOT%\backend"
set "FRONTEND_DIR=%PROJECT_ROOT%\frontend"
set "VENV_PYTHON=%PROJECT_ROOT%\venv\Scripts\python.exe"

if "%1"=="" goto :run_all
if "%1"=="frontend" goto :run_frontend
if "%1"=="backend" goto :run_backend
echo Unknown option: %1
echo Usage: run.bat [frontend^|backend]
exit /b 1

:run_all
echo ========================================
echo Starting Backend Server...
echo ========================================
start "Quantum Backend" cmd /k "cd /d %BACKEND_DIR% && %VENV_PYTHON% run.py"

echo Waiting 3 seconds for backend to start...
timeout /t 3 /nobreak > nul

echo ========================================
echo Starting Frontend Dev Server...
echo ========================================
start "Quantum Frontend" cmd /k "cd /d %FRONTEND_DIR% && bun run dev"

echo.
echo ========================================
echo Servers starting:
echo   Backend:  http://127.0.0.1:5000
echo   Frontend: http://localhost:5173
echo ========================================
echo.
echo Press Ctrl+C in each window to stop servers.
pause
goto :eof

:run_frontend
echo ========================================
echo Starting Frontend Dev Server...
echo ========================================
cd /d %FRONTEND_DIR%
bun run dev
goto :eof

:run_backend
echo ========================================
echo Starting Backend Server...
echo ========================================
cd /d %BACKEND_DIR%
%VENV_PYTHON% app.py
goto :eof
