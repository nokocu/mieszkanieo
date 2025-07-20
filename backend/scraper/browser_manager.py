"""
mieszkanieo scraper - browser management
"""

import time
from typing import Optional
import undetected_chromedriver as uc
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.common.by import By
from selenium.webdriver.support.wait import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


class BrowserManager:
    """Manages browser instances and web driver operations"""
    
    def __init__(self, headless: bool = True):
        self.headless = headless
        self.driver: Optional[uc.Chrome] = None
    
    def setup_browser(self, fresh_instance: bool = False) -> None:
        """Start chrome browser"""
        if self.driver and not fresh_instance:
            return
        
        # Close existing driver if creating fresh instance
        if fresh_instance and self.driver:
            try:
                self.driver.quit()
            except:
                pass
            self.driver = None
        
        self.driver = uc.Chrome(use_subprocess=False, headless=self.headless)
        self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        self.driver.execute_cdp_cmd('Network.setUserAgentOverride', {
            "userAgent": 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        })
        self.driver.get('chrome://settings/')
        self.driver.execute_script('chrome.settingsPrivate.setDefaultZoom(0.25);')
        time.sleep(0.5)
    
    def wait_for_page(self, selector: str, selector_type: str = "css", timeout: int = 10) -> bool:
        """Wait for page to load"""
        if not self.driver:
            return False
            
        try:
            if selector_type == "css" or selector.startswith('['):
                WebDriverWait(self.driver, timeout).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, selector))
                )
            else:
                WebDriverWait(self.driver, timeout).until(
                    EC.presence_of_element_located((By.CLASS_NAME, selector))
                )
            return True
        except TimeoutException:
            print("wait_for_page: timeout waiting for page element")
            return False
    
    def navigate_to_url(self, url: str) -> None:
        """Navigate to URL"""
        if self.driver:
            self.driver.get(url)
    
    def get_current_url(self) -> str:
        """Get current URL"""
        if self.driver:
            return self.driver.current_url
        return ""
    
    def get_page_source(self) -> str:
        """Get page source"""
        if self.driver:
            return self.driver.page_source
        return ""
    
    def cleanup(self) -> None:
        """Close browser"""
        if self.driver:
            try:
                self.driver.quit()
            except:
                pass
            self.driver = None
    
    def __enter__(self):
        """Context manager entry"""
        self.setup_browser()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit"""
        self.cleanup()
