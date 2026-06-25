@echo off
echo ============================================
echo  EOL Log Analyzer - Backend (FastAPI)
echo  Lineas soportadas: MP, DS, 31XX
echo ============================================
cd /d "%~dp0backend"

REM Create venv if it doesn't exist
if not exist ".venv" (
    echo Creando entorno virtual...
    python -m venv .venv
)

REM Activate and install
call .venv\Scripts\activate.bat

echo Instalando dependencias...
pip install -r requirements.txt -q

echo.
echo Iniciando FastAPI en http://localhost:8000
echo Presiona Ctrl+C para detener.
echo.
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
