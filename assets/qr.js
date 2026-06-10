(function () {
  window.renderQrSvg = function renderQrSvg(text, scale = 8) {
    if (typeof window.qrcode !== "function") {
      throw new Error("QR generator is unavailable.");
    }

    const qr = window.qrcode(0, "M");
    qr.addData(String(text).toUpperCase(), "Alphanumeric");
    qr.make();

    const moduleCount = qr.getModuleCount();
    const quietZone = 4;
    const viewBoxSize = moduleCount + quietZone * 2;
    const rects = [];

    for (let row = 0; row < moduleCount; row += 1) {
      for (let column = 0; column < moduleCount; column += 1) {
        if (qr.isDark(row, column)) {
          rects.push(
            `<rect x="${column + quietZone}" y="${row + quietZone}" width="1" height="1"/>`
          );
        }
      }
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewBoxSize} ${viewBoxSize}" width="${viewBoxSize * scale}" height="${viewBoxSize * scale}" role="img" aria-label="QR code for ${text}">
      <rect width="${viewBoxSize}" height="${viewBoxSize}" fill="#ffffff"/>
      <g fill="#000000" shape-rendering="crispEdges">${rects.join("")}</g>
    </svg>`;
  };
})();
