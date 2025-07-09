import time
from pprint import pprint

from selenium.common import TimeoutException
from selenium.webdriver.common.by import By
from unidecode import unidecode
from tkinter import *
from tkinter import ttk, filedialog, messagebox
from ctypes import windll, byref, sizeof, c_int
from bs4 import BeautifulSoup, element
import sv_ttk
import requests
from selenium import webdriver
import undetected_chromedriver as uc
from selenium.webdriver.support.wait import WebDriverWait
import selenium.webdriver.support.expected_conditions as ec
import json
import csv
import pandas as pd
from selenium.webdriver.common.keys import Keys



# returns dictionary with urls and page numbers to scrap
def create_dictionary(driver, city, sites):
    dictionary_sites = {}

    for site in sites:

        if site == "allegro":
            # url
            dictionary_sites["allegro"] = {}
            dictionary_sites["allegro"]["url"] = "https://allegro.pl/kategoria" + "/mieszkania-do-wynajecia-112745" + "?order=p" + f"&city={city}" + "&p=1"
            # page amount (selenium use needed)
            driver.get(dictionary_sites["allegro"]["url"])
            if wait_until_element_located(driver, "css", "article"):
                soup = BeautifulSoup(driver.page_source, "html.parser")
                try:
                    dictionary_sites["allegro"]["pages"] = int(try_scraping(([soup], ["find", 'span', "_1h7wt mgmw_wo mh36_8 mvrt_8"])))
                except ValueError:
                    dictionary_sites["allegro"]["pages"] = 0
                    print("[error] allegro.pl: loaded but not pages found")
            else:
                print("[error] allegro.pl: site didn't load")
                dictionary_sites["allegro"]["pages"] = 0
            print(f'[info] allegro.pl: {dictionary_sites["allegro"]["pages"]} pages')

        elif site == "gethome":
            # url
            dictionary_sites["gethome"] = {}
            dictionary_sites["gethome"]["url"] = "https://gethome.pl" + "/mieszkania/do-wynajecia" + f"/{unidecode(city)}" + "/?sort=price" + "&page=1"
            # page amount
            response = requests.get(dictionary_sites["gethome"]["url"])
            soup = BeautifulSoup(response.text, "html.parser")
            if response.status_code == 200:
                try:
                    dictionary_sites["gethome"]["pages"] = int(try_scraping(([soup], ["find", "ul", "gh-1wjowh8 e134q4pk1"], ["find_all", "li", "", "-1"], ["find", "a", ""], ["find", "span", ""])))
                except ValueError:
                    dictionary_sites["gethome"]["pages"] = 0
                    print(f"[error] gethome.pl: code 200 but no pages found")
            else:
                dictionary_sites["gethome"]["pages"] = 0
                print(f"[error {response.status_code}] gethome.pl: site didn't load")
            print(f'[info] gethome.pl: {dictionary_sites["gethome"]["pages"]} pages')

        elif site == "nieruchomosci":
            # url
            dictionary_sites["nieruchomosci"] = {}
            dictionary_sites["nieruchomosci"]["url"] = "https://nieruchomosci-online.pl/szukaj.html" + "?3,mieszkanie,wynajem" + f",,{city}" + "&o=price,asc" + "&p=1"
            # page amount (selenium use needed)
            driver.get(dictionary_sites["nieruchomosci"]["url"])
            if wait_until_element_located(driver, "css", "path"):
                soup = BeautifulSoup(driver.page_source, "html.parser")
                try:
                    dictionary_sites["nieruchomosci"]["pages"] = int(try_scraping(([soup], ["find_all", "span", "furthers", "-1"], ["find", "a", ""])))
                except ValueError:
                    dictionary_sites["nieruchomosci"]["pages"] = 0
                    print("[error] nieruchomosci-online.pl: loaded but not pages found")
            else:
                dictionary_sites["nieruchomosci-online"]["pages"] = 0
                print(f"[error] nieruchomosci-online.pl: site didn't load")
            print(f'[info] nieruchomosci-online.pl: {dictionary_sites["nieruchomosci"]["pages"]} pages')

        elif site == "olx":
            # url
            dictionary_sites["olx"] = {}
            dictionary_sites["olx"]["url"] = "https://www.olx.pl/nieruchomosci" + "/mieszkania/wynajem" + f"/{unidecode(city)}" + "/?search[order]=filter_float_price:asc" + "&view=grid" + "&page=1"
            # page amount
            response = requests.get(dictionary_sites["olx"]["url"])
            soup = BeautifulSoup(response.text, "html.parser")
            if response.status_code == 200:
                try:
                    dictionary_sites["olx"]["pages"] = int(try_scraping(([soup], ["find_all", "li", "css-ps94ux", "-1"], ["find", "a", ""])))
                except ValueError:
                    dictionary_sites["olx"]["pages"] = 0
                    print(f"[error] olx.pl: code 200 but no pages found")
            else:
                dictionary_sites["olx"]["pages"] = 0
                print(f"[error {response.status_code}] olx.pl: site didn't load")
            print(f'[info] olx.pl: {dictionary_sites["olx"]["pages"]} pages')

        elif site == "otodom":
            with open('data/cites_for_oto.csv', 'r') as city_list:
                df = pd.read_csv(city_list)
                city = unidecode(city).lower()
                df.set_index("miasto", inplace=True)
                try:
                    # url
                    city_string = df.loc[f"{city}"]["link"]
                    dictionary_sites["otodom"] = {}
                    dictionary_sites["otodom"]["url"] = "https://www.otodom.pl/pl/wyniki" + "/wynajem/mieszkanie" + city_string + "?limit=72&by=PRICE&direction=ASC" + "&page=1"
                    # page amount
                    response = requests.get(dictionary_sites["otodom"]["url"])
                    soup = BeautifulSoup(response.text, "html.parser")
                    if response.status_code == 200:
                        try:
                            dictionary_sites["otodom"]["pages"] = int(try_scraping(([soup], ["find_all", "li", "css-1tospdx", "-1"])))
                        except ValueError:
                            dictionary_sites["otodom"]["pages"] = 0
                            print("[error] otodom.pl: code 200 but no pages found")
                    else:
                        dictionary_sites["otodom"]["pages"] = 0
                        print(f"[error {response.status_code}] otodom.pl: site didn't load")
                except KeyError:
                    print(f"[error] city {city} not found in otomoto database")
            print(f'[info] otodom.pl: {dictionary_sites["otodom"]["pages"]} pages')

    return dictionary_sites


