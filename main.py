import json
import time
import webbrowser
from flask import Flask, render_template, request
from unidecode import unidecode
import os


# init ###############################################################################
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('FLASK_KEY')


# funkcje ###############################################################################
def clamp(n, typeof=None, low=None, max=None, default=None):
    if typeof == "numeric":
        try:
            n = int(n)
        except (TypeError, ValueError):
            return default
        if n < low:
            return low
        elif n > max:
            return max
        else:
            return n
    elif typeof == "string":
        if isinstance(n, str) and n != "":
            return n
        else:
            return default

def filtering(dictionary, location=None, site_a=None,
              site_g=None, site_n=None,
              site_o=None, site_ot=None,
              minprice=None, maxprice=None,
              minrooms=None, maxrooms=None,
              minlevel=None, maxlevel=None,
              minarea=None, maxarea=None,
              sortmin=None, sortmax=None):

    filtered_entries = {}

    for url, entry in dictionary.items():
        filter_counter = 0
        if 'price' in entry:
            if not maxprice >= int(entry['price']) >= minprice:
                filter_counter += 1

        if 'area' in entry:
            if not maxarea >= int(entry['area']) >= minarea:
                filter_counter += 1

        if 'rooms' in entry:
            if not maxrooms >= int(entry['rooms']) >= minrooms:
                filter_counter += 1
        else:
            filter_counter += 1

        if 'level' in entry:
            if not maxlevel >= int(entry['level']) >= minlevel:
                filter_counter += 1
        else:
            filter_counter += 1

        if location is not None:
            if unidecode(location) not in unidecode(entry['address']):
                filter_counter += 1

        sites = [site_a, site_g, site_n, site_o, site_ot]
        if None in sites:
            wrong_site_counter = 0
            for site in sites:
                if site not in entry['link']:
                    wrong_site_counter += 1
            if wrong_site_counter == len(sites):
                filter_counter += 1

        if filter_counter == 0:
            filtered_entries[url] = entry

    if sortmax == "on":
        return dict(sorted(filtered_entries.items(), key=lambda item: int(item[1]['price']), reverse=True))
    elif sortmin == "on":
        return dict(sorted(filtered_entries.items(), key=lambda item: int(item[1]['price'])))


# routes ###############################################################################
@app.route('/', methods=["GET", "POST"])
def home():
    filter_city = clamp(request.args.get("city"),              typeof="string",  default="krakow")
    filter_a = clamp(request.args.get("switchA"),              typeof="string",  default="Allegro")
    filter_g = clamp(request.args.get("switchG"),              typeof="string",  default="Gethome")
    filter_n = clamp(request.args.get("switchN"),              typeof="string",  default="Nieruchomosci")
    filter_o = clamp(request.args.get("switchO"),              typeof="string",  default="Olx")
    filter_ot = clamp(request.args.get("switchOt"),            typeof="string",  default="Otomoto")
    filter_pricemin = clamp(request.form.get("inputPriceMin"), typeof="numeric", low=0, max=999999, default=-1)
    filter_pricemax = clamp(request.form.get("inputPriceMax"), typeof="numeric", low=0, max=999999, default=999999)
    filter_levelmin = clamp(request.form.get("inputLevelMin"), typeof="numeric", low=0, max=999999, default=-1)
    filter_levelmax = clamp(request.form.get("inputLevelMax"), typeof="numeric", low=0, max=999999, default=999999)
    filter_areamin = clamp(request.form.get("inputAreaMin"),   typeof="numeric", low=0, max=999999, default=-1)
    filter_areamax = clamp(request.form.get("inputAreaMax"),   typeof="numeric", low=0, max=999999, default=999999)
    filter_roomsmin = clamp(request.form.get("inputRoomsMin"), typeof="numeric", low=0, max=999999, default=-1)
    filter_roomsmax = clamp(request.form.get("inputRoomsMax"), typeof="numeric", low=0, max=999999, default=999999)
    filter_address = clamp(request.form.get("inputAddress"),   typeof="string",  default=None)
    sort_from_min = clamp(request.form.get("checkSortMin"),    typeof="string",  default="on")
    sort_from_max = clamp(request.form.get("checkSortMax"),    typeof="string",  default=None)

    with open(f"data/{unidecode(filter_city).lower()}.json", "r", encoding="UTF-8") as data:
        data = json.load(data)
        filtered_data = filtering(dictionary=data,          location=filter_address, site_a=filter_a,
                                  site_g=filter_g,          site_n=filter_n,
                                  site_o=filter_o,          site_ot=filter_ot,
                                  minprice=filter_pricemin, maxprice=filter_pricemax,
                                  minrooms=filter_roomsmin, maxrooms=filter_roomsmax,
                                  minlevel=filter_levelmin, maxlevel=filter_levelmax,
                                  minarea=filter_areamin,   maxarea=filter_areamax,
                                  sortmin=sort_from_min,    sortmax=sort_from_max)

        return render_template("index.html", data=filtered_data)


if __name__ == "__main__":
    app.run(debug=True, port=5069)
    time.sleep(2)
    webbrowser.open_new("http://127.0.0.1:5069/")
