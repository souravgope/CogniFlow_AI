import { jsPDF } from "jspdf";
import mermaid from "mermaid";

async function renderSvg(code) {
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "loose",
    theme: document.documentElement.classList.contains("dark") ? "dark" : "default",
    flowchart: {
      htmlLabels: false,
      curve: "basis"
    }
  });

  const id = `export-${Date.now()}`;
  const { svg } = await mermaid.render(id, code);
  return svg;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function svgToDataUrl(svg) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load the rendered SVG for export."));
    image.src = src;
  });
}

function drawImageToCanvas(image) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(image.naturalWidth || image.width, 1200);
  canvas.height = Math.max(image.naturalHeight || image.height, 800);

  const context = canvas.getContext("2d");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0);

  return canvas;
}

export async function downloadSvg(code) {
  const svg = await renderSvg(code);
  downloadBlob(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }), "diagram.svg");
}

export async function downloadPng(code) {
  const svg = await renderSvg(code);
  const image = await loadImage(svgToDataUrl(svg));
  const canvas = drawImageToCanvas(image);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));

  if (!blob) {
    throw new Error("Unable to create PNG export.");
  }

  downloadBlob(blob, "diagram.png");
}

export async function downloadPdf(code) {
  const svg = await renderSvg(code);
  const image = await loadImage(svgToDataUrl(svg));
  const canvas = drawImageToCanvas(image);

  const pdf = new jsPDF({
    orientation: canvas.width > canvas.height ? "landscape" : "portrait",
    unit: "px",
    format: [canvas.width, canvas.height]
  });
  pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, canvas.width, canvas.height);
  pdf.save("diagram.pdf");
}
