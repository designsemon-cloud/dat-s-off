// Finds the boxes of visible UI elements in an image region, with plain pixel
// work (no model): edges → merged into words, lines, controls and card
// outlines → connected components → their bounding boxes. Used by the locate
// pass to draw numbered marks the model picks from (set-of-marks), so a marker
// always sits on a real element, never on empty space.

export interface PxBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

const EDGE = 34; // local contrast that counts as ink (0-255)

/**
 * Element boxes in canvas pixels, nearest to the centre first, at most `max`.
 * `zoom` is how much the crop was enlarged, so merging distances match the
 * original text size.
 */
export function proposeBoxes(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  zoom = 1,
  max = 64,
) {
  // Merge radii: letters → words → short lines (horizontal), not across rows (vertical).
  const RX = Math.round(Math.min(12, Math.max(4, 4 * zoom)));
  const RY = Math.round(Math.min(5, Math.max(2, 1.5 * zoom)));
  const px = ctx.getImageData(0, 0, W, H).data;
  const L = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++)
    L[i] = 0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2];

  // Ink: pixels with local contrast (3×3 max − min). Robust to the blur of
  // upscaled crops and to light, anti-aliased text.
  const edge = new Uint8Array(W * H);
  for (let y = 1; y < H - 1; y++)
    for (let x = 1; x < W - 1; x++) {
      let lo = 255,
        hi = 0;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const v = L[(y + dy) * W + x + dx];
          if (v < lo) lo = v;
          if (v > hi) hi = v;
        }
      if (hi - lo > EDGE) edge[y * W + x] = 1;
    }

  // Remove straight lines longer than a word (panel borders, dividers, outlines,
  // underlines): they'd join everything they touch into one giant box. What's
  // left is text, icons and glyphs, which group into labels below.
  const longRun = Math.round(28 * Math.max(1, zoom));
  // A run is a line only if it's thin: little ink a few pixels above and below
  // it (left and right for vertical runs). Words are runs too, but tall ones.
  const GAP = 4;
  const inkShare = (count: number, len: number) => count / len < 0.3;
  const thinH = (y: number, x0: number, x1: number) => {
    let above = 0,
      below = 0;
    for (let x = x0; x < x1; x++) {
      if (y - GAP >= 0 && edge[(y - GAP) * W + x]) above++;
      if (y + GAP < H && edge[(y + GAP) * W + x]) below++;
    }
    return inkShare(above, x1 - x0) && inkShare(below, x1 - x0);
  };
  const thinV = (x: number, y0: number, y1: number) => {
    let left = 0,
      right = 0;
    for (let y = y0; y < y1; y++) {
      if (x - GAP >= 0 && edge[y * W + x - GAP]) left++;
      if (x + GAP < W && edge[y * W + x + GAP]) right++;
    }
    return inkShare(left, y1 - y0) && inkShare(right, y1 - y0);
  };
  for (let y = 0; y < H; y++) {
    let x = 0;
    while (x < W) {
      if (!edge[y * W + x]) {
        x++;
        continue;
      }
      let end = x;
      while (end < W && edge[y * W + end]) end++;
      if (end - x > longRun && thinH(y, x, end)) edge.fill(0, y * W + x, y * W + end);
      x = end;
    }
  }
  for (let x = 0; x < W; x++) {
    let y = 0;
    while (y < H) {
      if (!edge[y * W + x]) {
        y++;
        continue;
      }
      let end = y;
      while (end < H && edge[end * W + x]) end++;
      if (end - y > longRun && thinV(x, y, end)) for (let k = y; k < end; k++) edge[k * W + x] = 0;
      y = end;
    }
  }

  // Dilate (separable box), so nearby strokes join into one component.
  const horiz = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) {
    let run = 0;
    for (let x = -RX; x < W + RX; x++) {
      if (x + RX < W && edge[y * W + x + RX]) run++;
      if (x - RX - 1 >= 0 && edge[y * W + x - RX - 1]) run--;
      if (x >= 0 && x < W && run > 0) horiz[y * W + x] = 1;
    }
  }
  const mask = new Uint8Array(W * H);
  for (let x = 0; x < W; x++) {
    let run = 0;
    for (let y = -RY; y < H + RY; y++) {
      if (y + RY < H && horiz[(y + RY) * W + x]) run++;
      if (y - RY - 1 >= 0 && horiz[(y - RY - 1) * W + x]) run--;
      if (y >= 0 && y < H && run > 0) mask[y * W + x] = 1;
    }
  }

  // Connected components → boxes (undoing the dilation margin).
  const seen = new Uint8Array(W * H);
  const stack = new Int32Array(W * H);
  const boxes: PxBox[] = [];
  for (let start = 0; start < W * H; start++) {
    if (!mask[start] || seen[start]) continue;
    let top = 0;
    stack[top++] = start;
    seen[start] = 1;
    let x0 = W,
      y0 = H,
      x1 = 0,
      y1 = 0;
    while (top) {
      const i = stack[--top];
      const x = i % W;
      const y = (i - x) / W;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
      const visit = (j: number) => {
        if (mask[j] && !seen[j]) {
          seen[j] = 1;
          stack[top++] = j;
        }
      };
      if (x > 0) visit(i - 1);
      if (x < W - 1) visit(i + 1);
      if (y > 0) visit(i - W);
      if (y < H - 1) visit(i + W);
    }
    const b = {
      x: Math.max(0, x0 + RX - 1),
      y: Math.max(0, y0 + RY - 1),
      w: 0,
      h: 0,
    };
    b.w = Math.min(W, x1 - RX + 2) - b.x;
    b.h = Math.min(H, y1 - RY + 2) - b.y;
    if (b.w < 8 || b.h < 7 || b.w * b.h < 120) continue; // specks
    if (b.w > W * 0.97 && b.h > H * 0.97) continue; // the whole crop
    if (b.w / b.h > 60 || b.h / b.w > 30) continue; // dividers, scrollbars
    boxes.push(b);
  }

  // Drop near-duplicates, keep the ones nearest the centre (where the first guess was).
  const iou = (a: PxBox, b: PxBox) => {
    const ix = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
    const iy = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
    const inter = ix * iy;
    return inter / (a.w * a.h + b.w * b.h - inter);
  };
  const dist = (b: PxBox) => Math.hypot(b.x + b.w / 2 - W / 2, b.y + b.h / 2 - H / 2);
  const unique: PxBox[] = [];
  for (const b of boxes.sort((a, b) => dist(a) - dist(b)))
    if (!unique.some((u) => iou(u, b) > 0.8)) unique.push(b);
  return unique.slice(0, max);
}

