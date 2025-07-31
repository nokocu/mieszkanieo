@echo off
setlocal

set "PYTHON_URL=https://www.python.org/ftp/python/3.13.5/python-3.13.5-embed-amd64.zip"
set "PYTHON_ZIP=%~dp0python-3.13.5-embed-amd64.zip"
set "PYTHON_DIR=%~dp0..\redistributable\python"
set "PYTHON_PATH=%PYTHON_DIR%\python.exe"
set "REQUIREMENTS_PATH=%~dp0requirements.txt"

echo Setting up redistributable Python environment...

REM Create redistributable directory
if not exist "%~dp0..\redistributable" mkdir "%~dp0..\redistributable"

REM Download Python if it doesn't exist
if not exist "%PYTHON_PATH%" (
    echo.
    echo Downloading Python 3.13.5 embeddable...
    powershell -Command "Invoke-WebRequest -Uri '%PYTHON_URL%' -OutFile '%PYTHON_ZIP%'"
    if %errorlevel% neq 0 (
        echo Failed to download Python
        pause
        exit /b 1
    )
    
    echo Extracting Python...
    powershell -Command "Expand-Archive -Path '%PYTHON_ZIP%' -DestinationPath '%PYTHON_DIR%' -Force"
    if %errorlevel% neq 0 (
        echo Failed to extract Python
        pause
        exit /b 1
    )
    
    echo Cleaning up zip file...
    del "%PYTHON_ZIP%"
    
    echo Configuring Python path file...
    echo python313.zip> "%PYTHON_DIR%\python313._pth"
    echo Lib/site-packages>> "%PYTHON_DIR%\python313._pth"
    echo .>> "%PYTHON_DIR%\python313._pth"
    echo.>> "%PYTHON_DIR%\python313._pth"
    echo # Uncomment to run site.main() automatically>> "%PYTHON_DIR%\python313._pth"
    echo import site>> "%PYTHON_DIR%\python313._pth"
)

echo.
echo 1. Installing get-pip...
powershell -Command "Invoke-WebRequest -Uri 'https://bootstrap.pypa.io/get-pip.py' -OutFile '%PYTHON_DIR%\get-pip.py'"
"%PYTHON_PATH%" "%PYTHON_DIR%\get-pip.py"
if %errorlevel% neq 0 (
    echo Failed to install pip
    pause
    exit /b 1
)

echo.
echo 2. Upgrading pip...
"%PYTHON_PATH%" -m pip install --upgrade pip
if %errorlevel% neq 0 (
    echo Failed to upgrade pip
    pause
    exit /b 1
)

echo.
echo 3. Installing requirements from file...
"%PYTHON_PATH%" -m pip install -r "%REQUIREMENTS_PATH%"
if %errorlevel% neq 0 (
    echo Failed to install requirements
    pause
    exit /b 1
)

echo.
echo 4. Verifying installation...
"%PYTHON_PATH%" -c "import undetected_chromedriver; import selenium; import bs4; import requests; import websocket; print('All packages imported successfully!')"
if %errorlevel% neq 0 (
    echo Package verification failed
    pause
    exit /b 1
)
"%PYTHON_PATH%" -c "import undetected_chromedriver; import selenium; import bs4; import requests; import websocket; print('All packages imported successfully!')"
if %errorlevel% neq 0 (
    echo Package verification failed
    pause
    exit /b 1
)

echo.
echo Portable Python environment setup completed successfully
echo All required packages have been installed in redistributable/python/
pause
