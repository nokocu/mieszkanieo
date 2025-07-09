# low = "https://a.allegroimg.com/s180/1e194c/b40278e74027a6ad5090cac4bbeb/Wynajem-mieszkania-ul-Agatowa-Krakow"
#
#
# hi = "https://a.allegroimg.com/original/1e194c/b40278e74027a6ad5090cac4bbeb"
#
#
# print(low.replace("s180", "original"))

#
# low = "https://ireland.apollo.olxcdn.com/v1/files/08tsc7f3eww32-PL/image;s=200x0;q=50"
#
# hi = "https://ireland.apollo.olxcdn.com/v1/files/08tsc7f3eww32-PL/image;s=1000x700"
#
# .replace("200x0;q=50", "1000x700")

hi = "https://i.st-nieruchomosci-online.pl/h6gmpgx/mieszkanie-krakow.jpg"

img_low = "https://i.st-nieruchomosci-online.pl/h6gmpgc/mieszkanie-krakow.jpg"

img_high = img_low.split("/")
image_res = list(img_high[-2])
image_res[-1] = "x"
image_res = "".join(image_res)
img_high[-2] = image_res
img_high = "/".join(img_high)





