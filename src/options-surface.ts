export type OptionSurfacePoint = {
  /** Strike or moneyness coordinate. */
  strike: number;
  /** Expiry coordinate, usually days to expiration. */
  expiry: number;
  /** Surface height, for example implied volatility. */
  value: number;
};

export type OptionSurfaceOptions = {
  data?: OptionSurfacePoint[];
  background?: string;
  strikeFormatter?: (strike: number) => string;
  expiryFormatter?: (expiry: number) => string;
  valueFormatter?: (value: number) => string;
  /** Label for the horizontal strike or moneyness dimension. */
  strikeLabel?: string;
  /** Label for the receding expiration dimension. */
  expiryLabel?: string;
  /** Label for the vertical surface-height dimension. */
  valueLabel?: string;
};

export type OptionSurfaceHandle = {
  setData(data: OptionSurfacePoint[]): OptionSurfaceHandle;
  destroy(): void;
};

type Point2D = { x: number; y: number };

const finite = (value: number) => Number.isFinite(value);

/**
 * Renders an interactive Canvas options surface. Drag in either direction to
 * orbit the surface, use the wheel to zoom, and hover to inspect a point.
 */
export function createOptionsSurface(host: HTMLElement, options: OptionSurfaceOptions = {}): OptionSurfaceHandle {
  const canvas = document.createElement("canvas");
  canvas.className = "opencharts-options-surface";
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", "Interactive options surface. Drag in either direction to orbit, use the wheel to zoom, and hover to inspect a point.");
  host.replaceChildren(canvas);
  const context = canvas.getContext("2d")!;
  let points = options.data?.filter((point) => finite(point.strike) && finite(point.expiry) && finite(point.value)) ?? [];
  let width = 0;
  let height = 0;
  let pixelRatio = 1;
  let yaw = 0.38;
  let pitch = 0.58;
  let zoom = 1;
  let hover: OptionSurfacePoint | undefined;
  let dragStart: { x: number; y: number; yaw: number; pitch: number } | undefined;

  const strikeText = options.strikeFormatter ?? ((value: number) => `$${value.toFixed(0)}`);
  const expiryText = options.expiryFormatter ?? ((value: number) => `${value.toFixed(0)}d`);
  const valueText = options.valueFormatter ?? ((value: number) => `${(value * 100).toFixed(1)}%`);

  const resize = () => {
    const bounds = host.getBoundingClientRect();
    width = Math.max(1, Math.floor(bounds.width));
    height = Math.max(1, Math.floor(bounds.height));
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    draw();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(host);

  const ranges = () => {
    const strikes = [...new Set(points.map((point) => point.strike))].sort((a, b) => a - b);
    const expiries = [...new Set(points.map((point) => point.expiry))].sort((a, b) => a - b);
    const values = points.map((point) => point.value);
    return { strikes, expiries, min: Math.min(...values, 0), max: Math.max(...values, 1) };
  };

  const draw = () => {
    context.clearRect(0, 0, width, height);
    context.fillStyle = options.background ?? "#0b1020";
    context.fillRect(0, 0, width, height);
    if (!points.length || width < 20 || height < 20) return;
    const { strikes, expiries, min, max } = ranges();
    const centerX = width * 0.54;
    const centerY = height * 0.78;
    const worldWidth = Math.max(100, width * 0.72);
    const worldDepth = Math.max(75, height * 0.5);
    const worldHeight = Math.max(85, height * 0.58);
    const valueRange = Math.max(0.0001, max - min);
    const projectWorld = (x: number, y: number, z: number): Point2D => {
      const cosYaw = Math.cos(yaw), sinYaw = Math.sin(yaw), cosPitch = Math.cos(pitch), sinPitch = Math.sin(pitch);
      return {
        x: centerX + zoom * (x * cosYaw - y * sinYaw),
        y: centerY - zoom * (x * sinYaw * sinPitch + y * cosYaw * sinPitch + z * cosPitch),
      };
    };
    const project = (strikeIndex: number, expiryIndex: number, value: number): Point2D => {
      const u = strikes.length === 1 ? 0 : strikeIndex / (strikes.length - 1);
      const v = expiries.length === 1 ? 0 : expiryIndex / (expiries.length - 1);
      return projectWorld((u - 0.5) * worldWidth, (v - 0.5) * worldDepth, ((value - min) / valueRange) * worldHeight);
    };
    const lookup = new Map(points.map((point) => [`${point.strike}:${point.expiry}`, point]));
    const pointAt = (s: number, e: number) => lookup.get(`${strikes[s]}:${expiries[e]}`);
    const color = (value: number, alpha = 1) => {
      const t = (value - min) / valueRange;
      const r = Math.round(30 + t * 117);
      const g = Math.round(182 - t * 94);
      const b = Math.round(166 + t * 74);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    const halfWidth = worldWidth / 2, halfDepth = worldDepth / 2;
    const line = (from: Point2D, to: Point2D) => { context.beginPath(); context.moveTo(from.x, from.y); context.lineTo(to.x, to.y); context.stroke(); };
    const at = (x: number, y: number, z: number) => projectWorld(x, y, z);
    // Draw a true 3D plotting volume: floor, back wall, and side wall grids.
    // They give the IV surface the same spatial cues as a conventional 3D chart.
    context.lineWidth = 1;
    context.strokeStyle = "rgba(125, 146, 183, .16)";
    for (let step = 0; step <= 4; step += 1) {
      const ratio = step / 4;
      const x = -halfWidth + ratio * worldWidth;
      const y = -halfDepth + ratio * worldDepth;
      const z = ratio * worldHeight;
      line(at(x, -halfDepth, 0), at(x, halfDepth, 0));
      line(at(-halfWidth, y, 0), at(halfWidth, y, 0));
      line(at(-halfWidth, halfDepth, z), at(halfWidth, halfDepth, z));
      line(at(-halfWidth, y, z), at(-halfWidth, y, 0));
      line(at(-halfWidth, halfDepth, z), at(-halfWidth, -halfDepth, z));
    }
    context.strokeStyle = "#34425e";
    const floor = [at(-halfWidth, -halfDepth, 0), at(halfWidth, -halfDepth, 0), at(halfWidth, halfDepth, 0), at(-halfWidth, halfDepth, 0)];
    const back = [at(-halfWidth, halfDepth, 0), at(halfWidth, halfDepth, 0), at(halfWidth, halfDepth, worldHeight), at(-halfWidth, halfDepth, worldHeight)];
    const side = [at(-halfWidth, -halfDepth, 0), at(-halfWidth, halfDepth, 0), at(-halfWidth, halfDepth, worldHeight), at(-halfWidth, -halfDepth, worldHeight)];
    [floor, back, side].forEach((face) => { for (let index = 0; index < face.length; index += 1) line(face[index], face[(index + 1) % face.length]); });

    // The z axis is deliberately drawn as a first-class axis so the height of
    // the surface reads as implied volatility rather than decorative shading.
    const ivAxisBase = at(-halfWidth, -halfDepth, 0);
    const ivAxisTop = at(-halfWidth, -halfDepth, worldHeight);
    const axisLength = Math.hypot(ivAxisTop.x - ivAxisBase.x, ivAxisTop.y - ivAxisBase.y);
    if (axisLength > 6) {
      const normalX = (ivAxisTop.y - ivAxisBase.y) / axisLength;
      const normalY = -(ivAxisTop.x - ivAxisBase.x) / axisLength;
      context.strokeStyle = "#6a7b9d";
      context.lineWidth = 1.25;
      context.beginPath(); context.moveTo(ivAxisBase.x, ivAxisBase.y); context.lineTo(ivAxisTop.x, ivAxisTop.y); context.stroke();
      context.font = "10px ui-monospace, SFMono-Regular, monospace";
      context.fillStyle = "#b7c6df";
      context.textAlign = normalX < 0 ? "right" : "left";
      for (let tick = 0; tick <= 4; tick += 1) {
        const ratio = tick / 4;
        const x = ivAxisBase.x + (ivAxisTop.x - ivAxisBase.x) * ratio;
        const y = ivAxisBase.y + (ivAxisTop.y - ivAxisBase.y) * ratio;
        context.beginPath();
        context.moveTo(x - normalX * 5, y - normalY * 5);
        context.lineTo(x + normalX * 5, y + normalY * 5);
        context.stroke();
        context.fillText(valueText(min + valueRange * ratio), x + normalX * 10, y + normalY * 3);
      }
      context.save();
      context.translate(ivAxisTop.x + normalX * 20, ivAxisTop.y + normalY * 4);
      context.rotate(Math.atan2(ivAxisTop.y - ivAxisBase.y, ivAxisTop.x - ivAxisBase.x));
      context.fillStyle = "#dce8ff";
      context.textAlign = "center";
      context.fillText("IV", 0, -5);
      context.restore();
    }

    for (let e = expiries.length - 2; e >= 0; e -= 1) {
      for (let s = 0; s < strikes.length - 1; s += 1) {
        const a = pointAt(s, e), b = pointAt(s + 1, e), c = pointAt(s + 1, e + 1), d = pointAt(s, e + 1);
        if (!a || !b || !c || !d) continue;
        const pa = project(s, e, a.value), pb = project(s + 1, e, b.value), pc = project(s + 1, e + 1, c.value), pd = project(s, e + 1, d.value);
        context.beginPath();
        context.moveTo(pa.x, pa.y); context.lineTo(pb.x, pb.y); context.lineTo(pc.x, pc.y); context.lineTo(pd.x, pd.y); context.closePath();
        context.fillStyle = color((a.value + b.value + c.value + d.value) / 4, 0.68);
        context.fill();
        context.strokeStyle = "rgba(205, 232, 255, .18)";
        context.stroke();
      }
    }

    const ticks = (items: number[]) => items.filter((_, index) => index === 0 || index === items.length - 1 || index % Math.max(1, Math.ceil(items.length / 4)) === 0);
    context.font = "10px ui-monospace, SFMono-Regular, monospace";
    context.fillStyle = "#9aa9c5";
    context.textAlign = "center";
    ticks(strikes).forEach((strike) => {
      const index = strikes.indexOf(strike), p = project(index, 0, min);
      context.fillText(strikeText(strike), p.x, p.y + 18);
    });
    context.textAlign = "right";
    ticks(expiries).forEach((expiry) => {
      const index = expiries.indexOf(expiry), p = project(0, index, min);
      context.fillText(expiryText(expiry), p.x - 9, p.y + 3);
    });
    context.fillStyle = "#6f809f";
    context.textAlign = "left";
    context.fillText(options.strikeLabel ?? "STRIKE", width * 0.5 - 20, height - 10);
    context.save();
    context.translate(17, height * 0.55);
    context.rotate(-Math.PI / 2);
    context.fillText(options.expiryLabel ?? "EXPIRY", 0, 0);
    context.restore();
    context.fillText(options.valueLabel ?? "IMPLIED VOLATILITY", 14, 17);
    context.textAlign = "right";
    context.fillStyle = "#637390";
    context.fillText("DRAG TO ORBIT · SCROLL TO ZOOM", width - 14, 17);

    if (hover) {
      const s = strikes.indexOf(hover.strike), e = expiries.indexOf(hover.expiry), p = project(s, e, hover.value);
      context.beginPath(); context.arc(p.x, p.y, 4, 0, Math.PI * 2); context.fillStyle = "#f5f8ff"; context.fill();
      const label = `${strikeText(hover.strike)}  /  ${expiryText(hover.expiry)}  /  ${valueText(hover.value)}`;
      context.font = "11px ui-monospace, SFMono-Regular, monospace";
      const labelWidth = context.measureText(label).width + 18;
      const labelX = Math.min(width - labelWidth - 8, Math.max(8, p.x + 11));
      const labelY = Math.max(28, p.y - 12);
      context.fillStyle = "#131c30"; context.fillRect(labelX, labelY - 18, labelWidth, 24);
      context.strokeStyle = "#3c567c"; context.strokeRect(labelX, labelY - 18, labelWidth, 24);
      context.fillStyle = "#eff6ff"; context.textAlign = "left"; context.fillText(label, labelX + 9, labelY - 2);
    }
  };

  const nearest = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left, y = event.clientY - rect.top;
    const { strikes, expiries, min, max } = ranges();
    const best = points.reduce<{ point?: OptionSurfacePoint; distance: number }>((current, point) => {
      const strikeIndex = strikes.indexOf(point.strike), expiryIndex = expiries.indexOf(point.expiry);
      const u = strikes.length === 1 ? 0 : strikeIndex / (strikes.length - 1), v = expiries.length === 1 ? 0 : expiryIndex / (expiries.length - 1);
      const worldWidth = Math.max(100, width * 0.72), worldDepth = Math.max(75, height * 0.5), worldHeight = Math.max(85, height * 0.58);
      const worldX = (u - 0.5) * worldWidth, worldY = (v - 0.5) * worldDepth, worldZ = ((point.value - min) / Math.max(.0001, max - min)) * worldHeight;
      const cosYaw = Math.cos(yaw), sinYaw = Math.sin(yaw), cosPitch = Math.cos(pitch), sinPitch = Math.sin(pitch);
      const px = width * .54 + zoom * (worldX * cosYaw - worldY * sinYaw);
      const py = height * .78 - zoom * (worldX * sinYaw * sinPitch + worldY * cosYaw * sinPitch + worldZ * cosPitch);
      const distance = Math.hypot(px - x, py - y);
      return distance < current.distance ? { point, distance } : current;
    }, { distance: Infinity });
    return best.distance < 28 ? best.point : undefined;
  };
  canvas.addEventListener("pointermove", (event) => {
    if (dragStart) {
      yaw = dragStart.yaw + (event.clientX - dragStart.x) / 180;
      pitch = Math.max(-1.35, Math.min(1.35, dragStart.pitch + (event.clientY - dragStart.y) / 180));
      draw();
      return;
    }
    const next = nearest(event);
    if (hover !== next) { hover = next; canvas.style.cursor = hover ? "crosshair" : "grab"; draw(); }
  });
  canvas.addEventListener("pointerdown", (event) => { dragStart = { x: event.clientX, y: event.clientY, yaw, pitch }; canvas.setPointerCapture(event.pointerId); canvas.style.cursor = "grabbing"; });
  canvas.addEventListener("pointerup", (event) => { dragStart = undefined; canvas.releasePointerCapture(event.pointerId); canvas.style.cursor = hover ? "crosshair" : "grab"; });
  canvas.addEventListener("wheel", (event) => { event.preventDefault(); zoom = Math.max(0.48, Math.min(2.4, zoom * (event.deltaY > 0 ? 0.9 : 1.1))); draw(); }, { passive: false });
  canvas.addEventListener("pointerleave", () => { if (!dragStart && hover) { hover = undefined; draw(); } });
  resize();

  return {
    setData(data) { points = data.filter((point) => finite(point.strike) && finite(point.expiry) && finite(point.value)); hover = undefined; draw(); return this; },
    destroy() { observer.disconnect(); canvas.remove(); },
  };
}
