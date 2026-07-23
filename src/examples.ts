import { createChart, createDepthData, createOptionsChain, createOptionsSurface, createOrderBook, type Bar, type OptionLeg, type TradeMarker } from "./index";
import { mountSiteHeader } from "./site-header";
import "./examples.css";

const header = document.querySelector<HTMLElement>(".examples-shell > header")!;
mountSiteHeader(header, "Examples", "Live patterns built with the public API.");

function marketBars(count: number, start = Date.UTC(2025, 0, 2)): Bar[] {
  let price = 184;
  return Array.from({ length: count }, (_, index) => {
    const open = price;
    price += Math.sin(index / 9) * 1.4 + Math.cos(index / 17) * 0.8 + (index % 5 - 2) * 0.23;
    return {
      time: start + index * 86400000,
      open,
      high: Math.max(open, price) + 1.1 + (index % 3) * 0.3,
      low: Math.min(open, price) - 1 - (index % 4) * 0.2,
      close: price,
      volume: 900_000 + Math.round(Math.abs(Math.sin(index / 4)) * 1_600_000),
    };
  });
}

const bars = marketBars(120);

function streamBars(count: number, intervalMs: number, seed = 250) {
  let price = seed;
  const start = Date.now() - count * intervalMs;
  return Array.from({ length: count }, (_, index) => {
    const open = price;
    price += Math.sin(index / 6) * 0.7 + (index % 4 - 1.5) * 0.18;
    return {
      time: start + index * intervalMs,
      open,
      high: Math.max(open, price) + 0.35,
      low: Math.min(open, price) - 0.35,
      close: price,
    };
  });
}

const market = createChart(document.querySelector<HTMLElement>("#example-market")!, {
  background: "#0b1020",
  yAxis: "right",
});
market
  .setData(bars)
  .setVolumeVisible(true)
  .setEvents([
    {
      time: bars[35].time,
      type: "earnings",
      marker: { color: "#a78bfa", icon: "E", shape: "circle" },
      popup: {
        title: "Q1 earnings",
        rows: [
          { label: "Revenue", value: "$4.82B" },
          { label: "EPS", value: "$1.36" },
        ],
      },
    },
    {
      time: bars[83].time,
      type: "dividend",
      marker: { color: "#fbbf24", icon: "D", shape: "diamond" },
      popup: { title: "Quarterly dividend", rows: [{ label: "Amount", value: "$0.28" }] },
    },
  ])
  .fitContent();

const oneSecondBars = streamBars(60, 1_000, 252);
const oneSecond = createChart(document.querySelector<HTMLElement>("#example-one-second")!, {
  background: "#0b1020",
  ohlcTooltip: false,
});
oneSecond.setData(oneSecondBars);
oneSecond.fitContent();
let oneSecondMarkers: TradeMarker[] = oneSecondBars
  .filter((_, index) => index % 12 === 0)
  .map((bar) => ({ time: bar.time, side: bar.close >= bar.open ? "buy" : "sell" }));
oneSecond.setTradeMarkers(oneSecondMarkers);
let oneSecondPrice = oneSecondBars.at(-1)!.close;
let oneSecondTime = oneSecondBars.at(-1)!.time;
const oneSecondStatus = document.querySelector<HTMLElement>("#one-second-status")!;
setInterval(() => {
  const open = oneSecondPrice;
  oneSecondPrice += (Math.random() - 0.48) * 1.35;
  oneSecondTime += 1_000;
  const nextBar = {
    time: oneSecondTime,
    open,
    high: Math.max(open, oneSecondPrice) + Math.random() * 0.28,
    low: Math.min(open, oneSecondPrice) - Math.random() * 0.28,
    close: oneSecondPrice,
  };
  oneSecond.update(nextBar);
  const side: TradeMarker["side"] = nextBar.close >= nextBar.open ? "buy" : "sell";
  oneSecondMarkers = [...oneSecondMarkers, { time: nextBar.time, side }].slice(-14);
  oneSecond.setTradeMarkers(oneSecondMarkers);
  oneSecondStatus.textContent = `New candle · ${new Date(oneSecondTime).toLocaleTimeString()}`;
}, 1_000);

