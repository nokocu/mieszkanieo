"""
mieszkanieo scraper - location mapping
"""

import csv
import os
from unidecode import unidecode


class LocationMapper:
    """Handles location mapping from CSV files"""
    
    def __init__(self):
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
            print(f"Loaded {len(self.location_mapping)} location mappings", flush=True)
        except Exception as e:
            print(f"Error loading location mapping: {e}")
    
    def get_city_url_path(self, city, config):
        """Get URL path for city from CSV mapping"""
        if not config.get("use_csv_location"):
            return unidecode(city).lower()
            
        # load CSV mapping if not already loaded and needed
        if not self.location_mapping and config.get("csv_file"):
            csv_path = config["csv_file"]
            if not os.path.exists(csv_path):
                csv_path = os.path.join(os.path.dirname(__file__), config["csv_file"])

            self.load_location_mapping(csv_path)
            
        city_key = unidecode(city).lower()
        if city_key in self.location_mapping:
            return self.location_mapping[city_key]
        
        print(f"City '{city}' not found in location mapping")
        return None
