
"""
Entry point for mieszkanieo scraper
"""

import sys
import json
import os
from scraper import PropertyScraper


def main():
    """Run scraper from command line"""
    print("scraper_entry: starting", flush=True)
    
    if len(sys.argv) < 2:
        print("usage: python scraper_entry.py <config_file> [city] [job_id] [max_pages]")
        return
    
    config_file = sys.argv[1]
    city = sys.argv[2] if len(sys.argv) > 2 else "katowice"
    job_id = sys.argv[3] if len(sys.argv) > 3 else None
    
    # handle max_pages
    max_pages = None
    if len(sys.argv) > 4:
        try:
            max_pages = int(sys.argv[4])
        except ValueError:
            max_pages = None
    
    print(f"scraper_entry: config={config_file}, city={city}, job_id={job_id}, max_pages={max_pages}", flush=True)
    
    try:
        with open(config_file, 'r', encoding='utf-8') as f:
            config = json.load(f)
        
        print(f"scraper_entry: loaded config for {config.get('name', 'unknown')}", flush=True)
        
        scraper = PropertyScraper(headless=True, job_id=job_id)
        result = scraper.scrape_site(city, config, max_pages)
        
        if result["success"]:
            print(f"main: scraping completed", flush=True)
            print(f"main: found: {result['total_found']}", flush=True)
            print(f"main: saved: {result['saved']}", flush=True)
        else:
            print(f"main: scraping failed: {result.get('error', 'unknown error')}", flush=True)
            
    except FileNotFoundError:
        print(f"main: config file not found: {config_file}", flush=True)
    except Exception as e:
        print(f"main: error: {e}", flush=True)
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
