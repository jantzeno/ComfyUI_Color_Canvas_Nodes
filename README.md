# Region Color Nodes for [ComfyUI](https://github.com/comfyanonymous/ComfyUI)

## Installation:

- Navigate to the `/ComfyUI/custom_nodes/` folder
- `git clone https://github.com/jantzeno/ComfyUI_Color_Canvas_Nodes`
- Start ComfyUI
  - all require file should be downloaded/copied from there.
  - no need to manually copy/paste .js files anymore

---

# Todo: Update README

## Regional Color Canvas

Grid based canvas to visualize regions. Outputs an image and dictionary of colors.

<details close="close">
    <summary>Right click menu to add/remove/swap layers:</summary>
    <img src="./images/RightClickMenu.png">
</details>
Display what node is associated with current input selected

<img src="./images/MultiAreaConditioning_node.png" width="500px">

this also come with a <strong>ConditioningUpscale</strong> node.  
useseful for hires fix workflow

<img src="./images/ConditioningUpscale_node.png" width="500px">
<details close="close">
    <summary>Result example:</summary>
    <img src="./images/MultiAreaConditioning_result.png" width="500px">
</details>
<details close="close">
    <summary>Workflow example:</summary>
    <img src="./images/MultiAreaConditioning_workflow.svg" width="100%">
</details>

## Regional Color Ratio

Specify regions based on rows or columns and the ratio of regions in that section.
11 -> 1+1=2, two regions, 50% | 50%
111 => 1+1+1=3, three regions, 33% | 33% | 33%
1234 => 1+2+3+4=10, four regions, 10% | 20% | 30% | 40%

## Visual Examples

11
111
1234

211
46

1
1
111

11
23
32

---

## Regional Color Selector

Select the region and output regions hex color.

<details close="close">
    <summary>Right click menu to add/remove/swap layers:</summary>
    <img src="./images/RightClickMenu.png">
</details>
Display what node is associated with current input selected

<img src="./images/MultiLatentComposite_node.png" width="500px">

<details close="close">
    <summary>Result example:</summary>
    <img src="./images/MultiLatentComposite_result.png" width="500px">
</details>
<details close="close">
    <summary>Workflow example:</summary>
    <img src="./images/MultiLatentComposite_workflow.svg" width="100%">
</details>

---

# Known issues
