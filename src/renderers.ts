/** Canvas-only rendering primitives shared by the main plot and lower panes. */
export type PlotPoint = { logical: number; value: number; x?: number | string };

/** Traces a line or left-continuous step path without applying paint styles. */
export function traceSeriesPath(
  context: CanvasRenderingContext2D,
  points: readonly PlotPoint[],
  x: (point: PlotPoint) => number,
  y: (value: number) => number,
  stepped = false,
) {
  context.beginPath();
  points.forEach((point, index) => {
    const px = x(point);
    const py = y(point.value);
    if (!index) context.moveTo(px, py);
    else if (stepped) {
      context.lineTo(px, y(points[index - 1].value));
      context.lineTo(px, py);
    } else context.lineTo(px, py);
  });
}

/** Closes the current series path against a numeric baseline. */
export function closeAreaPath(
  context: CanvasRenderingContext2D,
  points: readonly PlotPoint[],
  x: (point: PlotPoint) => number,
  baseline: number,
) {
  if (!points.length) return;
  context.lineTo(x(points.at(-1)!), baseline);
  context.lineTo(x(points[0]), baseline);
  context.closePath();
}
