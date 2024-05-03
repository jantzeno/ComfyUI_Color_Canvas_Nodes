import { app } from "../../scripts/app.js";
import { getDrawColor, REGION_STRING } from "./utils.js";

app.registerExtension({
    name: "Comfy.RegionalColorRatio",

    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name === "RegionalColorRatio") {
            nodeType.prototype.onNodeCreated = function () {

                this.serialize_widgets = true;

                let maxRegions = 16
                let blankRegions = {}
                for (let i = 1; i <= maxRegions; i++) {
                    blankRegions[i] = { "ratio": "1" }
                }

                this.setProperty("regions", blankRegions)

                this.size = [315, 255]
                const inputHeight = 24

                let regionCountWidget = this.widgets.find((w) => w.name === "regions");

                if (regionCountWidget) {

                    let preRegions = regionCountWidget.value
                    if (preRegions > 1) {
                        for (let i = 1; i < preRegions; i++) {
                            REGION_STRING(this, "region_" + (i + 1), this.properties["regions"][i + 1].ratio,
                                function (v, _, node) {
                                    node.properties["regions"][i + 1].ratio = v
                                })
                            this.widgets.find((w) => w.name === "region_" + (i + 1)).value = this.properties["regions"][i + 1].ratio
                        }
                        this.size = [this.size[0], this.size[1] + addHeight]
                    } else {
                        REGION_STRING(this, "region_1", this.properties["regions"][1].ratio,
                            function (v, _, node) {
                                node.properties["regions"][1].ratio = v
                            })
                    }


                    regionCountWidget.callback = (v) => {
                        let widgetCount = this.widgets.filter((w) => w.name.startsWith("region_")).length
                        if (v > widgetCount) {
                            for (let i = widgetCount; i < v; i++) {
                                const nodeWidth = this.size[0]
                                let nodeHeight = this.size[1]
                                if (v > widgetCount) {
                                    REGION_STRING(this, "region_" + (i + 1), this.properties["regions"][i + 1].ratio,
                                        function (v, _, node) {
                                            node.properties["regions"][i + 1].ratio = v
                                        })
                                    this.size = [nodeWidth, nodeHeight + inputHeight]
                                }
                            }
                        } else if (v < widgetCount) {
                            for (let i = widgetCount; i > v; i--) {
                                if (this.widgets.at(-1).name === "region_1") {
                                    // do nothing
                                } else {
                                    this.widgets.pop();
                                    this.size[1] -= inputHeight
                                }
                            }
                        }
                    }
                }
            }
        }
    }
})