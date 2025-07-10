import time
import json
import uuid
import hashlib
from typing import Dict, List, Optional
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.wait import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, WebDriverException
from selenium.webdriver.chrome.options import Options
from bs4 import BeautifulSoup
from unidecode import unidecode
import requests
import pandas as pd
from sqlalchemy.orm import Session

from models import Property, ScrapingJob, PropertySite
from schemas import PropertyBase

class ModernScraper:
    """professional web scraper for real estate sites"""
    
    def __init__(self, headless: bool = True):
        self.headless = headless
        self.driver = None
        self.sites_config = {
            "allegro": {
                "base_url": "https://allegro.pl/kategoria/mieszkania-do-wynajecia-112745",
                "requires_selenium": True,
                "selectors": {
                    "articles": "article",
                    "pagination": "span._1h7wt.mgmw_wo.mh36_8.mvrt_8",
                    "title": "[aria-label]",
                    "price": "div.mli8_k4.msa3_z4.mqu1_1.mp0t_ji.m9qz_yo.mgmw_qw.mgn2_27.mgn2_30_s",
                    "image": "img",
                    "link": "a",
                    "address": "div.mpof_ki.m389_6m.mj7a_4.mgn2_12",
                    "area": "dd.mpof_uk.mp4t_0.m3h2_0.mryx_0.munh_0.mgmw_wo.mg9e_0.mj7a_0.mh36_0.mvrt_8._6a66d_9KC9A",
                    "rooms": "dd.mpof_uk.mp4t_0.m3h2_0.mryx_0.munh_0.mgmw_wo.mg9e_0.mj7a_0.mh36_0.mvrt_8._6a66d_9KC9A"
                }
            },
            "gethome": {
                "base_url": "https://gethome.pl/mieszkania/do-wynajecia",
                "requires_selenium": True,
                "selectors": {
                    "container": "ul.o104vn0c",
                    "listings": "li.o1iv0nf6.lbk9u7d",
                    "title": "div.t7iinf2",
                    "price": "span.o1bbpdyd",
                    "image": "picture.activeSlide source",
                    "link": "a.o13k6g1y",
                    "address": "address",
                    "details": "span.ngl9ymk"
                }
            },
            "olx": {
                "base_url": "https://www.olx.pl/nieruchomosci/mieszkania/wynajem",
                "requires_selenium": True,
                "selectors": {
                    "listings": "[data-cy='l-card']",
                    "title": "h6",
                    "price": "[data-testid='ad-price']",
                    "image": "img.css-8wsg1m",
                    "link": "a",
                    "address": "[data-testid='location-date']",
                    "area": "span.css-643j0o"
                }
            },
            "otodom": {
                "base_url": "https://www.otodom.pl/pl/wyniki/wynajem/mieszkanie",
                "requires_selenium": True,
                "selectors": {
                    "listings": "ul.css-rqwdxd.e1tno8ef0 li",
                    "title": "a.css-16vl3c1.e1njvixn0 p",
                    "price": "span.css-i5x0io.ewvgbgo0",
                    "image": "img",
                    "link": "a.css-16vl3c1.e1njvixn0",
                    "address": "div.css-12h460e.e17ey1dw4 p",
                    "details": "dd"
                }
            }
        }

    def setup_driver(self):
        """setup chrome driver with optimal settings"""
        if self.driver:
            return
            
        options = Options()
        if self.headless:
            options.add_argument("--headless")
        
        # performance optimizations
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-gpu")
        options.add_argument("--disable-extensions")
        options.add_argument("--disable-plugins")
        options.add_argument("--disable-images")
        options.add_argument("--disable-javascript")
        options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        
        try:
            self.driver = webdriver.Chrome(options=options)
            self.driver.set_page_load_timeout(30)
            self.driver.implicitly_wait(10)
        except Exception as e:
            raise WebDriverException(f"failed to setup chrome driver: {e}")

    def safe_extract_text(self, element, selector: str = None) -> str:
        """safely extract text from element"""
        try:
            if selector:
                target = element.select_one(selector)
                return target.get_text(strip=True) if target else ""
            return element.get_text(strip=True) if element else ""
        except Exception:
            return ""

    def safe_extract_attribute(self, element, selector: str, attribute: str) -> str:
        """safely extract attribute from element"""
        try:
            target = element.select_one(selector) if selector else element
            return target.get(attribute, "") if target else ""
        except Exception:
            return ""

    def extract_numbers(self, text: str) -> str:
        """extract numbers from text"""
        if not text:
            return ""
        return "".join(char for char in text if char.isdigit())

    def generate_property_id(self, link: str) -> str:
        """generate unique property id from link"""
        return hashlib.md5(link.encode()).hexdigest()[:12]

    def scrape_site(self, site: str, city: str, max_pages: int = 5) -> List[Dict]:
        """scrape specific site for properties"""
        if site not in self.sites_config:
            raise ValueError(f"unsupported site: {site}")
            
        config = self.sites_config[site]
        properties = []
        
        try:
            if site == "gethome":
                properties = self._scrape_gethome(city, max_pages)
            elif site == "olx":
                properties = self._scrape_olx(city, max_pages)
            elif site == "allegro":
                properties = self._scrape_allegro(city, max_pages)
            elif site == "otodom":
                properties = self._scrape_otodom(city, max_pages)
                
        except Exception as e:
            print(f"error scraping {site}: {e}")
            
        return properties

    def _scrape_gethome(self, city: str, max_pages: int) -> List[Dict]:
        """scrape gethome.pl"""
        properties = []
        base_url = f"https://gethome.pl/mieszkania/do-wynajecia/{unidecode(city).lower()}"
        
        for page in range(1, max_pages + 1):
            url = f"{base_url}/?sort=price&page={page}"
            
            try:
                self.setup_driver()
                self.driver.get(url)
                
                # wait for content to load
                WebDriverWait(self.driver, 10).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, "li.o1iv0nf6"))
                )
                
                soup = BeautifulSoup(self.driver.page_source, "html.parser")
                listings = soup.select("li.o1iv0nf6.lbk9u7d")
                
                if not listings:
                    break
                    
                for listing in listings:
                    try:
                        link_elem = listing.select_one("a.o13k6g1y")
                        if not link_elem or not link_elem.get("href"):
                            continue
                            
                        link = "https://gethome.pl" + link_elem["href"]
                        
                        property_data = {
                            "id": self.generate_property_id(link),
                            "title": self.safe_extract_text(listing, "div.t7iinf2"),
                            "price": self.extract_numbers(self.safe_extract_text(listing, "span.o1bbpdyd")),
                            "address": self.safe_extract_text(listing, "address"),
                            "link": link,
                            "site": "gethome",
                            "image": self.safe_extract_attribute(listing, "picture.activeSlide source", "srcset")
                        }
                        
                        # extract rooms and area
                        details = listing.select("span.ngl9ymk")
                        if len(details) >= 2:
                            property_data["rooms"] = self.extract_numbers(details[0].get_text())
                            property_data["area"] = self.extract_numbers(details[1].get_text())
                            
                        if property_data["price"] and property_data["title"]:
                            properties.append(property_data)
                            
                    except Exception as e:
                        print(f"error processing gethome listing: {e}")
                        continue
                        
            except Exception as e:
                print(f"error scraping gethome page {page}: {e}")
                break
                
        return properties

    def _scrape_olx(self, city: str, max_pages: int) -> List[Dict]:
        """scrape olx.pl"""
        properties = []
        base_url = f"https://www.olx.pl/nieruchomosci/mieszkania/wynajem/{unidecode(city).lower()}"
        
        for page in range(1, max_pages + 1):
            url = f"{base_url}/?search[order]=filter_float_price:asc&view=grid&page={page}"
            
            try:
                self.setup_driver()
                self.driver.get(url)
                
                # wait for listings
                WebDriverWait(self.driver, 10).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, "[data-cy='l-card']"))
                )
                
                soup = BeautifulSoup(self.driver.page_source, "html.parser")
                listings = soup.select("[data-cy='l-card']")
                
                if not listings:
                    break
                    
                for listing in listings:
                    try:
                        link_elem = listing.select_one("a")
                        if not link_elem or not link_elem.get("href"):
                            continue
                            
                        href = link_elem["href"]
                        link = f"https://www.olx.pl{href}" if href.startswith("/") else href
                        
                        property_data = {
                            "id": self.generate_property_id(link),
                            "title": self.safe_extract_text(listing, "h6"),
                            "price": self.extract_numbers(self.safe_extract_text(listing, "[data-testid='ad-price']")),
                            "link": link,
                            "site": "olx",
                            "area": self.extract_numbers(self.safe_extract_text(listing, "span.css-643j0o")),
                            "image": self.safe_extract_attribute(listing, "img.css-8wsg1m", "src")
                        }
                        
                        # extract address
                        address_elem = listing.select_one("[data-testid='location-date']")
                        if address_elem:
                            address_parts = address_elem.get_text().split("-")
                            if len(address_parts) > 1:
                                property_data["address"] = "-".join(address_parts[:-1]).strip()
                            else:
                                property_data["address"] = address_elem.get_text().strip()
                                
                        if property_data["price"] and property_data["title"]:
                            properties.append(property_data)
                            
                    except Exception as e:
                        print(f"error processing olx listing: {e}")
                        continue
                        
            except Exception as e:
                print(f"error scraping olx page {page}: {e}")
                break
                
        return properties

    def _scrape_allegro(self, city: str, max_pages: int) -> List[Dict]:
        """scrape allegro.pl"""
        properties = []
        base_url = f"https://allegro.pl/kategoria/mieszkania-do-wynajecia-112745?order=p&city={city}"
        
        for page in range(1, max_pages + 1):
            url = f"{base_url}&p={page}"
            
            try:
                self.setup_driver()
                self.driver.get(url)
                
                WebDriverWait(self.driver, 10).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, "article"))
                )
                
                soup = BeautifulSoup(self.driver.page_source, "html.parser")
                listings = soup.select("article")[:-4]  # remove last 4 sponsored
                
                if not listings:
                    break
                    
                for listing in listings:
                    try:
                        link_elem = listing.select_one("a")
                        if not link_elem or not link_elem.get("href"):
                            continue
                            
                        link = link_elem["href"]
                        
                        property_data = {
                            "id": self.generate_property_id(link),
                            "title": link_elem.get("aria-label", ""),
                            "price": self.extract_numbers(self.safe_extract_text(listing, "div.mli8_k4")),
                            "link": link,
                            "site": "allegro",
                            "image": self.safe_extract_attribute(listing, "img", "src"),
                            "address": self.safe_extract_text(listing, "div.mpof_ki").replace("Lokalizacja: ", "")
                        }
                        
                        # extract details
                        details = listing.select("dd.mpof_uk")
                        if len(details) >= 3:
                            property_data["area"] = self.extract_numbers(details[0].get_text())
                            property_data["rooms"] = self.extract_numbers(details[1].get_text())
                            property_data["level"] = self.extract_numbers(details[2].get_text())
                            
                        if property_data["price"] and property_data["title"]:
                            properties.append(property_data)
                            
                    except Exception as e:
                        print(f"error processing allegro listing: {e}")
                        continue
                        
            except Exception as e:
                print(f"error scraping allegro page {page}: {e}")
                break
                
        return properties

    def _scrape_otodom(self, city: str, max_pages: int) -> List[Dict]:
        """scrape otodom.pl"""
        properties = []
        
        # load city mapping for otodom
        try:
            df = pd.read_csv("delta-old/data/cites_for_oto.csv")
            city_lower = unidecode(city).lower()
            city_row = df[df['miasto'] == city_lower]
            
            if city_row.empty:
                print(f"city {city} not found in otodom database")
                return properties
                
            city_path = city_row.iloc[0]['link']
            base_url = f"https://www.otodom.pl/pl/wyniki/wynajem/mieszkanie{city_path}?limit=72&by=PRICE&direction=ASC"
            
        except Exception as e:
            print(f"error loading otodom city data: {e}")
            return properties
        
        for page in range(1, max_pages + 1):
            url = f"{base_url}&page={page}"
            
            try:
                self.setup_driver()
                self.driver.get(url)
                
                WebDriverWait(self.driver, 10).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, "ul.css-rqwdxd li"))
                )
                
                soup = BeautifulSoup(self.driver.page_source, "html.parser")
                listings = soup.select("ul.css-rqwdxd.e1tno8ef0 li")[1:]  # skip first ad
                
                if not listings:
                    break
                    
                for listing in listings[:10]:  # limit to avoid ads
                    try:
                        link_elem = listing.select_one("a.css-16vl3c1")
                        if not link_elem or not link_elem.get("href"):
                            continue
                            
                        link = "https://www.otodom.pl" + link_elem["href"]
                        
                        property_data = {
                            "id": self.generate_property_id(link),
                            "title": self.safe_extract_text(listing, "a.css-16vl3c1 p"),
                            "price": self.extract_numbers(self.safe_extract_text(listing, "span.css-i5x0io")),
                            "link": link,
                            "site": "otodom",
                            "image": self.safe_extract_attribute(listing, "img", "src")
                        }
                        
                        # extract address
                        address_elem = listing.select_one("div.css-12h460e p")
                        if address_elem:
                            address_parts = address_elem.get_text().split(", ")[:-2]
                            property_data["address"] = ", ".join(address_parts)
                        
                        # extract details
                        details = listing.select("dd")
                        if len(details) >= 3:
                            property_data["rooms"] = self.extract_numbers(details[0].get_text())
                            property_data["area"] = self.extract_numbers(details[1].get_text())
                            level_text = details[2].get_text().replace("parter", "0").replace("suterena", "0")
                            property_data["level"] = self.extract_numbers(level_text)
                            
                        if property_data["price"] and property_data["title"]:
                            properties.append(property_data)
                            
                    except Exception as e:
                        print(f"error processing otodom listing: {e}")
                        continue
                        
            except Exception as e:
                print(f"error scraping otodom page {page}: {e}")
                break
                
        return properties

    def cleanup(self):
        """cleanup resources"""
        if self.driver:
            try:
                self.driver.quit()
            except Exception:
                pass
            self.driver = None

    def __del__(self):
        """destructor"""
        self.cleanup()
