import pprint


class RegionalColorSelector:

    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "color_dict": ("COLOR_DICT",),
                "region_id": ("INT", {"default": 1, "min": 1, "max": 16}),
            },
        }

    # INPUT_IS_LIST = True
    RETURN_TYPES = ("STRING", )
    RETURN_NAMES = ("COLOR_HEX", )
    FUNCTION = "doStuff"
    OUTPUT_NODE = True

    CATEGORY = "Regional Colors"

    def doStuff(self, color_dict, region_id):

        color = "error"
        id = str(region_id)

        if region_id > 16 or region_id < 1:
            pass
        elif id in color_dict:
            color = color_dict[id]

        return {"ui": {"text": (color, )}, "result": (color, )}
