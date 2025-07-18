"""
mieszkanieo scraper
"""

import time
import json
import requests
import hashlib
import uuid
import csv
import os
from bs4 import BeautifulSoup
from unidecode import unidecode
import undetected_chromedriver as uc
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.common.by import By
from selenium.webdriver.support.wait import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


class PropertyScraper:
    """Scrapes properties"""
    
    def __init__(self, headless=True, api_url="http://localhost:8000"):
        self.headless = headless
        self.api_url = api_url
        self.driver = None
        self.location_mapping = {}
    
    def load_location_mapping(self, csv_file_path):
        """Load location mapping from CSV file"""
        if not os.path.exists(csv_file_path):
            print(f"CSV file not found: {csv_file_path}")
            return
            
        self.location_mapping = {}
        try:
            with open(csv_file_path, 'r', encoding='utf-8') as csvfile:
                reader = csv.DictReader(csvfile)
                for row in reader:
                    city = row['miasto'].strip().lower()
                    path = row['link'].strip()
                    self.location_mapping[city] = path
            print(f"Loaded {len(self.location_mapping)} location mappings")
        except Exception as e:
            print(f"Error loading location mapping: {e}")
    
    def get_city_url_path(self, city, config):
        """Get URL path for city from CSV mapping"""
        if not config.get("use_csv_location"):
            return unidecode(city).lower()
            
        city_key = unidecode(city).lower()
        if city_key in self.location_mapping:
            return self.location_mapping[city_key]
        
        print(f"City '{city}' not found in location mapping")
        return None
    
    def setup_browser(self):
        """Start chrome browser"""
        if self.driver:
            return
        
        self.driver = uc.Chrome(use_subprocess=False, headless=self.headless)
        self.driver.get('chrome://settings/')
        self.driver.execute_script('chrome.settingsPrivate.setDefaultZoom(0.25);')
    
    def wait_for_page(self, selector, selector_type="css", timeout=10):
        """Wait for page to load"""
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
    
    def apply_processing_rules(self, text, rules):
        """Apply processing rules to text"""
        if not rules or not text:
            return text
            
        result = text
        import re
        
        for rule in rules:
            if rule["type"] == "regex":
                result = re.sub(rule["pattern"], rule["replacement"], result)
            elif rule["type"] == "strip":
                result = result.strip(rule["chars"])
        
        return result
    
    def find_in_element(self, element, selectors):
        """Find text in element using multiple selectors"""
        for selector in selectors:
            tag, css_class = selector[0], selector[1] if len(selector) > 1 else ""
            
            if css_class:
                found = element.find(tag, class_=css_class)
            else:
                found = element.find(tag)
            
            if found:
                return found.get_text(strip=True)
        return ""
    
    def find_with_fallback(self, listing, primary_selectors, fallback_config):
        """Find element with fallback options"""
        # try primary selectors first
        text = self.find_in_element(listing, primary_selectors)
        
        if text or not fallback_config:
            return text
            
        # try fallback
        if "selector" in fallback_config:
            tag, css_class = fallback_config["selector"]
            element = listing.find(tag, class_=css_class) if css_class else listing.find(tag)
            
            if element and "nested" in fallback_config:
                nested_elements = element.find_all(fallback_config["nested"][0])
                if nested_elements:
                    return nested_elements[0].get_text(strip=True)
            elif element:
                return element.get_text(strip=True)
        
        return ""
    
    def extract_with_strategy(self, listing, config, extraction_type):
        """Extract data using configured strategy"""
        rules = config.get("processing_rules", {})
        
        if extraction_type == "details" and "details_extraction" in rules:
            details_rules = rules["details_extraction"]
            results = {}
            
            for field, field_config in details_rules.items():
                if "search_text" in field_config:
                    # find the specific element that directly contains the search text
                    search_text = field_config["search_text"]
                    
                    # look for p tags that contain the search text
                    p_elements = listing.find_all("p")
                    for p_element in p_elements:
                        p_text = p_element.get_text()
                        if search_text in p_text:
                            # extract from specified nested element within this specific p tag
                            if "extract_from" in field_config:
                                nested = p_element.find_all(field_config["extract_from"])
                                if nested:
                                    # get all strong tags and combine their text for this specific field
                                    value_parts = [strong.get_text().strip() for strong in nested]
                                    value_text = "".join(value_parts)
                                    
                                    # apply extract_number which handles "parter" case and floor format
                                    results[field] = self.extract_number(value_text)
                                    break
            
            return results
        
        return {}

    def find_listings_with_strategy(self, container, config):
        """Find listings using configured strategy"""
        listing_config = config["selectors"]["listing_item"]
        rules = config.get("processing_rules", {})
        
        # use data attributes if available
        if listing_config.get("data_cy"):
            return container.find_all(listing_config["tag"], attrs={"data-cy": listing_config["data_cy"]})
        
        # for otodom-style direct children (li directly under ul)
        if listing_config["tag"] == "li" and not listing_config.get("class"):
            return container.find_all("li", recursive=False)
        
        # use flexible class matching if configured
        if rules.get("listing_selector_strategy") == "flexible_class_matching":
            patterns = rules.get("flexible_class_patterns", [])
            for pattern in patterns:
                listings = container.find_all("div", class_=lambda x: x and pattern in str(x))
                if listings:
                    return listings
        
        # fall back to standard class matching
        return container.find_all(listing_config["tag"], class_=listing_config["class"])
    
    def find_attribute(self, element, tag, css_class, attr):
        """Find attribute value in element"""
        if css_class:
            found = element.find(tag, class_=css_class)
        else:
            found = element.find(tag)
        
        return found.get(attr, "") if found else ""
    
    def extract_number(self, text):
        """Get number from text"""
        if not text:
            return 0
        
        # handle special case for floor: if contains "parter", return 0
        if "parter" in text.lower():
            return 0
        
        # clean text
        clean = text.replace("zł", "").replace("m²", "").replace(" ", "")
        
        # handle floor format like "11/13" - take the first number (actual floor)
        if "/" in clean:
            clean = clean.split("/")[0]
        
        # get integer part only
        if "," in clean:
            clean = clean.split(",")[0]
        if "." in clean:
            clean = clean.split(".")[0]
        
        # extract digits
        digits = "".join(c for c in clean if c.isdigit())
        return int(digits) if digits else 0
    
    def get_total_pages(self, city, config):
        """Get number of pages to scrape and return page content if available"""
        # if the site doesnt have pagination, return a high number (will stop when it finds empty pages)
        if not config.get("has_pagination", True):
            return config.get("default_pages", 50), None
            
        # handle CSV-based location mapping
        if config.get("use_csv_location"):
            if config.get("csv_file"):
                csv_path = os.path.join(os.path.dirname(__file__), config["csv_file"])
                self.load_location_mapping(csv_path)
            
            city_path = self.get_city_url_path(city, config)
            if city_path is None:
                return config.get("default_pages", 50), None
            
            url = config["base_url"].format(city_path=city_path)
        else:
            url = config["base_url"].format(city=unidecode(city).lower())
        
        self.driver.get(url)
        wait_config = config["selectors"]["wait_element"]
        
        if not self.wait_for_page(wait_config["value"], wait_config["type"]):
            return config["default_pages"], None
        
        time.sleep(2)
        soup = BeautifulSoup(self.driver.page_source, "html.parser")
        
        # find pagination
        pag_config = config["selectors"]["pagination"]
        
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
            # handle CSV-based location mapping
            if config.get("use_csv_location"):
                if config.get("csv_file"):
                    csv_path = os.path.join(os.path.dirname(__file__), config["csv_file"])
                    self.load_location_mapping(csv_path)
                
                city_path = self.get_city_url_path(city, config)
                if city_path is None:
                    return []
                
                url = config["page_url"].format(city_path=city_path, page=page_num)
            else:
                url = config["page_url"].format(city=unidecode(city).lower(), page=page_num)
            
            print(f"scrape_page: scraping page {page_num}: {url}")
            
            self.driver.get(url)
            wait_config = config["selectors"]["wait_element"]
            
            if not self.wait_for_page(wait_config["value"], wait_config["type"]):
                return []
            
            # wait longer for dynamic content
            time.sleep(5)
            soup = BeautifulSoup(self.driver.page_source, "html.parser")
        else:
            print(f"scrape_page: using preloaded page {page_num}")
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
        
        print(f"scrape_page: found {len(listings)} listings")
        
        properties = []
        for listing in listings:
            prop = self.extract_property(listing, city, config)
            if prop:
                properties.append(prop)
        
        print(f"scrape_page: extracted {len(properties)} properties from page")
        return properties
    
    def extract_property(self, listing, city, config):
        """Extract property data from listing element"""
        selectors = config["selectors"]
        
        # get link
        link_config = selectors["link"]
        if link_config.get("nested"):
            parent = listing.find(link_config["tag"], class_=link_config["class"])
            link_elem = parent.find(link_config["nested"]["tag"]) if parent else None
        else:
            # find any link in the listing
            link_elem = listing.find("a")
        
        if not link_elem:
            return None
        
        link = link_elem.get("href", "")
        if not link:
            return None
        
        # make full url
        if link.startswith("/"):
            link = config["base_domain"] + link
        elif not link.startswith("http"):
            link = config["base_domain"] + "/" + link
        
        # get title - handle data attributes
        title = ""
        title_config = selectors["title"]
        if isinstance(title_config, dict) and title_config.get("data_cy"):
            title_elem = listing.find(title_config["tag"], attrs={"data-cy": title_config["data_cy"]})
            title = title_elem.get_text(strip=True) if title_elem else ""
        else:
            title = self.find_in_element(listing, selectors["title"])
        
        if not title:
            return None
        
        # get address - handle data attributes
        address = ""
        address_config = selectors["address"]
        if isinstance(address_config, dict) and address_config.get("data_sentry_component"):
            address_elem = listing.find(address_config["tag"], attrs={"data-sentry-component": address_config["data_sentry_component"]})
            address = address_elem.get_text(strip=True) if address_elem else ""
        else:
            address = self.find_in_element(listing, selectors["address"])
        
        if not address:
            address = city.title()
        
        # apply address cleanup rules if configured
        rules = config.get("processing_rules", {})
        if "address_cleanup" in rules:
            address = self.apply_processing_rules(address, rules["address_cleanup"])
        
        # get price - handle data attributes
        price_text = ""
        price_config = selectors["price"]
        if isinstance(price_config, dict) and price_config.get("data_sentry_element"):
            price_elem = listing.find(price_config["tag"], attrs={"data-sentry-element": price_config["data_sentry_element"]})
            price_text = price_elem.get_text(strip=True) if price_elem else ""
        else:
            price_text = self.find_with_fallback(
                listing, 
                selectors["price"], 
                rules.get("price_fallback")
            )
        
        price = self.extract_number(price_text)
        
        # get image - handle data attributes
        image = ""
        if "image" in selectors:
            img_config = selectors["image"]
            if img_config.get("data_cy"):
                img_elem = listing.find(img_config["tag"], attrs={"data-cy": img_config["data_cy"]})
                image = img_elem.get(img_config["attribute"], "") if img_elem else ""
            elif img_config.get("nested"):
                picture = listing.find(img_config["tag"], class_=img_config["class"])
                if picture:
                    source = picture.find(img_config["nested"]["tag"])
                    if source:
                        image = source.get(img_config["attribute"], "")
            else:
                image = self.find_attribute(listing, img_config["tag"], img_config["class"], img_config["attribute"])
        
        # get area, rooms, level
        area = 0
        rooms = None
        level = None
        
        if "details" in selectors:
            details_config = selectors["details"]
            
            # handle otodom-style indexed dd elements
            if rules.get("otodom_details_extraction"):
                dd_elements = listing.find_all("dd", class_="css-17je0kd")
                if len(dd_elements) >= 3:
                    # rooms is first dd
                    rooms_text = dd_elements[0].get_text(strip=True)
                    rooms = self.extract_number(rooms_text)
                    
                    # area is second dd
                    area_text = dd_elements[1].get_text(strip=True)
                    area = self.extract_number(area_text)
                    
                    # level is third dd
                    level_text = dd_elements[2].get_text(strip=True)
                    level = self.extract_number(level_text)
            
            elif isinstance(details_config, dict) and "area" in details_config:
                # complex details like olx and nieruchomosci
                area_text = self.find_with_fallback(
                    listing, 
                    details_config["area"], 
                    rules.get("area_fallback")
                )
                area = self.extract_number(area_text)
                
                # extract additional details using configured strategy
                extracted_details = self.extract_with_strategy(listing, config, "details")
                if extracted_details:
                    rooms = extracted_details.get("rooms", rooms)
                    level = extracted_details.get("level", level)
            else:
                # simple details like gethome
                detail_spans = listing.find_all(details_config["tag"], class_=details_config["class"])
                if len(detail_spans) >= 2:
                    rooms = self.extract_number(detail_spans[0].get_text())
                    area = self.extract_number(detail_spans[1].get_text())
        
        return {
            "id": hashlib.md5(link.encode()).hexdigest()[:12],
            "title": title,
            "price": price,
            "area": area,
            "rooms": rooms,
            "level": level,
            "address": address,
            "site": config["site_name"],
            "link": link,
            "image": image
        }
    
    def save_properties_batch(self, properties):
        """Save multiple properties to api in a single request"""
        if not properties:
            return 0
            
        try:
            response = requests.post(
                f"{self.api_url}/api/properties/batch",
                json={"properties": properties},
                headers={"Content-Type": "application/json"},
                timeout=30  # longer timeout for batch operations
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"save_properties_batch: saved {result.get('saved', 0)}, skipped {result.get('skipped', 0)}")
                return result.get('saved', 0)
            else:
                print(f"save_properties_batch: api error {response.status_code}: {response.text}")
                return 0
                
        except Exception as e:
            print(f"save_properties_batch: save error: {e}")
            return 0

    def save_property(self, property_data):
        """Save property to api (fallback for single property)"""
        try:
            response = requests.post(
                f"{self.api_url}/api/properties",
                json=property_data,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            if response.status_code == 409:
                # property already exists
                return False
            elif response.status_code != 200:
                print(f"save_property: api error {response.status_code}: {response.text}")
            return response.status_code == 200
        except Exception as e:
            print(f"save_property: save error: {e}")
            return False
    
    def create_job(self, job_id, city):
        """Create scraping job"""
        try:
            response = requests.post(
                f"{self.api_url}/api/scraping-jobs",
                json={"id": job_id, "city": city},
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            return response.status_code == 200
        except:
            return False
    
    def update_job(self, job_id, updates):
        """Update scraping job"""
        try:
            response = requests.put(
                f"{self.api_url}/api/scraping-jobs/{job_id}",
                json=updates,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            return response.status_code == 200
        except:
            return False
    
    def scrape_site(self, city, config, max_pages=None):
        """Scrape entire site"""
        print(f"scrape_site: starting {config['name']} scraping for {city}")
        
        job_id = str(uuid.uuid4())[:8]
        self.create_job(job_id, city)
        
        try:
            self.setup_browser()
            
            # get page count and potentially preloaded first page
            if config.get("has_pagination", True):
                total_pages, first_page_soup = self.get_total_pages(city, config)
                if max_pages:
                    total_pages = min(total_pages, max_pages)
                print(f"scrape_site: will scrape {total_pages} pages")
            else:
                # for sites without pagination, use default or max_pages
                total_pages = max_pages if max_pages else config.get("default_pages", 50)
                first_page_soup = None
                print(f"scrape_site: will scrape until empty pages (max {total_pages} pages)")
            
            all_properties = []
            saved_count = 0
            empty_pages_count = 0
            
            for page in range(1, total_pages + 1):
                progress = int((page - 1) / total_pages * 100)
                self.update_job(job_id, {"progress": progress})
                
                # use preloaded soup for page 1 if available
                if page == 1 and first_page_soup is not None:
                    properties = self.scrape_page(city, page, config, first_page_soup)
                else:
                    properties = self.scrape_page(city, page, config)
                
                if not properties:
                    empty_pages_count += 1
                    print(f"scrape_site: page {page} is empty ({empty_pages_count} empty pages in a row)")
                    
                    # for sites without pagination, stop after 2 consecutive empty pages
                    if not config.get("has_pagination", True) and empty_pages_count >= 2:
                        print("scrape_site: stopping due to consecutive empty pages")
                        break
                    
                    # for sites with pagination, stop after 1 empty page
                    if config.get("has_pagination", True):
                        break
                else:
                    empty_pages_count = 0  # reset counter when we find properties
                
                all_properties.extend(properties)
                
                # save properties in batch
                if properties:
                    saved_count += self.save_properties_batch(properties)
                
                print(f"scrape_site:page {page} done: {len(properties)} properties")
                
                if page < total_pages:
                    time.sleep(config.get("delay_between_pages", 3))
            
            self.update_job(job_id, {
                "status": "completed",
                "progress": 100,
                "total_found": len(all_properties)
            })
            
            return {
                "success": True,
                "properties": all_properties,
                "saved": saved_count,
                "total_found": len(all_properties),
                "job_id": job_id
            }
            
        except Exception as e:
            print(f"scrape_site: error: {e}")
            self.update_job(job_id, {"status": "failed", "error": str(e)})
            return {"success": False, "error": str(e)}
        finally:
            self.cleanup()
    
    def cleanup(self):
        """Close browser"""
        if self.driver:
            try:
                self.driver.quit()
            except:
                pass
            self.driver = None


def main():
    """Run scraper from command line"""
    import sys
    
    if len(sys.argv) < 2:
        print("usage: python scraper_new.py <config_file> [city] [max_pages]")
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