const intrabarBars = streamBars(60, 3_000, 286);
const intrabar = createChart(document.querySelector<HTMLElement>("#example-intrabar")!, {
  background: "#0b1020",
  ohlcTooltip: false,
});
intrabar.setData(intrabarBars);
intrabar.fitContent();
let intrabarPrice = intrabarBars.at(-1)!.close;
let intrabarTime = intrabarBars.at(-1)!.time + 3_000;
let intrabarOpen = intrabarPrice;
let intrabarHigh = intrabarPrice;
let intrabarLow = intrabarPrice;
let tick = 0;
const intrabarStatus = document.querySelector<HTMLElement>("#intrabar-status")!;
setInterval(() => {
  tick++;
  intrabarPrice += (Math.random() - 0.5) * 0.72;
  intrabarHigh = Math.max(intrabarHigh, intrabarPrice);
  intrabarLow = Math.min(intrabarLow, intrabarPrice);
  intrabar.update({
    time: intrabarTime,
    open: intrabarOpen,
    high: intrabarHigh,
    low: intrabarLow,
    close: intrabarPrice,
  });
  intrabarStatus.textContent = `${tick} / 10 intrabar updates`;
  if (tick === 10) {
    tick = 0;
    intrabarTime += 3_000;
    intrabarOpen = intrabarPrice;
    intrabarHigh = intrabarPrice;
    intrabarLow = intrabarPrice;
  }
}, 300);

const payoffPrices = Array.from({ length: 121 }, (_, index) => 75 + index * 0.5);
const payoffPoints = (formula: (spot: number) => number) =>
  payoffPrices.map((spot, index) => ({ time: index, x: spot, value: formula(spot) }));
const payoff = createChart(document.querySelector<HTMLElement>("#example-payoff")!, {
  background: "#0b1020",
  primarySeriesVisible: false,
  ohlcTooltip: false,
  xAxis: { type: "numeric", formatter: (value) => `$${Number(value).toFixed(0)}` },
});
const totalPayoff = payoff.createSeries({ id: "total", type: "area", color: "#69f0bf", fillColor: "#20664e", negativeFillColor: "#8f3145", lineWidth: 2 });
const payoffStatus = document.querySelector<HTMLElement>("#payoff-status")!;
const payoffLineIds: string[] = [];
const updatePayoff = (legs: readonly OptionLeg[]) => {
  payoffLineIds.splice(0).forEach((id) => payoff.removeSeries(id));
  const valueAt = (spot: number, leg: OptionLeg) => {
    const intrinsic = leg.type === "call" ? Math.max(spot - leg.strike, 0) : Math.max(leg.strike - spot, 0);
    return (leg.side === "buy" ? intrinsic - leg.price : leg.price - intrinsic) * leg.quantity;
  };
  totalPayoff.setData(payoffPoints((spot) => legs.reduce((total, leg) => total + valueAt(spot, leg), 0)));
  legs.forEach((leg, index) => {
    const id = `selected-leg-${index}`; payoffLineIds.push(id);
    payoff.createSeries({ id, type: "line", color: leg.side === "buy" ? "#7dd3fc" : "#fb7185", lineWidth: 1 }).setData(payoffPoints((spot) => valueAt(spot, leg)));
  });
  payoff.setOverlays(legs.map((leg) => ({ type: "vertical-line" as const, time: Math.round((leg.strike - 75) / .5), label: `${leg.strike}${leg.type[0].toUpperCase()}`, detail: `${leg.side} ${leg.quantity} @ ${leg.price.toFixed(2)}`, color: leg.side === "buy" ? "#7dd3fc" : "#fb7185" })));
  payoffStatus.textContent = legs.length ? `${legs.length} leg${legs.length === 1 ? "" : "s"} · payoff at expiration` : "Select up to four contracts in the chain";
};
updatePayoff([]);

