import { createChart, createDepthData, type Bar } from "./index";
import "./style.css";
import "./demo.css";
import { mountSiteHeader } from "./site-header";

function makeBars(count = 220, intervalMs = 86400000): Bar[] {
  let price = 182;
  const start = Date.UTC(2025, 7, 1);
  return Array.from({ length: count }, (_, i) => {
    const open = price;
    const wave = Math.sin(i / 11) * 0.9 + Math.sin(i / 27) * 1.5;
    price = Math.max(20, open + wave + (Math.random() - 0.48) * 5);
    const close = price,
      high = Math.max(open, close) + Math.random() * 2.8,
      low = Math.min(open, close) - Math.random() * 2.8;
    return {
      time: start + i * intervalMs,
      open,
      high,
      low,
      close,
      volume: Math.round(8e5 + Math.random() * 2e6),
    };
  });
}
let bars = makeBars();
const demoEvents = (data: Bar[]) => [
  {
    time: data[50].time,
    type: "earnings" as const,
    label: "Q3",
    marker: { color: "#a78bfa", shape: "circle" as const, filled: true },
    popup: {
      title: "ACME Q3 earnings",
      rows: [{ label: "Period", value: "Q3 2025" }],
      actionLabel: "View earnings",
    },
  },
  {
    time: data[113].time,
    type: "dividend" as const,
    label: "D",
    marker: { color: "#fbbf24", shape: "diamond" as const, filled: true },
    popup: {
      title: "ACME dividend",
      rows: [{ label: "Amount", value: "$0.24" }],
      actionLabel: "View dividends",
    },
  },
  {
    time: data[177].time,
    type: "earnings" as const,
    label: "Q4",
    marker: { color: "#a78bfa", shape: "circle" as const, filled: true },
    popup: {
      title: "ACME Q4 earnings",
      rows: [{ label: "Period", value: "Q4 2025" }],
      actionLabel: "View earnings",
    },
  },
];
document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <main><header><div class="brand"><span class="mark">⌁</span><span>Open<span>Charts</span></span><small>prototype</small></div><p>Fast, composable financial charts for the open web.</p><a href="/docs.html">Docs</a><a href="https://github.com" target="_blank" rel="noreferrer">GitHub ↗</a></header>
  <section class="hero"><div><span class="eyebrow">CANVAS-POWERED • ZERO RUNTIME DEPENDENCIES</span><h1>Charts that stay out<br/>of your way.</h1><p>Explore a lightweight API designed for modern trading and analytics apps. Pan, zoom, inspect, then make it yours.</p></div><div class="metrics"><div><b>60 FPS</b><span>interaction target</span></div><div><b>&lt; 30 kB</b><span>ESM bundle target (gzip)</span></div><div><b>MIT</b><span>open source</span></div></div></section>
  <section class="terminal"><div class="toolbar"><div class="symbol"><strong>ACME</strong><span>Acme Industries</span></div><div class="price"><b id="last-price"></b><span id="change"></span></div><div class="actions"><button class="active" data-type="candlestick">Candles</button><button data-type="line">Line</button><button id="volume" class="active">Volume</button><button id="events" class="active">Events</button><button data-indicator="ema">EMA 20</button><button data-indicator="macd">MACD</button><button data-draw="trendline">Trend</button><button data-draw="horizontal-line">H-Line</button><button data-draw="free-draw">Draw</button><button id="clear">Clear</button><button id="fit">Fit</button></div></div><div id="chart"></div><div class="status"><span><i></i> Market simulated</span><span>EMA overlays price · MACD opens a synchronized subpane</span></div></section>
  <section class="roadmap"><article><span>01</span><h2>A focused core</h2><p>Canvas renderer, a time scale, price scale, series primitives, and an interaction model that can be extended without locking users in.</p></article><article><span>02</span><h2>Useful by default</h2><p>Candles and line series already support responsive layout, panning, zooming, grid controls, and crosshair data inspection.</p></article><article><span>03</span><h2>Build in public</h2><p>Next: streaming updates, multiple panes, indicators, annotations, accessibility, and an ergonomic documented package.</p></article></section>
  <footer>TradingCharts <span>—</span> a deliberately small charting foundation.</footer></main>`;
document.querySelector<HTMLElement>("main")!.classList.add("site-shell");
mountSiteHeader(
  document.querySelector<HTMLElement>("main > header")!,
  "Demo",
  "Fast, composable financial charts for the open web.",
);
const chart = createChart(document.querySelector<HTMLElement>("#chart")!, {
  background: "#0b1020",
})
  .setData(bars)
  .setEvents(demoEvents(bars));
// Indicators are userland series; the demo exposes generic panes instead.
document
  .querySelectorAll("[data-indicator]")
  .forEach((button) => button.remove());
document.querySelector(".status span:last-child")!.textContent =
  "Add any computed series to a synchronized pane";
const momentumPoints = () =>
  bars.map((bar, index) => ({
    time: bar.time,
    value: Math.sin(index / 10) * 42 + Math.cos(index / 21) * 18,
  }));
const momentumButton = document.createElement("button");
momentumButton.textContent = "Momentum";
momentumButton.onclick = () => {
  const enabled = !momentumButton.classList.contains("active");
  if (enabled)
    chart
      .addPane({ id: "momentum", title: "Momentum", height: 0.22 })
      .addSeries({
        id: "demo-momentum",
        pane: "momentum",
        type: "line",
        color: "#a78bfa",
      })
      .setSeriesData("demo-momentum", momentumPoints());
  else chart.removePane("momentum");
  momentumButton.classList.toggle("active", enabled);
};
document.querySelector<HTMLElement>(".actions")!.append(momentumButton);
const intervals = [
  ["1s", 1000],
  ["1m", 60000],
  ["15m", 900000],
  ["1h", 3600000],
  ["1d", 86400000],
] as const;
for (const [label, intervalMs] of intervals) {
  const button = document.createElement("button");
  button.textContent = label;
  button.onclick = () => {
    bars = makeBars(220, intervalMs);
    chart.setData(bars).setEvents(demoEvents(bars));
    if (momentumButton.classList.contains("active"))
      chart.setSeriesData("demo-momentum", momentumPoints());
    refreshSummary();
    document
      .querySelectorAll("[data-timeframe]")
      .forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
  };
  button.dataset.timeframe = label;
  if (label === "1d") button.classList.add("active");
  document.querySelector<HTMLElement>(".actions")!.append(button);
}
const refreshSummary = () => {
  const last = bars.at(-1)!,
    first = bars.at(-2)!;
  document.querySelector("#last-price")!.textContent = last.close.toFixed(2);
  const delta = ((last.close - first.close) / first.close) * 100;
  const change = document.querySelector("#change")!;
  change.textContent = `${delta >= 0 ? "+" : ""}${delta.toFixed(2)}%`;
  change.className = delta >= 0 ? "positive" : "negative";
};
refreshSummary();
document.querySelectorAll<HTMLButtonElement>("[data-type]").forEach(
  (button) =>
    (button.onclick = () => {
      document.querySelector(".actions .active")?.classList.remove("active");
      button.classList.add("active");
      chart.setType(button.dataset.type as "line" | "candlestick");
    }),
);
chart.setVolumeVisible(true);
document.querySelector<HTMLButtonElement>("#volume")!.onclick = (event) => {
  const button = event.currentTarget as HTMLButtonElement;
  const visible = !button.classList.contains("active");
  chart.setVolumeVisible(visible);
  button.classList.toggle("active", visible);
};
document.querySelector<HTMLButtonElement>("#events")!.onclick = (event) => {
  const button = event.currentTarget as HTMLButtonElement;
  const visible = !button.classList.contains("active");
  chart.setEventsVisible(visible);
  button.classList.toggle("active", visible);
};
document.querySelectorAll<HTMLButtonElement>("[data-draw]").forEach(
  (button) =>
    (button.onclick = () => {
      const tool = button.dataset.draw as
        "trendline" | "horizontal-line" | "free-draw";
      chart.setDrawingTool(tool);
      document
        .querySelectorAll("[data-draw]")
        .forEach((item) => item.classList.remove("active"));
      if (chart.getDrawingTool() !== "none") button.classList.add("active");
    }),
);
document
  .querySelector<HTMLElement>("#chart")!
  .addEventListener("tradingchartdrawingcomplete", () =>
    document
      .querySelectorAll("[data-draw]")
      .forEach((item) => item.classList.remove("active")),
  );
document.querySelector<HTMLButtonElement>("#clear")!.onclick = () =>
  chart.clearDrawings();
document.querySelector<HTMLButtonElement>("#fit")!.onclick = () =>
  chart.fitContent();

const distributionSection = document.createElement("section");
distributionSection.className = "terminal distribution-demo";
distributionSection.innerHTML = `
  <div class="toolbar"><div class="symbol"><strong>Normal distribution</strong><span>Generic series rendering</span></div><div class="actions"><button class="active" data-dist="line">Line</button><button data-dist="histogram">Columns</button><button data-dist="area">Line + area</button></div></div>
  <div id="distribution-chart" class="distribution-chart"></div><div class="status"><span><i></i> User supplied data</span><span>Line, columns, and area are generic series types</span></div>`;
const primaryTerminal = document.querySelector<HTMLElement>(".terminal")!;
const demoGrid = document.createElement("div");
demoGrid.className = "demo-grid";
primaryTerminal.before(demoGrid);
demoGrid.append(primaryTerminal, distributionSection);
const distributionPoints = Array.from({ length: 121 }, (_, index) => {
  const z = (index - 60) / 15;
  const value = Math.exp(-(z * z) / 2) / Math.sqrt(2 * Math.PI);
  return {
    time: index,
    x: z,
    value,
  };
});
const distributionChart = createChart(
  document.querySelector<HTMLElement>("#distribution-chart")!,
  {
    background: "#0b1020",
    primarySeriesVisible: false,
    ohlcTooltip: false,
  },
)
  .setXAxis({
    type: "numeric",
    formatter: (value) => Number(value).toFixed(1),
  });
const setDistributionType = (type: "line" | "histogram" | "area") => {
  distributionChart
    .addSeries({ id: "normal", type, color: "#7dd3fc", scale: "price" })
    .setSeriesData("normal", distributionPoints);
};
setDistributionType("line");
document
  .querySelectorAll<HTMLButtonElement>("[data-dist]")
  .forEach((button) => {
    button.onclick = () => {
      setDistributionType(button.dataset.dist as "line" | "histogram" | "area");
      document
        .querySelectorAll("[data-dist]")
        .forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
    };
  });

const depthSection = document.createElement("section");
depthSection.className = "terminal depth-demo";
depthSection.innerHTML = `
  <div class="toolbar"><div class="symbol"><strong>Order-book depth</strong><span>Cumulative bid and ask liquidity</span></div><div class="actions"><button id="depth-refresh">New snapshot</button></div></div>
  <div id="depth-chart" class="distribution-chart"></div><div class="status"><span><i></i> Snapshot simulated</span><span>Generic step-area series + numeric X axis</span></div>`;
demoGrid.append(depthSection);

const makeDepthSnapshot = () => {
  const midPrice = 3894.185;
  const levels = 34;
  const bids = Array.from({ length: levels }, (_, index) => ({
    price: midPrice - 0.45 - index * 0.62,
    size: 3 + Math.round(Math.random() * 12) + (index % 8 === 0 ? 34 : 0),
  }));
  const asks = Array.from({ length: levels }, (_, index) => ({
    price: midPrice + 0.45 + index * 0.62,
    size: 3 + Math.round(Math.random() * 12) + (index % 9 === 0 ? 31 : 0),
  }));
  return createDepthData(bids, asks, midPrice, Date.UTC(2025, 0, 1));
};
const depthChart = createChart(
  document.querySelector<HTMLElement>("#depth-chart")!,
  {
    background: "#0b1020",
    primarySeriesVisible: false,
    ohlcTooltip: false,
    yAxis: "both",
    padding: { top: 56, left: 52, right: 52 },
  },
).setXAxis({
  type: "numeric",
  formatter: (value) =>
    `$${Number(value).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`,
});
const renderDepth = () => {
  const depth = makeDepthSnapshot();
  depthChart
    .setData(depth.bars)
    .addSeries({
      id: "bids",
      type: "step-area",
      color: "#7df27a",
      fillColor: "#388a57",
      lineWidth: 2,
      scale: "price",
    })
    .addSeries({
      id: "asks",
      type: "step-area",
      color: "#ff744d",
      fillColor: "#a34f3e",
      lineWidth: 2,
      scale: "price",
    })
    .setSeriesData("bids", depth.bids)
    .setSeriesData("asks", depth.asks)
    .setOverlays([
      {
        type: "vertical-line",
        time: depth.midTime,
        label: depth.midPrice.toLocaleString(undefined, {
          minimumFractionDigits: 3,
          maximumFractionDigits: 3,
        }),
        detail: "Mid market price",
      },
    ])
    .fitContent();
};
renderDepth();
document.querySelector<HTMLButtonElement>("#depth-refresh")!.onclick = renderDepth;
