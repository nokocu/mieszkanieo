"""
mieszkanieo scraper - api client
"""

import requests


class APIClient:
    """Handles API communication"""
    
    def __init__(self, api_url="http://localhost:8000"):
        self.api_url = api_url
    
    def delete_all_properties(self):
        """Delete all properties from database"""
        try:
            response = requests.delete(
                f"{self.api_url}/api/properties",
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                deleted_count = result.get('deletedCount', 0)
                print(f"delete_all_properties: deleted {deleted_count} properties from database")
                return deleted_count
            else:
                print(f"delete_all_properties: api error {response.status_code}: {response.text}")
                return 0
                
        except Exception as e:
            print(f"delete_all_properties: delete error: {e}")
            return 0

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