# Originally by Davemane42#0042 for ComfyUI
# Forked by jantzeno for ComfyUI
from .nodes.RegionalColorCanvas import RegionalColorCanvas
from .nodes.RegionalColorSelector import RegionalColorSelector
# from .MultiLatentComposite import MultiLatentComposite
import os
import subprocess
import importlib.util
import sys
import filecmp
import shutil

import __main__

python = sys.executable

extensions_folder = os.path.join(os.path.dirname(os.path.realpath(__main__.__file__)),
                                 "web" + os.sep + "extensions" + os.sep + "color_canvas_nodes")
javascript_folder = os.path.join(os.path.dirname(
    os.path.realpath(__file__)), "javascript")

if not os.path.exists(extensions_folder):
    print('Making the "web\extensions\\regional_color_canvas" folder')
    os.mkdir(extensions_folder)

result = filecmp.dircmp(javascript_folder, extensions_folder)

if result.left_only or result.diff_files:
    print('Update to JavaScript files detected')
    file_list = list(result.left_only)
    file_list.extend(x for x in result.diff_files if x not in file_list)

    for file in file_list:
        print(f'Copying {file} to extensions folder')
        src_file = os.path.join(javascript_folder, file)
        dst_file = os.path.join(extensions_folder, file)
        if os.path.exists(dst_file):
            os.remove(dst_file)
        # print("disabled")
        shutil.copy(src_file, dst_file)


def is_installed(package, package_overwrite=None):
    try:
        spec = importlib.util.find_spec(package)
    except ModuleNotFoundError:
        pass

    package = package_overwrite or package

    if spec is None:
        print(f"Installing {package}...")
        command = f'"{python}" -m pip install {package}'

        result = subprocess.run(command, stdout=subprocess.PIPE,
                                stderr=subprocess.PIPE, shell=True, env=os.environ)

        if result.returncode != 0:
            print(
                f"Couldn't install\nCommand: {command}\nError code: {result.returncode}")

# is_installed("huggingface_hub")
# is_installed("onnx")
# is_installed("onnxruntime", "onnxruntime-gpu")


# from .ABGRemover import ABGRemover

NODE_CLASS_MAPPINGS = {
    "RegionalColorCanvas": RegionalColorCanvas,
    "RegionalColorSelector": RegionalColorSelector
}

print('\033[34mRegiopnal Color Canvas: \033[92mLoaded\033[0m')
