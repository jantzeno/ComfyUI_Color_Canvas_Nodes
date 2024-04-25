# From Comfyroll
from math import isclose, sqrt
import numpy as np
import torch
from PIL import Image


def tensor2pil(image):
    return Image.fromarray(np.clip(255. * image.cpu().numpy().squeeze(), 0, 255).astype(np.uint8))


def pil2tensor(image):
    return torch.from_numpy(np.array(image).astype(np.float32) / 255.0).unsqueeze(0)


def toInt(value):
    try:
        return int(value)
    except ValueError:
        return 0


def get_draw_color(hue, alpha):
    h = hue % 360
    s = 50
    l = 50
    l /= 100
    a = s * min(l, 1 - l) / 100

    def calculate_color(n, h, l, a):
        k = (n + h / 30) % 12
        color = l - a * max(min(k - 3, 9 - k, 1), -1)
        return hex(int(255 * color))[2:].zfill(2)

    red = calculate_color(0, h, l, a)
    green = calculate_color(8, h, l, a)
    blue = calculate_color(4, h, l, a)

    return "#{}{}{}{}".format(red, green, blue, alpha)


class DrawColor:

    current_color = 1

    def __init__(self):
        self.current_color = 1

    def getColor(self, hue=""):
        color = get_draw_color(self.current_color * 199, hue)
        self.current_color += 1
        return color


def process_regions(region, drawColor):
    alphabet = "abcdefghijklmnopqrstuvwxyz"
    # does not include comma or period
    special_characters = " !\"#$%&'()*+-./:;<=>?@[\\]^_`{|}~"

    layout = []
    region_data = {}
    template = {"cells": "", "cell_ratios": [], "colors": []}
    for r, d in region.items():
        region_txt = d["ratio"]
        region_txt = region_txt.strip(alphabet)
        region_txt = region_txt.strip(special_characters)
        region_txt = region_txt.strip()

        region_prep = region_txt.split(",")
        if isinstance(region_prep, list):
            region_ints = [toInt(x) for x in region_prep]
            data = template.copy()

            if 0 in region_ints:
                region_ints = [1]
                data["cells"] = 1
                data["cell_ratios"] = region_ints
                data["colors"] = ["#000000"]
            elif len(region_ints) == 1:
                data["cells"] = str(region_ints[0])
                data["cell_ratios"] = [1]
                data["colors"] = [drawColor.getColor()]
            else:
                region_sum = sum(region_ints[1:])
                region_ratios = []
                for i in region_ints[1:]:
                    region_ratios.append(float(i / region_sum))
                data["cells"] = len(region_ints[1:])
                data["cell_ratios"] = round_to_100(region_ratios)
                data["colors"] = [drawColor.getColor() for x in region_ratios]

            layout.append(region_ints[0])
            region_data[r] = data

    layout_sum = sum(layout)
    region_data["layout"] = round_to_100(
        [x / layout_sum for x in layout])

    return region_data


def error_gen(actual, rounded):
    if actual == 0:
        return 0
    divisor = sqrt(1.0 if actual < 1.0 else actual)
    return abs(rounded - actual) ** 2 / divisor


def round_to_100(percents):
    percents = [x * 100 for x in percents]
    if not isclose(sum(percents), 100):
        raise ValueError
    n = len(percents)
    rounded = [int(x) for x in percents]
    up_count = 100 - sum(rounded)
    errors = [(error_gen(percents[i], rounded[i] + 1) -
               error_gen(percents[i], rounded[i]), i) for i in range(n)]
    rank = sorted(errors)
    for i in range(up_count):
        rounded[rank[i][1]] += 1
    return ([x / 100 for x in rounded])