const optionSpot = 102.4;
const surfaceExpiries = Array.from({ length: 25 }, (_, index) => 7 + index * 10);
const surfaceMoneyness = Array.from({ length: 31 }, (_, index) => 0.7 + index * 0.02);
const surface = createOptionsSurface(document.querySelector<HTMLElement>("#example-surface")!, {
  background: "#0b1020",
  strikeLabel: "MONEYNESS (S / K)",
  expiryLabel: "TIME TO MATURITY",
  valueLabel: "IMPLIED VOLATILITY",
  strikeFormatter: (value) => value.toFixed(2),
  expiryFormatter: (value) => `${(value / 365).toFixed(1)}y`,
  valueFormatter: (value) => `${(value * 100).toFixed(1)}% IV`,
});
surface.setData(
  surfaceExpiries.flatMap((expiry) => surfaceMoneyness.map((moneyness) => {
    const logMoneyness = Math.log(moneyness);
    const termStructure = 0.11 * (1 - Math.exp(-expiry / 135));
    const skew = -0.07 * logMoneyness;
    const smile = 0.24 * logMoneyness ** 2;
    const shortDatedPutStress = 0.3 * Math.exp(-((moneyness - 0.72) ** 2) / 0.012) * Math.exp(-expiry / 75);
    return { strike: moneyness, expiry, value: 0.17 + termStructure + skew + smile + shortDatedPutStress };
  })),
);

const monteCarlo = createChart(document.querySelector<HTMLElement>("#example-monte-carlo")!, {
  background: "#0b1020",
  primarySeriesVisible: false,
  ohlcTooltip: false,
});
const simulationStart = Date.UTC(2026, 1, 2);
const historyLength = 45;
const forecastLength = 70;
const random = (() => {
  let seed = 42_319;
  return () => { seed = (seed * 16_807) % 2_147_483_647; return (seed - 1) / 2_147_483_646; };
})();
const normal = () => {
  const u = Math.max(random(), 1e-9), v = random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(Math.PI * 2 * v);
};
let currentPrice = 102;
const history = Array.from({ length: historyLength }, (_, index) => {
  currentPrice *= Math.exp(0.0007 + normal() * 0.0105);
  return { time: simulationStart + index * 86_400_000, value: currentPrice };
});
monteCarlo.createSeries({ id: "history", type: "line", color: "#eef5ff", lineWidth: 2 }).setData(history);
const paths: number[][] = [];
for (let path = 0; path < 72; path += 1) {
  let price = history.at(-1)!.value;
  const values = [price];
  for (let day = 1; day <= forecastLength; day += 1) { price *= Math.exp(0.00055 + normal() * 0.016); values.push(price); }
  paths.push(values);
  monteCarlo.createSeries({ id: `path-${path}`, type: "line", color: "rgba(96, 214, 192, .14)", lineWidth: 1 }).setData(
    values.map((value, day) => ({ time: simulationStart + (historyLength - 1 + day) * 86_400_000, value })),
  );
}
const percentile = (values: number[], p: number) => [...values].sort((a, b) => a - b)[Math.round((values.length - 1) * p)];
const percentileSeries = (p: number) => Array.from({ length: forecastLength + 1 }, (_, day) => ({
  time: simulationStart + (historyLength - 1 + day) * 86_400_000,
  value: percentile(paths.map((path) => path[day]), p),
}));
monteCarlo.createSeries({ id: "p10", type: "line", color: "#55728a", lineWidth: 1 }).setData(percentileSeries(.1));
monteCarlo.createSeries({ id: "p90", type: "line", color: "#55728a", lineWidth: 1 }).setData(percentileSeries(.9));
monteCarlo.createSeries({ id: "median", type: "line", color: "#fbbf24", lineWidth: 2 }).setData(percentileSeries(.5));
monteCarlo.setOverlays([{ type: "vertical-line", time: history.at(-1)!.time, label: "NOW", detail: "Forecast begins", color: "#69f0bf" }]);