const COLORS = ["#e6007a", "#0063e0", "#00894a", "#c25400", "#7a2ee6"];

/** Draws each box with its number, in rotating high-contrast colours (by number, so they match across tiles). */
export function drawMarks(
  ctx: CanvasRenderingContext2D,
  boxes: PxBox[],
  unit: number,
  /** The number on each box; defaults to its position (1-based). */
  numbers?: number[],
) {
  const size = Math.round(11 * unit);
  ctx.font = `bold ${size}px sans-serif`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  const num = (i: number) => numbers?.[i] ?? i + 1;
  boxes.forEach((b, i) => {
    const c = COLORS[num(i) % COLORS.length];
    ctx.strokeStyle = c;
    ctx.lineWidth = 1.5 * unit;
    ctx.strokeRect(b.x, b.y, b.w, b.h);
  });
  boxes.forEach((b, i) => {
    const c = COLORS[num(i) % COLORS.length];
    const text = String(num(i));
    const tw = ctx.measureText(text).width + 6 * unit;
    const th = size + 4 * unit;
    // Tag on the top-left corner, above the box when there's room.
    const tx = b.x;
    const ty = b.y >= th ? b.y - th : b.y;
    ctx.fillStyle = c;
    ctx.fillRect(tx, ty, tw, th);
    ctx.fillStyle = "#fff";
    ctx.fillText(text, tx + tw / 2, ty + th / 2);
  });
}
