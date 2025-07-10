"""
mieszkanieo scrapper
"""

import time
import json
from datetime import datetime
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.common.by import By
from selenium.webdriver.support.wait import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys
from bs4 import BeautifulSoup
from unidecode import unidecode
import undetected_chromedriver as uc
import hashlib

from database import get_db
from models import Property


class PropertyScraper:
    """Generic property scraper that works with site-specific configurations"""
    
    def __init__(self, headless: bool = True):
        self.headless = headless
        self.driver = None
        
    def setup_driver(self):
        """Setup undetected Chrome driver"""
        if self.driver:
            return
            
        try:
            self.driver = uc.Chrome(use_subprocess=False, headless=self.headless)
            self.driver.get('chrome://settings/')
            self.driver.execute_script('chrome.settingsPrivate.setDefaultZoom(0.25);')
            print("Browser setup complete")
        except Exception as e:
            raise Exception(f"Failed to setup browser: {e}")
    
    def wait_for_element(self, selector: str, by: str = "css", timeout: int = 10) -> bool:
        """Wait for element to load with retries"""
        try:
            if by == "css":
                WebDriverWait(self.driver, timeout).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, selector))
                )
            elif by == "class":
                WebDriverWait(self.driver, timeout).until(
                    EC.presence_of_element_located((By.CLASS_NAME, selector))
                )
            return True
        except TimeoutException:
            print(f"Timeout waiting for element: {selector}")
            return False
    
    def safe_extract(self, soup, selectors: list) -> str:
        """Safely extract text using multiple fallback selectors - searches entire subtree"""
        for selector_info in selectors:
            try:
                if len(selector_info) == 2:  # tag, class
                    tag, class_name = selector_info
                    element = soup.find(tag, class_=class_name) if class_name else soup.find(tag)
                elif len(selector_info) == 3:  # tag, class, attribute
                    tag, class_name, attribute = selector_info
                    element = soup.find(tag, class_=class_name) if class_name else soup.find(tag)
                    if element:
                        return element.get(attribute, "")
                elif len(selector_info) == 4:  # tag, class, nested_tag, index OR extract_type
                    tag, class_name, nested_tag, index_or_type = selector_info
                    element = soup.find(tag, class_=class_name) if class_name else soup.find(tag)
                    if element:
                        if index_or_type.isdigit():  # it's an index
                            nested_elements = element.find_all(nested_tag)
                            if len(nested_elements) > int(index_or_type):
                                nested = nested_elements[int(index_or_type)]
                                return nested.get_text(strip=True)
                        else:  # it's an extract type
                            nested = element.find(nested_tag)
                            if nested:
                                if index_or_type == "text":
                                    return nested.get_text(strip=True)
                                else:
                                    return nested.get(index_or_type, "")
                elif len(selector_info) == 5:  # tag, class, nested_tag, index, extract_type
                    tag, class_name, nested_tag, index, extract_type = selector_info
                    element = soup.find(tag, class_=class_name) if class_name else soup.find(tag)
                    if element:
                        nested_elements = element.find_all(nested_tag)
                        if len(nested_elements) > int(index):
                            nested = nested_elements[int(index)]
                            if extract_type == "text":
                                return nested.get_text(strip=True)
                            else:
                                return nested.get(extract_type, "")
                elif len(selector_info) == 6:  # complex nested selectors for nieruchomosci
                    tag, class_name, nested_tag, nested_class, index, final_tag = selector_info
                    element = soup.find(tag, class_=class_name) if class_name else soup.find(tag)
                    if element:
                        nested_elements = element.find_all(nested_tag, class_=nested_class)
                        if len(nested_elements) > int(index):
                            nested = nested_elements[int(index)]
                            final = nested.find(final_tag)
                            if final:
                                return final.get_text(strip=True)
                else:
                    continue
                    
                if element:
                    return element.get_text(strip=True)
            except Exception:
                continue
        return ""
    
    def extract_numbers(self, text: str) -> int:
        """Extract numbers from text, handling commas, spaces, and special characters"""
        if not text:
            return 0
        # remove common non-numeric characters including ² symbol
        clean_text = text.replace(" ", "").replace(",", "").replace(".", "").replace("zł", "").replace("m²", "").replace("²", "")
        numbers = "".join(char for char in clean_text if char.isdigit())
        if numbers:
            # limit to reasonable range for SQLite INTEGER
            num = int(numbers)
            return min(num, 2147483647)  # SQLite INTEGER max value
        return 0
    
    def extract_area(self, text: str) -> int:
        """Extract area from text, handling decimal values properly"""
        if not text:
            return 0
        
        # clean text but preserve decimal structure
        clean_text = text.replace(" ", "").replace("m²", "").replace("²", "").replace("zł", "")
        
        # handle comma 
        if "," in clean_text:
            # split by comma and take only the integer part
            parts = clean_text.split(",")
            if parts[0].isdigit():
                num = int(parts[0])
                return min(num, 2147483647)
        
        # handle dot as decimal separator
        if "." in clean_text:
            parts = clean_text.split(".")
            if parts[0].isdigit():
                num = int(parts[0])
                return min(num, 2147483647)
        
        # if no decimal separators, extract all digits
        numbers = "".join(char for char in clean_text if char.isdigit())
        if numbers:
            num = int(numbers)
            return min(num, 2147483647)
        return 0
    
    def extract_floor(self, text: str) -> int:
        """Extract floor number from text, handling formats like '5/9' correctly"""
        if not text:
            return 0
        
        # handle special cases first
        if "parter" in text.lower():
            return 0
        
        # clean the text
        clean_text = text.strip()
        
        # handle floor formats like "5/9" - take only the first number
        if "/" in clean_text:
            parts = clean_text.split("/")
            first_part = parts[0].strip()
            numbers = "".join(char for char in first_part if char.isdigit())
            if numbers:
                return min(int(numbers), 2147483647)
        
        # handle simple numbers
        numbers = "".join(char for char in clean_text if char.isdigit())
        if numbers:
            return min(int(numbers), 2147483647)
        return 0
    
    def get_page_count(self, city: str, site_config: dict) -> int:
        """Get total page count using site-specific configuration"""
        url = site_config["base_url"].format(city=unidecode(city).lower())
        
        try:
            print(f"Getting page count from: {url}")
            self.driver.get(url)
            
            # wait for page to load using site config
            wait_selector = site_config["selectors"]["wait_element"]
            if not self.wait_for_element(wait_selector["value"], wait_selector["type"], timeout=15):
                print("Page did not load properly for page count")
                return 1
            
            # additional wait for pagination to load
            time.sleep(3)
            
            soup = BeautifulSoup(self.driver.page_source, "html.parser")
            
            # find pagination using site config
            pagination_config = site_config["selectors"]["pagination"]
            pagination = soup.find(pagination_config["tag"], class_=pagination_config["class"])
            
            if pagination:
                page_links = pagination.find_all(pagination_config["item_tag"])
                print(f"Found {len(page_links)} pagination elements")
                
                if page_links:
                    # try to get all numeric page links and find the maximum
                    max_page = 0
                    
                    for link in page_links:
                        text = link.get_text(strip=True)
                        try:
                            page_num = int(text)
                            max_page = max(max_page, page_num)
                        except ValueError:
                            continue
                    
                    if max_page > 0:
                        print(f"Detected {max_page} total pages")
                        return max_page
                    else:
                        print("No numeric page elements found")
            
            # For sites without pagination info, use dynamic discovery
            print(f"Could not determine page count, will use dynamic discovery (default: {site_config['default_pages']})")
            return site_config["default_pages"]
            
        except Exception as e:
            print(f"Error getting page count: {e}")
            return site_config["default_pages"]
    
    def scrape_page(self, city: str, page: int, site_config: dict) -> list:
        """Scrape a single page using site-specific configuration"""
        url = site_config["page_url"].format(city=unidecode(city).lower(), page=page)
        properties = []
        
        try:
            print(f"Scraping {site_config['name']} page {page}: {url}")
            self.driver.get(url)
            
            wait_selector = site_config["selectors"]["wait_element"]
            if not self.wait_for_element(wait_selector["value"], wait_selector["type"]):
                print(f"Page {page} did not load properly")
                return properties
            
            # small delay for dynamic content
            time.sleep(2)
            
            soup = BeautifulSoup(self.driver.page_source, "html.parser")
            
            # find the main listings container
            container_config = site_config["selectors"]["listings_container"]
            listings_container = soup.find(container_config["tag"], class_=container_config["class"])
            
            if not listings_container:
                print(f"No listings container found on page {page}")
                return properties
            
            # get all listings
            listing_config = site_config["selectors"]["listing_item"]
            listings = listings_container.find_all(listing_config["tag"], class_=listing_config["class"])
            print(f"Found {len(listings)} listings on page {page}")
            
            for i, listing in enumerate(listings):
                try:
                    property_data = self.extract_property(listing, i + 1, city, site_config)
                    if property_data:
                        properties.append(property_data)
                        print(f"Extracted property {i+1}: {property_data['title'][:50]}...")
                    else:
                        print(f"Skipped listing {i+1} - missing required data")
                except Exception as e:
                    print(f"Error processing listing {i+1}: {e}")
                    continue
            
            print(f"Successfully extracted {len(properties)} properties from page {page}")
            
        except Exception as e:
            print(f"Error scraping page {page}: {e}")
        
        return properties
    
    def extract_property(self, listing, index: int, city: str, site_config: dict) -> dict:
        """Extract property data using site-specific selectors"""
        try:
            selectors = site_config["selectors"]
            
            # extract link - required field
            link_config = selectors["link"]
            
            if link_config.get("nested"):
                # handle nested link extraction (like h2 > a)
                parent_elem = listing.find(link_config["tag"], class_=link_config["class"])
                if parent_elem:
                    link_elem = parent_elem.find(link_config["nested"]["tag"])
                    if link_elem:
                        link = link_elem.get("href", "")
                    else:
                        link = ""
                else:
                    link = ""
            else:
                # standard link extraction - search anywhere within listing
                link_elem = listing.find(link_config["tag"], class_=link_config["class"])
                link = link_elem.get("href", "") if link_elem else ""
            
            if not link:
                print(f"   Listing {index}: No link found")
                return None
            
            # ensure full URL
            if link.startswith("http"):
                pass  # already full URL
            elif link.startswith("/"):
                link = site_config["base_domain"] + link
            else:
                link = site_config["base_domain"] + "/" + link
            
            # extract title
            title = self.safe_extract(listing, selectors["title"])
            
            if not title:
                print(f"   Listing {index}: No title found")
                return None
            
            # extract image
            image_url = ""
            if "image" in selectors:
                image_config = selectors["image"]
                picture_elem = listing.find(image_config["tag"], class_=image_config["class"])
                if picture_elem:
                    if image_config.get("nested"):
                        source_elem = picture_elem.find(image_config["nested"]["tag"])
                        if source_elem:
                            image_url = source_elem.get(image_config["attribute"], "")
                    else:
                        image_url = picture_elem.get(image_config["attribute"], "")
                    
                    # handle image transformations
                    if image_config.get("transform") == "high_res":
                        # nieruchomosci specific: convert low res to high res
                        if image_url:
                            img_parts = image_url.split("/")
                            if len(img_parts) >= 2:
                                res_part = list(img_parts[-2])
                                if len(res_part) > 0:
                                    res_part[-1] = "l"  # change last character to 'l' for large
                                    img_parts[-2] = "".join(res_part)
                                    image_url = "/".join(img_parts)
            
            # extract address
            address = self.safe_extract(listing, selectors["address"])
            
            # extract price
            price_text = ""
            price_selectors = selectors["price"]
            for selector_info in price_selectors:
                if len(selector_info) == 2:
                    tag, class_name = selector_info
                    if tag == "span" and class_name == "":
                        # find span containing "zł"
                        price_spans = listing.find_all("span")
                        for span in price_spans:
                            span_text = span.get_text(strip=True)
                            if "zł" in span_text and any(char.isdigit() for char in span_text):
                                price_text = span_text
                                break
                        if price_text:
                            break
                    else:
                        price_text = self.safe_extract(listing, [selector_info])
                        if price_text:
                            break
                else:
                    price_text = self.safe_extract(listing, [selector_info])
                    if price_text:
                        break
            
            price = self.extract_numbers(price_text)
            
            # extract details
            rooms = 0
            area = 0
            level = None 
            
            if "details" in selectors:
                detail_config = selectors["details"]
                
                if isinstance(detail_config, dict) and "area" in detail_config:
                    # complex details extraction (for nieruchomosci)
                    if "area" in detail_config:
                        area_selector = detail_config["area"]
                        area_text = self.safe_extract(listing, [area_selector])
                        area = self.extract_area(area_text)
                    
                    if "rooms" in detail_config:
                        # search for div containing "Liczba pokoi:"
                        divs = listing.find_all("div")
                        for div in divs:
                            div_text = div.get_text(strip=True)
                            if "Liczba pokoi:" in div_text:
                                # extract only the part after "Liczba pokoi:"
                                room_part = div_text.split("Liczba pokoi:")[-1].strip()
                                # take only the first word/number
                                room_value = room_part.split()[0] if room_part.split() else ""
                                rooms = self.extract_numbers(room_value)
                                break
                    
                    if "level" in detail_config:
                        # search for div containing "Piętro:"
                        divs = listing.find_all("div")
                        for div in divs:
                            div_text = div.get_text(strip=True)
                            if "Piętro:" in div_text:
                                # extract only the part after "Piętro:"
                                level_part = div_text.split("Piętro:")[-1].strip()
                                # take only the first word/number
                                level_value = level_part.split()[0] if level_part.split() else ""
                                # handle special cases like "parter" = 0
                                if "parter" in level_value.lower():
                                    level = 0
                                else:
                                    level = self.extract_floor(level_value)
                                break
                else:
                    # simple details extraction (like gethome)
                    detail_spans = listing.find_all(detail_config["tag"], class_=detail_config["class"])
                    
                    if len(detail_spans) >= 2:
                        rooms = self.extract_numbers(detail_spans[0].get_text(strip=True))
                        area = self.extract_area(detail_spans[1].get_text(strip=True))

            
            # generate unique ID
            property_id = hashlib.md5(link.encode()).hexdigest()[:12]
            
            property_data = {
                "id": property_id,
                "title": title,
                "price": price,
                "area": area,
                "rooms": rooms,
                "level": level,
                "address": address or city.title(),  # default to city if no address
                "site": site_config["site_name"],
                "link": link,
                "image": image_url
            }
            
            # only return if we have minimum required data
            if property_data["title"] and property_data["link"]:
                return property_data
            else:
                return None
                
        except Exception as e:
            print(f"   Error extracting property data: {e}")
            return None
    
    def save_to_database(self, properties: list) -> int:
        """Save properties to database"""
        if not properties:
            return 0
        
        # ensure tables exist before saving
        try:
            from database import engine, Base
            Base.metadata.create_all(bind=engine)
            print("Database tables verified/created")
        except Exception as e:
            print(f"Warning creating tables: {e}")
            
        db = next(get_db())
        saved_count = 0
        
        try:
            # save properties ONE BY ONE to handle duplicates properly
            for prop_data in properties:
                try:
                    # check if property already exists
                    existing = db.query(Property).filter(Property.link == prop_data["link"]).first()
                    
                    if not existing:
                        property_obj = Property(**prop_data)
                        db.add(property_obj)
                        db.commit()  # commit each one individually
                        saved_count += 1
                        print(f"Added: {prop_data['title'][:50]}...")
                    else:
                        print(f"Already exists: {prop_data['title'][:50]}...")
                except Exception as e:
                    print(f"Error saving property {prop_data.get('title', 'Unknown')[:30]}: {e}")
                    db.rollback()
                    continue
            
            print(f"Saved {saved_count} new properties to database")
            
        except Exception as e:
            print(f"Error saving to database: {e}")
            db.rollback()
        finally:
            db.close()
            
        return saved_count
    
    def scrape_site(self, city: str, site_config: dict, max_pages: int = None) -> dict:
        """Scrape a site using the provided configuration"""
        print(f"Starting {site_config['name']} scraping for {city}")
        
        try:
            self.setup_driver()
            
            # get total page count
            total_pages = self.get_page_count(city, site_config)
            if total_pages == 0:
                print("Could not determine page count or site unavailable")
                return {"success": False, "properties": [], "saved": 0}
            
            # limit pages if specified
            if max_pages:
                total_pages = min(total_pages, max_pages)
            
            print(f"Will scrape up to {total_pages} pages from {site_config['name']}")
            
            all_properties = []
            page = 1
            
            # scrape pages dynamically
            while page <= total_pages:
                print(f"\n{'='*50}")
                print(f"SCRAPING PAGE {page}/{total_pages}")
                print('='*50)
                
                page_properties = self.scrape_page(city, page, site_config)
                
                if not page_properties:
                    print(f"No properties found on page {page}, stopping")
                    break
                
                all_properties.extend(page_properties)
                
                print(f"Page {page} complete: {len(page_properties)} properties")
                print(f"Total so far: {len(all_properties)} properties")
                
                # respectful delay between pages
                delay = site_config.get("delay_between_pages", 3)
                print(f"Waiting {delay} seconds before next page...")
                time.sleep(delay)
                
                page += 1
            
            print(f"\nScraping complete")
            print(f"Total properties found: {len(all_properties)}")
            
            # save to database
            saved_count = self.save_to_database(all_properties)
            
            return {
                "success": True,
                "properties": all_properties,
                "saved": saved_count,
                "total_found": len(all_properties)
            }
            
        except Exception as e:
            print(f"Error during scraping: {e}")
            return {"success": False, "properties": [], "saved": 0, "error": str(e)}
        finally:
            self.cleanup()
    
    def cleanup(self):
        """Cleanup browser resources"""
        if self.driver:
            try:
                self.driver.quit()
                print("Browser cleaned up")
            except Exception:
                pass
            self.driver = None
    
    def __del__(self):
        """Destructor"""
        self.cleanup()


