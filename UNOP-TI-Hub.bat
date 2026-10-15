@echo off
setlocal EnableExtensions
title UNOP TI Hub - Panel de servicios
set "PORT=5173"
set "WEBAPP_DIR=%~dp0webapp"
set "WINDOW_TITLE=UNOP TI Hub - Servidor de desarrollo"

if /i "%~1"=="iniciar" goto :iniciar_y_salir
if /i "%~1"=="cerrar" goto :cerrar_y_salir
if /i "%~1"=="estado" goto :estado_y_salir

:menu
cls
echo ============================================
echo   UNOP TI Hub - Panel de servicios
echo ============================================
echo.
call :mostrar_estado
echo.
echo   1. Iniciar servidor
echo   2. Cerrar servidor
echo   3. Salir
echo.
set "OPCION="
set /p "OPCION=Selecciona una opcion (1/2/3): "

if "%OPCION%"=="1" goto :menu_iniciar
if "%OPCION%"=="2" goto :menu_cerrar
if "%OPCION%"=="3" goto :fin
goto :menu_invalida

:menu_iniciar
call :iniciar
goto :menu

:menu_cerrar
call :cerrar
goto :menu

:menu_invalida
echo.
echo Opcion invalida, intenta de nuevo.
echo.
pause
goto :menu

:iniciar_y_salir
call :iniciar
goto :eof

:cerrar_y_salir
call :cerrar
goto :eof

:estado_y_salir
call :mostrar_estado
goto :eof

:mostrar_estado
set "RUNNING=0"
for /f "tokens=5" %%p in ('netstat -aon ^| findstr ":%PORT% " ^| findstr "LISTENING"') do set "RUNNING=1"
if "%RUNNING%"=="1" goto :estado_activo
echo   Servidor de desarrollo, puerto %PORT%: DETENIDO
exit /b 0
:estado_activo
echo   Servidor de desarrollo, puerto %PORT%: EN EJECUCION
exit /b 0

:iniciar
set "YA_CORRIENDO=0"
for /f "tokens=5" %%p in ('netstat -aon ^| findstr ":%PORT% " ^| findstr "LISTENING"') do set "YA_CORRIENDO=1"
if not "%YA_CORRIENDO%"=="1" goto :iniciar_continuar
echo.
echo El servidor ya esta en ejecucion en el puerto %PORT%.
echo.
pause
exit /b 0

:iniciar_continuar
if exist "%WEBAPP_DIR%\node_modules" goto :iniciar_arrancar
echo.
echo No se encontraron dependencias instaladas en webapp\node_modules.
echo Instalando dependencias por primera vez, esto puede tardar unos minutos...
echo.
pushd "%WEBAPP_DIR%"
call npm install
popd

:iniciar_arrancar
echo.
echo Iniciando el servidor de desarrollo...
start "%WINDOW_TITLE%" cmd /k "cd /d "%WEBAPP_DIR%" && npm run dev"
echo Esperando a que el servidor este listo...
timeout /t 4 /nobreak >nul
start "" "http://localhost:%PORT%/"
echo.
echo Servidor iniciado en una ventana aparte, titulo: %WINDOW_TITLE%
echo Abierto en http://localhost:%PORT%/
echo.
pause
exit /b 0

:cerrar
echo.
set "FOUND=0"
for /f "tokens=5" %%p in ('netstat -aon ^| findstr ":%PORT% " ^| findstr "LISTENING"') do call :cerrar_pid %%p
if "%FOUND%"=="1" goto :cerrar_ok
echo No hay ningun servidor en ejecucion en el puerto %PORT%.
goto :cerrar_fin
:cerrar_ok
echo Servidor detenido correctamente.
:cerrar_fin
echo.
pause
exit /b 0

:cerrar_pid
echo Cerrando servidor, PID %1, puerto %PORT%...
taskkill /F /T /PID %1 >nul 2>&1
set "FOUND=1"
exit /b 0

:fin
echo.
echo Cerrando el panel...
endlocal
exit /b 0