const optionExpirations = [
  ["2026-02-20", "20 Feb · 14d", 0.78],
  ["2026-03-20", "20 Mar · 42d", 1.25],
  ["2026-06-18", "18 Jun · 132d", 2.2],
].map(([id, label, premium]) => ({
  id: String(id),
  label: String(label),
  rows: Array.from({ length: 17 }, (_, index) => {
    const strike = 82.5 + index * 2.5;
    const callFair = Math.max(optionSpot - strike, 0) + Number(premium) * (1.1 + Math.max((strike - optionSpot) / 28, 0));
    const putFair = Math.max(strike - optionSpot, 0) + Number(premium) * (1.1 + Math.max((optionSpot - strike) / 28, 0));
    const quote = (fair: number, bias: number) => ({
      bid: Math.max(.05, fair - .12),
      ask: fair + .12,
      impliedVolatility: .22 + Math.abs(strike - optionSpot) / 160 + bias,
      volume: 35 + ((index * 137 + Math.round(Number(premium) * 41) + Math.round(bias * 100)) % 1_250),
      openInterest: 320 + ((index * 811 + Math.round(Number(premium) * 179) + Math.round(bias * 100)) % 12_000),
    });
    return { strike, call: quote(callFair, .006), put: quote(putFair, -.004) };
  }),
}));
const selectedLegs = document.querySelector<HTMLElement>("#options-chain-status")!;
createOptionsChain(document.querySelector<HTMLElement>("#example-options-chain")!, {
  expirations: optionExpirations,
  spot: optionSpot,
  maxLegs: 4,
  strikeFormatter: (value) => `$${value.toFixed(1)}`,
  onLegsChange: (legs) => { selectedLegs.textContent = legs.length ? `${legs.length} selected leg${legs.length === 1 ? "" : "s"}` : "Select up to four contracts to build a strategy"; updatePayoff(legs); },
});

const signal = createChart(document.querySelector<HTMLElement>("#example-signal")!, {
  background: "#0b1020",
});
signal
  .setData(bars)
  .addPane({ id: "signal", title: "Momentum", height: 0.3 })
  .addSeries({ id: "momentum", pane: "signal", type: "area", color: "#a78bfa" })
  .setSeriesData(
    "momentum",
    bars.map((bar, index) => ({
      time: bar.time,
      value: Math.sin(index / 10) * 24 + Math.cos(index / 23) * 10,
    })),
  )
  .fitContent();

const distribution = createChart(
  document.querySelector<HTMLElement>("#example-distribution")!,
  {
    background: "#0b1020",
    primarySeriesVisible: false,
    ohlcTooltip: false,
    xAxis: { type: "numeric", formatter: (value) => Number(value).toFixed(1) },
  },
);
distribution
  .createSeries({ id: "normal", type: "area", color: "#69f0bf", fillColor: "#1d725d" })
  .setData(
    Array.from({ length: 101 }, (_, index) => {
      const x = (index - 50) / 10;
      return { time: index, x, value: Math.exp(-(x * x) / 2) / Math.sqrt(2 * Math.PI) };
    }),
  );

// Scatter is a regular series primitive: the fit and cluster assignment below
// are application code, so callers can bring any model or classifier they use.
const scatter = createChart(document.querySelector<HTMLElement>("#example-scatter")!, {
  background: "#0b1020",
  primarySeriesVisible: false,
  ohlcTooltip: false,
  xAxis: { type: "numeric", formatter: (value) => Number(value).toFixed(1) },
});
for (const [id, type, color, markerRadius] of [
  ["points", "scatter", "#7dd3fc", 4],
  ["cluster-a", "scatter", "#69f0bf", 4],
  ["cluster-b", "scatter", "#fbbf24", 4],
  ["cluster-c", "scatter", "#a78bfa", 4],
  ["centroids", "scatter", "#f3f7ff", 7],
  ["fit", "line", "#ff8c9b", 2],
] as const)
  scatter.createSeries({ id, type, color, markerRadius });

