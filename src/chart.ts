export type Bar = {
  time: number;
  /** Optional caller-owned X-domain value for numeric or ordinal axes. */
  x?: number | string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};
export type XAxisOptions = {
  type?: "time" | "numeric" | "ordinal";
  /** Called for every selected tick when the axis is not calendar time. */
  formatter?: (value: number | string, index: number) => string;
};
export type SeriesType = "candlestick" | "line";
export type DrawingTool =
  "none" | "trendline" | "horizontal-line" | "free-draw";
/** A numeric value with a caller-owned identity and optional non-time X label. */
export type SeriesPoint = { time: number; value: number; x?: number | string };
/** Rendering primitives for caller-owned numeric data. */
export type CustomSeriesType =
  | "line"
  | "histogram"
  | "area"
  | "step-area"
  | "scatter";
export type CustomSeriesOptions = {
  id: string;
  /** Human-readable overlay name shown by the optional hover removal control. */
  label?: string;
  /** Allow the built-in hover control to remove this user-owned overlay. */
  removable?: boolean;
  /** Expose a settings action beside the hover removal control. */
  settings?: boolean;
  pane?: string;
  type?: CustomSeriesType;
  color?: string;
  /** Explicit area fill; defaults to a translucent version of `color`. */
  fillColor?: string;
  /** Optional fill used below the zero baseline for area series. */
  negativeFillColor?: string;
  lineWidth?: number;
  /** Dot radius in CSS pixels for `scatter` series. */
  markerRadius?: number;
  /** `price` shares the main OHLC scale; `independent` fits this series to the plot. */
  scale?: "price" | "independent";
};
export type ChartOverlay = {
  type: "vertical-line";
  /** An existing data timestamp used to anchor the overlay on the X domain. */
  time: number;
  /** Primary annotation rendered as an X-axis badge at the line's anchor. */
  label?: string;
  /** Optional horizontal callout rendered beside the middle of the line. */
  detail?: string;
  color?: string;
};
export type PaneOptions = { id: string; height?: number; title?: string; xAxis?: XAxisOptions };
export type SeriesHandle = {
  id: string;
  setData(data: SeriesPoint[]): SeriesHandle;
  update(point: SeriesPoint): SeriesHandle;
  remove(): void;
};
export type ChartEvent = {
  time: number;
  type: "earnings" | "dividend";
  label?: string;
  color?: string;
  marker?: {
    color?: string;
    icon?: string;
    shape?: "circle" | "square" | "diamond";
    filled?: boolean;
  };
  popup?: {
    title?: string;
    rows?: Array<{ label: string; value: string }>;
    actionLabel?: string;
    /** Called when the optional popup action is selected. */
    onAction?: (event: ChartEvent) => void;
  };
};
export type TradeMarker = {
  /** Timestamp of the bar that receives the marker. */
  time: number;
  side: "buy" | "sell";
  /** Optional execution price; defaults below/above the bar for buy/sell. */
  price?: number;
  label?: string;
  color?: string;
};
export type DrawingAnchor = { logical: number; price: number };
export type ChartDrawing =
  | {
      id: string;
      pane?: string;
      type: "trendline";
      anchors: [DrawingAnchor, DrawingAnchor];
      color?: string;
    }
  | {
      id: string;
      pane?: string;
      type: "horizontal-line";
      price: number;
      color?: string;
    }
  | {
      id: string;
      pane?: string;
      type: "free-draw";
      anchors: DrawingAnchor[];
      color?: string;
    };
export type ChartOptions = {
  background?: string;
  gridColor?: string;
  textColor?: string;
  upColor?: string;
  downColor?: string;
  /** Position price-scale labels on either edge, or mirror them on both. */
  yAxis?: "left" | "right" | "both";
  crosshair?: boolean;
  /** Hide the built-in OHLC/line series when the chart hosts only custom series. */
  primarySeriesVisible?: boolean;
  /**
   * OHLC inspection treatment. `floating` follows the crosshair; `fixed`
   * keeps a compact legend in the plot's top-left and updates it on hover.
   * `false` hides it while retaining crosshair axis labels.
   */
  ohlcTooltip?: boolean | "floating" | "fixed";
  /** Optional context for the fixed OHLC legend. */
  ohlcLegend?: { title?: string; showVolume?: boolean };
  /** Caps Canvas backing-store density; set to `1` to prioritize throughput. */
  maxPixelRatio?: number;
  /** Fine-grained input behavior for embedded and touch-first charts. */
  interaction?: {
    mouseWheel?: boolean;
    dragPan?: boolean;
    /** CSS touch-action policy. `pan-y` preserves page scrolling during vertical drags. */
    touchAction?: "auto" | "none" | "pan-y";
  };
  xAxis?: XAxisOptions;
  padding?: { top?: number; bottom?: number; left?: number; right?: number };
};
/** Inclusive bar-index viewport for time and ordinal charts. */
export type LogicalRange = { from: number; to: number };
/** Inclusive UTC-millisecond viewport for time-axis charts. */
export type TimeRange = { from: number; to: number };
export type VisibleRangeChangeHandler = (range: LogicalRange | null) => void;
export type CrosshairMoveEvent = {
  point: { x: number; y: number } | null;
  pane: string | null;
  logical: number | null;
  time: number | null;
  x: number | string | null;
  price: number | null;
  /** A copied bar at the nearest crosshair position, when primary data exists. */
  bar: Bar | null;
};
export type CrosshairMoveHandler = (event: CrosshairMoveEvent) => void;
type ResolvedOptions = Omit<Required<ChartOptions>, "padding" | "interaction"> & {
  padding: Required<NonNullable<ChartOptions["padding"]>>;
  interaction: Required<NonNullable<ChartOptions["interaction"]>>;
};
const defaults: ResolvedOptions = {
  background: "#0b1020",
  gridColor: "#25314d",
  textColor: "#aab6d3",
  upColor: "#38d39f",
  downColor: "#ff6b81",
  yAxis: "right",
  crosshair: true,
  primarySeriesVisible: true,
  ohlcTooltip: "floating",
  ohlcLegend: { title: "", showVolume: true },
  maxPixelRatio: Infinity,
  interaction: { mouseWheel: true, dragPan: true, touchAction: "pan-y" },
  xAxis: { type: "time" },
  padding: { top: 18, bottom: 32, left: 10, right: 68 },
};
/** Extra visual breathing room retained whenever a price scale is auto-fitted. */
const AUTO_FIT_PADDING = 0.05;
type Gesture = {
  kind:
    | "pan"
    | "scale-x"
    | "scale-pane-x"
    | "scale-y"
    | "scale-macd-y"
    | "scale-pane-y"
    | "resize-pane"
    | "free";
  x: number;
  y: number;
  offset: number;
  priceOffset: number;
  visible: number;
  priceZoom: number;
  windowStart: number;
  numericCenter?: number;
  numericSpan?: number;
  subRatio: number;
  paneId?: string;
  paneZoom?: number;
  paneOffset?: number;
  paneXSpan?: number;
  paneXCenter?: number;
  macdZoom: number;
  macdOffset: number;
};
function drawOhlcCard(
  c: CanvasRenderingContext2D,
  b: Bar,
  x: number,
  y: number,
) {
  const width = 252,
    height = 43;
  c.save();
  c.shadowColor = "#000a";
  c.shadowBlur = 12;
  c.fillStyle = "#111a2ded";
  c.beginPath();
  c.roundRect(x, y, width, height, 6);
  c.fill();
  c.shadowBlur = 0;
  c.strokeStyle = "#33405d";
  c.stroke();
  const columns: [string, number, string][] = [
    ["O", b.open, "#c9d5ed"],
    ["H", b.high, "#7dd3fc"],
    ["L", b.low, "#aab6d3"],
    ["C", b.close, b.close >= b.open ? "#38d39f" : "#ff6b81"],
  ];
  columns.forEach(([label, value, color], index) => {
    const left = x + 12 + index * 60;
    c.font = "10px ui-monospace,SFMono-Regular,monospace";
    c.fillStyle = "#71809e";
    c.fillText(label, left, y + 14);
    c.font = "11px ui-monospace,SFMono-Regular,monospace";
    c.fillStyle = color;
    c.fillText(value.toFixed(2), left, y + 30);
  });
  c.restore();
}

function assertSeriesPoint(point: SeriesPoint) {
  if (
    !Number.isFinite(point.time) ||
    !Number.isFinite(point.value) ||
    (point.x !== undefined &&
      typeof point.x !== "string" &&
      !Number.isFinite(point.x))
  )
    throw new RangeError(
      "Series points require finite time and value fields, plus an optional string or finite numeric x field.",
    );
}

function cloneDrawing(drawing: ChartDrawing): ChartDrawing {
  if (drawing.type === "horizontal-line") return { ...drawing };
  if (drawing.type === "trendline")
    return {
      ...drawing,
      anchors: [{ ...drawing.anchors[0] }, { ...drawing.anchors[1] }],
    };
  return { ...drawing, anchors: drawing.anchors.map((anchor) => ({ ...anchor })) };
}

function assertDrawing(
  drawing: ChartDrawing,
  panes: ReadonlyMap<string, unknown>,
  seenIds: Set<string>,
) {
  if (!drawing.id || seenIds.has(drawing.id))
    throw new RangeError("Drawings require unique, non-empty ids.");
  seenIds.add(drawing.id);
  const pane = drawing.pane ?? "main";
  if (pane !== "main" && !panes.has(pane))
    throw new RangeError(`Unknown drawing pane: ${pane}. Call addPane() first.`);
  if (drawing.type === "horizontal-line") {
    if (!Number.isFinite(drawing.price))
      throw new RangeError("Horizontal-line drawings require a finite price.");
    return;
  }
  const anchors = drawing.anchors;
  if (
    (drawing.type === "trendline" && anchors.length !== 2) ||
    (drawing.type === "free-draw" && anchors.length < 2) ||
    anchors.some(
      (anchor) =>
        !Number.isFinite(anchor.logical) || !Number.isFinite(anchor.price),
    )
  )
    throw new RangeError(
      "Trendlines require two finite anchors; free drawings require at least two finite anchors.",
    );
}

function drawOhlcLegend(
  c: CanvasRenderingContext2D,
  b: Bar,
  x: number,
  y: number,
  options: NonNullable<ChartOptions["ohlcLegend"]>,
) {
  c.save();
  let lineY = y;
  c.font = "600 11px ui-monospace,SFMono-Regular,monospace";
  if (options.title) {
    c.fillStyle = "#dce7ff";
    c.fillText(options.title, x, lineY);
    lineY += 17;
  }
  const fields: [string, number, string][] = [
    ["O", b.open, "#c9d5ed"],
    ["H", b.high, "#7dd3fc"],
    ["L", b.low, "#aab6d3"],
    ["C", b.close, b.close >= b.open ? "#38d39f" : "#ff6b81"],
  ];
  let left = x;
  for (const [label, value, color] of fields) {
    c.font = "10px ui-monospace,SFMono-Regular,monospace";
    c.fillStyle = "#7890af";
    c.fillText(label, left, lineY);
    left += c.measureText(label).width + 3;
    c.font = "600 10px ui-monospace,SFMono-Regular,monospace";
    c.fillStyle = color;
    const text = value.toFixed(2);
    c.fillText(text, left, lineY);
    left += c.measureText(text).width + 11;
  }
  if (options.showVolume && b.volume !== undefined) {
    c.font = "10px ui-monospace,SFMono-Regular,monospace";
    c.fillStyle = "#7890af";
    c.fillText(`Vol. ${b.volume.toLocaleString()}`, x, lineY + 16);
  }
  c.restore();
}

