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
from pathlib import Path
from typing import Dict, Any, Tuple
import requests
import undetected_chromedriver as uc
from selenium.common.exceptions import SessionNotCreatedException


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
        try:
            # 1: Test if current ChromeDriver works
            is_working, error_msg = self._test_chromedriver()
            
            if is_working:
                return {
                    "compatible": True,
                    "message": "ChromeDriver is working correctly",
                    "needs_chrome_update": False
                }
            
            # 2: Check if version mismatch
            if "This version of ChromeDriver only supports Chrome version" in error_msg:
                # 3: Try to update ChromeDriver
                update_success, update_msg = self._update_chromedriver()
                
                if update_success:
                    # 4: Test again after update
                    is_working_after_update, _ = self._test_chromedriver()
                    
                    if is_working_after_update:
                        return {
                            "compatible": True,
                            "message": "ChromeDriver updated successfully",
                            "needs_chrome_update": False
                        }
                    else:
                        # likely chrome needs update
                        return {
                            "compatible": False,
                            "message": "ChromeDriver updated but Chrome version is too old",
                            "needs_chrome_update": True,
                            "error": error_msg
                        }
                else:
                    return {
                        "compatible": False,
                        "message": f"Failed to update ChromeDriver: {update_msg}",
                        "needs_chrome_update": False,
                        "error": error_msg
                    }
            else:
                # different error not version related
                return {
                    "compatible": False,
                    "message": "ChromeDriver error (not version related)",
                    "needs_chrome_update": False,
                    "error": error_msg
                }
                
        except Exception as e:
            return {
                "compatible": False,
                "message": f"ChromeDriver check failed: {str(e)}",
                "needs_chrome_update": False,
                "error": str(e)
            }
    
    def _test_chromedriver(self) -> Tuple[bool, str]:
        """Test if ChromeDriver can start successfully"""
        try:
            # create a temporary chrome instance
            test_driver = uc.Chrome(use_subprocess=False, headless=True)
            test_driver.quit()
            return True, ""
        except SessionNotCreatedException as e:
            error_msg = str(e)
            # extract error msg
            if "Stacktrace:" in error_msg:
                clean_error = error_msg.split("Stacktrace:")[0].strip()
            else:
                clean_error = error_msg.split('\n')[0].strip()
            return False, clean_error
        except Exception as e:
            return False, f"ChromeDriver test failed: {str(e)}"
    
    def _update_chromedriver(self) -> Tuple[bool, str]:
        """Update ChromeDriver to the latest version"""
        try:
            # use pip to update undetected-chromedriver
            python_exe = os.path.join(self.python_path, 'python.exe')
            
            if not os.path.exists(python_exe):
                return False, "Python executable not found in redistributable folder"
            
            # Update undetected-chromedriver
            result = subprocess.run([
                python_exe, '-m', 'pip', 'install', '--upgrade', 'undetected-chromedriver'
            ], capture_output=True, text=True, cwd=self.python_path)
            
            if result.returncode == 0:
                return True, "ChromeDriver updated successfully"
            else:
                return False, f"pip update failed: {result.stderr}"
                
        except Exception as e:
            return False, f"Update failed: {str(e)}"


chromedriver_service = ChromeDriverService()
