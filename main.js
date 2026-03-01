// Initialize canvas

const c = document.getElementById("mainCanvas");
const ctx = c.getContext("2d");

const hiddenCanvas = document.createElement('canvas');
const hiddenCtx = hiddenCanvas.getContext('2d');

const screenshotCanvas = document.createElement('canvas');
const screenshotCtx = screenshotCanvas.getContext('2d');

screenshotCanvas.width = 1500;
screenshotCanvas.height = 1500;

const worker = new Worker('fractalWorker.js');
const screenshotWorker = new Worker('screenshotWorker.js');

const dropdown = document.getElementById("fractalSelect");
let selectedOptionValue = dropdown.value;
let oldSelectedOptionValue = selectedOptionValue;

let zoom = c.width/4; // Zoom of the mandelbrot viewport
let pastX = 0; // Past X mouse position
let pastY = 0; // Past Y mouse position
let pastOffsetX = 0; // Past horizontal offset
let pastOffsetY = 0; // Past vertical offset 
let isMouseDown = false; // Turns true when the mouse is down on the canvas
let offsetX = 0; // Horizontal offset of the viewport (transformation applied)
let offsetY = 0; // Vertical offset of the viewport (transformation applied)
let qualityIndex = 15; // Level of render quality of the viewport
let quality = c.width / qualityIndex; // Calculation of the size of the pixels

function reset()
{
	zoom = c.width/4;
	pastX = 0;
	pastY = 0;
	pastOffsetX = 0;
	pastOffsetY = 0;
	isMouseDown = false;
	offsetX = 0;
	offsetY = 0;
	qualityIndex = 15;
	quality = c.width / qualityIndex;
}

function workerStart() {
	worker.postMessage({
		width: hiddenCanvas.width,
		height: hiddenCanvas.height,
		zoom: zoom / quality,
		offsetX,
		offsetY,
		selection: parseInt(document.getElementById("fractalSelect").value)
	});
}

// Detect if mouse is down and applies the current position to pastX & pastY
c.addEventListener("mousedown", (mouseDown) => {
	if (!isMouseDown) {
		isMouseDown = true;
		pastX = mouseDown.clientX;
		pastY = mouseDown.clientY;
		pastOffsetX = offsetX;
		pastOffsetY = offsetY;
	};
},
{
	passive: true
});

// Detect if mouse is up, changing the mouseDown flag to false and updating the last offsets

c.addEventListener("mouseup", (mouseUp) => {
	isMouseDown = false;
},
{
	passive: true
});

// Detect if mouse moved

c.addEventListener("mousemove", (mouseMove) => {
	if (!isMouseDown) return;

	qualityIndex = 10;

	// Apply new offset according to the position the mouse was when clicked and the current positon
	let zoomFactor = 1 / zoom;
	offsetX = pastOffsetX + ((mouseMove.clientX - pastX) * zoomFactor);
	offsetY = pastOffsetY + ((mouseMove.clientY - pastY) * zoomFactor);

},
{
	passive: true
});

// Detect if the scrollwheel was moved to change the zoom

document.addEventListener("wheel", (Scrolling) => {
	qualityIndex = 10;

	if (Scrolling.deltaY > 0) {
		zoom += zoom / 3;
	};

	if (Scrolling.deltaY < 0) {
		zoom -= zoom / 3;
	};

},
{
	passive: true
});

function lessZoom()
{
	qualityIndex = 10;
	zoom += zoom/3;
}

function moreZoom()
{
	qualityIndex = 10;
	zoom -= zoom/3;
}

worker.onmessage = function(message) {

	if (qualityIndex < 500) {

		qualityIndex += 30;

	};
	hiddenCtx.putImageData(message.data[0], 0, 0);

	generateMandelbrot(hiddenCanvas);

	quality = 500 / qualityIndex;
	hiddenCanvas.width = c.width / quality;
	hiddenCanvas.height = c.height / quality;

	workerStart();
}

function screenshot()
{
	screenshotWorker.postMessage({
		width: screenshotCanvas.width,
		height: screenshotCanvas.height,
		zoom: zoom / quality,
		offsetX,
		offsetY,
		selection: parseInt(document.getElementById("fractalSelect").value)
	});
}

screenshotWorker.onmessage = function(message)
{
	screenshotCtx.putImageData(message.data[0], 0, 0);
	var image = screenshotCanvas.toDataURL();
	// Create a link
	var aDownloadLink = document.createElement('a');
	// Add the name of the file to the link
	aDownloadLink.download = 'fractal.png';
	// Attach the data to the link
	aDownloadLink.href = image;
	// Get the code to click the download link
	aDownloadLink.click();
}

// This function generates the Mandelbrot
function generateMandelbrot(imageData) {
	ctx.clearRect(0, 0, c.width, c.height);

	ctx.drawImage(imageData, 0, 0, hiddenCanvas.width, hiddenCanvas.height, 0, 0, c.width, c.height);

	// Drawing axis and setting font type and size
	ctx.fillStyle = "grey";

	ctx.fillRect(c.width / 2, 0, 1, c.height);
	ctx.fillRect(0, c.height / 2, c.width, 1);
	ctx.font = Math.min(c.width, c.height) / 60 + "px Monospace";

	// Draw coordinate text
	ctx.fillText(Math.round(((c.width / 2) / zoom - offsetX) * 1000000) / 1000000, c.width - 90, c.height / 2 - 20);
	ctx.fillText(Math.round(((0 - c.width / 2) / zoom - offsetX) * 1000000) / 1000000, 20, c.height / 2 - 20);
	ctx.fillText(Math.round(((c.height / 2) / zoom + offsetY) * 1000000) / 1000000, c.width / 2 + 20, 30);
	ctx.fillText(Math.round((((0 - c.height / 2) / zoom) + offsetY) * 1000000) / 1000000, c.width / 2 + 20, c.width - 20);
	ctx.fillText(Math.round(((0 / zoom - offsetX) * 1000000)) / 1000000 + " , " + Math.round(((0 / zoom - offsetY) * 1000000)) / 1000000, c.width / 2 + 20, c.height / 2 - 20);

	ctx.fillText("Zoom: " + Math.round((zoom * 2) / 250) + "x", 20, c.height - 40);
	ctx.fillText("Render quality: " + Math.round((qualityIndex * 100)/525) + "%", 20, c.height - 20);

};

workerStart();