# waits until element found on site
def wait_until_element_located(driver, by, reference):
    tries = 5
    while tries != 0:
        try:
            if by == "css":
                WebDriverWait(driver, 2).until(ec.presence_of_element_located((By.CSS_SELECTOR, f'{reference}')))
            elif by == "class":
                WebDriverWait(driver, 2).until(ec.presence_of_element_located((By.CLASS_NAME, f"{reference}")))
            return True
        except TimeoutException:
            tries -= 1
            print(f"[error] wait_until_element_located: {tries} tries left")

    print("[error] wait_until_element_located: didnt find the element, did page not load?")
    return False


# exception handler for scraping
def try_scraping(web_elements):
    data = web_elements[0][0]
    web_elements = list(web_elements[1:])
    for web_element in web_elements:
        try:
            if web_element[0] == "find_with_value":
                data = data.find(f"{web_element[1]}", {f"{web_element[2]}": f"{web_element[3]}"})
            elif web_element[0] == "find_all_with_value":
                return data.find_all(f"{web_element[1]}", {f"{web_element[2]}": f"{web_element[3]}"})
            elif web_element[0] == "data_attribute":
                return data[f'{web_element[1]}']

            elif web_element[0] == "find":
                if web_element[2] != "":
                    data = data.find(f'{web_element[1]}', class_=f"{web_element[2]}")
                else:
                    data = data.find(f'{web_element[1]}')

            elif web_element[0] == "find_all":
                if web_element[2] != "":
                    if web_element[3] == "all":
                        return data.find_all(f'{web_element[1]}', class_=f"{web_element[2]}")
                    else:
                        data = data.find_all(f'{web_element[1]}', class_=f"{web_element[2]}")[int(web_element[3])]
                else:
                    if web_element[3] == "all":
                        return data.find_all(f'{web_element[1]}')
                    else:
                        data = data.find_all(f'{web_element[1]}')[int(web_element[3])]

            elif web_element[0] == "find_attribute":
                if web_element[2] != "":
                    return data.find(f'{web_element[1]}', class_=f"{web_element[2]}")[f"{web_element[3]}"]
                else:
                    return data.find(f'{web_element[1]}')[f"{web_element[3]}"]

            elif web_element[0] == "find_all_except":
                if web_element[2] != "":
                    data = data.find_all(f"{web_element[1]}", class_=f"{web_element[2]}")[:int(web_element[3])]
                    return data
                else:
                    data = data.find_all(f"{web_element[1]}")[:int(web_element[3])]
                    return data

        except (AttributeError, KeyError, IndexError, TypeError):
            return "none"

    try:
        return data.text
    except (AttributeError, KeyError, IndexError, TypeError):
        return "none"

