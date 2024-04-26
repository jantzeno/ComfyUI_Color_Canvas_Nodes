from .utils import pil2tensor, DrawColor, process_regions
from PIL import Image, ImageDraw
from nodes import MAX_RESOLUTION


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
                "rotate": ("BOOLEAN", {"default": False,
                           "label_on": "90° counter-clockwise", "label_off": "disabled"}),
                "regions": ("INT", {"default": 1, "min": 1, "max": 16}),
            },
            "hidden": {"extra_pnginfo": "EXTRA_PNGINFO", "unique_id": "UNIQUE_ID"},
        }

    RETURN_TYPES = ("IMAGE", "IMAGE", "COLOR_DICT", "INT", "INT")
    RETURN_NAMES = ("IMAGE", "IMAGE (numbered)",
                    "COLOR_DICT", "WIDTH", "HEIGHT")
    FUNCTION = "doStuff"
    CATEGORY = "Regional Colors"

    def doStuff(self, width, height, divide_mode, rotate, regions, extra_pnginfo, unique_id, **kwargs):

        region_data = []
        color_map = {}
        color = DrawColor()
        black = (0, 0, 0)

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
        if rotate:
            width, height = height, width
            if divide_mode == "columns":
                divide_mode = "rows"
                for r, d in region_data.items():
                    if r == "layout":
                        continue
                    d["cell_ratios"] = list(reversed(d["cell_ratios"]))
            else:
                divide_mode = "columns"
                region_data = dict(reversed(region_data.items()))

        image = Image.new("RGB", (width, height))
        image_numbered = Image.new("RGB", (width, height))
        draw = ImageDraw.Draw(image)
        draw_numbered = ImageDraw.Draw(image_numbered)

        start_x = 0
        start_y = 0
        count = 0
        for region, values in region_data.items():
            if region == "layout":
                continue
            region_percentage = region_data["layout"][int(region) - 1]
            cell_count = len(values["cell_ratios"])
            if divide_mode == "columns":
                thickness = region_percentage * height
            else:
                thickness = region_percentage * width
            for i in range(cell_count):
                fill_color = values["colors"][i]
                if divide_mode == "columns":
                    x = start_x
                    y = start_y
                    w = width * values["cell_ratios"][i]
                    h = thickness
                    start_x += w
                    font_size = h * 0.6
                else:
                    x = start_x
                    y = start_y
                    w = thickness
                    h = height * values["cell_ratios"][i]
                    start_y += h
                    font_size = w * 0.6
                draw.rectangle([x, y, x + w, y + h], fill=fill_color)
                draw_numbered.rectangle([x, y, x + w, y + h], fill=fill_color)
                draw_numbered.text([x, y], str(count + 1),
                                   fill=black, font_size=font_size)

                color_map[str(count + 1)] = values["colors"][i]
                count += 1

            if divide_mode == "columns":
                start_x = 0
                start_y += thickness
            else:
                start_y = 0
                start_x += thickness

        image_out = pil2tensor(image.convert("RGB"))
        image_numbered_out = pil2tensor(image_numbered.convert("RGB"))

        return {"result": (image_out, image_numbered_out, color_map, width, height)}