type ScatterPoint = { time: number; x: number; value: number };
const point = (x: number, value: number, time: number): ScatterPoint => ({ time, x, value });
const scatterShapes = {
  linear: () => {
    const points = Array.from({ length: 35 }, (_, index) => {
      const x = -6 + index * .35;
      return point(x, 1.15 * x + Math.sin(index * 2.17) * .78, index);
    });
    const meanX = points.reduce((total, item) => total + item.x, 0) / points.length;
    const meanY = points.reduce((total, item) => total + item.value, 0) / points.length;
    const slope = points.reduce((total, item) => total + (item.x - meanX) * (item.value - meanY), 0) /
      points.reduce((total, item) => total + (item.x - meanX) ** 2, 0);
    return {
      points,
      fit: points.map(({ x, time }) => point(x, meanY + slope * (x - meanX), time)),
      label: "Least-squares trend",
    };
  },
  curve: () => {
    const points = Array.from({ length: 37 }, (_, index) => {
      const x = -5.5 + index * (11 / 36);
      return point(x, .34 * x * x - 2.8 + Math.sin(index * 1.9) * .58, index);
    });
    return {
      points,
      fit: points.map(({ x, time }) => point(x, .34 * x * x - 2.8, time)),
      label: "Quadratic model fit",
    };
  },
  clusters: () => {
    const centers: Array<[number, number, string]> = [[-3.4, 2.7, "cluster-a"], [.2, -2.1, "cluster-b"], [3.7, 2.2, "cluster-c"]];
    const rawGroups = Object.fromEntries(centers.map(([, , id]) => [id, [] as ScatterPoint[]])) as Record<string, ScatterPoint[]>;
    centers.forEach(([cx, cy, id], group) => {
      rawGroups[id] = Array.from({ length: 17 }, (_, index) => {
        const angle = index * 2.4 + group;
        return point(cx + Math.cos(angle) * (.6 + (index % 4) * .1), cy + Math.sin(angle * 1.3) * (.55 + (index % 3) * .16), 0);
      });
    });
    // The canvas navigation domain is time-ordered. Sort all observations by
    // their numeric x value, then give centroids the exact logical coordinate
    // of the nearest (centered) sample so every mark shares the same scale.
    const ordered = Object.entries(rawGroups).flatMap(([id, points]) => points.map((sample) => ({ id, sample }))).sort((a, b) => a.sample.x - b.sample.x);
    const groups = Object.fromEntries(centers.map(([, , id]) => [id, [] as ScatterPoint[]])) as Record<string, ScatterPoint[]>;
    ordered.forEach(({ id, sample }, time) => groups[id].push({ ...sample, time }));
    const centroids = centers.map(([x, value], index) => {
      const nearest = ordered.reduce((best, item, time) => Math.abs(item.sample.x - x) < Math.abs(best.sample.x - x) ? { sample: item.sample, time } : best, { sample: ordered[0].sample, time: 0 });
      const target = groups[centers[index][2]].find((sample) => sample.time === nearest.time)!;
      target.x = x;
      return point(x, value, nearest.time);
    });
    return { groups, centroids, label: "Three groups with centroids" };
  },
};
const scatterStatus = document.querySelector<HTMLElement>("#scatter-status")!;
const renderScatter = (kind: keyof typeof scatterShapes) => {
  const result = scatterShapes[kind]();
  scatter.setSeriesData("points", "points" in result ? result.points : []);
  scatter.setSeriesData("fit", "fit" in result ? result.fit : []);
  scatter.setSeriesData("cluster-a", "groups" in result ? result.groups["cluster-a"] : []);
  scatter.setSeriesData("cluster-b", "groups" in result ? result.groups["cluster-b"] : []);
  scatter.setSeriesData("cluster-c", "groups" in result ? result.groups["cluster-c"] : []);
  scatter.setSeriesData("centroids", "centroids" in result ? result.centroids : []);
  scatter.fitContent();
  scatterStatus.textContent = result.label;
};
document.querySelectorAll<HTMLButtonElement>("[data-scatter-shape]").forEach((button) =>
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-scatter-shape]").forEach((item) => item.classList.toggle("active", item === button));
    renderScatter(button.dataset.scatterShape as keyof typeof scatterShapes);
  }),
);
renderScatter("linear");

