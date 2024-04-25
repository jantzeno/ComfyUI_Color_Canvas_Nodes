export function CUSTOM_INT(node, inputName, val, func, config = {}) {
	return {
		widget: node.addWidget(
			"number",
			inputName,
			val,
			func,
			Object.assign({}, { min: 0, max: 4096, step: 640, precision: 0 }, config)
		),
	};
}

export function REGION_INT(node, inputName, val, max, func, config = {}) {
	return {
		widget: node.addWidget(
			"number",
			inputName,
			val,
			func,
			Object.assign({}, { min: 1, max: max, step: 10, precision: 0 }, config)
		)
	};
}

export function REGION_STRING(node, inputName, val, func, config = {}) {
	return {
		widget: node.addWidget(
			"text",
			inputName,
			val,
			func,
			Object.assign({}, { multiline: false }, config)
		)
	};
}

export function transformFunc(widget, value, node, key) {
	const s = widget.options.step / 10;
	widget.value = Math.round(value / s) * s;
	node.properties["regions"][node.widgets[node.regionCountWidgetIndex].value][key] = widget.value
}

export function getDrawColor(hue, alpha) {
	let h = hue % 360
	let s = 50;
	let l = 50;
	l /= 100;
	const a = s * Math.min(l, 1 - l) / 100;
	const f = n => {
		const k = (n + h / 30) % 12;
		const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
		return Math.round(255 * color).toString(16).padStart(2, '0');   // convert to Hex and prefix "0" if needed
	};
	return `#${f(0)}${f(8)}${f(4)}${alpha}`;
}

export function computeCanvasSize(node, size) {
	if (node.widgets[0].last_y == null) return;

	const MIN_SIZE = 200;

	// let y = LiteGraph.NODE_WIDGET_HEIGHT * Math.max(node.inputs.length, node.outputs.length) + 5;
	let y = LiteGraph.NODE_WIDGET_HEIGHT * node.outputs.length + 5;
	let freeSpace = size[1] - y;

	// Compute the height of all non custom text widgets
	let widgetHeight = 0;
	for (let i = 0; i < node.widgets.length; i++) {
		const w = node.widgets[i];
		if (w.type !== "customCanvas") {
			if (w.computeSize) {
				widgetHeight += w.computeSize()[1] + 4;
			} else {
				widgetHeight += LiteGraph.NODE_WIDGET_HEIGHT + 5;
			}
		}
	}

	// See how large the canvas can be
	freeSpace -= widgetHeight;

	// There isn't enough space for all the widgets, increase the size of the node
	if (freeSpace < MIN_SIZE) {
		freeSpace = MIN_SIZE;
		node.size[1] = y + widgetHeight + freeSpace;
		node.graph.setDirtyCanvas(true);
	}

	// Position each of the widgets
	for (const w of node.widgets) {
		w.y = y;
		if (w.type === "customCanvas") {
			y += freeSpace;
		} else if (w.computeSize) {
			y += w.computeSize()[1] + 4;
		} else {
			y += LiteGraph.NODE_WIDGET_HEIGHT + 4;
		}
	}

	node.canvasHeight = freeSpace;
}