def main():
    """Main function - loads config and runs scraper"""
    import sys
    import os
    
    if len(sys.argv) < 2:
        print("Usage: python newscrapper.py <config_file> [city] [max_pages]")
        print("Example: python newscrapper.py gethome_config.json katowice 5")
        print("Example: python newscrapper.py gethome_config katowice 5")
        return
    
    config_file = sys.argv[1]
    city = sys.argv[2] if len(sys.argv) > 2 else "warszawa"
    max_pages = int(sys.argv[3]) if len(sys.argv) > 3 else None
    
    try:
        # check if config is JSON or Python module
        if config_file.endswith('.json'):
            # load JSON config
            with open(config_file, 'r', encoding='utf-8') as f:
                site_config = json.load(f)
        else:
            # import Python module config
            config = __import__(config_file)
            site_config = config.SITE_CONFIG
        
        print(f"Property Scraper - {site_config['name']}")
        print("=" * 50)
        
        scraper = PropertyScraper(headless=True)
        
        result = scraper.scrape_site(city, site_config, max_pages)
        
        if result["success"]:
            print(f"\nScraping completed successfully")
            print(f"Properties found: {result['total_found']}")
            print(f"Properties saved: {result['saved']}")
        else:
            print(f"Scraping failed: {result.get('error', 'Unknown error')}")
            
    except FileNotFoundError:
        print(f"Error: Config file '{config_file}' not found")
    except ImportError:
        print(f"Error: Could not import config module '{config_file}'")
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in config file: {e}")
    except KeyboardInterrupt:
        print("\nScraping interrupted by user")
    except Exception as e:
        print(f"Unexpected error: {e}")


if __name__ == "__main__":
    main()
