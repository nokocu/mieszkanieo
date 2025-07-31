@echo off
setlocal

set "OUTPUT_DIR=%~dp0..\release-debug"
set "BACKEND_SRC=%~dp0..\backend"
set "VENV_SRC=%~dp0..\.venv"
set "REDISTRIBUTABLE_SRC=%~dp0..\redistributable"
set "TAURI_EXE=%~dp0..\src-tauri\target\debug\mieszkanieo.exe"
set "WEBVIEW_DLL=%~dp0..\src-tauri\target\debug\WebView2Loader.dll"

echo Preparing debug folder...

REM Clean output folder
if exist "%OUTPUT_DIR%" (
    echo Cleaning existing debug folder...
    rmdir /s /q "%OUTPUT_DIR%"
)
mkdir "%OUTPUT_DIR%"

REM Check if Tauri exe exists
if not exist "%TAURI_EXE%" (
    echo Error: Tauri debug executable not found at: %TAURI_EXE%
    echo Please run 'cargo tauri build --debug' or 'cargo tauri dev' first
    pause
    exit /b 1
)

REM Copy Tauri executable and DLL
echo Copying Tauri debug executable...
copy "%TAURI_EXE%" "%OUTPUT_DIR%\mieszkanieo.exe"
if %errorlevel% neq 0 (
    echo Failed to copy Tauri executable
    pause
    exit /b 1
)

if exist "%WEBVIEW_DLL%" (
    echo Copying WebView2Loader.dll...
    copy "%WEBVIEW_DLL%" "%OUTPUT_DIR%\WebView2Loader.dll"
    if %errorlevel% neq 0 (
        echo Failed to copy WebView2Loader.dll
        pause
        exit /b 1
    )
) else (
    echo WebView2Loader.dll not found, skipping...
)

REM Copy backend
echo Copying backend...
xcopy "%BACKEND_SRC%" "%OUTPUT_DIR%\backend" /e /i /h /y /q
if %errorlevel% neq 0 (
    echo Failed to copy backend
    pause
    exit /b 1
)

REM Copy venv if it exists
if exist "%VENV_SRC%" (
    echo Copying virtual environment...
    xcopy "%VENV_SRC%" "%OUTPUT_DIR%\.venv" /e /i /h /y /q
    if %errorlevel% neq 0 (
        echo Failed to copy virtual environment
        pause
        exit /b 1
    )
) else (
    echo Virtual environment not found, skipping...
)

REM Copy redistributable
if exist "%REDISTRIBUTABLE_SRC%" (
    echo Copying redistributable...
    xcopy "%REDISTRIBUTABLE_SRC%" "%OUTPUT_DIR%\redistributable" /e /i /h /y /q
    if %errorlevel% neq 0 (
        echo Failed to copy redistributable
        pause
        exit /b 1
    )
) else (
    echo Redistributable folder not found!
    pause
    exit /b 1
)

echo.
echo Debug folder prepared successfully at: %OUTPUT_DIR%
echo.
echo To run the debug build:
echo   cd "%OUTPUT_DIR%"
echo   mieszkanieo.exe
echo.
pause