export class TradingChart {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private eventPopup: HTMLDivElement;
  private overlayControl: HTMLDivElement;
  private hoveredOverlay?: { kind: "volume" | "series"; id?: string };
  private overlayHideTimer?: number;
  private seriesLabelHits: Array<{ id: string; label: string; x: number; y: number; width: number }> = [];
  private bars: Bar[] = [];
  /** Tracks whether the caller supplied primary OHLC bars or a series-only domain. */
  private hasPrimaryData = false;
  private opts: ResolvedOptions;
  private kind: SeriesType = "candlestick";
  private visible = 90;
  private offset = 0;
  /** Continuous X viewport used by numeric axes. Time axes retain bar navigation. */
  private numericXCenter = 0;
  private numericXSpan = 1;
  private numericXBaseSpan = 1;
  private priceZoom = 1;
  private priceOffset = 0;
  /** Plot drags are X-only until the matching price axis has been adjusted. */
  private pricePanUnlocked = false;
  private panePanUnlocked = new Set<string>();
  private macdPanUnlocked = false;
  private basePriceCenter = 0;
  private basePriceSpan = 1;
  private pointer?: { x: number; y: number };
  private gesture?: Gesture;
  private tool: DrawingTool = "none";
  private drawings: ChartDrawing[] = [];
  private draft?: ChartDrawing;
  private observer: ResizeObserver;
  private renderFrame?: number;
  private resizeFrame?: number;
  private volumeVisible = false;
  private eventsVisible = true;
  private events: ChartEvent[] = [];
  private tradeMarkers: TradeMarker[] = [];
  private overlays: ChartOverlay[] = [];
  private visibleRangeListeners = new Set<VisibleRangeChangeHandler>();
  private visibleRangeKey = "";
  private crosshairMoveListeners = new Set<CrosshairMoveHandler>();
  private crosshairKey = "";
  private series = new Map<
    string,
    Required<Omit<CustomSeriesOptions, "id">> & {
      id: string;
      data: SeriesPoint[];
    }
  >();
  private panes = new Map<
    string,
    Required<PaneOptions> & { zoom: number; offset: number; xBaseSpan: number; xSpan: number; xCenter: number }
  >();
  // Compatibility renderer, unreachable without the former public indicator API.
  private indicators = new Set<"ema" | "macd">();
  private subRatio = 0.32;
  private macdZoom = 1;
  private macdOffset = 0;
  private macdCache?: {
    macd: number[];
    signal: number[];
    hist: number[];
    base: number;
  };
  constructor(
    private host: HTMLElement,
    options: ChartOptions = {},
  ) {
    this.opts = {
      ...defaults,
      ...options,
      padding: { ...defaults.padding, ...options.padding },
      interaction: { ...defaults.interaction, ...options.interaction },
    };
    this.canvas = document.createElement("canvas");
    this.canvas.className = "tradingchart-canvas";
    this.canvas.tabIndex = 0;
    this.canvas.setAttribute("role", "region");
    this.canvas.setAttribute("aria-roledescription", "financial chart");
    this.canvas.style.touchAction = this.opts.interaction.touchAction;
    this.canvas.setAttribute(
      "aria-label",
      "Interactive financial chart. Use left and right arrow keys to pan, plus or minus to zoom, Home to fit data, End to return to live data, and Escape to cancel a drawing.",
    );
    this.ctx = this.canvas.getContext("2d")!;
    this.eventPopup = document.createElement("div");
    this.eventPopup.className = "tradingchart-event-popup";
    this.eventPopup.hidden = true;
    Object.assign(this.eventPopup.style, {
      position: "absolute",
      zIndex: "2",
      width: "220px",
      padding: "12px",
      border: "1px solid #37445f",
      borderRadius: "7px",
      background: "#171a21",
      boxShadow: "0 10px 26px #0008",
      color: "#d9e1f2",
      font: "13px/1.45 system-ui,sans-serif",
    });
    this.overlayControl = document.createElement("div");
    this.overlayControl.className = "tradingchart-overlay-control";
    this.overlayControl.hidden = true;
    Object.assign(this.overlayControl.style, {
      position: "absolute",
      zIndex: "3",
      display: "flex",
      alignItems: "center",
      gap: "7px",
      padding: "5px 6px 5px 9px",
      border: "1px solid #415675",
      borderRadius: "5px",
      background: "#111a2df2",
      boxShadow: "0 8px 22px #0009",
      color: "#dbe6f7",
      font: "11px ui-monospace,SFMono-Regular,monospace",
      whiteSpace: "nowrap",
    });
    this.overlayControl.addEventListener("pointerdown", (event) => event.stopPropagation());
    this.overlayControl.addEventListener("pointerenter", () => {
      if (this.overlayHideTimer !== undefined) clearTimeout(this.overlayHideTimer);
      this.overlayHideTimer = undefined;
    });
    this.overlayControl.addEventListener("pointerleave", (event) => {
      if (event.relatedTarget instanceof Node && event.relatedTarget === this.canvas) return;
      this.scheduleOverlayHide();
    });
    if (getComputedStyle(host).position === "static") host.style.position = "relative";
    host.replaceChildren(this.canvas, this.eventPopup, this.overlayControl);
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(host);
    this.bind();
    this.resize();
  }
  setData(data: Bar[]) {
    this.bars = normalizeBars(data);
    this.hasPrimaryData = this.bars.length > 0;
    if (!this.hasPrimaryData) this.rebuildSeriesDomain();
    this.offset = 0;
    this.resetNumericXRange();
    this.resetPriceRange();
    this.draw();
    return this;
  }
  /** Apply a streaming bar update. Same timestamps replace; older bars are inserted. */
  update(bar: Bar) {
    return this.updateMany([bar]);
  }
  /** Apply a batch of streaming updates with one redraw. */
  updateMany(updates: Bar[]) {
    if (!updates.length) return this;
    this.hasPrimaryData = true;
    const wasHistorical = this.offset > 0;
    const nextBars = normalizeBars(updates),
      previous = this.bars,
      lastTime = previous.at(-1)?.time ?? -Infinity;
    let appended = 0;
    if (!previous.length) this.bars = nextBars;
    else if (nextBars[0].time > lastTime) {
      this.bars = [...previous, ...nextBars];
      appended = nextBars.length;
    } else {
      const merged: Bar[] = [];
      let existing = 0,
        incoming = 0;
      while (existing < previous.length || incoming < nextBars.length) {
        const current = previous[existing],
          update = nextBars[incoming];
        if (!update || (current && current.time < update.time)) {
          merged.push(current);
          existing++;
        } else if (!current || update.time < current.time) {
          merged.push(update);
          if (update.time > lastTime) appended++;
          incoming++;
        } else {
          merged.push(update);
          existing++;
          incoming++;
        }
      }
      this.bars = merged;
    }
    // Preserve the historical viewport while fresh bars arrive; a chart at the
    // live edge continues following the latest bar.
    if (wasHistorical) this.offset += appended;
    // Locked scales follow incoming bars just as they follow manual pan/zoom.
    // Once the user adjusts the y axis, their explicit range remains intact.
    if (this.numericXAxisActive()) this.resetNumericXRange();
    if (!this.pricePanUnlocked) this.resetPriceRange();
    this.draw();
    return this;
  }
  setType(type: SeriesType) {
    this.kind = type;
    this.draw();
    return this;
  }
  setXAxis(options: XAxisOptions) {
    this.opts.xAxis = { ...this.opts.xAxis, ...options };
    this.resetNumericXRange();
    this.resetPriceRange();
    this.draw();
    return this;
  }
  setDrawingTool(tool: DrawingTool) {
    this.tool = this.tool === tool ? "none" : tool;
    this.draft = undefined;
    this.updateCursor();
    this.draw();
    return this;
  }
  setVolumeVisible(visible: boolean) {
    this.volumeVisible = visible;
    this.draw();
    return this;
  }
  setEvents(events: ChartEvent[]) {
    this.events = [...events].sort((a, b) => a.time - b.time);
    this.closeEventPopup();
    this.draw();
    return this;
  }
  setEventsVisible(visible: boolean) {
    this.eventsVisible = visible;
    if (!visible) this.closeEventPopup();
    this.draw();
    return this;
  }
  /** Displays caller-owned buy/sell arrows anchored to bars or execution prices. */
  setTradeMarkers(markers: TradeMarker[]) {
    this.tradeMarkers = [...markers].sort((a, b) => a.time - b.time);
    this.draw();
    return this;
  }
  /** Adds data-anchored vertical annotations with X-axis badges and midpoint callouts. */
  setOverlays(overlays: ChartOverlay[]) {
    this.overlays = [...overlays];
    this.draw();
    return this;
  }
  /** Creates or replaces a user-owned numeric series. No indicator formulas are built in. */
  addSeries(options: CustomSeriesOptions) {
    if (!options.id) throw new RangeError("Series ids must be non-empty strings.");
    if (
      options.pane &&
      options.pane !== "main" &&
      !this.panes.has(options.pane)
    )
      throw new Error(`Unknown pane: ${options.pane}. Call addPane() first.`);
    const series = {
      id: options.id,
      label: options.label ?? options.id,
      removable: options.removable ?? true,
      settings: options.settings ?? false,
      pane: options.pane ?? "main",
      type: options.type ?? "line",
      color: options.color ?? "#7dd3fc",
      fillColor: options.fillColor ?? options.color ?? "#7dd3fc",
      negativeFillColor: options.negativeFillColor ?? "",
      lineWidth: options.lineWidth ?? 2,
      markerRadius: Math.max(1, Math.min(24, options.markerRadius ?? 4)),
      scale: options.scale ?? "price",
      data: this.series.get(options.id)?.data ?? [],
    };
    this.series.set(options.id, series);
    this.draw();
    return this;
  }
  /** Creates a controller for a series, avoiding repeated string ids in app code. */
  createSeries(options: CustomSeriesOptions): SeriesHandle {
    this.addSeries(options);
    return this.seriesHandle(options.id);
  }
  private seriesHandle(id: string): SeriesHandle {
    return {
      id,
      setData: (data) => {
        this.setSeriesData(id, data);
        return this.seriesHandle(id);
      },
      update: (point) => {
        this.updateSeries(id, point);
        return this.seriesHandle(id);
      },
      remove: () => this.removeSeries(id),
    };
  }
  /** Creates a synchronized, independently auto-scaled lower pane. */
  addPane(options: PaneOptions) {
    if (!options.id || options.id === "main" || options.id === "macd")
      throw new Error(
        "Pane ids must be non-empty and cannot be 'main' or 'macd'.",
      );
    this.panes.set(options.id, {
      id: options.id,
      height: Math.max(0.12, Math.min(0.5, options.height ?? 0.24)),
      title: options.title ?? options.id,
      xAxis: options.xAxis ?? { type: "time" },
      zoom: 1,
      offset: 0,
      xBaseSpan: 0,
      xSpan: 0,
      xCenter: 0,
    });
    this.draw();
    return this;
  }
  removePane(id: string) {
    this.panes.delete(id);
    for (const [seriesId, series] of this.series)
      if (series.pane === id) this.series.delete(seriesId);
    if (!this.hasPrimaryData) this.rebuildSeriesDomain();
    this.draw();
    return this;
  }
  hasPane(id: string) {
    return this.panes.has(id);
  }
  getPaneIds() {
    return [...this.panes.keys()];
  }
  /** Sets all values for a user-defined series. Points may be supplied in any order. */
  setSeriesData(id: string, data: SeriesPoint[]) {
    const series = this.series.get(id);
    if (!series)
      throw new Error(`Unknown series: ${id}. Call addSeries() first.`);
    data.forEach(assertSeriesPoint);
    const ordered = [...data].sort((a, b) => a.time - b.time);
    series.data = ordered.filter(
      (point, index) => index === ordered.length - 1 || point.time !== ordered[index + 1].time,
    );
    if (!this.hasPrimaryData) this.rebuildSeriesDomain();
    this.draw();
    return this;
  }
  /** Replaces or appends one point in a user-defined series. */
  updateSeries(id: string, point: SeriesPoint) {
    const series = this.series.get(id);
    if (!series)
      throw new Error(`Unknown series: ${id}. Call addSeries() first.`);
    assertSeriesPoint(point);
    let lo = 0,
      hi = series.data.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (series.data[mid].time < point.time) lo = mid + 1;
      else hi = mid;
    }
    if (lo === series.data.length) series.data.push(point);
    else if (series.data[lo].time === point.time) series.data[lo] = point;
    else series.data.splice(lo, 0, point);
    if (!this.hasPrimaryData) this.rebuildSeriesDomain();
    this.draw();
    return this;
  }
  removeSeries(id: string) {
    this.series.delete(id);
    if (!this.hasPrimaryData) this.rebuildSeriesDomain();
    this.draw();
    return this;
  }
  private hideOverlayControl() {
    if (this.overlayHideTimer !== undefined) clearTimeout(this.overlayHideTimer);
    this.overlayHideTimer = undefined;
    this.hoveredOverlay = undefined;
    this.overlayControl.hidden = true;
    this.overlayControl.style.display = "none";
  }
  private scheduleOverlayHide() {
    if (this.overlayHideTimer !== undefined) clearTimeout(this.overlayHideTimer);
    this.overlayHideTimer = window.setTimeout(() => {
      this.overlayHideTimer = undefined;
      this.hideOverlayControl();
      this.draw();
    }, 220);
  }
  private showOverlayControl(
    target: { kind: "volume" | "series"; id?: string; label: string; settings?: boolean },
    x: number,
    y: number,
  ) {
    if (this.overlayHideTimer !== undefined) clearTimeout(this.overlayHideTimer);
    this.overlayHideTimer = undefined;
    const same = this.hoveredOverlay?.kind === target.kind && this.hoveredOverlay?.id === target.id;
    this.hoveredOverlay = { kind: target.kind, id: target.id };
    if (!same) {
      this.overlayControl.replaceChildren();
      const label = document.createElement("span");
      label.textContent = target.label;
      if (target.settings) {
        const settings = document.createElement("button");
        settings.type = "button";
        settings.textContent = "Settings ⚙";
        Object.assign(settings.style, { border: "0", borderLeft: "1px solid #3b4d6b", background: "transparent", color: "#a9c8ff", padding: "0 7px", cursor: "pointer", font: "inherit" });
        settings.addEventListener("click", () => {
          this.hideOverlayControl();
          this.host.dispatchEvent(new CustomEvent("tradingchartoverlaysettings", { detail: target }));
        });
        this.overlayControl.append(label, settings);
      } else this.overlayControl.append(label);
      const remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = "Remove ×";
      Object.assign(remove.style, { border: "0", borderLeft: "1px solid #3b4d6b", background: "transparent", color: "#ff9aaa", padding: "0 0 0 7px", cursor: "pointer", font: "inherit" });
      remove.addEventListener("click", () => {
        // Clear hover state before rendering the removal so an old highlight
        // cannot survive in the freshly drawn canvas.
        this.hideOverlayControl();
        if (target.kind === "volume") this.setVolumeVisible(false);
        else if (target.id) this.removeSeries(target.id);
        this.host.dispatchEvent(new CustomEvent("tradingchartoverlayremove", { detail: target }));
      });
      this.overlayControl.append(remove);
    }
    const area = this.area();
    this.overlayControl.hidden = false;
    this.overlayControl.style.display = "flex";
    // Controls belong to their overlay. Do not continually reposition the
    // element as the crosshair moves within the same overlay.
    if (!same) {
      this.overlayControl.style.left = `${Math.max(6, Math.min(x, area.w - 140))}px`;
      this.overlayControl.style.top = `${Math.max(6, y)}px`;
    }
  }
  private updateOverlayControl() {
    if (!this.pointer || this.gesture || this.tool !== "none") return this.hideOverlayControl();
    const layout = this.layout(), { p, mainH, plotW } = layout;
    const labelHit = this.seriesLabelHits.find((hit) =>
      this.pointer!.x >= hit.x && this.pointer!.x <= hit.x + hit.width &&
      this.pointer!.y >= hit.y - 13 && this.pointer!.y <= hit.y + 4,
    );
    if (labelHit)
      return this.showOverlayControl(
        { kind: "series", id: labelHit.id, label: labelHit.label, settings: this.series.get(labelHit.id)?.settings },
        labelHit.x,
        labelHit.y - 13,
      );
    const fixedLegendVolumeY =
      p.top + 15 + (this.opts.ohlcLegend.title ? 17 : 0) + 16;
    if (
      this.volumeVisible &&
      this.opts.ohlcTooltip === "fixed" &&
      this.bars.some((bar) => bar.volume !== undefined) &&
      this.pointer.x >= p.left + 4 &&
      this.pointer.x <= p.left + 145 &&
      this.pointer.y >= fixedLegendVolumeY - 13 &&
      this.pointer.y <= fixedLegendVolumeY + 5
    ) {
      return this.showOverlayControl(
        { kind: "volume", label: "Volume" },
        // The volume legend is part of the fixed OHLC readout in the
        // top-left. Its contextual actions replace that readout in place.
        p.left + 4,
        fixedLegendVolumeY - 13,
      );
    }
    const { start, data, windowStart } = this.window();
    const span = this.basePriceSpan * this.priceZoom, hi = this.basePriceCenter + this.priceOffset + span / 2;
    for (const series of this.series.values()) {
      if (series.pane !== "main" || !series.removable) continue;
      const points = this.visibleSeriesPoints(series.data, start, start + data.length);
      if (!points.length) continue;
      const logical = Math.round(windowStart + ((this.pointer.x - p.left) / plotW) * this.visible);
      const point = points.reduce((nearest, candidate) => Math.abs(candidate.logical - logical) < Math.abs(nearest.logical - logical) ? candidate : nearest);
      const values = points.map((item) => item.value);
      const lo = Math.min(...values, ["histogram", "area", "step-area"].includes(series.type) ? 0 : Infinity);
      const upper = Math.max(...values, ["histogram", "area", "step-area"].includes(series.type) ? 0 : -Infinity);
      const pointY = series.scale === "price" ? p.top + ((hi - point.value) / span) * mainH : p.top + ((upper - point.value) / Math.max(upper - lo, 1e-9)) * mainH;
      if (Math.abs(this.pointer.y - pointY) <= Math.max(8, series.lineWidth + 4)) {
        const pointX = this.numericXAxisActive() && typeof point.x === "number"
          ? p.left + ((point.x - this.numericXRange().lo) / Math.max(this.numericXRange().hi - this.numericXRange().lo, 1e-9)) * plotW
          : p.left + ((point.logical + 0.5 - windowStart) / this.visible) * plotW;
        return this.showOverlayControl({ kind: "series", id: series.id, label: series.label, settings: series.settings }, pointX + 8, pointY - 28);
      }
    }
    this.hideOverlayControl();
  }
  hasSeries(id: string) {
    return this.series.has(id);
  }
  getSeriesIds() {
    return [...this.series.keys()];
  }
  getDrawingTool() {
    return this.tool;
  }
  /** Returns the current time/ordinal viewport, or null for a continuous numeric X axis. */
  getVisibleLogicalRange(): LogicalRange | null {
    if (this.numericXAxisActive() || !this.bars.length) return null;
    const { windowStart } = this.window();
    const from = Math.max(0, Math.ceil(windowStart));
    const to = Math.min(this.bars.length - 1, Math.floor(windowStart + this.visible - 0.0001));
    return from <= to ? { from, to } : null;
  }
  /** Restores a time/ordinal viewport using inclusive bar indexes. */
  setVisibleLogicalRange(range: LogicalRange) {
    if (this.numericXAxisActive())
      throw new Error("Logical ranges are unavailable for a continuous numeric X axis.");
    if (!Number.isFinite(range.from) || !Number.isFinite(range.to) || range.from > range.to)
      throw new RangeError("Visible logical ranges require finite from <= to values.");
    if (!this.bars.length) return this;
    const from = Math.max(0, Math.min(this.bars.length - 1, Math.floor(range.from)));
    const to = Math.max(from, Math.min(this.bars.length - 1, Math.floor(range.to)));
    this.visible = Math.max(1, to - from + 1);
    this.offset = this.bars.length - 1 - to;
    if (!this.pricePanUnlocked) this.resetPriceRange();
    this.draw();
    return this;
  }
  /** Returns the loaded timestamps spanning the visible logical viewport. */
  getVisibleRange(): TimeRange | null {
    const range = this.getVisibleLogicalRange();
    if (!range) return null;
    return { from: this.bars[range.from].time, to: this.bars[range.to].time };
  }
  /** Restores a time-axis viewport by selecting loaded bars within an inclusive time interval. */
  setVisibleRange(range: TimeRange) {
    if (!Number.isFinite(range.from) || !Number.isFinite(range.to) || range.from > range.to)
      throw new RangeError("Visible time ranges require finite from <= to values.");
    if (!this.bars.length) return this;
    const from = this.logicalAtOrAfter(range.from);
    const to = this.logicalAtOrBefore(range.to);
    return this.setVisibleLogicalRange({ from, to: Math.max(from, to) });
  }
  /** Moves a time/ordinal chart back to its newest loaded bar. */
  scrollToRealTime() {
    if (!this.numericXAxisActive()) {
      this.offset = 0;
      if (!this.pricePanUnlocked) this.resetPriceRange();
      this.draw();
    }
    return this;
  }
  /** Observe distinct visible logical viewport changes. Returns an unsubscribe function. */
  subscribeVisibleRangeChange(listener: VisibleRangeChangeHandler) {
    this.visibleRangeListeners.add(listener);
    return () => this.visibleRangeListeners.delete(listener);
  }
  /** Converts a loaded bar index to an X coordinate in the current viewport. */
  logicalToCoordinate(logical: number): number | null {
    if (!Number.isFinite(logical) || logical < 0 || logical >= this.bars.length) return null;
    const a = this.layout();
    if (a.plotW <= 0) return null;
    let coordinate: number;
    if (this.numericXAxisActive()) {
      const value = this.bars[logical].x;
      if (typeof value !== "number") return null;
      const range = this.numericXRange();
      coordinate = a.p.left + ((value - range.lo) / Math.max(range.hi - range.lo, 1e-9)) * a.plotW;
    } else {
      const { windowStart } = this.window();
      coordinate = a.p.left + ((logical + 0.5 - windowStart) / this.visible) * a.plotW;
    }
    return coordinate >= a.p.left && coordinate <= a.p.left + a.plotW ? coordinate : null;
  }
  /** Finds the nearest loaded bar at a viewport X coordinate. */
  coordinateToLogical(x: number): number | null {
    const a = this.layout();
    if (!Number.isFinite(x) || !this.bars.length || a.plotW <= 0 || x < a.p.left || x > a.p.left + a.plotW) return null;
    if (this.numericXAxisActive()) {
      const range = this.numericXRange();
      const target = range.lo + ((x - a.p.left) / a.plotW) * (range.hi - range.lo);
      let best: number | null = null;
      for (let index = 0; index < this.bars.length; index += 1) {
        const value = this.bars[index].x;
        if (typeof value !== "number") continue;
        if (best === null || Math.abs(value - target) < Math.abs(Number(this.bars[best].x) - target)) best = index;
      }
      return best;
    }
    const { windowStart } = this.window();
    const logical = Math.round(windowStart + ((x - a.p.left) / a.plotW) * this.visible - 0.5);
    return logical >= 0 && logical < this.bars.length ? logical : null;
  }
  /** Converts an exact loaded timestamp to a viewport X coordinate. */
  timeToCoordinate(time: number): number | null {
    if (!Number.isFinite(time)) return null;
    const logical = this.logicalAtOrAfter(time);
    return this.bars[logical]?.time === time ? this.logicalToCoordinate(logical) : null;
  }
  /** Returns the nearest loaded timestamp at a viewport X coordinate. */
  coordinateToTime(x: number): number | null {
    const logical = this.coordinateToLogical(x);
    return logical === null ? null : this.bars[logical]?.time ?? null;
  }
  /** Converts a price value to a Y coordinate in the main or named pane. */
  priceToCoordinate(price: number, pane = "main"): number | null {
    if (!Number.isFinite(price)) return null;
    const a = this.layout();
    if (pane === "main") {
      const span = this.basePriceSpan * this.priceZoom;
      const hi = this.basePriceCenter + this.priceOffset + span / 2;
      const coordinate = a.p.top + ((hi - price) / span) * a.mainH;
      return coordinate >= a.p.top && coordinate <= a.p.top + a.mainH ? coordinate : null;
    }
    const area = a.paneAreas.find((item) => item.id === pane);
    if (!area) return null;
    const scale = this.paneScale(pane);
    const coordinate = area.top + ((scale.hi - price) / scale.span) * area.height;
    return coordinate >= area.top && coordinate <= area.top + area.height ? coordinate : null;
  }
  /** Converts a Y coordinate to a price value in the main or named pane. */
  coordinateToPrice(y: number, pane = "main"): number | null {
    if (!Number.isFinite(y)) return null;
    const a = this.layout();
    if (pane === "main") {
      if (y < a.p.top || y > a.p.top + a.mainH) return null;
      const span = this.basePriceSpan * this.priceZoom;
      const hi = this.basePriceCenter + this.priceOffset + span / 2;
      return hi - ((y - a.p.top) / a.mainH) * span;
    }
    const area = a.paneAreas.find((item) => item.id === pane);
    if (!area || y < area.top || y > area.top + area.height) return null;
    const scale = this.paneScale(pane);
    return scale.hi - ((y - area.top) / area.height) * scale.span;
  }
  /** Observe crosshair movement without coupling an application to Canvas events. */
  subscribeCrosshairMove(listener: CrosshairMoveHandler) {
    this.crosshairMoveListeners.add(listener);
    return () => this.crosshairMoveListeners.delete(listener);
  }
  getDrawings() {
    return this.drawings.map(cloneDrawing);
  }
  /** Replaces caller-persisted drawings. Create any referenced panes first. */
  setDrawings(drawings: ChartDrawing[]) {
    const seenIds = new Set<string>();
    drawings.forEach((drawing) => assertDrawing(drawing, this.panes, seenIds));
    this.drawings = drawings.map(cloneDrawing);
    this.draft = undefined;
    this.draw();
    return this;
  }
  clearDrawings() {
    this.drawings = [];
    this.draft = undefined;
    this.draw();
    return this;
  }
  fitContent() {
    this.visible = Math.min(Math.max(this.bars.length, 20), 150);
    this.offset = 0;
    this.resetNumericXRange();
    this.resetPriceRange();
    this.draw();
    return this;
  }
  destroy() {
    this.observer.disconnect();
    if (this.renderFrame !== undefined) cancelAnimationFrame(this.renderFrame);
    if (this.resizeFrame !== undefined) cancelAnimationFrame(this.resizeFrame);
    if (this.overlayHideTimer !== undefined) clearTimeout(this.overlayHideTimer);
    this.closeEventPopup();
    this.canvas.remove();
    this.eventPopup.remove();
    this.overlayControl.remove();
  }
  private window() {
    if (this.numericXAxisActive())
      return { windowStart: 0, start: 0, data: this.bars };
    const windowStart = this.bars.length - this.offset - this.visible,
      start = Math.max(0, Math.floor(windowStart)),
      end = Math.min(this.bars.length, Math.ceil(windowStart + this.visible));
    return { windowStart, start, data: this.bars.slice(start, end) };
  }
  private numericXAxisActive() {
    return (
      this.opts.xAxis.type === "numeric" &&
      this.bars.some((bar) => typeof bar.x === "number" && Number.isFinite(bar.x))
    );
  }
  private numericXRange() {
    return {
      lo: this.numericXCenter - this.numericXSpan / 2,
      hi: this.numericXCenter + this.numericXSpan / 2,
    };
  }
  private resetNumericXRange() {
    if (!this.numericXAxisActive()) return;
    const values = this.bars
      .map((bar) => bar.x)
      .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
    if (!values.length) return;
    const lo = Math.min(...values),
      hi = Math.max(...values),
      rawSpan =
        hi - lo > 1e-9
          ? hi - lo
          : Math.max(Math.abs(lo), Math.abs(hi), 1) * 0.02;
    this.numericXCenter = (lo + hi) / 2;
    this.numericXBaseSpan = rawSpan * 1.04;
    this.numericXSpan = this.numericXBaseSpan;
  }
  private logicalAtOrAfter(time: number) {
    let lo = 0,
      hi = this.bars.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (this.bars[mid].time < time) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }
  private logicalAtOrBefore(time: number) {
    let lo = 0,
      hi = this.bars.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (this.bars[mid].time <= time) lo = mid + 1;
      else hi = mid;
    }
    return lo - 1;
  }
  /** Restrict a sorted custom series before converting timestamps to logical points. */
  private visibleSeriesPoints(data: SeriesPoint[], start: number, end: number) {
    if (!data.length || !this.bars.length) return [];
    if (this.numericXAxisActive()) {
      const { lo, hi } = this.numericXRange();
      return data.flatMap((point) => {
        const logical = this.logicalForTime(point.time),
          x = point.x ?? this.bars[logical]?.x;
        if (typeof x !== "number" || x < lo || x > hi) return [];
        return [{ ...point, x, logical }];
      });
    }
    const firstTime = this.bars[Math.max(0, start - 1)]?.time ?? -Infinity;
    const lastTime = this.bars[Math.min(this.bars.length - 1, end)]?.time ?? Infinity;
    let lo = 0,
      hi = data.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (data[mid].time < firstTime) lo = mid + 1;
      else hi = mid;
    }
    const points: Array<SeriesPoint & { logical: number }> = [];
    for (; lo < data.length && data[lo].time <= lastTime; lo++) {
      const point = data[lo],
        logical = this.logicalForTime(point.time);
      if (logical >= start && logical < end) points.push({ ...point, logical });
    }
    return points;
  }
  /** Retain a large free-navigation envelope beyond the loaded data. */
  private maxVisible() {
    return Math.max(150, this.bars.length * 8);
  }
  /**
   * Builds an internal navigation/scale domain for custom-series-only charts.
   * Callers provide points directly; placeholder OHLC bars stay an internal
   * implementation detail rather than part of the public contract.
   */
  private rebuildSeriesDomain() {
    const domain = new Map<
      number,
      { x?: number | string; low: number; high: number; close: number }
    >();
    for (const series of this.series.values()) {
      for (const point of series.data) {
        const current = domain.get(point.time);
        if (current) {
          current.low = Math.min(current.low, point.value);
          current.high = Math.max(current.high, point.value);
          current.close = point.value;
          if (current.x === undefined && point.x !== undefined) current.x = point.x;
        } else
          domain.set(point.time, {
            x: point.x,
            low: point.value,
            high: point.value,
            close: point.value,
          });
      }
    }
    const includesZero = [...this.series.values()].some((series) =>
      ["histogram", "area", "step-area"].includes(series.type),
    );
    this.bars = [...domain.entries()]
      .sort(([a], [b]) => a - b)
      .map(([time, point]) => ({
        time,
        x: point.x,
        open: includesZero ? 0 : point.close,
        high: Math.max(point.high, includesZero ? 0 : -Infinity),
        low: Math.min(point.low, includesZero ? 0 : Infinity),
        close: point.close,
      }));
    this.visible = Math.min(Math.max(this.bars.length, 20), 150);
    this.offset = 0;
    this.resetNumericXRange();
    this.resetPriceRange();
  }
  private logicalForTime(time: number) {
    let lo = 0,
      hi = this.bars.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (this.bars[mid].time < time) lo = mid + 1;
      else hi = mid - 1;
    }
    if (lo === 0) return 0;
    if (lo >= this.bars.length) return this.bars.length - 1;
    return Math.abs(this.bars[lo].time - time) <
      Math.abs(time - this.bars[lo - 1].time)
      ? lo
      : lo - 1;
  }
  private paneScale(id: string) {
    const { start, data } = this.window();
    const paneSeries = [...this.series.values()].filter(
      (series) => series.pane === id,
    );
    const pane = this.panes.get(id)!;
    const values = paneSeries.flatMap((series) =>
      (pane.xAxis.type === "numeric" ? series.data : this.visibleSeriesPoints(series.data, start, start + data.length)).map((point) => point.value),
    );
    const zeroAnchored = paneSeries.some((series) =>
      ["histogram", "area", "step-area"].includes(series.type),
    );
    const baseLo = values.length
      ? Math.min(...values, zeroAnchored ? 0 : Infinity)
      : 0;
    const baseHi = values.length
      ? Math.max(...values, zeroAnchored ? 0 : -Infinity)
      : 1;
    const baseSpan = Math.max(
      (baseHi - baseLo) * (1 + AUTO_FIT_PADDING * 2),
      1e-9,
    );
    const span = baseSpan * pane.zoom;
    const center = (baseHi + baseLo) / 2 + pane.offset;
    return { lo: center - span / 2, hi: center + span / 2, span };
  }
  private resetPriceRange() {
    const { data } = this.window();
    const scoped = this.numericXAxisActive()
      ? data.filter(
          (bar) =>
            typeof bar.x === "number" &&
            bar.x >= this.numericXRange().lo &&
            bar.x <= this.numericXRange().hi,
        )
      : data;
    if (!scoped.length) return;
    const lo = Math.min(...scoped.map((b) => b.low)),
      hi = Math.max(...scoped.map((b) => b.high));
    this.basePriceCenter = (lo + hi) / 2;
    this.basePriceSpan = Math.max(
      (hi - lo) * (1 + AUTO_FIT_PADDING * 2),
      0.000001,
    );
    this.priceZoom = 1;
    this.priceOffset = 0;
  }
  private macdSeries() {
    if (this.macdCache) return this.macdCache;
    return (this.macdCache = macd(this.bars.map((bar) => bar.close)));
  }
  private finishDrawing() {
    this.tool = "none";
    this.draft = undefined;
    this.host.dispatchEvent(new CustomEvent("tradingchartdrawingcomplete"));
    this.updateCursor();
  }
  private resize() {
    // ResizeObserver can fire several times per native window resize. Resizing
    // a canvas clears it, so coalesce those events and repaint in the same
    // frame rather than leaving a blank canvas until a later draw callback.
    if (this.resizeFrame !== undefined) return;
    this.resizeFrame = requestAnimationFrame(() => {
      this.resizeFrame = undefined;
      const r = this.host.getBoundingClientRect(),
        d = Math.max(
          1,
          Math.min(devicePixelRatio || 1, this.opts.maxPixelRatio),
        );
      if (r.width <= 0 || r.height <= 0) return;
      const width = Math.round(r.width * d),
        height = Math.round(r.height * d),
        cssWidth = `${r.width}px`,
        cssHeight = `${r.height}px`;
      if (
        this.canvas.width === width &&
        this.canvas.height === height &&
        this.canvas.style.width === cssWidth &&
        this.canvas.style.height === cssHeight
      )
        return;
      this.canvas.width = width;
      this.canvas.height = height;
      this.canvas.style.width = cssWidth;
      this.canvas.style.height = cssHeight;
      this.ctx.setTransform(d, 0, 0, d, 0, 0);
      if (this.renderFrame !== undefined) {
        cancelAnimationFrame(this.renderFrame);
        this.renderFrame = undefined;
      }
      this.drawNow();
    });
  }
  private area() {
    const r = this.canvas.getBoundingClientRect(),
      p = this.opts.padding;
    return {
      r,
      p,
      w: r.width,
      h: r.height,
      plotW: r.width - p.left - p.right,
      plotH: r.height - p.top - p.bottom,
    };
  }
  private layout() {
    const a = this.area();
    const lower = [...this.panes.values()];
    const requested = lower.reduce((sum, pane) => sum + pane.height, 0);
    const scale = requested > 0.76 ? 0.76 / requested : 1;
    const mainH = Math.max(
      40,
      a.plotH * (1 - requested * scale) - lower.length * 14,
    );
    let top = a.p.top + mainH + 14;
    const paneAreas = lower.map((pane) => {
      const height = a.plotH * pane.height * scale;
      const area = { ...pane, top, height };
      top += height + 14;
      return area;
    });
    return { ...a, mainH, paneAreas, subTop: Infinity, subH: 0 };
  }
  private paneAt(x: number, y: number) {
    const a = this.layout();
    // Include the axes in their pane hit areas so each lower pane owns its
    // right-side scale gesture, while the bottom axis remains global.
    if (y >= a.p.top && y <= a.p.top + a.mainH) return "main";
    return (
      a.paneAreas.find((pane) => y >= pane.top && y <= pane.top + pane.height)
        ?.id ?? null
    );
  }
  private anchor(x: number, y: number): DrawingAnchor | null {
    const a = this.layout(),
      pane = this.paneAt(x, y);
    if (!pane) return null;
    const { windowStart } = this.window();
    if (pane === "macd") {
      const range = this.macdSeries().base * this.macdZoom;
      return {
        logical: windowStart + ((x - a.p.left) / a.plotW) * this.visible,
        price:
          this.macdOffset +
          ((a.subTop + a.subH / 2 - y) / Math.max(1, a.subH * 0.44)) * range,
      };
    }
    if (pane !== "main") {
      const area = a.paneAreas.find((item) => item.id === pane);
      if (!area) return null;
      const { hi, span } = this.paneScale(pane);
      return {
        logical: windowStart + ((x - a.p.left) / a.plotW) * this.visible,
        price: hi - ((y - area.top) / area.height) * span,
      };
    }
    const span = this.basePriceSpan * this.priceZoom,
      hi = this.basePriceCenter + this.priceOffset + span / 2;
    return {
      logical: windowStart + ((x - a.p.left) / a.plotW) * this.visible,
      price: hi - ((y - a.p.top) / a.mainH) * span,
    };
  }
  private eventAt(x: number, y: number) {
    if (!this.eventsVisible) return null;
    const a = this.layout(),
      { windowStart } = this.window();
    for (const event of this.events) {
      const index = this.bars.findIndex((bar) => bar.time >= event.time);
      if (index < 0) continue;
      const markerX =
        a.p.left + ((index + 0.5 - windowStart) * a.plotW) / this.visible;
      const markerY = a.p.top + a.mainH - 12;
      if (
        markerX >= a.p.left &&
        markerX <= a.p.left + a.plotW &&
        Math.hypot(x - markerX, y - markerY) <= 16
      )
        return { event, x: markerX, y: markerY };
    }
    return null;
  }
  private closeEventPopup() {
    this.eventPopup.hidden = true;
    this.eventPopup.replaceChildren();
  }
  private openEventPopup(hit: { event: ChartEvent; x: number; y: number }) {
    const popup = hit.event.popup,
      title = popup?.title ?? hit.event.label ?? hit.event.type,
      rows = popup?.rows ?? [];
    this.eventPopup.replaceChildren();
    const heading = document.createElement("strong");
    heading.textContent = title;
    heading.style.display = "block";
    heading.style.marginBottom = rows.length ? "8px" : "0";
    this.eventPopup.append(heading);
    rows.forEach((row) => {
      const line = document.createElement("div");
      line.style.display = "flex";
      line.style.justifyContent = "space-between";
      line.style.gap = "12px";
      const label = document.createElement("span");
      label.textContent = row.label;
      label.style.color = "#9aa8c3";
      const value = document.createElement("span");
      value.textContent = row.value;
      line.append(label, value);
      this.eventPopup.append(line);
    });
    if (popup?.actionLabel) {
      const action = document.createElement("button");
      action.type = "button";
      action.textContent = popup.actionLabel;
      Object.assign(action.style, {
        marginTop: "10px",
        padding: "5px 8px",
        border: "1px solid #4b6389",
        borderRadius: "4px",
        background: "transparent",
        color: "#9cefc5",
        cursor: "pointer",
      });
      action.addEventListener("click", () => {
        popup.onAction?.(hit.event);
        this.host.dispatchEvent(
          new CustomEvent("tradingcharteventaction", { detail: hit.event }),
        );
      });
      this.eventPopup.append(action);
    }
    const a = this.area();
    this.eventPopup.hidden = false;
    this.eventPopup.style.left = `${Math.max(8, Math.min(hit.x + 14, a.w - 228))}px`;
    this.eventPopup.style.top = `${Math.max(8, hit.y - 110)}px`;
    this.host.dispatchEvent(
      new CustomEvent("tradingcharteventclick", { detail: hit.event }),
    );
  }
  private updateCursor() {
    const a = this.pointer ? this.layout() : undefined;
    if (!a || !this.pointer) {
      this.canvas.style.cursor = "crosshair";
      return;
    }
    const { x, y } = this.pointer;
    if (this.tool !== "none") this.canvas.style.cursor = "crosshair";
    else if (this.eventAt(x, y)) this.canvas.style.cursor = "pointer";
    else if (a.paneAreas.some((pane) => Math.abs(y - (pane.top - 7)) < 10))
      this.canvas.style.cursor = "row-resize";
    else if (a.paneAreas.some((pane) => pane.xAxis.type === "numeric" && y >= pane.top + pane.height - 28 && y <= pane.top + pane.height))
      this.canvas.style.cursor = "ew-resize";
    else if (x >= a.w - a.p.right) this.canvas.style.cursor = "ns-resize";
    else if (y >= a.h - a.p.bottom) this.canvas.style.cursor = "ew-resize";
    else this.canvas.style.cursor = "crosshair";
  }
  private bind() {
    this.canvas.addEventListener("keydown", (event) => {
      const pan = Math.max(1, this.visible * 0.12);
      let changed = false;
      if (event.key === "ArrowLeft") {
        if (this.numericXAxisActive()) this.numericXCenter -= this.numericXSpan * 0.12;
        else this.offset = Math.min(Math.max(0, this.bars.length - this.visible), this.offset + pan);
        changed = true;
      } else if (event.key === "ArrowRight") {
        if (this.numericXAxisActive()) this.numericXCenter += this.numericXSpan * 0.12;
        else this.offset = Math.max(0, this.offset - pan);
        changed = true;
      } else if (event.key === "+" || event.key === "=") {
        if (this.numericXAxisActive()) this.numericXSpan = Math.max(this.numericXBaseSpan * 0.00001, this.numericXSpan * 0.85);
        else this.visible = Math.max(1, this.visible * 0.85);
        changed = true;
      } else if (event.key === "-" || event.key === "_") {
        if (this.numericXAxisActive()) this.numericXSpan = Math.min(this.numericXBaseSpan * 1_000_000, this.numericXSpan / 0.85);
        else this.visible = Math.min(this.maxVisible(), this.visible / 0.85);
        changed = true;
      } else if (event.key === "Home") {
        this.fitContent();
        event.preventDefault();
        return;
      } else if (event.key === "End") {
        this.scrollToRealTime();
        event.preventDefault();
        return;
      } else if (event.key === "Escape") {
        this.tool = "none";
        this.draft = undefined;
        this.closeEventPopup();
        changed = true;
      }
      if (changed) {
        event.preventDefault();
        this.draw();
      }
    });
    this.canvas.addEventListener("pointermove", (e) => {
      const r = this.canvas.getBoundingClientRect();
      this.pointer = { x: e.clientX - r.left, y: e.clientY - r.top };
      this.updateOverlayControl();
      const g = this.gesture;
      if (g) {
        const a = this.layout(),
          mainH = a.mainH,
          dx = this.pointer.x - g.x,
          dy = this.pointer.y - g.y;
        if (g.kind === "pan") {
          const pane = g.paneId ? this.panes.get(g.paneId) : undefined;
          if (pane?.xAxis.type === "numeric")
            pane.xCenter =
              (g.paneXCenter ?? pane.xCenter) -
              (dx / a.plotW) * (g.paneXSpan ?? pane.xSpan);
          else if (this.numericXAxisActive())
            this.numericXCenter =
              (g.numericCenter ?? this.numericXCenter) -
              (dx / a.plotW) * (g.numericSpan ?? this.numericXSpan);
          else this.offset = g.offset + dx / (a.plotW / g.visible);
          if (g.paneId && this.panePanUnlocked.has(g.paneId)) {
            const pane = this.panes.get(g.paneId);
            const area = a.paneAreas.find((item) => item.id === g.paneId);
            if (pane && area) {
              const baseSpan =
                this.paneScale(g.paneId).span / (g.paneZoom ?? 1);
              pane.offset =
                (g.paneOffset ?? 0) +
                (dy * baseSpan * (g.paneZoom ?? 1)) / area.height;
            }
          } else if (
            this.indicators.has("macd") &&
            g.y >= a.subTop &&
            this.macdPanUnlocked
          )
            this.macdOffset =
              g.macdOffset +
              (dy * this.macdSeries().base * g.macdZoom) /
                Math.max(1, a.subH * 0.44);
          else if (!g.paneId && this.pricePanUnlocked)
            this.priceOffset =
              g.priceOffset + (dy * this.basePriceSpan * g.priceZoom) / mainH;
        } else if (g.kind === "scale-x") {
          if (this.numericXAxisActive()) {
            const baseSpan = g.numericSpan ?? this.numericXSpan,
              anchorFraction = Math.max(0, Math.min(1, (g.x - a.p.left) / a.plotW)),
              oldLo = (g.numericCenter ?? this.numericXCenter) - baseSpan / 2,
              anchor = oldLo + anchorFraction * baseSpan;
            this.numericXSpan = Math.max(
              this.numericXBaseSpan * 0.00001,
              Math.min(this.numericXBaseSpan * 1_000_000, baseSpan * Math.exp(dx / 460)),
            );
            this.numericXCenter = anchor - (anchorFraction - 0.5) * this.numericXSpan;
          } else {
          const anchorLogical = Math.min(
              this.bars.length - 1,
              Math.floor(g.windowStart + g.visible - 0.0001),
            ),
            anchorFraction = (anchorLogical + 0.5 - g.windowStart) / g.visible;
          this.visible = Math.max(
            1,
            Math.min(
              this.maxVisible(),
              g.visible * Math.exp(dx / 460),
            ),
          );
          const nextStart = anchorLogical + 0.5 - anchorFraction * this.visible;
          this.offset = this.bars.length - nextStart - this.visible;
          }
        } else if (g.kind === "scale-pane-x" && g.paneId) {
          const pane = this.panes.get(g.paneId);
          if (pane?.xAxis.type === "numeric") {
            const baseSpan = g.paneXSpan ?? pane.xSpan;
            const fraction = Math.max(0, Math.min(1, (g.x - a.p.left) / a.plotW));
            const anchor = (g.paneXCenter ?? pane.xCenter) - baseSpan / 2 + fraction * baseSpan;
            pane.xSpan = Math.max(pane.xBaseSpan * 0.00001, Math.min(pane.xBaseSpan * 1_000_000, baseSpan * Math.exp(dx / 460)));
            pane.xCenter = anchor - (fraction - .5) * pane.xSpan;
          }
        } else if (g.kind === "scale-y") {
          const oldSpan = this.basePriceSpan * g.priceZoom,
            oldHi = this.basePriceCenter + g.priceOffset + oldSpan / 2,
            anchor = oldHi - ((g.y - a.p.top) / mainH) * oldSpan;
          this.priceZoom = Math.max(
            0.2,
            Math.min(12, g.priceZoom * Math.exp(dy / 460)),
          );
          const span = this.basePriceSpan * this.priceZoom;
          this.priceOffset =
            anchor -
            this.basePriceCenter -
            span / 2 +
            ((g.y - a.p.top) / mainH) * span;
        } else if (g.kind === "scale-pane-y" && g.paneId) {
          const pane = this.panes.get(g.paneId);
          const area = a.paneAreas.find((item) => item.id === g.paneId);
          if (pane && area) {
            const { span } = this.paneScale(g.paneId);
            const oldSpan = (span / (g.paneZoom ?? 1)) * (g.paneZoom ?? 1);
            const anchor =
              (g.paneOffset ?? 0) +
              ((area.top + area.height / 2 - g.y) / area.height) * oldSpan;
            pane.zoom = Math.max(
              0.2,
              Math.min(
                12,
                (g.paneZoom ?? 1) * Math.exp(dy / 460),
              ),
            );
            const nextSpan = (span / (g.paneZoom ?? 1)) * pane.zoom;
            pane.offset =
              anchor -
              ((area.top + area.height / 2 - g.y) / area.height) * nextSpan;
          }
        } else if (g.kind === "scale-macd-y") {
          const base = this.macdSeries().base,
            old = g.macdZoom,
            anchor =
              g.macdOffset +
              ((a.subTop + a.subH / 2 - g.y) / Math.max(1, a.subH * 0.44)) *
                base *
                old;
          this.macdZoom = Math.max(
            0.2,
            Math.min(12, old * Math.exp(dy / 460)),
          );
          this.macdOffset =
            anchor -
            ((a.subTop + a.subH / 2 - g.y) / Math.max(1, a.subH * 0.44)) *
              base *
              this.macdZoom;
        } else if (g.kind === "resize-pane") {
          if (g.paneId === "macd")
            this.subRatio = Math.max(
              0.15,
              Math.min(0.6, g.subRatio - dy / a.plotH),
            );
          else if (g.paneId) {
            const pane = this.panes.get(g.paneId);
            if (pane)
              pane.height = Math.max(
                0.12,
                Math.min(0.5, g.subRatio - dy / a.plotH),
              );
          }
        } else if (g.kind === "free" && this.draft?.type === "free-draw") {
          const next = this.anchor(this.pointer.x, this.pointer.y),
            last = this.draft.anchors.at(-1);
          if (
            next &&
            (!last ||
              Math.hypot(
                ((next.logical - last.logical) * a.plotW) / this.visible,
                ((next.price - last.price) * a.plotH) /
                  (this.basePriceSpan * this.priceZoom),
              ) >= 4)
          )
            this.draft = {
              ...this.draft,
              anchors: [...this.draft.anchors, next],
            };
        }
      } else if (
        this.tool === "trendline" &&
        this.draft?.type === "trendline"
      ) {
        const next = this.anchor(this.pointer.x, this.pointer.y);
        if (next)
          this.draft = {
            ...this.draft,
            anchors: [this.draft.anchors[0], next],
          };
      }
      if (
        g &&
        !this.pricePanUnlocked &&
        (g.kind === "pan" || g.kind === "scale-x")
      )
        this.resetPriceRange();
      this.updateCursor();
      this.emitCrosshairMove();
      this.draw();
    });
    this.canvas.addEventListener("pointerleave", (event) => {
      if (event.relatedTarget instanceof Node && this.overlayControl.contains(event.relatedTarget)) return;
      if (!this.gesture) {
        this.pointer = undefined;
        this.emitCrosshairMove();
        this.scheduleOverlayHide();
        this.updateCursor();
        this.draw();
      }
    });
    this.canvas.addEventListener("pointerdown", (e) => {
      const r = this.canvas.getBoundingClientRect();
      this.pointer = { x: e.clientX - r.left, y: e.clientY - r.top };
      const a = this.layout(),
        pane = this.paneAt(this.pointer.x, this.pointer.y),
        anchor = this.anchor(this.pointer.x, this.pointer.y),
        base = {
          x: this.pointer.x,
          y: this.pointer.y,
          offset: this.offset,
          priceOffset: this.priceOffset,
          visible: this.visible,
          numericCenter: this.numericXCenter,
          numericSpan: this.numericXSpan,
          priceZoom: this.priceZoom,
          windowStart: this.window().windowStart,
          subRatio: this.subRatio,
          macdZoom: this.macdZoom,
          macdOffset: this.macdOffset,
          paneZoom:
            pane && pane !== "main" ? this.panes.get(pane)?.zoom : undefined,
          paneOffset:
            pane && pane !== "main" ? this.panes.get(pane)?.offset : undefined,
          paneXSpan:
            pane && pane !== "main" ? this.panes.get(pane)?.xSpan : undefined,
          paneXCenter:
            pane && pane !== "main" ? this.panes.get(pane)?.xCenter : undefined,
          paneId: pane && pane !== "main" ? pane : undefined,
        };
      if (e.button !== 0) {
        this.closeEventPopup();
        this.finishDrawing();
        this.draw();
        return;
      }
      if (this.tool === "none" && !this.opts.interaction.dragPan) return;
      const eventHit = this.tool === "none" ? this.eventAt(this.pointer.x, this.pointer.y) : null;
      if (eventHit) {
        this.openEventPopup(eventHit);
        this.updateCursor();
        return;
      }
      this.closeEventPopup();
      if (this.tool === "horizontal-line" && anchor) {
        this.drawings.push({
          id: `horizontal-line:${Date.now()}`,
          pane: pane ?? "main",
          type: "horizontal-line",
          price: anchor.price,
          color: "#7dd3fc",
        });
        this.finishDrawing();
        this.draw();
        return;
      }
      if (this.tool === "trendline" && anchor) {
        if (this.draft?.type === "trendline") {
          this.drawings.push({
            ...this.draft,
            anchors: [this.draft.anchors[0], anchor],
          });
          this.finishDrawing();
        } else
          this.draft = {
            id: `trendline:${Date.now()}`,
            pane: pane ?? "main",
            type: "trendline",
            anchors: [anchor, anchor],
            color: "#7dd3fc",
          };
        this.draw();
        return;
      }
      if (this.tool === "free-draw" && anchor)
        ((this.gesture = { ...base, kind: "free" }),
          (this.draft = {
            id: `free-draw:${Date.now()}`,
            pane: pane ?? "main",
            type: "free-draw",
            anchors: [anchor],
            color: "#7dd3fc",
          }));
      else {
        const divider = a.paneAreas.find(
          (item) => Math.abs(this.pointer!.y - (item.top - 7)) < 10,
        );
        if (divider)
          this.gesture = {
            ...base,
            kind: "resize-pane",
            paneId: divider.id,
            subRatio: divider.height / a.plotH,
          };
        else if (pane && pane !== "main" && a.paneAreas.find((item) => item.id === pane)?.xAxis.type === "numeric" && this.pointer.y >= (a.paneAreas.find((item) => item.id === pane)!.top + a.paneAreas.find((item) => item.id === pane)!.height - 28))
          this.gesture = { ...base, kind: "scale-pane-x", paneId: pane };
        else if (this.pointer.x >= a.w - a.p.right && pane && pane !== "main") {
          this.panePanUnlocked.add(pane);
          this.gesture = { ...base, kind: "scale-pane-y", paneId: pane };
        }
        else if (
          this.pointer.x >= a.w - a.p.right &&
          this.pointer.y >= a.subTop
        ) {
          this.macdPanUnlocked = true;
          this.gesture = { ...base, kind: "scale-macd-y" };
        } else if (this.pointer.x >= a.w - a.p.right) {
          this.pricePanUnlocked = true;
          this.gesture = { ...base, kind: "scale-y" };
        }
        else if (this.pointer.y >= a.h - a.p.bottom)
          this.gesture = { ...base, kind: "scale-x" };
        else this.gesture = { ...base, kind: "pan" };
      }
      this.canvas.setPointerCapture(e.pointerId);
      this.updateCursor();
    });
    this.canvas.addEventListener("pointerup", () => {
      if (
        this.gesture?.kind === "free" &&
        this.draft?.type === "free-draw" &&
        this.draft.anchors.length > 1
      ) {
        this.drawings.push(this.draft);
        this.finishDrawing();
      }
      if (this.gesture?.kind === "free") this.draft = undefined;
      this.gesture = undefined;
      this.updateCursor();
      this.draw();
    });
    const cancelGesture = () => {
      if (!this.gesture && !this.draft) return;
      this.gesture = undefined;
      this.draft = undefined;
      this.updateCursor();
      this.draw();
    };
    this.canvas.addEventListener("pointercancel", cancelGesture);
    this.canvas.addEventListener("lostpointercapture", cancelGesture);
    this.canvas.addEventListener(
      "wheel",
      (e) => {
        if (!this.opts.interaction.mouseWheel) return;
        e.preventDefault();
        const r = this.canvas.getBoundingClientRect(),
          x = e.clientX - r.left,
          y = e.clientY - r.top,
          a = this.layout(),
          pane = this.paneAt(x, y),
          { windowStart } = this.window();
        const paneArea = pane && pane !== "main" ? a.paneAreas.find((item) => item.id === pane) : undefined;
        const paneWithNumericX = paneArea?.xAxis.type === "numeric" ? this.panes.get(paneArea.id) : undefined;
        if (paneWithNumericX && paneArea && x < a.w - a.p.right) {
          const fraction = Math.max(0, Math.min(1, (x - a.p.left) / a.plotW));
          const oldSpan = paneWithNumericX.xSpan;
          const oldLo = paneWithNumericX.xCenter - oldSpan / 2;
          const anchor = oldLo + fraction * oldSpan;
          paneWithNumericX.xSpan = Math.max(
            paneWithNumericX.xBaseSpan * 0.00001,
            Math.min(paneWithNumericX.xBaseSpan * 1_000_000, oldSpan * Math.exp(e.deltaY / 640)),
          );
          paneWithNumericX.xCenter = anchor - (fraction - .5) * paneWithNumericX.xSpan;
        } else if (x >= a.w - a.p.right) {
          if (pane && pane !== "main") {
            const target = this.panes.get(pane),
              paneArea = a.paneAreas.find((item) => item.id === pane),
              scale = this.paneScale(pane);
            if (target && paneArea) {
              this.panePanUnlocked.add(pane);
              const baseSpan = scale.span / target.zoom,
                baseCenter = (scale.hi + scale.lo) / 2 - target.offset,
                anchor =
                  scale.hi - ((y - paneArea.top) / paneArea.height) * scale.span;
              target.zoom = Math.max(
                0.2,
                Math.min(
                  12,
                  target.zoom *
                    Math.exp(e.deltaY / 640),
                ),
              );
              const nextSpan = baseSpan * target.zoom;
              target.offset =
                anchor -
                baseCenter -
                nextSpan / 2 +
                ((y - paneArea.top) / paneArea.height) * nextSpan;
            }
          } else {
            this.pricePanUnlocked = true;
            const old = this.basePriceSpan * this.priceZoom,
            hi = this.basePriceCenter + this.priceOffset + old / 2,
            anchor = hi - ((y - a.p.top) / a.plotH) * old;
            this.priceZoom = Math.max(
              0.2,
              Math.min(
                12,
                this.priceZoom *
                  Math.exp(e.deltaY / 640),
              ),
            );
            const span = this.basePriceSpan * this.priceZoom;
            this.priceOffset =
              anchor -
              this.basePriceCenter -
              span / 2 +
              ((y - a.p.top) / a.plotH) * span;
          }
        } else if (y >= a.h - a.p.bottom) {
          if (this.numericXAxisActive()) {
            const fraction = Math.max(0, Math.min(1, (x - a.p.left) / a.plotW)),
              oldSpan = this.numericXSpan,
              oldLo = this.numericXCenter - oldSpan / 2,
              anchor = oldLo + fraction * oldSpan;
            this.numericXSpan = Math.max(
              this.numericXBaseSpan * 0.00001,
              Math.min(
                this.numericXBaseSpan * 1_000_000,
                oldSpan * Math.exp(e.deltaY / 640),
              ),
            );
            this.numericXCenter = anchor - (fraction - 0.5) * this.numericXSpan;
          } else {
          const anchorLogical = Math.min(
              this.bars.length - 1,
              Math.floor(windowStart + this.visible - 0.0001),
            ),
            anchorFraction = (anchorLogical + 0.5 - windowStart) / this.visible;
          this.visible = Math.max(
            3,
            Math.min(
              this.maxVisible(),
              this.visible * Math.exp(e.deltaY / 640),
            ),
          );
          const nextStart = anchorLogical + 0.5 - anchorFraction * this.visible;
          this.offset = this.bars.length - nextStart - this.visible;
          }
        } else {
          if (this.numericXAxisActive()) {
            const fraction = Math.max(0, Math.min(1, (x - a.p.left) / a.plotW)),
              oldSpan = this.numericXSpan,
              oldLo = this.numericXCenter - oldSpan / 2,
              anchor = oldLo + fraction * oldSpan;
            this.numericXSpan = Math.max(
              this.numericXBaseSpan * 0.00001,
              Math.min(
                this.numericXBaseSpan * 1_000_000,
                oldSpan * Math.exp(e.deltaY / 640),
              ),
            );
            this.numericXCenter = anchor - (fraction - 0.5) * this.numericXSpan;
          } else {
          const f = Math.max(0, Math.min(1, (x - a.p.left) / a.plotW)),
            anchor = windowStart + f * this.visible;
          this.visible = Math.max(
            3,
            Math.min(
              this.maxVisible(),
              this.visible * Math.exp(e.deltaY / 640),
            ),
          );
          this.offset = this.bars.length - anchor - (1 - f) * this.visible;
          }
        }
        if (!this.pricePanUnlocked) this.resetPriceRange();
        this.draw();
      },
      { passive: false },
    );
  }
  /** Coalesce bursts of input and data updates into one browser paint. */
  private draw() {
    this.emitVisibleRangeChange();
    if (this.renderFrame !== undefined) return;
    this.renderFrame = requestAnimationFrame(() => {
      this.renderFrame = undefined;
      this.drawNow();
    });
  }
  private emitVisibleRangeChange() {
    const range = this.getVisibleLogicalRange();
    const key = range ? `${range.from}:${range.to}` : "null";
    if (key === this.visibleRangeKey) return;
    this.visibleRangeKey = key;
    for (const listener of this.visibleRangeListeners) listener(range && { ...range });
  }
  private emitCrosshairMove() {
    const point = this.pointer ? { ...this.pointer } : null;
    const a = this.layout();
    const inMainPlot = Boolean(point && point.x >= a.p.left && point.x <= a.p.left + a.plotW && point.y >= a.p.top && point.y <= a.p.top + a.mainH);
    const pane = inMainPlot ? "main" : null;
    const logical = inMainPlot && point ? this.coordinateToLogical(point.x) : null;
    const bar = logical === null ? null : this.bars[logical] ? { ...this.bars[logical] } : null;
    const event: CrosshairMoveEvent = {
      point,
      pane,
      logical,
      time: bar?.time ?? null,
      x: bar?.x ?? null,
      price: point && pane ? this.coordinateToPrice(point.y) : null,
      bar,
    };
    const key = event.point && event.logical !== null && event.price !== null
      ? `${event.point.x}:${event.point.y}:${event.logical}:${event.price}`
      : "null";
    if (key === this.crosshairKey) return;
    this.crosshairKey = key;
    for (const listener of this.crosshairMoveListeners) listener(event);
  }
  private drawNow() {
    const layout = this.layout(),
      { p, w, h, plotW, plotH, mainH, subTop, subH } = layout,
      c = this.ctx,
      hasMacd = this.indicators.has("macd");
    c.clearRect(0, 0, w, h);
    c.fillStyle = this.opts.background;
    c.fillRect(0, 0, w, h);
    const { windowStart, start, data } = this.window(),
      span = this.basePriceSpan * this.priceZoom,
      center = this.basePriceCenter + this.priceOffset,
      lo = center - span / 2,
      hi = center + span / 2,
      y = (v: number) => p.top + ((hi - v) / span) * mainH,
      x = (logical: number) =>
        p.left + ((logical - windowStart) * plotW) / this.visible;
    // Numeric axes are continuous coordinates, not evenly spaced labels. This
    // keeps a scatter point and a fitted line aligned even when their samples
    // have different timestamps or irregular X spacing.
    const numericRange = this.numericXRange(),
      numericLo = this.numericXAxisActive() ? numericRange.lo : 0,
      numericHi = this.numericXAxisActive() ? numericRange.hi : 1,
      numericSpan = Math.max(numericHi - numericLo, 1e-9),
      numericX = (value: number) =>
        p.left + ((value - numericLo) / numericSpan) * plotW,
      seriesX = (point: { logical: number; x?: number | string }) =>
        this.opts.xAxis.type === "numeric" && typeof point.x === "number"
          ? numericX(point.x)
          : x(point.logical + 0.5);
    // Preserve the candle's full range when bodies would be too narrow to read.
    const compactCandles = this.kind === "candlestick" && plotW / this.visible < 4;
    c.font = "12px ui-monospace,SFMono-Regular,Menlo,monospace";
    c.lineWidth = 1;
    c.fillStyle = this.opts.textColor;
    const priceTicks = zeroAnchoredTicks(
      lo,
      hi,
      Math.max(3, Math.floor(mainH / 34)),
    );
    const priceDecimals = tickDecimalPlaces(priceTicks.step);
    for (const price of priceTicks.values) {
      const py = y(price);
      const label = price.toFixed(priceDecimals);
      if (this.opts.yAxis === "right" || this.opts.yAxis === "both")
        c.fillText(label, w - p.right + 9, py + 4);
      if (this.opts.yAxis === "left" || this.opts.yAxis === "both")
        c.fillText(label, p.left - c.measureText(label).width - 9, py + 4);
    }
    c.save();
    c.beginPath();
    c.rect(p.left, p.top, plotW, mainH);
    c.clip();
    if (this.hasPrimaryData && this.opts.primarySeriesVisible && this.kind === "line") {
      c.beginPath();
      c.strokeStyle = this.opts.upColor;
      c.lineWidth = 2;
      data.forEach((b, i) =>
        i
          ? c.lineTo(x(start + i + 0.5), y(b.close))
          : c.moveTo(x(start + i + 0.5), y(b.close)),
      );
      c.stroke();
    } else if (this.hasPrimaryData && this.opts.primarySeriesVisible) {
      const bw = Math.max(1, (plotW / this.visible) * 0.66);
      type RenderBar = Bar & { xx: number };
      let renderBars: RenderBar[];
      if (compactCandles && data.length > Math.ceil(plotW)) {
        const buckets = new Map<number, RenderBar>();
        data.forEach((bar, index) => {
          const xx = x(start + index + 0.5),
            bucket = Math.floor(xx - p.left),
            current = buckets.get(bucket);
          if (current) {
            current.high = Math.max(current.high, bar.high);
            current.low = Math.min(current.low, bar.low);
            current.close = bar.close;
          } else buckets.set(bucket, { ...bar, xx });
        });
        renderBars = [...buckets.values()];
      } else renderBars = data.map((bar, index) => ({ ...bar, xx: x(start + index + 0.5) }));
      for (const [rising, color] of [
        [true, this.opts.upColor],
        [false, this.opts.downColor],
      ] as const) {
        c.beginPath();
        for (const bar of renderBars)
          if ((bar.close >= bar.open) === rising) {
            c.moveTo(bar.xx, y(bar.high));
            c.lineTo(bar.xx, y(bar.low));
          }
        c.strokeStyle = color;
        c.stroke();
      }
      if (!compactCandles)
        for (const [rising, color] of [
          [true, this.opts.upColor],
          [false, this.opts.downColor],
        ] as const) {
          c.fillStyle = color;
          for (const bar of renderBars)
            if ((bar.close >= bar.open) === rising)
              c.fillRect(
                bar.xx - bw / 2,
                Math.min(y(bar.open), y(bar.close)),
                bw,
                Math.max(1, Math.abs(y(bar.open) - y(bar.close))),
              );
        }
    }
    if (this.hasPrimaryData && this.volumeVisible) {
      const maxVolume = Math.max(...data.map((b) => b.volume ?? 0), 1),
        volumeHeight = mainH * 0.18,
        bw = Math.max(1, (plotW / this.visible) * 0.66);
      data.forEach((b, i) => {
        c.fillStyle = b.close >= b.open ? "#38d39f55" : "#ff6b8155";
        const vh = ((b.volume ?? 0) / maxVolume) * volumeHeight;
        c.fillRect(x(start + i + 0.5) - bw / 2, p.top + mainH - vh, bw, vh);
      });
    }
    for (const series of this.series.values()) {
      if (series.pane !== "main") continue;
      const points = this.visibleSeriesPoints(
        series.data,
        start,
        start + data.length,
      );
      if (!points.length) continue;
      const values = points.map((point) => point.value);
      const independentLo = Math.min(
        ...values,
        ["histogram", "area", "step-area"].includes(series.type)
          ? 0
          : Infinity,
      );
      const independentHi = Math.max(
        ...values,
        ["histogram", "area", "step-area"].includes(series.type)
          ? 0
          : -Infinity,
      );
      const independentSpan = Math.max(independentHi - independentLo, 1e-9);
      const seriesY =
        series.scale === "price"
          ? y
          : (value: number) =>
              p.top + ((independentHi - value) / independentSpan) * mainH;
      c.strokeStyle = series.color;
      c.fillStyle = series.color;
      c.lineWidth = series.lineWidth;
      if (series.type === "scatter") {
        points.forEach((point) => {
          c.beginPath();
          c.arc(
            seriesX(point),
            seriesY(point.value),
            series.markerRadius,
            0,
            Math.PI * 2,
          );
          c.globalAlpha = 0.82;
          c.fill();
        });
        c.globalAlpha = 1;
      } else if (series.type === "histogram") {
        const baseline = seriesY(0),
          bw = Math.max(1, (plotW / this.visible) * 0.66);
        points.forEach((point) => {
          const py = seriesY(point.value);
          c.globalAlpha = 0.55;
          c.fillRect(
            seriesX(point) - bw / 2,
            Math.min(py, baseline),
            bw,
            Math.abs(py - baseline),
          );
        });
        c.globalAlpha = 1;
      } else {
        if (series.type === "area" || series.type === "step-area") {
          const baseline = seriesY(0),
            stepped = series.type === "step-area";
          if (series.negativeFillColor) {
            const fillClipped = (top: number, height: number, color: string) => {
              if (height <= 0) return;
              c.save();
              c.beginPath();
              c.rect(p.left, top, plotW, height);
              c.clip();
              traceSeriesPath(c, points, seriesX, seriesY, stepped);
              closeAreaPath(c, points, seriesX, baseline);
              c.fillStyle = color;
              c.globalAlpha = 0.24;
              c.fill();
              c.restore();
            };
            fillClipped(p.top, baseline - p.top, series.fillColor);
            fillClipped(baseline, p.top + mainH - baseline, series.negativeFillColor);
            c.globalAlpha = 1;
          } else {
            traceSeriesPath(c, points, seriesX, seriesY, stepped);
            closeAreaPath(c, points, seriesX, baseline);
            c.fillStyle = series.fillColor;
            c.globalAlpha = 0.24;
            c.fill();
            c.globalAlpha = 1;
          }
        }
        traceSeriesPath(c, points, seriesX, seriesY, series.type === "step-area");
        c.strokeStyle = series.color;
        c.stroke();
      }
    }
    if (this.indicators.has("ema")) {
      const values = ema(
        this.bars.map((b) => b.close),
        20,
      );
      c.beginPath();
      c.strokeStyle = "#fbbf24";
      c.lineWidth = 2;
      data.forEach((_, i) => {
        const point = x(start + i + 0.5),
          value = values[start + i];
        i ? c.lineTo(point, y(value)) : c.moveTo(point, y(value));
      });
      c.stroke();
    }
    const render = (d: ChartDrawing, alpha = 1) => {
      c.globalAlpha = alpha;
      c.strokeStyle = d.color ?? "#7dd3fc";
      c.lineWidth = 2;
      if (d.type === "horizontal-line") {
        c.beginPath();
        c.moveTo(p.left, y(d.price));
        c.lineTo(p.left + plotW, y(d.price));
        c.stroke();
        return;
      }
      const points = d.anchors.map((a) => ({ x: x(a.logical), y: y(a.price) }));
      if (points.length < 2) return;
      c.beginPath();
      points.forEach((pt, i) =>
        i ? c.lineTo(pt.x, pt.y) : c.moveTo(pt.x, pt.y),
      );
      c.stroke();
    };
    this.drawings
      .filter((d) => !d.pane || d.pane === "main")
      .forEach((d) => render(d));
    if (this.draft && (!this.draft.pane || this.draft.pane === "main"))
      render(this.draft, 0.65);
    this.overlays.forEach((overlay, overlayIndex) => {
      const index = this.logicalAtOrAfter(overlay.time);
      if (index >= this.bars.length) return;
      const bar = this.bars[index],
        ox =
          this.numericXAxisActive() && typeof bar.x === "number"
            ? numericX(bar.x)
            : x(index + 0.5);
      if (ox < p.left || ox > p.left + plotW) return;
      c.strokeStyle = overlay.color ?? "#8d9aac";
      c.lineWidth = 1;
      c.setLineDash([4, 4]);
      c.beginPath();
      c.moveTo(ox, p.top);
      c.lineTo(ox, p.top + mainH);
      c.stroke();
      c.setLineDash([]);
      if (overlay.detail) {
        c.font = "11px ui-monospace,SFMono-Regular,monospace";
        const detailWidth = c.measureText(overlay.detail).width + 14;
        const detailX = Math.min(ox + 9, p.left + plotW - detailWidth - 4);
        const detailY = p.top + mainH / 2 + ((overlayIndex % 3) - 1) * 19;
        c.fillStyle = "#121c31";
        c.beginPath();
        c.roundRect(detailX, detailY - 11, detailWidth, 22, 4);
        c.fill();
        c.strokeStyle = overlay.color ?? "#536988";
        c.stroke();
        c.fillStyle = "#dce7ff";
        c.textAlign = "left";
        c.fillText(overlay.detail, detailX + 7, detailY + 4);
      }
      c.textAlign = "start";
    });
    this.tradeMarkers.forEach((marker) => {
      const index = this.logicalAtOrAfter(marker.time);
      const bar = this.bars[index];
      if (!bar) return;
      const mx =
        this.numericXAxisActive() && typeof bar.x === "number"
          ? numericX(bar.x)
          : x(index + 0.5);
      if (mx < p.left || mx > p.left + plotW) return;
      const buy = marker.side === "buy";
      const anchor = marker.price ?? (buy ? bar.low : bar.high);
      const my = y(anchor) + (buy ? 10 : -10);
      const color = marker.color ?? (buy ? "#38d39f" : "#ff6b81");
      c.fillStyle = color;
      c.strokeStyle = "#0b1020";
      c.lineWidth = 1.5;
      c.beginPath();
      if (buy) {
        c.moveTo(mx, my - 8);
        c.lineTo(mx - 7, my + 5);
        c.lineTo(mx + 7, my + 5);
      } else {
        c.moveTo(mx, my + 8);
        c.lineTo(mx - 7, my - 5);
        c.lineTo(mx + 7, my - 5);
      }
      c.closePath();
      c.fill();
      c.stroke();
      if (marker.label) {
        c.font = "10px ui-monospace,SFMono-Regular,monospace";
        c.fillStyle = color;
        c.textAlign = "center";
        c.fillText(marker.label, mx, my + (buy ? 18 : -12));
        c.textAlign = "start";
      }
    });
    c.restore();
    this.overlays.forEach((overlay) => {
      const index = this.logicalAtOrAfter(overlay.time);
      if (index >= this.bars.length) return;
      const bar = this.bars[index],
        ox =
          this.numericXAxisActive() && typeof bar.x === "number"
            ? numericX(bar.x)
            : x(index + 0.5);
      if (ox < p.left || ox > p.left + plotW) return;
      const axisValue = bar.x ?? bar.time;
      const axisLabel = overlay.label ?? (this.opts.xAxis.type !== "time"
        ? (this.opts.xAxis.formatter?.(axisValue, index) ?? String(axisValue))
        : new Date(bar.time).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }));
      c.font = "11px ui-monospace,SFMono-Regular,monospace";
      const labelWidth = c.measureText(axisLabel).width + 12;
      const labelX = Math.max(p.left, Math.min(ox - labelWidth / 2, p.left + plotW - labelWidth));
      c.fillStyle = overlay.color ?? "#dce7ff";
      c.beginPath();
      c.roundRect(labelX, p.top + plotH + 4, labelWidth, 20, 4);
      c.fill();
      c.fillStyle = "#10182b";
      c.textAlign = "left";
      c.fillText(axisLabel, labelX + 6, p.top + plotH + 18);
      c.textAlign = "start";
    });
    if (this.eventsVisible)
      this.events.forEach((event) => {
        const index = this.logicalAtOrAfter(event.time);
        if (index >= this.bars.length) return;
        const bar = this.bars[index],
          ex =
            this.numericXAxisActive() && typeof bar.x === "number"
              ? numericX(bar.x)
              : x(index + 0.5),
          ey = p.top + mainH - 12;
        if (ex < p.left || ex > p.left + plotW) return;
        const marker = event.marker ?? {},
          markerColor =
            marker.color ??
            event.color ??
            (event.type === "earnings" ? "#a78bfa" : "#fbbf24"),
          filled = marker.filled ?? true;
        c.strokeStyle = markerColor;
        c.fillStyle = filled ? markerColor : "#101827";
        c.lineWidth = 1.5;
        c.beginPath();
        if ((marker.shape ?? "circle") === "square")
          c.rect(ex - 9, ey - 9, 18, 18);
        else if (marker.shape === "diamond") {
          c.moveTo(ex, ey - 11);
          c.lineTo(ex + 11, ey);
          c.lineTo(ex, ey + 11);
          c.lineTo(ex - 11, ey);
          c.closePath();
        } else c.arc(ex, ey, 10, 0, Math.PI * 2);
        if (filled) c.fill();
        else c.stroke();
        c.fillStyle = filled ? "#101827" : markerColor;
        c.font = "bold 10px ui-monospace,SFMono-Regular,monospace";
        const icon =
          marker.icon ?? event.label ?? (event.type === "earnings" ? "E" : "D");
        c.fillText(icon, ex - c.measureText(icon).width / 2, ey + 4);
      });
    if (hasMacd) {
      c.font = "12px ui-monospace,SFMono-Regular,monospace";
      c.fillStyle = this.opts.textColor;
      c.strokeStyle = "#aab6d3";
      c.beginPath();
      c.moveTo(p.left, subTop - 7);
      c.lineTo(p.left + plotW, subTop - 7);
      c.stroke();
      const { macd, signal, hist, base } = this.macdSeries(),
        range = base * this.macdZoom,
        my = (v: number) =>
          subTop + subH / 2 - ((v - this.macdOffset) / range) * subH * 0.44;
      c.save();
      c.beginPath();
      c.rect(p.left, subTop, plotW, subH);
      c.clip();
      c.strokeStyle = "#273654";
      c.beginPath();
      c.moveTo(p.left, my(0));
      c.lineTo(p.left + plotW, my(0));
      c.stroke();
      const bw = Math.max(1, (plotW / this.visible) * 0.62);
      hist.slice(start, start + data.length).forEach((value, i) => {
        c.fillStyle = value >= 0 ? "#38d39f" : "#ff6b81";
        c.fillRect(
          x(start + i + 0.5) - bw / 2,
          Math.min(my(0), my(value)),
          bw,
          Math.abs(my(value) - my(0)),
        );
      });
      for (const [values, color] of [
        [macd, "#7dd3fc"],
        [signal, "#fbbf24"],
      ] as const) {
        c.beginPath();
        c.strokeStyle = color;
        c.lineWidth = 1.5;
        data.forEach((_, i) =>
          i
            ? c.lineTo(x(start + i + 0.5), my(values[start + i]))
            : c.moveTo(x(start + i + 0.5), my(values[start + i])),
        );
        c.stroke();
      }
      const renderMacd = (d: ChartDrawing, alpha = 1) => {
        c.globalAlpha = alpha;
        c.strokeStyle = d.color ?? "#7dd3fc";
        c.lineWidth = 2;
        if (d.type === "horizontal-line") {
          c.beginPath();
          c.moveTo(p.left, my(d.price));
          c.lineTo(p.left + plotW, my(d.price));
          c.stroke();
          return;
        }
        const points = d.anchors.map((a) => ({
          x: x(a.logical),
          y: my(a.price),
        }));
        if (points.length < 2) return;
        c.beginPath();
        points.forEach((pt, i) =>
          i ? c.lineTo(pt.x, pt.y) : c.moveTo(pt.x, pt.y),
        );
        c.stroke();
      };
      this.drawings
        .filter((d) => d.pane === "macd")
        .forEach((d) => renderMacd(d));
      if (this.draft?.pane === "macd") renderMacd(this.draft, 0.65);
      c.restore();
      const macdLo = this.macdOffset - range / 0.88,
        macdHi = this.macdOffset + range / 0.88,
        macdTicks = zeroAnchoredTicks(
          macdLo,
          macdHi,
          Math.max(3, Math.floor(subH / 34)),
        );
      c.fillStyle = this.opts.textColor;
      for (const value of macdTicks.values)
        c.fillText(
          value.toFixed(tickDecimalPlaces(macdTicks.step)),
          w - p.right + 9,
          my(value) + 4,
        );
      c.fillText("MACD · drag divider to resize", p.left + 4, subTop + 12);
    }
    for (const pane of layout.paneAreas) {
      if (pane.id === "macd") continue;
      const paneSeries = [...this.series.values()].filter(
        (series) => series.pane === pane.id,
      );
      const paneUsesNumericX = pane.xAxis.type === "numeric";
      const points = paneSeries.flatMap((series) =>
        paneUsesNumericX ? series.data : this.visibleSeriesPoints(series.data, start, start + data.length),
      );
      if (!points.length) continue;
      const paneXValues = points.map((point) => typeof point.x === "number" ? point.x : point.time);
      const paneXBaseLo = Math.min(...paneXValues), paneXBaseHi = Math.max(...paneXValues);
      const paneXBaseSpan = Math.max(paneXBaseHi - paneXBaseLo, 1e-9);
      const paneState = this.panes.get(pane.id)!;
      if (paneUsesNumericX && paneState.xBaseSpan === 0) {
        paneState.xBaseSpan = paneXBaseSpan;
        paneState.xSpan = paneXBaseSpan;
        paneState.xCenter = (paneXBaseHi + paneXBaseLo) / 2;
      }
      const paneXSpan = paneUsesNumericX ? paneState.xSpan : paneXBaseSpan;
      const paneXLo = paneUsesNumericX ? paneState.xCenter - paneXSpan / 2 : paneXBaseLo;
      const paneX = (point: { logical: number; x?: number | string }) => paneUsesNumericX
        ? p.left + (((typeof point.x === "number" ? point.x : point.logical) - paneXLo) / paneXSpan) * plotW
        : seriesX(point);
      const { lo, hi, span: paneSpan } = this.paneScale(pane.id);
      const paneY = (value: number) =>
        pane.top + ((hi - value) / paneSpan) * pane.height;
      c.strokeStyle = "#aab6d3";
      c.beginPath();
      c.moveTo(p.left, pane.top - 7);
      c.lineTo(p.left + plotW, pane.top - 7);
      c.stroke();
      c.save();
      c.beginPath();
      c.rect(p.left, pane.top, plotW, pane.height);
      c.clip();
      for (const series of paneSeries) {
        const visiblePoints = paneUsesNumericX
          ? series.data.map((point) => ({ ...point, logical: this.logicalForTime(point.time) }))
          : this.visibleSeriesPoints(series.data, start, start + data.length);
        c.strokeStyle = series.color;
        c.fillStyle = series.color;
        c.lineWidth = series.lineWidth;
        if (series.type === "scatter") {
          visiblePoints.forEach((point) => {
            c.beginPath();
            c.arc(
              paneX(point),
              paneY(point.value),
              series.markerRadius,
              0,
              Math.PI * 2,
            );
            c.globalAlpha = 0.82;
            c.fill();
          });
          c.globalAlpha = 1;
        } else if (series.type === "histogram") {
          const baseline = paneY(0);
          const bw = Math.max(1, (plotW / this.visible) * 0.66);
          visiblePoints.forEach((point) =>
            c.fillRect(
              paneX(point) - bw / 2,
              Math.min(paneY(point.value), baseline),
              bw,
              Math.abs(paneY(point.value) - baseline),
            ),
          );
        } else {
        if (series.type === "area" || series.type === "step-area") {
          const baseline = paneY(0),
            stepped = series.type === "step-area";
          if (series.negativeFillColor) {
            const fillClipped = (top: number, height: number, color: string) => {
              if (height <= 0) return;
              c.save();
              c.beginPath();
              c.rect(p.left, top, plotW, height);
              c.clip();
              traceSeriesPath(c, visiblePoints, paneX, paneY, stepped);
              closeAreaPath(c, visiblePoints, paneX, baseline);
              c.fillStyle = color;
              c.globalAlpha = 0.24;
              c.fill();
              c.restore();
            };
            fillClipped(pane.top, baseline - pane.top, series.fillColor);
            fillClipped(baseline, pane.top + pane.height - baseline, series.negativeFillColor);
            c.globalAlpha = 1;
          } else {
            traceSeriesPath(c, visiblePoints, paneX, paneY, stepped);
            closeAreaPath(c, visiblePoints, paneX, baseline);
            c.fillStyle = series.fillColor;
            c.globalAlpha = 0.24;
            c.fill();
            c.globalAlpha = 1;
          }
          }
          traceSeriesPath(
            c,
            visiblePoints,
            paneX,
            paneY,
            series.type === "step-area",
          );
          c.strokeStyle = series.color;
          c.stroke();
        }
      }
      const renderPaneDrawing = (drawing: ChartDrawing, alpha = 1) => {
        c.globalAlpha = alpha;
        c.strokeStyle = drawing.color ?? "#7dd3fc";
        c.lineWidth = 2;
        if (drawing.type === "horizontal-line") {
          c.beginPath();
          c.moveTo(p.left, paneY(drawing.price));
          c.lineTo(p.left + plotW, paneY(drawing.price));
          c.stroke();
          return;
        }
        const drawingPoints = drawing.anchors.map((anchor) => ({
          x: x(anchor.logical),
          y: paneY(anchor.price),
        }));
        if (drawingPoints.length < 2) return;
        c.beginPath();
        drawingPoints.forEach((point, index) =>
          index ? c.lineTo(point.x, point.y) : c.moveTo(point.x, point.y),
        );
        c.stroke();
      };
      this.drawings
        .filter((drawing) => drawing.pane === pane.id)
        .forEach((drawing) => renderPaneDrawing(drawing));
      if (this.draft?.pane === pane.id) renderPaneDrawing(this.draft, 0.65);
      c.restore();
      const ticks = zeroAnchoredTicks(
        lo,
        hi,
        Math.max(3, Math.floor(pane.height / 34)),
      );
      c.fillStyle = this.opts.textColor;
      c.font = "12px ui-monospace,SFMono-Regular,Menlo,monospace";
      for (const value of ticks.values)
        c.fillText(
          value.toFixed(tickDecimalPlaces(ticks.step)),
          w - p.right + 9,
          paneY(value) + 4,
        );
      c.fillText(pane.title, p.left + 4, pane.top + 12);
      if (paneUsesNumericX) {
        const formatter = pane.xAxis.formatter ?? ((value: number | string) => String(value));
        // Numeric pane labels are anchored to zero, not regenerated from the
        // current viewport endpoints. Panning therefore preserves the label
        // sequence while zooming introduces progressively finer steps.
        const xTicks = zeroAnchoredTicks(paneXLo, paneXLo + paneXSpan, Math.max(3, Math.floor(plotW / 118)));
        xTicks.values.forEach((value, index) => {
          const fraction = (value - paneXLo) / paneXSpan;
          if (fraction < 0 || fraction > 1) return;
          const label = formatter(value, index);
          const width = c.measureText(label).width;
          c.fillText(label, p.left + plotW * fraction - (fraction === .5 ? width / 2 : fraction ? width : 0), pane.top + pane.height - 4);
        });
      }
    }
    // Every removable custom series gets a stable in-chart name. The name is
    // also a hit target for its contextual remove control, avoiding the need
    // to hunt for a thin plotted line.
    this.seriesLabelHits = [];
    c.font = "11px ui-monospace,SFMono-Regular,monospace";
    const drawSeriesLabel = (series: { id: string; label: string; color: string }, x: number, y: number) => {
      const width = c.measureText(series.label).width + 8;
      c.fillStyle = "#111a2ddd";
      c.fillRect(x - 4, y - 12, width, 16);
      c.fillStyle = series.color;
      c.fillText(series.label, x, y);
      this.seriesLabelHits.push({ id: series.id, label: series.label, x: x - 4, y, width });
      return width + 8;
    };
    let mainLabelX = p.left + 8;
    const mainLabelY = p.top + (this.opts.ohlcTooltip === "fixed" ? 86 : 14);
    for (const series of this.series.values())
      if (series.pane === "main" && series.removable)
        mainLabelX += drawSeriesLabel(series, mainLabelX, mainLabelY);
    for (const pane of layout.paneAreas) {
      const owner = [...this.series.values()].find((series) => series.pane === pane.id && series.removable);
      if (!owner) continue;
      // Pane titles are already rendered at the top-left of their pane. They
      // double as the one contextual removal target for the pane's study.
      this.seriesLabelHits.push({
        id: owner.id,
        label: pane.title,
        x: p.left + 4,
        y: pane.top + 12,
        width: c.measureText(pane.title).width + 8,
      });
    }
    const first = Math.max(0, Math.ceil(windowStart)),
      last = Math.min(
        this.bars.length - 1,
        Math.floor(windowStart + this.visible),
      ),
      spanMs = first <= last ? this.bars[last].time - this.bars[first].time : 0,
      intervalMs =
        first < last
          ? this.bars[first + 1].time - this.bars[first].time
          : 86400000,
      labelEveryPeriod = plotW / this.visible >= 66;
    c.font = "12px ui-monospace,SFMono-Regular,monospace";
    c.fillStyle = this.opts.textColor;
    if (this.opts.xAxis.type !== "time") {
      if (this.numericXAxisActive()) {
        const step = nicePriceStep(numericSpan),
          firstValue = Math.ceil(numericLo / step) * step;
        for (let value = firstValue; value <= numericHi + step * 0.001; value += step) {
          const label = this.opts.xAxis.formatter
              ? this.opts.xAxis.formatter(value, 0)
              : value.toFixed(tickDecimalPlaces(step)),
            labelX = numericX(value) - c.measureText(label).width / 2;
          if (labelX >= p.left && labelX + c.measureText(label).width <= p.left + plotW)
            c.fillText(label, labelX, p.top + plotH + 20);
        }
      } else {
      const rawStride = Math.max(
        1,
        Math.ceil((last - first + 1) / Math.max(2, Math.floor(plotW / 88))),
      );
      // Quantized, globally anchored steps are stable under panning. Each
      // zoom level is a strict refinement of the prior level (16, 8, 4, 2, 1).
      const stride = 2 ** Math.ceil(Math.log2(rawStride));
      const zeroLogical =
        this.opts.xAxis.type === "numeric"
          ? this.bars.reduce(
              (closest, bar, index) =>
                Math.abs(Number(bar.x ?? index)) <
                Math.abs(Number(this.bars[closest].x ?? closest))
                  ? index
                  : closest,
              0,
            )
          : -1;
      // For numeric axes, the global tick grid expands out from the zero bar.
      const tickOrigin = zeroLogical >= 0 ? zeroLogical : 0;
      const firstTick =
        tickOrigin + Math.ceil((first - tickOrigin) / stride) * stride;
      const drawAxisLabel = (logical: number) => {
        const bar = this.bars[logical],
          value = bar.x ?? logical;
        const label = this.opts.xAxis.formatter
          ? this.opts.xAxis.formatter(value, logical)
          : String(value);
        c.fillText(
          label,
          (this.opts.xAxis.type === "numeric" && typeof bar.x === "number"
            ? numericX(bar.x)
            : x(logical + 0.5)) - c.measureText(label).width / 2,
          p.top + plotH + 20,
        );
      };
      for (let logical = firstTick; logical <= last; logical += stride) {
        drawAxisLabel(logical);
      }
      if (
        zeroLogical >= first &&
        zeroLogical <= last &&
        (zeroLogical - tickOrigin) % stride !== 0
      )
        drawAxisLabel(zeroLogical);
      }
    } else {
      let lastTimeLabelRight = -Infinity;
      let timeLabelsDrawn = 0;
      for (let logical = first; logical <= last; logical++) {
        const b = this.bars[logical],
          date = new Date(b.time),
          day = date.getUTCDate(),
          weekDay = date.getUTCDay(),
          hour = date.getUTCHours(),
          minute = date.getUTCMinutes(),
          second = date.getUTCSeconds();
        const month = date.getUTCMonth();
        // Market calendars skip weekends/holidays, so the first visible bar of
        // a month is not reliably the first calendar day. Compare against the
        // prior bar instead: this preserves every month/year anchor for daily
        // and intraday financial data.
        const previousDate = logical > 0 ? new Date(this.bars[logical - 1].time) : undefined;
        const monthStart =
          !previousDate ||
          previousDate.getUTCMonth() !== month ||
          previousDate.getUTCFullYear() !== date.getUTCFullYear();
        const dayStart =
          !previousDate ||
          previousDate.getUTCDate() !== day ||
          previousDate.getUTCMonth() !== month ||
          previousDate.getUTCFullYear() !== date.getUTCFullYear();
        const monthStride =
          spanMs >= 2 * 365 * 86400000 ? 6 : spanMs >= 365 * 86400000 ? 2 : 1;
        const dayStride =
          spanMs >= 28 * 86400000
            ? 7
            : spanMs >= 14 * 86400000
              ? 4
              : spanMs >= 7 * 86400000
                ? 2
                : 1;
        const hourStride =
          spanMs >= 2 * 86400000
            ? 12
            : spanMs >= 12 * 60 * 60 * 1000
              ? 6
              : spanMs >= 6 * 60 * 60 * 1000
                ? 3
                : 1;
        const minuteStride =
          spanMs >= 2 * 60 * 60 * 1000
            ? 30
            : spanMs >= 30 * 60 * 1000
              ? 15
              : spanMs >= 10 * 60 * 1000
                ? 5
                : 1;
        const show =
          labelEveryPeriod ||
          monthStart ||
          (spanMs >= 60 * 86400000
            ? day === 1 && month % monthStride === 0
            : spanMs >= 24 * 60 * 60 * 1000
              // Exchange sessions normally begin after midnight. Anchor day
              // labels to their first traded bar instead of requiring 00:00.
              ? dayStart && (day - 1) % dayStride === 0
              : spanMs >= 60 * 60 * 1000
                ? (dayStart || (minute === 0 && hour % hourStride === 0))
                : spanMs >= 60 * 1000
                  ? second === 0 && minute % minuteStride === 0
                  : second %
                      (spanMs >= 2 * 60 * 1000
                        ? 30
                        : spanMs >= 30 * 1000
                          ? 15
                          : spanMs >= 10 * 1000
                            ? 5
                            : 1) ===
                    0);
        if (!show) continue;
        const label = labelEveryPeriod
          ? intervalMs < 60000
            ? date.toLocaleTimeString(undefined, {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false,
              })
            : intervalMs < 86400000
              ? date.toLocaleTimeString(undefined, {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })
              : date.toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  timeZone: "UTC",
                })
          : monthStart
            ? month === 0
              ? String(date.getUTCFullYear())
              : date.toLocaleDateString(undefined, {
                  month: "short",
                  timeZone: "UTC",
                })
            : spanMs >= 365 * 86400000
              ? date.toLocaleDateString(undefined, {
                  month: "short",
                  timeZone: "UTC",
                })
              : spanMs >= 60 * 86400000
                ? date.toLocaleDateString(undefined, {
                    month: "short",
                    timeZone: "UTC",
                  })
                : spanMs >= 2 * 86400000
                  ? hour === 12
                    ? "12:00"
                    : String(day)
                  : spanMs >= 60 * 60 * 1000
                    ? date.toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      })
                    : spanMs >= 10 * 60 * 1000
                      ? date.toLocaleTimeString(undefined, {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        })
                      : date.toLocaleTimeString(undefined, {
                          minute: "2-digit",
                          second: "2-digit",
                          hour12: false,
                        });
        const labelWidth = c.measureText(label).width;
        const labelX = x(logical + 0.5) - labelWidth / 2;
        // Candidate ticks are semantic; this final guard preserves readability
        // at every zoom level and viewport width.
        if (labelX > lastTimeLabelRight + 6) {
          c.fillText(label, labelX, p.top + plotH + 20);
          lastTimeLabelRight = labelX + labelWidth;
          timeLabelsDrawn++;
        }
      }
      // A freely panned intraday viewport can contain no semantic boundary
      // (for example, a partial session). Always retain one stable date label
      // rather than leaving the time axis blank.
      if (!timeLabelsDrawn && first <= last) {
        const date = new Date(this.bars[first].time);
        const label = spanMs >= 24 * 60 * 60 * 1000
          ? date.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" })
          : date.toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
              timeZone: "UTC",
            });
        c.fillText(label, p.left + 4, p.top + plotH + 20);
      }
    }
    if (this.hasPrimaryData && this.opts.ohlcTooltip === "fixed") {
      const lastVisible = Math.max(
        0,
        Math.min(this.bars.length - 1, Math.floor(windowStart + this.visible - 0.0001)),
      );
      drawOhlcLegend(c, this.bars[lastVisible], p.left + 8, p.top + 15, {
        ...this.opts.ohlcLegend,
        showVolume: this.opts.ohlcLegend.showVolume && this.volumeVisible,
      });
    }
    if (
      this.pointer &&
      this.opts.crosshair &&
      this.pointer.x >= p.left &&
      this.pointer.x <= p.left + plotW &&
      this.pointer.y >= p.top &&
      this.pointer.y <= p.top + mainH
    ) {
      const pointerXValue =
          numericLo + ((this.pointer.x - p.left) / plotW) * numericSpan,
        logical = this.numericXAxisActive()
          ? this.bars.reduce(
              (closest, bar, index) =>
                typeof bar.x === "number" &&
                Math.abs(bar.x - pointerXValue) <
                  Math.abs(Number(this.bars[closest]?.x) - pointerXValue)
                  ? index
                  : closest,
              0,
            )
          : Math.round(
              windowStart + ((this.pointer.x - p.left) / plotW) * this.visible,
            ),
        b = this.bars[logical];
      if (b) {
        const xx =
            this.numericXAxisActive() && typeof b.x === "number"
              ? numericX(b.x)
              : x(logical + 0.5),
          price = hi - ((this.pointer.y - p.top) / mainH) * span;
        c.setLineDash([4, 4]);
        c.strokeStyle = "#8ea5cf";
        c.globalAlpha = 0.75;
        c.beginPath();
        c.moveTo(xx, p.top);
        c.lineTo(xx, h - p.bottom);
        c.moveTo(p.left, this.pointer.y);
        c.lineTo(w - p.right, this.pointer.y);
        c.stroke();
        c.setLineDash([]);
        c.globalAlpha = 1;
        if (this.hasPrimaryData && (this.opts.ohlcTooltip === true || this.opts.ohlcTooltip === "floating"))
          drawOhlcCard(c, b, p.left + 10, p.top + 8);
        else if (this.hasPrimaryData && this.opts.ohlcTooltip === "fixed")
          drawOhlcLegend(c, b, p.left + 8, p.top + 15, {
            ...this.opts.ohlcLegend,
            showVolume: this.opts.ohlcLegend.showVolume && this.volumeVisible,
          });
        c.fillStyle = "#dce7ff";
        c.beginPath();
        c.roundRect(w - p.right + 4, this.pointer.y - 10, 60, 20, 4);
        c.fill();
        c.fillStyle = "#11182b";
        c.font = "11px ui-monospace,SFMono-Regular,monospace";
        c.fillText(price.toFixed(2), w - p.right + 8, this.pointer.y + 4);
        const intervalMs =
          this.bars.length > 1
            ? this.bars[1].time - this.bars[0].time
            : 86400000;
        const xValue = b.x ?? b.time;
        const xLabel =
          this.opts.xAxis.type !== "time"
            ? (this.opts.xAxis.formatter?.(xValue, logical) ?? String(xValue))
            : intervalMs < 60000
              ? new Date(b.time).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: false,
                  timeZone: "UTC",
                })
              : intervalMs < 86400000
                ? new Date(b.time).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                    timeZone: "UTC",
                  })
                : new Date(b.time).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    timeZone: "UTC",
                  });
        const xWidth = c.measureText(xLabel).width + 12;
        const xLeft = Math.max(
          p.left,
          Math.min(xx - xWidth / 2, p.left + plotW - xWidth),
        );
        c.fillStyle = "#dce7ff";
        c.beginPath();
        c.roundRect(xLeft, p.top + plotH + 4, xWidth, 20, 4);
        c.fill();
        c.fillStyle = "#11182b";
        c.fillText(xLabel, xLeft + 6, p.top + plotH + 18);
      }
    }
  }
}
export function createChart(host: HTMLElement, options?: ChartOptions) {
  return new TradingChart(host, options);
}
import {
  ema,
  macd,
  nicePriceStep,
  normalizeBars,
  tickDecimalPlaces,
  zeroAnchoredTicks,
} from "./core";
import { closeAreaPath, traceSeriesPath } from "./renderers";
