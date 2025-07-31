"""
ChromeDriver compatibility and auto-update service
"""

import subprocess
import json
import os
import sys
import tempfile
import zipfile
import shutil
import time
from pathlib import Path
from typing import Dict, Any, Tuple
import requests
import undetected_chromedriver as uc
from selenium.common.exceptions import SessionNotCreatedException


def log_message(message: str, level: str = "INFO"):
    """Log message to stderr (to avoid interfering with JSON output on stdout)"""
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] [{level}] ChromeDriverService: {message}", file=sys.stderr, flush=True)


class ChromeDriverService:
    """Manages ChromeDriver compatibility and updates"""
    
    def __init__(self):
        # get the python path
        script_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.join(script_dir, '..', '..')
        self.python_path = os.path.join(project_root, 'redistributable', 'python')
        self.site_packages = os.path.join(self.python_path, 'Lib', 'site-packages')
        self.uc_path = os.path.join(self.site_packages, 'undetected_chromedriver')
    
    def check_chromedriver_status(self) -> Dict[str, Any]:
        """
        Check ChromeDriver status and attempt auto-fix if needed
        Returns status dictionary with compatibility info
        """
        log_message("Starting ChromeDriver status check")
        try:
            # 1: Test if current ChromeDriver works
            log_message("Testing current ChromeDriver compatibility")
            is_working, error_msg = self._test_chromedriver()
            
            if is_working:
                log_message("ChromeDriver is working correctly")
                return {
                    "compatible": True,
                    "message": "ChromeDriver is working correctly",
                    "needs_chrome_update": False
                }
            
            # 2: If any error occurs try to update uc
            if error_msg:
                log_message(f"ChromeDriver test failed: {error_msg}")
                
                # 3: Try to update ChromeDriver
                log_message("Attempting to update ChromeDriver")
                update_success, update_msg = self._update_chromedriver()
                
                if update_success:
                    log_message("ChromeDriver update completed, testing again")
                    
                    # 4: Test again after update
                    is_working_after_update, new_error_msg = self._test_chromedriver()
                    
                    if is_working_after_update:
                        log_message("ChromeDriver is now working after update")
                        return {
                            "compatible": True,
                            "message": "ChromeDriver updated successfully",
                            "needs_chrome_update": False
                        }
                    else:
                        # Still failing after update - likely chrome needs update
                        log_message(f"ChromeDriver still failing after update: {new_error_msg or error_msg}", "WARNING")
                        return {
                            "compatible": False,
                            "message": "ChromeDriver updated but still errors out",
                            "needs_chrome_update": True,
                            "error": new_error_msg or error_msg
                        }
                else:
                    log_message(f"ChromeDriver update failed: {update_msg}", "ERROR")
                    return {
                        "compatible": False,
                        "message": f"Failed to update ChromeDriver: {update_msg}",
                        "needs_chrome_update": False,
                        "error": error_msg
                    }
                
        except Exception as e:
            log_message(f"ChromeDriver check failed with exception: {str(e)}", "ERROR")
            return {
                "compatible": False,
                "message": f"ChromeDriver check failed: {str(e)}",
                "needs_chrome_update": False,
                "error": str(e)
            }
    
    def _test_chromedriver(self) -> Tuple[bool, str]:
        """Test if ChromeDriver can start successfully"""
        try:
            log_message("Attempting to create ChromeDriver instance")
            # options
            options = uc.ChromeOptions()
            options.add_argument('--headless')
            
            # create a temporary chrome instance
            test_driver = uc.Chrome(
                options=options,
                use_subprocess=False,
                headless=True,
                version_main=None
            )
            test_driver.quit()
            log_message("ChromeDriver test successful")
            return True, ""
        except SessionNotCreatedException as e:
            error_msg = str(e)
            # extract error msg
            if "Stacktrace:" in error_msg:
                clean_error = error_msg.split("Stacktrace:")[0].strip()
            else:
                clean_error = error_msg.split('\n')[0].strip()
            log_message(f"ChromeDriver test failed with SessionNotCreatedException: {clean_error}", "ERROR")
            return False, clean_error
        except Exception as e:
            error_msg = f"ChromeDriver test failed: {str(e)}"
            log_message(error_msg, "ERROR")
            return False, error_msg
    
    def _update_chromedriver(self) -> Tuple[bool, str]:
        """Update ChromeDriver to the latest version"""
        try:
            log_message("Starting ChromeDriver update process")
            # use pip to update undetected-chromedriver
            python_exe = os.path.join(self.python_path, 'python.exe')
            
            if not os.path.exists(python_exe):
                error_msg = "Python executable not found in redistributable folder"
                log_message(error_msg, "ERROR")
                return False, error_msg
            
            log_message(f"Using Python executable: {python_exe}")
            log_message("Running pip install --upgrade undetected-chromedriver")
            
            # Update undetected-chromedriver
            result = subprocess.run([
                python_exe, '-m', 'pip', 'install', '--upgrade', 'undetected-chromedriver'
            ], capture_output=True, text=True, cwd=self.python_path)
            
            if result.returncode == 0:
                log_message("ChromeDriver update completed successfully")
                log_message(f"pip stdout: {result.stdout.strip()}")
                return True, "ChromeDriver updated successfully"
            else:
                error_msg = f"pip update failed: {result.stderr}"
                log_message(error_msg, "ERROR")
                log_message(f"pip stderr: {result.stderr.strip()}")
                return False, error_msg
                
        except Exception as e:
            error_msg = f"Update failed: {str(e)}"
            log_message(error_msg, "ERROR")
            return False, error_msg


chromedriver_service = ChromeDriverService()
