import { app } from "/scripts/app.js";
import { CUSTOM_INT, REGION_INT, transformFunc, getDrawColor, computeCanvasSize } from "./utils.js"

function addColorCanvas(node, app) {

	const maxRegions = 16
	const minCellSize = 8
	const maxCellSize = 64

	const widget = {
		type: "customCanvas",
		name: "RegionalColorCanvas",
		get value() {
			return this.canvas.value;
		},
		set value(x) {
			this.canvas.value = x;
		},
		draw: function (ctx, node, widgetWidth, widgetY) {

			// If we are initially offscreen when created we wont have received a resize event
			// Calculate it here instead
			if (!node.canvasHeight) {
				computeCanvasSize(node, node.size)
			}

			const visible = true //app.canvasblank.ds.scale > 0.5 && this.type === "customCanvas";
			const t = ctx.getTransform();
			const margin = 10
			const border = 2

			const widgetHeight = node.canvasHeight
			const regions = node.properties["regions"]
			const width = Math.round(node.properties["width"])
			const height = Math.round(node.properties["height"])
			let cellSize = Math.round(node.properties["cellSize"])
			if (cellSize < minCellSize) {
				cellSize = minCellSize
			}
			if (cellSize > maxCellSize) {
				cellSize = maxCellSize
			}

			const scale = Math.min((widgetWidth - margin * 2) / width, (widgetHeight - margin * 2) / height)

			// Round, CUSTOM_INT has mega precision, maybe need a better solution
			let current_region = parseInt(node.widgets[node.regionCountWidgetIndex].value)
			if (current_region > maxRegions) {
				current_region = maxRegions
			}

			Object.assign(this.canvas.style, {
				left: `${t.e}px`,
				top: `${t.f + (widgetY * t.d)}px`,
				width: `${widgetWidth * t.a}px`,
				height: `${widgetHeight * t.d}px`,
				position: "absolute",
				zIndex: 1,
				fontSize: `${t.d * 10.0}px`,
				pointerEvents: "none",
			});

			this.canvas.hidden = !visible;

			let backgroundWidth = width * scale
			let backgroundHeight = height * scale

			let xOffset = margin
			if (backgroundWidth < widgetWidth) {
				xOffset += (widgetWidth - backgroundWidth) / 2 - margin
			}
			let yOffset = margin
			if (backgroundHeight < widgetHeight) {
				yOffset += (widgetHeight - backgroundHeight) / 2 - margin
			}

			let widgetX = xOffset
			widgetY = widgetY + yOffset

			ctx.fillStyle = "#000000"
			ctx.fillRect(widgetX - border, widgetY - border, backgroundWidth + border * 2, backgroundHeight + border * 2)

			ctx.fillStyle = globalThis.LiteGraph.NODE_DEFAULT_BGCOLOR
			ctx.fillRect(widgetX, widgetY, backgroundWidth, backgroundHeight);

			function getDrawArea(r) {
				let x = r.x * backgroundWidth / width
				let y = r.y * backgroundHeight / height
				let w = r.width * backgroundWidth / width
				let h = r.height * backgroundHeight / height

				if (x > backgroundWidth) { x = backgroundWidth }
				if (y > backgroundHeight) { y = backgroundHeight }

				if (x + w > backgroundWidth) {
					w = Math.max(0, backgroundWidth - x)
				}

				if (y + h > backgroundHeight) {
					h = Math.max(0, backgroundHeight - y)
				}

				return [x, y, w, h]
			}

			// Draw all the canvas colors
			for (const [k, v] of Object.entries(regions)) {
				if (k == current_region) { continue }
				if (k > node.properties["activeRegions"]) { break }

				const [x, y, w, h] = getDrawArea(v)

				// let hPercent = k / Object.values(regions).length
				let hue = k * 199
				ctx.fillStyle = getDrawColor(hue, "80") //colors[k] + "B0"
				ctx.fillRect(widgetX + x, widgetY + y, w, h)

			}

			ctx.beginPath();
			ctx.lineWidth = 1;

			for (let x = 0; x <= width / cellSize; x += 1) {
				ctx.moveTo(widgetX + x * cellSize * scale, widgetY);
				ctx.lineTo(widgetX + x * cellSize * scale, widgetY + backgroundHeight);
			}

			for (let y = 0; y <= height / cellSize; y += 1) {
				ctx.moveTo(widgetX, widgetY + y * cellSize * scale);
				ctx.lineTo(widgetX + backgroundWidth, widgetY + y * cellSize * scale);
			}

			ctx.strokeStyle = "#00000050";
			ctx.stroke();
			ctx.closePath();

			// Draw currently selected region
			let [x, y, w, h] = getDrawArea(regions[current_region])

			w = Math.max(cellSize * scale, w)
			h = Math.max(cellSize * scale, h)

			//ctx.fillStyle = "#"+(Number(`0x1${colors[index].substring(1)}`) ^ 0xFFFFFF).toString(16).substring(1).toUpperCase()
			ctx.fillStyle = "#ffffff"
			ctx.fillRect(widgetX + x, widgetY + y, w, h)

			let hue = current_region * 199
			const selectedColor = getDrawColor(hue, "FF")
			regions[current_region].color = selectedColor.slice(0, 7);
			ctx.fillStyle = selectedColor
			ctx.fillRect(widgetX + x + border, widgetY + y + border, w - border * 2, h - border * 2)

			if (node.selected) {
			}

		},
	};

	widget.canvas = document.createElement("canvas");
	widget.canvas.className = "regional-color-canvas";

	widget.parent = node;
	document.body.appendChild(widget.canvas);

	node.addCustomWidget(widget);

	app.canvas.onDrawBackground = function () {
		// Draw node isn't fired once the node is off the screen
		// if it goes off screen quickly, the input may not be removed
		// this shifts it off screen so it can be moved back if the node is visible.
		for (let n in app.graph._nodes) {
			n = app.graph._nodes[n];
			for (let w in n.widgets) {
				let wid = n.widgets[w];
				if (Object.hasOwn(wid, "canvas")) {
					wid.canvas.style.left = -8000 + "px";
					wid.canvas.style.position = "absolute";
				}
			}
		}
	};

	node.onResize = function (size) {
		computeCanvasSize(node, size);
	}

	return { minWidth: 200, minHeight: 200, widget }
}

