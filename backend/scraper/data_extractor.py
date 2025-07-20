"""
mieszkanieo scraper - data extraction
"""

import hashlib


class DataExtractor:
    """Handles data extraction and parsing from HTML elements"""
    
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
                                    
                                    # use proper floor extraction for level field
                                    if field == "level":
                                        results[field] = self.extract_floor_number(value_text)
                                    else:
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
    
    def extract_address_from_title(self, title, city, config):
        """Extract address from title text (e.g., 'Mieszkanie, Katowice, Bogucice, 43 m²')"""
        if not title:
            return city.title()
        
        # remove common prefixes like "Mieszkanie, "
        clean_title = title
        if "," in title:
            parts = [part.strip() for part in title.split(",")]
            if len(parts) >= 3:
                # format: "Mieszkanie, City, District, Size"
                # take city and district: "City, District"
                return f"{parts[1]}, {parts[2]}"
            elif len(parts) == 2:
                # format: "Mieszkanie, City, Size" (no district)
                # just return city
                return parts[1].strip()
        
        return city.title()
    
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

    def extract_floor_number(self, text):
        """Extract floor number with proper handling of ground floor vs missing data"""
        if not text:
            return None  # missing data
        
        text_lower = text.lower().strip()
        
        # handle "parter" (ground floor) - return 0
        if "parter" in text_lower:
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
        if digits:
            return int(digits)
        
        # if no digits found, return None (missing data)
        return None

    
    def extract_property(self, listing, city, config):
        """Extract property data from listing element"""
        try:
            selectors = config["selectors"]
            
            # get link
            link_config = selectors["link"]
            
            if isinstance(link_config, dict) and link_config.get("nested"):
                parent = listing.find(link_config["tag"], class_=link_config["class"])
                link_elem = parent.find(link_config["nested"]["tag"]) if parent else None
            elif isinstance(link_config, list):
                # handle list format like [["a", "_1e32a_zIS-q"]]
                link_elem = None
                for selector in link_config:
                    if len(selector) >= 2:
                        tag, css_class = selector[0], selector[1]
                        link_elem = listing.find(tag, class_=css_class)
                        if link_elem:
                            break
            else:
                # find any link in the listing
                link_elem = listing.find("a")
            
            if not link_elem:
                return None
        except Exception as e:
            print(f"ERROR: Error in extract_property: {e}")
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
        
        # get address - handle data attributes or extract from title
        address = ""
        address_config = selectors["address"]
        
        if isinstance(address_config, dict) and address_config.get("data_sentry_component"):
            address_elem = listing.find(address_config["tag"], attrs={"data-sentry-component": address_config["data_sentry_component"]})
            address = address_elem.get_text(strip=True) if address_elem else ""
        else:
            try:
                address = self.find_in_element(listing, selectors["address"])
            except Exception as e:
                print(f"DEBUG: Error in find_in_element for address: {e}")
                address = ""
        
        # if no separate address found, extract from title
        if not address and title:
            address = self.extract_address_from_title(title, city, config)
        
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
        elif isinstance(price_config, dict) and price_config.get("attribute") and price_config.get("data_pattern"):
            # handle attribute-based extraction
            pattern = price_config["data_pattern"]
            price_elems = listing.find_all(price_config["tag"])
            price_text = ""
            for elem in price_elems:
                attr_value = elem.get(price_config["attribute"], "")
                if pattern in attr_value:
                    price_text = attr_value
                    break
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
                # for OLX, find img element and extract from srcset if available
                if config["site_name"] == "olx":
                    img_elem = listing.find(img_config["tag"])
                    if img_elem:
                        # try to get highest quality from srcset first
                        srcset = img_elem.get("srcset", "")
                        if srcset:
                            # parse srcset to find highest resolution (600w)
                            sources = []
                            for source in srcset.split(","):
                                source = source.strip()
                                if " " in source:
                                    url, descriptor = source.rsplit(" ", 1)
                                    # extract width from descriptor like "600w"
                                    if descriptor.endswith("w"):
                                        try:
                                            width = int(descriptor[:-1])
                                            sources.append((width, url.strip()))
                                        except ValueError:
                                            continue
                            
                            # return the URL with highest width
                            if sources:
                                sources.sort(key=lambda x: x[0], reverse=True)
                                image = sources[0][1]
                        
                        # fallback to src if srcset didn't work
                        if not image:
                            image = img_elem.get(img_config["attribute"], "")
                        
                        # handle placeholder images - set to empty instead of showing placeholder
                        if image and ("no_thumbnail" in image or "placeholder" in image):
                            image = ""
                        # fix relative URLs for OLX (only if not a placeholder)
                        elif image and image.startswith("/"):
                            image = config["base_domain"] + image
                else:
                    # for non-OLX sites, use original logic
                    image = self.find_attribute(listing, img_config["tag"], img_config.get("class", ""), img_config["attribute"])
        
        # upgrade image quality from s180 to s720 (allegro)
        if image and "allegroimg.com/s180" in image:
            image = image.replace("s180", "s720")
        
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
                    level = self.extract_floor_number(level_text)
            
            # handle allegro-style label-value pairs
            elif isinstance(details_config, dict) and details_config.get("tag") == "span" and config.get("site_name") != "gethome":
                # Find all spans with the value class
                value_spans = listing.find_all(details_config["tag"], class_=details_config["class"])
                label_spans = listing.find_all("span", class_="mgmw_3z _1e32a_XFNn4")
                
                # Create label-value mapping
                for i, label_span in enumerate(label_spans):
                    label_text = label_span.get_text(strip=True).lower()
                    if i < len(value_spans):
                        value_text = value_spans[i].get_text(strip=True)
                        
                        if "powierzchnia" in label_text:
                            area = self.extract_number(value_text)
                        elif "pokoi" in label_text:
                            rooms = self.extract_number(value_text)
                        elif "piętro" in label_text:
                            level = self.extract_floor_number(value_text)
            
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
                if config.get("site_name") == "gethome":
                    # get room count from specific data-testid
                    room_span = listing.find("span", {"data-testid": "number-of-rooms-offerbox"})
                    if room_span:
                        rooms = self.extract_number(room_span.get_text())
                    
                    # get area from ngl9ymk spans that don't have data-testid
                    area_spans = listing.find_all("span", class_="ngl9ymk")
                    for span in area_spans:
                        if not span.get("data-testid"):  # no data-testid means its area
                            span_text = span.get_text()
                            if any(char.isdigit() for char in span_text):
                                area = self.extract_number(span_text)
                                break
                else:
                    # other simple detail sites
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
            "city": city.title(),
            "site": config["site_name"],
            "link": link,
            "image": image
        }
