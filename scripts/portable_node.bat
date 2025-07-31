@echo off
setlocal

set "NODE_URL=https://nodejs.org/dist/v22.17.1/node-v22.17.1-win-x64.zip"
set "NODE_ZIP=%~dp0node-v22.17.1-win-x64.zip"
set "NODE_DIR=%~dp0..\redistributable\node"
set "NODE_PATH=%NODE_DIR%\node.exe"

echo Setting up redistributable Node.js environment...

REM Create redistributable directory
if not exist "%~dp0..\redistributable" mkdir "%~dp0..\redistributable"

REM Download Node.js if it doesn't exist
if not exist "%NODE_PATH%" (
    echo.
    echo Downloading Node.js v22.17.1...
    powershell -Command "Invoke-WebRequest -Uri '%NODE_URL%' -OutFile '%NODE_ZIP%'"
    if %errorlevel% neq 0 (
        echo Failed to download Node.js
        pause
        exit /b 1
    )
    
    echo Extracting Node.js...
    powershell -Command "Expand-Archive -Path '%NODE_ZIP%' -DestinationPath '%~dp0temp_node' -Force"
    if %errorlevel% neq 0 (
        echo Failed to extract Node.js
        pause
        exit /b 1
    )
    
    echo Moving Node.js files...
    if not exist "%NODE_DIR%" mkdir "%NODE_DIR%"
    xcopy "%~dp0temp_node\node-v22.17.1-win-x64\*" "%NODE_DIR%" /e /i /h /y
    if %errorlevel% neq 0 (
        echo Failed to move Node.js files
        pause
        exit /b 1
    )
    
    echo Cleaning up temporary files...
    del "%NODE_ZIP%"
    rmdir /s /q "%~dp0temp_node"
)

echo.
echo Verifying Node.js installation...
"%NODE_PATH%" --version
if %errorlevel% neq 0 (
    echo Node.js verification failed
    pause
    exit /b 1
)

echo.
echo Portable Node.js environment setup completed.
echo Node.js has been installed in redistributable/node/
pause
