@echo off
echo ============================================
echo  MP Log Analyzer - Frontend (Next.js)
echo ============================================
cd /d "%~dp0frontend"

REM Install if needed
if not exist "node_modules" (
    echo Instalando dependencias npm...
    npm install
)

echo.
echo Iniciando Next.js en http://localhost:3000
echo Presiona Ctrl+C para detener.
echo.
npm run dev