def get_digits(string):
    numbers = "0123456789"
    if "," in string:
        string = string.split(",")[0]
    return "".join([symbol for symbol in string if symbol in numbers])

# returns data from url
def scrap(driver, scrap_url):
    scrapped_listings = {}

    if "gethome.pl" in scrap_url:
        driver.get(scrap_url)

        if wait_until_element_located(driver, "class", "oifs6rx"):
            soup = BeautifulSoup(driver.page_source, "html.parser")
            listings_list = try_scraping(([soup], ["find", "ul", "o104vn0c"], ["find_all", "li", "o1iv0nf6 lbk9u7d", "all"]))

            for listing in listings_list:
                link = "https://gethome.pl" + try_scraping(([listing],        ["find_attribute", "a", "o13k6g1y", "href"]))
                scrapped_listings[link] = {}
                scrapped_listings[link]["link"] = link
                scrapped_listings[link]["image"] = try_scraping(([listing],   ["find", "picture", "activeSlide"], ["find_attribute", "source", "", "srcset"]))
                scrapped_listings[link]["title"] = try_scraping(([listing],   ["find", "div", "t7iinf2"]))
                scrapped_listings[link]["address"] = try_scraping(([listing], ["find", "address", ""]))
                scrapped_listings[link]["price"] = get_digits(try_scraping(([listing],   ["find", "span", "o1bbpdyd"])))
                scrapped_listings[link]["rooms"] = get_digits(try_scraping(([listing],   ["find_all", "span", "ngl9ymk", "0"])))
                scrapped_listings[link]["area"] = get_digits(try_scraping(([listing],    ["find_all", "span", "ngl9ymk", "1"])))
        else:
            return False

    elif "olx.pl" in scrap_url:
        driver.get(scrap_url)

        if wait_until_element_located(driver, "class", "onetrust-pc-dark-filter"):
            body = driver.find_element(By.CSS_SELECTOR, 'body')
            body.send_keys(Keys.PAGE_DOWN)
            time.sleep(1)
            soup = BeautifulSoup(driver.page_source, "html.parser")
            listings_list = try_scraping(([soup], ["find_all_with_value", "div", "data-cy", "l-card"]))

            for listing in listings_list:
                link = try_scraping(([listing], ["find_attribute", "a", "", "href"]))
                if link[:3] == "/d/":
                    link = "https://www.olx.pl" + link
                scrapped_listings[link] = {}
                scrapped_listings[link]["link"] = link
                scrapped_listings[link]["image"] = try_scraping(([listing],                ["find", "div", "css-gl6djm"], ["find_attribute", "img", "css-8wsg1m", "src"])).replace("200x0;q=50", "1000x700")
                scrapped_listings[link]["title"] = try_scraping(([listing],                ["find", "h6", ""]))
                scrapped_listings[link]["price"] = get_digits(try_scraping(([listing],     ["find_with_value", "p", "data-testid", "ad-price"])))
                scrapped_listings[link]["area"] = get_digits(try_scraping(([listing],      ["find", "span", "css-643j0o"])))
                if scrapped_listings[link]["image"] == "none":
                    scrapped_listings[link]["image"] = try_scraping(([listing], ["find", "div", "css-gl6djm"],["find_attribute", "img", "css-gwhqbt","src"])).replace("200x0;q=50", "1000x700")
                if "/app/static/media/no_thumbnail" in scrapped_listings[link]["image"]:
                    scrapped_listings[link]["image"] = "https://www.olx.pl" + scrapped_listings[link]["image"]
                non_split_address = try_scraping(([listing], ["find_with_value", "p", "data-testid", "location-date"]))
                split_address = non_split_address.split("-")
                split_address.pop(len(split_address) - 1)
                scrapped_listings[link]["address"] = "-".join(split_address)
        else:
            return False

    elif "allegro.pl" in scrap_url:
        driver_allegro = uc.Chrome(use_subprocess=False, headless=True)
        driver = driver_allegro
        driver.get(scrap_url)

        if wait_until_element_located(driver, "css", "article"):
            soup = BeautifulSoup(driver.page_source, "html.parser")
            listings_list = try_scraping(([soup], ["find_all_except", "article", "", "-4"]))

            for listing in listings_list:
                link = try_scraping(([listing], ["find_attribute", "a", "", "href"]))
                scrapped_listings[link] = {}
                scrapped_listings[link]["link"] = link
                scrapped_listings[link]["image"] = try_scraping(([listing],            ["find_attribute", "img", "", "src"])).replace("s180", "original")
                scrapped_listings[link]["title"] = try_scraping(([listing],            ["data_attribute", "aria-label", ""]))
                scrapped_listings[link]["address"] = try_scraping(([listing],          ["find", "div", "mpof_ki m389_6m mj7a_4 mgn2_12"])).replace("Lokalizacja: ", "")
                scrapped_listings[link]["price"] = get_digits(try_scraping(([listing], ["find", "div", "mli8_k4 msa3_z4 mqu1_1 mp0t_ji m9qz_yo mgmw_qw mgn2_27 mgn2_30_s"])))
                scrapped_listings[link]["area"] = get_digits(try_scraping(([listing],  ["find_all", "dd", "mpof_uk mp4t_0 m3h2_0 mryx_0 munh_0 mgmw_wo mg9e_0 mj7a_0 mh36_0 mvrt_8 _6a66d_9KC9A", "0"])))
                scrapped_listings[link]["rooms"] = get_digits(try_scraping(([listing], ["find_all", "dd", "mpof_uk mp4t_0 m3h2_0 mryx_0 munh_0 mgmw_wo mg9e_0 mj7a_0 mh36_0 mvrt_8 _6a66d_9KC9A", "1"])))
                scrapped_listings[link]["level"] = get_digits(try_scraping(([listing], ["find_all", "dd", "mpof_uk mp4t_0 m3h2_0 mryx_0 munh_0 mgmw_wo mg9e_0 mj7a_0 mh36_0 mvrt_8 _6a66d_9KC9A", "2"])))
        else:
            driver.quit()
            return False

        driver.quit()

    elif "nieruchomosci-online.pl" in scrap_url:
        driver.get(scrap_url)

        if wait_until_element_located(driver, "css", "path"):
            soup = BeautifulSoup(driver.page_source, "html.parser")
            listings_list = try_scraping(([soup], ["find_all", "div", "tile-inner tile-inner-primary", "all"]))

            for listing in listings_list:
                link = try_scraping(([listing], ["find", "h2", ""], ["find_attribute", "a", "", "href"]))
                scrapped_listings[link] = {}
                scrapped_listings[link]["link"] = link
                img_low = try_scraping(([listing], ["find_attribute", "img", "", "src"]))
                img_high = img_low.split("/")
                image_res = list(img_high[-2])
                image_res[-1] = "l"
                image_res = "".join(image_res)
                img_high[-2] = image_res
                scrapped_listings[link]["image"] = "/".join(img_high)
                scrapped_listings[link]["title"] = try_scraping(([listing],            ["find", "h2", ""], ["find", "a", ""]))
                scrapped_listings[link]["address"] = try_scraping(([listing],          ["find", "p", "province"], ["find", "a", ""]))
                scrapped_listings[link]["price"] = get_digits(try_scraping(([listing], ["find", "p", "title-a primary-display"], ["find", "span", ""])))
                scrapped_listings[link]["area"] = get_digits(try_scraping(([listing],  ["find", "p", "title-a primary-display"], ["find_all", "span", "", "1"])))
                level = get_digits(try_scraping(([listing],                            ["find", "table", "table-a"], ["find_all", "td", "", "0"], ["find", "span", ""])))
                rooms = get_digits(try_scraping(([listing],                            ["find", "table", "table-a"], ["find_all", "td", "", "1"], ["find", "span", ""])))
                if level != "":
                    scrapped_listings[link]["level"] = level
                if level != "":
                    scrapped_listings[link]["rooms"] = rooms
        else:
            return False

    elif "otodom.pl" in scrap_url:
        print("line 320")
        driver.get(scrap_url)
        if wait_until_element_located(driver, "class", "onetrust-pc-dark-filter"):
            soup = BeautifulSoup(driver.page_source, "html.parser")
            listings_list = try_scraping(([soup], ["find_all", "ul", "css-rqwdxd e1tno8ef0", "1"], ["find_all", "li", "", "all"]))
            for listing in listings_list:
                if listings_list.index(listing) != 3:
                    link = "https://www.otodom.pl" + (try_scraping(([listing],    ["find_attribute", "a", "css-16vl3c1 e1njvixn0", "href"])))
                    scrapped_listings[link] = {}
                    scrapped_listings[link]["link"] = link
                    scrapped_listings[link]["image"] = try_scraping(([listing],   ["find_attribute", "img", "", "src"]))
                    scrapped_listings[link]["title"] = try_scraping(([listing],   ["find", "a", "css-16vl3c1 e1njvixn0"], ["find", "p", ""]))
                    split_address = try_scraping(([listing], ["find", "div", "css-12h460e e17ey1dw4"], ["find", "p", ""])).split(", ")[:-2]
                    scrapped_listings[link]["address"] = ", ".join(split_address)
                    scrapped_listings[link]["price"] = get_digits(try_scraping(([listing],   ["find", "span", "css-i5x0io ewvgbgo0"])))
                    scrapped_listings[link]["level"] = get_digits(try_scraping(([listing],   ["find_all", "dd", "", "2"])).replace("parter", "0").replace("suterena", "0"))
                    scrapped_listings[link]["area"] = get_digits(try_scraping(([listing],    ["find_all", "dd", "", "1"])))
                    scrapped_listings[link]["rooms"] = get_digits(try_scraping(([listing],   ["find_all", "dd", "", "0"])))
                    type_row1 = try_scraping(([listing], ["find", "div", "css-s6dbfx e1r80qxr2"], ["find_all", "div", "", "0"]))
                    type_row2 = try_scraping(([listing], ["find", "div", "css-s6dbfx e1r80qxr2"], ["find_all", "div", "", "1"]))
                    if type_row2 != "none" or "Biuro nieruchomości" in type_row1:
                        scrapped_listings[link]["type"] = type_row1
        else:
            print("line 343")
            return False

    return scrapped_listings

