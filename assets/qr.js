(function () {
  const ALPHANUM = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";
  const FORMAT_L_MASK_0 = 0b111011111000100;

  const exp = new Array(512);
  const log = new Array(256);
  let x = 1;
  for (let i = 0; i < 255; i += 1) {
    exp[i] = x;
    log[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i += 1) exp[i] = exp[i - 255];

  const gfMul = (a, b) => (a && b ? exp[log[a] + log[b]] : 0);
  const bit = (value, index) => ((value >>> index) & 1) === 1;

  function appendBits(buffer, value, length) {
    for (let i = length - 1; i >= 0; i -= 1) {
      buffer.push((value >>> i) & 1);
    }
  }

  function createDataCodewords(text) {
    const clean = text.toUpperCase();
    const bits = [];
    appendBits(bits, 0x2, 4);
    appendBits(bits, clean.length, 9);
    for (let i = 0; i < clean.length; i += 2) {
      const first = ALPHANUM.indexOf(clean[i]);
      const second = ALPHANUM.indexOf(clean[i + 1]);
      if (first < 0 || (clean[i + 1] && second < 0)) {
        throw new Error("QR text contains unsupported characters: " + text);
      }
      if (i + 1 < clean.length) appendBits(bits, first * 45 + second, 11);
      else appendBits(bits, first, 6);
    }

    appendBits(bits, 0, Math.min(4, 152 - bits.length));
    while (bits.length % 8) bits.push(0);

    const data = [];
    for (let i = 0; i < bits.length; i += 8) {
      data.push(bits.slice(i, i + 8).reduce((sum, value) => (sum << 1) | value, 0));
    }
    for (let pad = 0; data.length < 19; pad += 1) {
      data.push(pad % 2 === 0 ? 0xec : 0x11);
    }
    return data;
  }

  function reedSolomon(data) {
    let generator = [1];
    for (let i = 0; i < 7; i += 1) {
      const next = new Array(generator.length + 1).fill(0);
      generator.forEach((coefficient, index) => {
        next[index] ^= coefficient;
        next[index + 1] ^= gfMul(coefficient, exp[i]);
      });
      generator = next;
    }

    const result = new Array(7).fill(0);
    data.forEach((byte) => {
      const factor = byte ^ result.shift();
      result.push(0);
      for (let i = 0; i < 7; i += 1) {
        result[i] ^= gfMul(generator[i + 1], factor);
      }
    });
    return result;
  }

  function reserve(matrix, reserved, row, col, dark) {
    if (row < 0 || col < 0 || row >= 21 || col >= 21) return;
    matrix[row][col] = !!dark;
    reserved[row][col] = true;
  }

  function finder(matrix, reserved, row, col) {
    for (let y = -1; y <= 7; y += 1) {
      for (let x = -1; x <= 7; x += 1) {
        const yy = row + y;
        const xx = col + x;
        if (yy < 0 || xx < 0 || yy >= 21 || xx >= 21) continue;
        const dark =
          x >= 0 &&
          y >= 0 &&
          x <= 6 &&
          y <= 6 &&
          (x === 0 || x === 6 || y === 0 || y === 6 || (x >= 2 && x <= 4 && y >= 2 && y <= 4));
        reserve(matrix, reserved, yy, xx, dark);
      }
    }
  }

  function buildMatrix(text) {
    const matrix = Array.from({ length: 21 }, () => new Array(21).fill(false));
    const reserved = Array.from({ length: 21 }, () => new Array(21).fill(false));

    finder(matrix, reserved, 0, 0);
    finder(matrix, reserved, 0, 14);
    finder(matrix, reserved, 14, 0);

    for (let i = 8; i <= 12; i += 1) {
      reserve(matrix, reserved, 6, i, i % 2 === 0);
      reserve(matrix, reserved, i, 6, i % 2 === 0);
    }

    for (let i = 0; i <= 8; i += 1) {
      reserve(matrix, reserved, 8, i, false);
      reserve(matrix, reserved, i, 8, false);
    }
    for (let i = 13; i < 21; i += 1) {
      reserve(matrix, reserved, 8, i, false);
      reserve(matrix, reserved, i, 8, false);
    }
    reserve(matrix, reserved, 13, 8, true);

    for (let i = 0; i <= 5; i += 1) reserve(matrix, reserved, 8, i, bit(FORMAT_L_MASK_0, i));
    reserve(matrix, reserved, 8, 7, bit(FORMAT_L_MASK_0, 6));
    reserve(matrix, reserved, 8, 8, bit(FORMAT_L_MASK_0, 7));
    reserve(matrix, reserved, 7, 8, bit(FORMAT_L_MASK_0, 8));
    for (let i = 9; i < 15; i += 1) reserve(matrix, reserved, 14 - i, 8, bit(FORMAT_L_MASK_0, i));
    for (let i = 0; i < 8; i += 1) reserve(matrix, reserved, 20 - i, 8, bit(FORMAT_L_MASK_0, i));
    for (let i = 8; i < 15; i += 1) reserve(matrix, reserved, 8, 6 + i, bit(FORMAT_L_MASK_0, i));

    const codewords = createDataCodewords(text);
    const bytes = codewords.concat(reedSolomon(codewords));
    const bits = bytes.flatMap((byte) => Array.from({ length: 8 }, (_, index) => (byte >>> (7 - index)) & 1));

    let index = 0;
    let upward = true;
    for (let right = 20; right >= 1; right -= 2) {
      if (right === 6) right -= 1;
      for (let vert = 0; vert < 21; vert += 1) {
        const row = upward ? 20 - vert : vert;
        for (let j = 0; j < 2; j += 1) {
          const col = right - j;
          if (reserved[row][col]) continue;
          const masked = ((bits[index] || 0) === 1) !== ((row + col) % 2 === 0);
          matrix[row][col] = masked;
          index += 1;
        }
      }
      upward = !upward;
    }
    return matrix;
  }

  window.renderQrSvg = function renderQrSvg(text, scale = 8) {
    const matrix = buildMatrix(text);
    const quiet = 4;
    const size = 21 + quiet * 2;
    const rects = [];
    matrix.forEach((row, y) => {
      row.forEach((dark, x) => {
        if (dark) rects.push(`<rect x="${x + quiet}" y="${y + quiet}" width="1" height="1"/>`);
      });
    });
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size * scale}" height="${size * scale}" role="img" aria-label="QR code for ${text}">
      <rect width="${size}" height="${size}" fill="#fffaf2"/>
      <g fill="#7f2518">${rects.join("")}</g>
    </svg>`;
  };
})();