app.registerExtension({
	name: "Comfy.RegionalColorCanvas.",
	async beforeRegisterNodeDef(nodeType, nodeData, app) {
		if (nodeData.name === "RegionalColorCanvas") {
			const onNodeCreated = nodeType.prototype.onNodeCreated;
			nodeType.prototype.onNodeCreated = function () {
				const r = onNodeCreated ? onNodeCreated.apply(this, arguments) : undefined;

				// start with 1 region, not 0 because not an array
				let maxRegions = 16
				let blankRegions = {}
				for (let i = 1; i <= maxRegions; i++) {
					blankRegions[i] = { "x": 0, "y": 0, "width": 0, "height": 0, "color": "" }
				}
				let defaultCellSize = 64

				this.setProperty("width", 512)
				this.setProperty("height", 512)
				this.setProperty("regions", blankRegions)
				this.setProperty("activeRegions", 1)
				this.setProperty("cellSize", defaultCellSize)

				this.selected = false
				this.regionCountWidgetIndex = 5
				this.size = [315, 600]
				this.serialize_widgets = true;

				CUSTOM_INT(this, "canvasX", 512,
					function (v, _, node) {
						const s = this.options.step / 10;
						this.value = Math.round(v / s) * s;
						node.properties["width"] = this.value
					}
				)
				CUSTOM_INT(this, "canvasY", 512,
					function (v, _, node) {
						const s = this.options.step / 10;
						this.value = Math.round(v / s) * s;
						node.properties["height"] = this.value
					}
				)
				REGION_INT(this, "regions", 1, maxRegions,
					function (r, _, node) {
						let activeRegions = r
						if (activeRegions > maxRegions) {
							activeRegions = maxRegions
							this.value = maxRegions
						}

						node.properties["activeRegions"] = activeRegions
						let regionInput = node.widgets[5]
						regionInput.options.max = activeRegions
						if (regionInput.value > activeRegions) {
							regionInput.value = activeRegions
						}
					},
				)

				CUSTOM_INT(this, "cell size", defaultCellSize,
					function (v, _, node) {

						let currentCellSize = node.properties["cellSize"]
						let newCellSize = currentCellSize
						if (v > currentCellSize) {
							newCellSize <<= 1
						} else if (v < currentCellSize) {
							newCellSize >>= 1
						}

						this.value = newCellSize
						node.properties["cellSize"] = newCellSize
						const newStepSize = newCellSize * 10
						// x
						node.widgets[6].options.step = newStepSize
						// y
						node.widgets[7].options.step = newStepSize
						// width
						node.widgets[8].options.step = newStepSize
						// height
						node.widgets[9].options.step = newStepSize
					}, { min: 8, max: 64, step: 80, precision: 0 })

				addColorCanvas(this, app)

				REGION_INT(this, "region", 1, maxRegions,
					function (r, _, node) {

						if (r > maxRegions) {
							r = maxRegions
							this.value = maxRegions
						}

						if (r > node.properties["activeRegions"]) {
							r = node.properties["activeRegions"]
							this.value = node.properties["activeRegions"]
						}

						const regions = node.properties["regions"]

						let currentRegion = r
						if (currentRegion && regions[currentRegion]) {
							node.widgets[6].value = regions[currentRegion].x
							node.widgets[7].value = regions[currentRegion].y
							node.widgets[8].value = regions[currentRegion].width
							node.widgets[9].value = regions[currentRegion].height
						}
					},
				)

				CUSTOM_INT(this, "x", 0, function (r, _, node) { transformFunc(this, r, node, "x") })
				CUSTOM_INT(this, "y", 0, function (r, _, node) { transformFunc(this, r, node, "y") })
				CUSTOM_INT(this, "width", 0, function (r, _, node) { transformFunc(this, r, node, "width") })
				CUSTOM_INT(this, "height", 0, function (r, _, node) { transformFunc(this, r, node, "height") })

				this.onRemoved = function () {
					// When removing this node we need to remove the input from the DOM
					for (let y in this.widgets) {
						if (this.widgets[y].canvas) {
							this.widgets[y].canvas.remove();
						}
					}
				};

				this.onSelected = function () {
					this.selected = true
				}
				this.onDeselected = function () {
					this.selected = false
				}

				return r;
			};
		}
	},
});