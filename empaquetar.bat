@echo off
setlocal

set "PROYECTO=DeployAthena"
set "DIR=%~dp0"

echo.
echo  =============================================
echo   Empaquetando %PROYECTO%
echo  =============================================
echo.

for /f "delims=" %%T in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd_HHmmss"') do set "FECHA=%%T"

set "SALIDA=%DIR%..\%PROYECTO%_%FECHA%.tar.gz"
echo  Destino: %SALIDA%
echo.

pushd "%DIR%"
tar -czf "%SALIDA%" --exclude="./logs" --exclude="./state.json" --exclude="./empaquetar.bat" .
popd

if %ERRORLEVEL% neq 0 (
  echo.
  echo  ERROR al crear el archivo.
  pause
  exit /b 1
)

for /f "delims=" %%S in ('powershell -NoProfile -Command "$s=[math]::Round((Get-Item '%SALIDA:\=\\%').Length/1MB,1);Write-Host $s"') do set "SIZE=%%S"

echo.
echo  Listo! Tamano: %SIZE% MB
echo  Archivo: %SALIDA%
echo.
echo  NOTA: state.json y logs/ NO se incluyen (inicio limpio).
echo.
pause
endlocal
