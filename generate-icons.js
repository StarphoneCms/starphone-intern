const { createCanvas } = require("canvas");
const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "public/icons");
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#11131a";
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = "#181c24";
  const radius = size * 0.22;
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(size - radius, 0);
  ctx.quadraticCurveTo(size, 0, size, radius);
  ctx.lineTo(size, size - radius);
  ctx.quadraticCurveTo(size, size, size - radius, size);
  ctx.lineTo(radius, size);
  ctx.quadraticCurveTo(0, size, 0, size - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = `bold ${size * 0.55}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("S", size / 2, size / 2);

  return canvas.toBuffer("image/png");
}

[192, 512].forEach((size) => {
  const buffer = generateIcon(size);
  fs.writeFileSync(path.join(dir, `icon-${size}x${size}.png`), buffer);
  console.log(`✅ icon-${size}x${size}.png erstellt`);
});
