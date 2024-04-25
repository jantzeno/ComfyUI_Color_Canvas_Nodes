# Originally MultiAreaConditioning by Davemane42#0042 for ComfyUI
# Forked by jantzeno

from .utils import pil2tensor
from PIL import Image, ImageDraw


class RegionalColorCanvas:

    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {},
            "optional": {},
            "hidden": {"extra_pnginfo": "EXTRA_PNGINFO", "unique_id": "UNIQUE_ID"},
        }

    RETURN_TYPES = ("IMAGE", "COLOR_DICT", "INT", "INT")
    RETURN_NAMES = ("IMAGE", "COLOR_DICT", "WIDTH", "HEIGHT")
    FUNCTION = "doStuff"
    CATEGORY = "Regional Colors"

    def doStuff(self, extra_pnginfo, unique_id):

        regions = []
        active_regions = 0
        canvasX = 512
        canvasY = 512

        for node in extra_pnginfo["workflow"]["nodes"]:
            if node["id"] == int(unique_id):
                regions = node["properties"]["regions"]
                active_regions = node["properties"]["activeRegions"]
                canvasX = node["properties"]["width"]
                canvasY = node["properties"]["height"]
                break

        # filter only active regions
        output_regions = {k: v for k,
                          v in regions.items() if int(k) <= active_regions}

        # ensure regions are sorted
        # regions are stacked from first to last
        output_regions = dict(sorted(output_regions.items()))

        image = Image.new("RGB", (canvasX, canvasY))
        draw = ImageDraw.Draw(image)

        color_map = {}

        for region, values in output_regions.items():

            x, y = values["x"], values["y"]
            w, h = values["width"], values["height"]
            color = values["color"]

            color_map[region] = color

            if x+w > canvasX:
                w = max(0, canvasX-x)

            if y+h > canvasY:
                h = max(0, canvasY-y)

            if w == 0 or h == 0:
                continue

            draw.rectangle([x, y, x+w, y+h], fill=color)

        image_out = pil2tensor(image.convert("RGB"))

        return (image_out, color_map, canvasX, canvasY)
# ----------
