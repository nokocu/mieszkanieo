# python runtime setup for electron
import os
import sys
import subprocess
from pathlib import Path

def setup_python_environment():
    """setup python environment for electron app"""
    
    # check if we're in development or production
    if getattr(sys, 'frozen', False):
        # production - bundled executable
        app_path = Path(sys.executable).parent
        python_path = app_path / "python" / "python.exe"
    else:
        # development - use system python or venv
        app_path = Path(__file__).parent
        venv_python = app_path.parent / ".venv" / "Scripts" / "python.exe"
        
        if venv_python.exists():
            python_path = venv_python
        else:
            python_path = "python"
    
    return str(python_path)

def install_requirements():
    """install python requirements if needed"""
    python_path = setup_python_environment()
    requirements_file = Path(__file__).parent / "requirements.txt"
    
    if requirements_file.exists():
        try:
            subprocess.check_call([
                python_path, "-m", "pip", "install", "-r", str(requirements_file)
            ])
            print("python requirements installed successfully")
        except subprocess.CalledProcessError as e:
            print(f"failed to install requirements: {e}")

def get_python_executable():
    """get the python executable path for the current environment"""
    return setup_python_environment()

if __name__ == "__main__":
    print(f"python executable: {get_python_executable()}")