const depthChart = createChart(document.querySelector<HTMLElement>("#example-depth")!, {
  background: "#0b1020",
  primarySeriesVisible: false,
  ohlcTooltip: false,
  xAxis: { type: "numeric", formatter: (value) => `$${Number(value).toFixed(2)}` },
});
let mid = 61_982;
depthChart.createSeries({ id: "bids", type: "step-area", color: "#69f0bf", fillColor: "#236046" });
depthChart.createSeries({ id: "asks", type: "step-area", color: "#ff806f", fillColor: "#6d3632" });
const book = createOrderBook(document.querySelector<HTMLElement>("#example-orderbook")!, {
  levels: 14,
  quoteCurrency: "USDC",
  priceFormatter: (value) => value.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
  sizeFormatter: (value) => Math.round(value).toLocaleString(),
});
const bookLevels = () => ({
  bids: Array.from({ length: 16 }, (_, index) => ({ price: mid - (index + 1) * 0.5, size: 8_000 + ((index * 14_731) % 260_000) })),
  asks: Array.from({ length: 16 }, (_, index) => ({ price: mid + (index + 1) * 0.5, size: 8_000 + ((index * 18_773) % 260_000) })),
});
let liveBook = bookLevels();
const syncDepth = () => {
  const depth = createDepthData(liveBook.bids, liveBook.asks, mid);
  depthChart
    .setData(depth.bars)
    .setSeriesData("bids", depth.bids)
    .setSeriesData("asks", depth.asks)
    .setOverlays([{ type: "vertical-line", time: depth.midTime, label: `MID ${mid.toLocaleString()}`, detail: "Live ladder midpoint", color: "#dbe7ff" }])
    .fitContent();
};
const applyLiveDelta = (side: "bids" | "asks", price: number, size: number) => {
  const levels = liveBook[side];
  const index = levels.findIndex((level) => level.price === price);
  if (index >= 0) levels[index] = { price, size };
  else levels.push({ price, size });
  liveBook = {
    bids: [...liveBook.bids].sort((a, b) => b.price - a.price).slice(0, 16),
    asks: [...liveBook.asks].sort((a, b) => a.price - b.price).slice(0, 16),
  };
};
book.setSnapshot(liveBook);
syncDepth();
const midLabel = document.querySelector<HTMLElement>("#orderbook-mid")!;
const status = document.querySelector<HTMLElement>("#orderbook-status")!;
const refreshBook = () => {
  mid += (Math.random() - 0.5) * 0.7;
  mid = Math.round(mid * 2) / 2;
  const side = Math.random() > 0.5 ? "bids" : "asks";
  const offset = 1 + Math.floor(Math.random() * 14);
  const price = mid + (side === "asks" ? offset : -offset) * 0.5;
  const size = 5_000 + Math.random() * 300_000;
  applyLiveDelta(side, price, size);
  book.update({ [side]: [{ price, size }] });
  if (Math.random() > 0.82) { liveBook = bookLevels(); book.setSnapshot(liveBook); }
  syncDepth();
  midLabel.textContent = mid.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  status.textContent = `Receiving updates · ${3 + Math.floor(Math.random() * 3)} Hz`;
};
refreshBook();
setInterval(refreshBook, 250);
