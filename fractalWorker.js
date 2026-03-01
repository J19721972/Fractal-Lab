onmessage = function(message) {
  const {
    width,
    height,
    zoom,
    offsetX,
    offsetY,
    selection
  } = message.data;
  const imageData = new ImageData(width, height);
  const data = imageData.data;
  //calculateBurningShip(width,height,zoom,offsetX,offsetY,data)
  calculateFractal(width,height,zoom,offsetX,offsetY,data,selection);
  postMessage([imageData, width, height]);
}

function interpolateColor(color1, color2, t) {
  return [    Math.round((1 - t) * color1[0] + t * color2[0]),
    Math.round((1 - t) * color1[1] + t * color2[1]),
    Math.round((1 - t) * color1[2] + t * color2[2])
  ];
}

function calculateFractal(width,height,zoom,offsetX,offsetY,data,fractalType)
{
// Definition of color gradient
  const colorStops = [    { stop: 0.0, color: [0, 0, 0] },
    { stop: 0.2, color: [230, 0, 0] },
    { stop: 0.4, color: [255, 210, 0] },
    { stop: 0.6, color: [255, 255, 255] },
    { stop: 0.8, color: [0, 255, 0] },
    { stop: 1.0, color: [0, 0, 255] }
  ];

      for (let y = height; y > 0; y--) {
        for (let x = 0; x < width; x++) {
          const mappedX = (x - width / 2) / zoom - offsetX;
          const mappedY = (y - height / 2) / zoom - offsetY;
          let d = 0;
          let a = mappedX;
          let b = mappedY;
          let i = 0;
          let zReal = 0;
          let zImag = 0;
          for (; i < 10**3; i++) {
            switch (fractalType) {
              case 0:
                a = zReal * zReal - zImag * zImag + mappedX;
                b = 2 * zReal * zImag + mappedY;
                zReal = a;
                zImag = b;
                d = zReal * zReal + zImag * zImag;
                break;
              case 1:
                const a2 = a ** 2;
                const b2 = b ** 2;
                const aNew = a2 - b2 + mappedX;
                const bNew = 2 * Math.abs(a) * Math.abs(b) + mappedY;
                a = aNew;
                b = bNew;
                d = a2 + b2;
                break;
              case 2:
                const dNew = a ** 2 - b ** 2 + mappedX;
                b = 2 * b * a + mappedY;
                a = dNew + b / dNew * b;
                d = dNew;
                break;
            }
          
            if (d > 100) {
              break;
            }
          }

      // Map the number of iterations to a color in the gradient
      const stopSize = 1.0 / colorStops.length;
      const stopIndex = Math.min(Math.floor(i / (150 * stopSize)), colorStops.length - 1);
      const prevStop = colorStops[stopIndex];
      const nextStop = colorStops[stopIndex + 1] || prevStop;
      const stopOffset = (i / 150 - prevStop.stop) / (nextStop.stop - prevStop.stop);
      const color = interpolateColor(prevStop.color, nextStop.color, stopOffset);

      const pixelIndex = (y * width + x) * 4;
      data[pixelIndex] = color[0]; // red
      data[pixelIndex + 1] = color[1]; // green
      data[pixelIndex + 2] = color[2]; // blue
      data[pixelIndex + 3] = 255; // alpha
    }
  }
}