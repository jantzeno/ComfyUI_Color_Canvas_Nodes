import pprint
from .utils import flip_cells, parse_region_data, pil2tensor, DrawColor, process_regions, draw_regions, toggle_divide_mode, rotate_cells
from nodes import MAX_RESOLUTION
from PIL import Image


class RegionalColorRatio:

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "width": ("INT", {"default": 512, "min": 0,
                          "max": MAX_RESOLUTION, "step": 64}),
                "height": ("INT", {"default": 512, "min": 0,
                           "max": MAX_RESOLUTION, "step": 64}),
                "divide_mode": (["rows", "columns"],),
                # "flip": ("BOOLEAN", {"default": False,
                #  "label_on": "rotate 90° counter-clockwise", "label_off": "disabled"}),
                "regions": ("INT", {"default": 1, "min": 1, "max": 16}),
            },
            "hidden": {"extra_pnginfo": "EXTRA_PNGINFO", "unique_id": "UNIQUE_ID"},
        }

    RETURN_TYPES = ("IMAGE", "IMAGE", "COLOR_DICT", "INT", "INT")
    RETURN_NAMES = ("IMAGE", "IMAGE (numbered)",
                    "COLOR_DICT", "WIDTH", "HEIGHT")
    FUNCTION = "doStuff"
    CATEGORY = "Regional Colors"

    def doStuff(self, width, height, divide_mode, regions, extra_pnginfo, unique_id):

        region_data = []
        color = DrawColor()
        for node in extra_pnginfo["workflow"]["nodes"]:
            if node["id"] == int(unique_id):
                region_data = node["properties"]["regions"]
                break

        # filter only active regions
        input_regions = {k: v for k,
                         v in region_data.items() if int(k) <= regions}

        # ensure regions are sorted first to last
        input_regions = dict(sorted(input_regions.items()))

        region_data = process_regions(input_regions, color)

        # rotate cells 90 degrees counter-clockwise
        # should mimic the flip option in sd-regional-prompter
        # if flip:
        #     width, height = height, width
        #     region_data = flip_cells(region_data, divide_mode)

        region_layers, colors = parse_region_data(
            region_data, width, height, divide_mode)

        image, image_numbered = draw_regions(
            width, height, region_layers, divide_mode)

        # image = Image.new("RGB", (width, height))
        # image_numbered = Image.new("RGB", (width, height))
        image_out = pil2tensor(image.convert("RGB"))
        image_numbered_out = pil2tensor(image_numbered.convert("RGB"))

        return {"result": (image_out, image_numbered_out, colors, width, height)}
