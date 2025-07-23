"""
mieszkanieo scraper - modular version
"""

import time
import json
import uuid
from bs4 import BeautifulSoup
from unidecode import unidecode
from selenium.webdriver.support.ui import WebDriverWait

from .browser_manager import BrowserManager
from .location_mapper import LocationMapper
from .data_extractor import DataExtractor
from .api_client import APIClient


class PropertyScraper:
    """Scrapes properties"""
    
    def __init__(self, headless=True, api_url="http://localhost:8000", job_id=None):
        self.headless = headless
        self.api_url = api_url
        self.job_id = job_id
        
        # init
        self.browser_manager = BrowserManager(headless)
        self.location_mapper = LocationMapper()
        self.data_extractor = DataExtractor()
        self.api_client = APIClient(api_url)
        self.driver = None
        self.location_mapping = {}
    def setup_browser(self, fresh_instance=False):
        """Start chrome browser"""
        self.browser_manager.setup_browser(fresh_instance)
        self.driver = self.browser_manager.driver
    
    def send_status(self, message):
        """Send status update to API"""
        if self.job_id:
            try:
                print(f"DEBUG: Sending status update: '{message}' for job {self.job_id}")
                self.api_client.update_job(self.job_id, {
                    "current_status": message
                })
                print(f"DEBUG: Status update sent successfully")
            except Exception as e:
                print(f"Failed to update job status: {e}")
        else:
            print(f"DEBUG: No job_id, cannot send status: '{message}'")
    
    def wait_for_content_loaded(self, timeout=10):
        """Wait for page content to be fully loaded"""
        if not self.driver:
            return False
        try:
            # wait for document ready state
            WebDriverWait(self.driver, timeout).until(
                lambda driver: driver.execute_script("return document.readyState") == "complete"
            )
            # additional wait for AJAX
            WebDriverWait(self.driver, timeout).until(
                lambda driver: driver.execute_script("return jQuery.active == 0") if 
                driver.execute_script("return typeof jQuery !== 'undefined'") else True
            )
            return True
        except:
            # )fallback) just wait for document ready
            try:
                WebDriverWait(self.driver, timeout).until(
                    lambda driver: driver.execute_script("return document.readyState") == "complete"
                )
                return True
            except:
                return False
    
    def cleanup(self):
        """Close browser"""
        self.browser_manager.cleanup()
        self.driver = None
    
    def wait_for_page(self, selector, selector_type="css", timeout=10):
        """Wait for page to load"""
        return self.browser_manager.wait_for_page(selector, selector_type, timeout)
    
    def load_location_mapping(self, csv_file_path):
        """Load location mapping from CSV file"""
        self.location_mapper.load_location_mapping(csv_file_path)
        self.location_mapping = self.location_mapper.location_mapping
    
    def get_city_url_path(self, city, config):
        """Get URL path for city from CSV mapping"""
        return self.location_mapper.get_city_url_path(city, config)
    
    def apply_processing_rules(self, text, rules):
        """Apply processing rules to text"""
        return self.data_extractor.apply_processing_rules(text, rules)
    
    def find_in_element(self, element, selectors):
        """Find text in element using multiple selectors"""
        return self.data_extractor.find_in_element(element, selectors)
    
    def find_with_fallback(self, listing, primary_selectors, fallback_config):
        """Find element with fallback options"""
        return self.data_extractor.find_with_fallback(listing, primary_selectors, fallback_config)
    
    def extract_with_strategy(self, listing, config, extraction_type):
        """Extract data using configured strategy"""
        return self.data_extractor.extract_with_strategy(listing, config, extraction_type)
    
    def find_listings_with_strategy(self, container, config):
        """Find listings using configured strategy"""
        return self.data_extractor.find_listings_with_strategy(container, config)
    
    def find_attribute(self, element, tag, css_class, attr):
        """Find attribute value in element"""
        return self.data_extractor.find_attribute(element, tag, css_class, attr)
    
    def extract_address_from_title(self, title, city, config):
        """Extract address from title text (e.g., 'Mieszkanie, Katowice, Bogucice, 43 m²')"""
        return self.data_extractor.extract_address_from_title(title, city, config)
    
    def extract_number(self, text):
        """Get number from text"""
        return self.data_extractor.extract_number(text)
    
    def extract_property(self, listing, city, config):
        """Extract property data from listing element"""
        return self.data_extractor.extract_property(listing, city, config)
    
    def delete_all_properties(self):
        """Delete all properties from database"""
        return self.api_client.delete_all_properties()
    
    def save_properties_batch(self, properties):
        """Save multiple properties to api in a single request"""
        return self.api_client.save_properties_batch(properties)
    
    def save_property(self, property_data):
        """Save property to api (fallback for single property)"""
        return self.api_client.save_property(property_data)
    
    def create_job(self, job_id, city):
        """Create scraping job"""
        return self.api_client.create_job(job_id, city)
    
    def update_job(self, job_id, updates):
        """Update scraping job"""
        return self.api_client.update_job(job_id, updates)
    
    def get_total_pages(self, city, config):
        """Get number of pages to scrape and return page content if available"""
        if not config.get("has_pagination", True):
            return config.get("default_pages", 999), None
            
        # handle CSV-based location mapping
        if config.get("use_csv_location"):
            city_path = self.get_city_url_path(city, config)
            if city_path is None:
                return config.get("default_pages", 999), None
            
            url = config["base_url"].format(city_path=city_path)
        else:
            url = config["base_url"].format(city=unidecode(city).lower())
        
        self.browser_manager.navigate_to_url(url, site_name=config.get("site_name", ""))
        wait_config = config["selectors"]["wait_element"]
        
        if not self.wait_for_page(wait_config["value"], wait_config["type"]):
            return config["default_pages"], None
        
        if not self.wait_for_content_loaded():
            return config["default_pages"], None
        
        # olx delay for thumbnail loading  
        if config.get("site_name") == "olx":
            olx_delay = config.get("thumbnail_delay", 2)
            print(f"get_total_pages: thumbnail delay {olx_delay}s", flush=True)
            time.sleep(olx_delay)
            
        soup = BeautifulSoup(self.browser_manager.get_page_source(), "html.parser")
        
        # find pagination
        pag_config = config["selectors"]["pagination"]
        
        # handle data_page attribute pagination
        if "data_page" in pag_config:
            pages = soup.find_all(pag_config["tag"], attrs={"data-page": True})
            max_page = 0
            for page in pages:
                try:
                    page_num = page.get("data-page")
                    if page_num and page_num.isdigit():
                        max_page = max(max_page, int(page_num))
                except:
                    continue
            
            page_count = max_page if max_page > 0 else config["default_pages"]
            return page_count, soup
        
        # handle otodom-specific pagination
        if "last_page_selector" in pag_config:
            last_page_elem = soup.select_one(pag_config["last_page_selector"])
            if last_page_elem:
                text = last_page_elem.get_text(strip=True)
                if text.isdigit():
                    return int(text), soup
        
        # standard pagination handling
        if pag_config.get("data_testid"):
            pages = soup.find_all(pag_config["tag"], attrs={"data-testid": pag_config["data_testid"]})
        else:
            pages = soup.find_all(pag_config["tag"], class_=pag_config["class"])
        
        max_page = 0
        for page in pages:
            try:
                text = page.get_text(strip=True)
                if text.isdigit():
                    max_page = max(max_page, int(text))
            except:
                continue
        
        page_count = max_page if max_page > 0 else config["default_pages"]
        # return both page count and the soup of page 1 so we dont need to reload it
        return page_count, soup
    
    def scrape_page(self, city, page_num, config, preloaded_soup=None):
        """Scrape one page of listings"""
        if preloaded_soup is None:
            # use fresh browser instance for each page to avoid bot detection
            is_allegro = config.get("site_name") == "allegro"
            if is_allegro and page_num > 1:
                print(f"scrape_page: creating fresh browser instance for Allegro page {page_num}")
                self.setup_browser(fresh_instance=True)
            
            # handle CSV-based location mapping
            if config.get("use_csv_location"):
                city_path = self.get_city_url_path(city, config)
                if city_path is None:
                    return []
                
                url = config["page_url"].format(city_path=city_path, page=page_num)
            else:
                url = config["page_url"].format(city=unidecode(city).lower(), page=page_num)
            
            print(f"scrape_page: scraping page {page_num}: {url}", flush=True)
            
            self.browser_manager.navigate_to_url(url, site_name=config.get("site_name", ""))
            
            # check if we got redirected before waiting for elements
            if (config.get("site_name") in ["otodom", "gethome"]) and page_num > 1:
                actual_url = self.browser_manager.get_current_url()
                print(f"scrape_page: {config.get('site_name')} page {page_num} - requested: {url}")
                print(f"scrape_page: {config.get('site_name')} page {page_num} - actual: {actual_url}")
                
                # check if we were redirected to a different page
                if (f"page={page_num}" not in actual_url and 
                    ("page=1" in actual_url or not "page=" in actual_url)):
                    print(f"scrape_page: {config.get('site_name')} redirect detected on page {page_num}, returning empty")
                    return []
            
            wait_config = config["selectors"]["wait_element"]
            
            if not self.wait_for_page(wait_config["value"], wait_config["type"]):
                return []
            
            if not self.wait_for_content_loaded():
                return []
            
            # OLX-specific delay for thumbnail loading
            if config.get("site_name") == "olx":
                olx_delay = config.get("thumbnail_delay", 2)
                print(f"scrape_page: OLX thumbnail delay {olx_delay}s", flush=True)
                time.sleep(olx_delay)
                
            soup = BeautifulSoup(self.browser_manager.get_page_source(), "html.parser")
        else:
            print(f"scrape_page: using preloaded page {page_num}", flush=True)
            soup = preloaded_soup
        
        # find listings container
        container_config = config["selectors"]["listings_container"]
        if container_config.get("data_testid"):
            container = soup.find(container_config["tag"], attrs={"data-testid": container_config["data_testid"]})
        else:
            container = soup.find(container_config["tag"], class_=container_config["class"])
        
        if not container:
            print("DEBUG: Primary container not found, trying alternative approaches...")
            # try to find any div that might contain listings
            potential_containers = soup.find_all("div", class_=lambda x: x and ("column" in " ".join(x) or "container" in " ".join(x) or "content" in " ".join(x)))
            print(f"DEBUG: Found {len(potential_containers)} potential containers")
            if potential_containers:
                container = potential_containers[0]
                print(f"DEBUG: Using container with class: {container.get('class')}")
        
        if not container:
            print("DEBUG: No container found at all")
            return []
        
        # find individual listings
        listings = self.find_listings_with_strategy(container, config)
        
        print(f"scrape_page: found {len(listings)} listings", flush=True)
        
        properties = []
        for listing in listings:
            prop = self.extract_property(listing, city, config)
            if prop:
                properties.append(prop)
        
        print(f"scrape_page: extracted {len(properties)} properties from page", flush=True)
        return properties
    
    def scrape_site(self, city, config, max_pages=None):
        """Scrape entire site"""
        print(f"scrape_site: starting {config['name']} scraping for {city}", flush=True)
        
        try:
            # update status: initializing browser
            self.send_status("Inicjalizacja Chrome")
            self.setup_browser()
            
            # update status: starting to scrape
            site_name = config.get('name', 'portal')
            self.send_status(f"Zbieranie ogłoszeń z {site_name}")
            
            # get page count and potentially preloaded first page
            if config.get("has_pagination", True):
                total_pages, first_page_soup = self.get_total_pages(city, config)
                if max_pages:
                    total_pages = min(total_pages, max_pages)
                print(f"scrape_site: will scrape {total_pages} pages", flush=True)
                self.send_status(f"Zbieranie ogłoszeń z {site_name} (znaleziono {total_pages} stron)")
            else:
                # for sites without pagination, use default or max_pages
                total_pages = max_pages if max_pages else config.get("default_pages", 999)
                first_page_soup = None
                print(f"scrape_site: will scrape until empty pages (max {total_pages} pages)", flush=True)
                self.send_status(f"Zbieranie ogłoszeń z {site_name}")
            
            all_properties = []
            saved_count = 0
            empty_pages_count = 0
            
            for page in range(1, total_pages + 1):
                progress = int((page - 1) / total_pages * 100)
                
                # update detailed status with current page
                if total_pages == 999:
                    # dont show for sites without pagination 
                    self.send_status(f"Zbieranie ogłoszeń z {site_name}, strona {page}")
                else:
                    self.send_status(f"Zbieranie ogłoszeń z {site_name}, strona {page}/{total_pages}")
                
                if self.job_id:
                    self.update_job(self.job_id, {"progress": progress})
                
                # use preloaded soup for page 1 if available
                if page == 1 and first_page_soup is not None:
                    print(f"scrape_page: processing preloaded page 1", flush=True)
                    properties = self.scrape_page(city, page, config, first_page_soup)
                else:
                    properties = self.scrape_page(city, page, config)
                
                if not properties:
                    empty_pages_count += 1
                    print(f"scrape_site: page {page} is empty ({empty_pages_count} empty pages in a row)", flush=True)
                    
                    # for sites without pagination, stop after 2 consecutive empty pages
                    if not config.get("has_pagination", True) and empty_pages_count >= 2:
                        print("scrape_site: stopping due to consecutive empty pages", flush=True)
                        break
                    
                    # for sites with pagination, stop after 1 empty page
                    if config.get("has_pagination", True):
                        print("scrape_site: stopping due to empty page on paginated site", flush=True)
                        break
                else:
                    empty_pages_count = 0  # reset counter when we find properties
                
                all_properties.extend(properties)
                
                # save properties in batch
                if properties:
                    saved_count += self.save_properties_batch(properties)
                
                print(f"scrape_site:page {page} done: {len(properties)} properties", flush=True)
                
                if page < total_pages:
                    time.sleep(0.5)
            
            # final completion status
            self.send_status(f"Zapisywanie wyników z {site_name}")
            if self.job_id:
                self.update_job(self.job_id, {
                    "total_found": len(all_properties)
                })
            
            return {
                "success": True,
                "properties": all_properties,
                "saved": saved_count,
                "total_found": len(all_properties)
            }
            
        except Exception as e:
            print(f"scrape_site: error: {e}")
            import traceback
            traceback.print_exc()
            self.send_status(f"Błąd: {str(e)}")
            if self.job_id:
                self.update_job(self.job_id, {"status": "failed", "error": str(e)})
            return {"success": False, "error": str(e)}
        finally:
            self.cleanup()


def main():
    """Run scraper from command line"""
    import sys
    
    if len(sys.argv) < 2:
        print("usage: python property_scraper.py <config_file> [city] [max_pages]")
        return
    
    config_file = sys.argv[1]
    city = sys.argv[2] if len(sys.argv) > 2 else "katowice"
    max_pages = int(sys.argv[3]) if len(sys.argv) > 3 else None
    
    try:
        with open(config_file, 'r', encoding='utf-8') as f:
            config = json.load(f)
        
        scraper = PropertyScraper(headless=False)
        result = scraper.scrape_site(city, config, max_pages)
        
        if result["success"]:
            print(f"main: scraping completed")
            print(f"main: found: {result['total_found']}")
            print(f"main: saved: {result['saved']}")
        else:
            print(f"main: scraping failed: {result.get('error', 'unknown error')}")
            
    except FileNotFoundError:
        print(f"main: config file not found: {config_file}")
    except Exception as e:
        print(f"main: error: {e}")


if __name__ == "__main__":
    main()