# scrapping sequence - scrap the page and change page to next
if __name__ == "__main__":
    start = time.time()

    driver = uc.Chrome(use_subprocess=False, headless=True)
    driver.get('chrome://settings/')
    driver.execute_script('chrome.settingsPrivate.setDefaultZoom(0.25);')

    database = {}
    site_dictionary = create_dictionary(driver, "Kraków", ["olx", "nieruchomosci", "gethome", "allegro", "otodom"])

    for site in site_dictionary.values():
        if site["pages"] > 0:
            current_page = 1
            scrap_url = site["url"]
            while current_page <= site["pages"]:
                scrapped_listings = scrap(driver, scrap_url)
                if scrapped_listings:
                    database.update(scrapped_listings)
                    current_page += 1
                    print(f"[info] collecting page {current_page} of {site["pages"]} at {site["url"][:25]}...")

                    if "gethome.pl" in site["url"] or "olx.pl" in site["url"] or "otodom.pl" in site["url"]:
                        split_url = site["url"].split("&page=")
                        split_url[1] = f"&page={current_page}"
                        scrap_url = ''.join(split_url)
                    elif "nieruchomosci-online.pl" in site["url"] or "allegro.pl" in site["url"]:
                        split_url = site["url"].split("&p=")
                        split_url[1] = f"&p={current_page}"
                        scrap_url = ''.join(split_url)
                else:
                    current_page = site["pages"]+1
                    print(f"[error] aborting remaining pages")

    with open(f"output.json", "w", encoding="utf-8") as outputfile:
        json.dump(database, outputfile)

    end = time.time()
    print(f"[info] finished - total listings: {len(database)}!")
    print(f"Time elapsed: {end - start}")
    driver.quit()
    exit(0)
    exit(0)

