import type { OrderBookLevel } from "./core";

export type OrderBookSnapshot = {
  bids: readonly OrderBookLevel[];
  asks: readonly OrderBookLevel[];
};
export type OrderBookOptions = {
  /** Number of price levels displayed on each side. Default: 10. */
  levels?: number;
  quoteCurrency?: string;
  priceFormatter?: (price: number) => string;
  sizeFormatter?: (size: number) => string;
};
export type OrderBookHandle = {
  setSnapshot(snapshot: OrderBookSnapshot): OrderBookHandle;
  /** Applies price-level deltas; a zero size removes the level. */
  update(delta: Partial<OrderBookSnapshot>): OrderBookHandle;
  destroy(): void;
};

type Row = {
  root: HTMLDivElement;
  price: HTMLSpanElement;
  size: HTMLSpanElement;
  total: HTMLSpanElement;
};

const valid = (level: OrderBookLevel) =>
  Number.isFinite(level.price) && Number.isFinite(level.size) && level.size >= 0;

/**
 * Creates a DOM order-book ladder optimized for sub-second feeds. The component
 * allocates its rows once; snapshot and delta updates only change text and CSS
 * variables, and all bursts coalesce to one animation frame.
 */
export function createOrderBook(
  host: HTMLElement,
  options: OrderBookOptions = {},
): OrderBookHandle {
  const levels = Math.max(1, Math.floor(options.levels ?? 10));
  const bids = new Map<number, number>();
  const asks = new Map<number, number>();
  const price = options.priceFormatter ?? ((value: number) => value.toLocaleString(undefined, { maximumFractionDigits: 8 }));
  const size = options.sizeFormatter ?? ((value: number) => value.toLocaleString(undefined, { maximumFractionDigits: 3 }));
  let frame: number | undefined;

  const makeRow = (side: "ask" | "bid"): Row => {
    const root = document.createElement("div");
    root.className = `tradingcharts-orderbook-row tradingcharts-orderbook-${side}`;
    const priceCell = document.createElement("span");
    const sizeCell = document.createElement("span");
    const totalCell = document.createElement("span");
    root.append(priceCell, sizeCell, totalCell);
    return { root, price: priceCell, size: sizeCell, total: totalCell };
  };
  const root = document.createElement("section");
  root.className = "tradingcharts-orderbook";
  root.setAttribute("aria-label", "Order book");
  const header = document.createElement("div");
  header.className = "tradingcharts-orderbook-header";
  const quote = options.quoteCurrency ?? "quote";
  ["Price", `Size (${quote})`, `Total (${quote})`].forEach((label) => {
    const cell = document.createElement("span");
    cell.textContent = label;
    header.append(cell);
  });
  const askRows = Array.from({ length: levels }, () => makeRow("ask"));
  const spread = document.createElement("div");
  spread.className = "tradingcharts-orderbook-spread";
  const bidRows = Array.from({ length: levels }, () => makeRow("bid"));
  root.append(header, ...askRows.map((row) => row.root), spread, ...bidRows.map((row) => row.root));
  host.replaceChildren(root);

  const paintRow = (row: Row, level: { price: number; size: number; total: number } | undefined, maxSize: number) => {
    if (!level) {
      row.root.hidden = true;
      return;
    }
    row.root.hidden = false;
    row.price.textContent = price(level.price);
    row.size.textContent = size(level.size);
    row.total.textContent = size(level.total);
    row.root.style.setProperty("--depth", `${Math.max(0, Math.min(1, level.size / maxSize)) * 100}%`);
  };
  const render = () => {
    frame = undefined;
    const selectedAsks = [...asks]
      .map(([price, size]) => ({ price, size }))
      .sort((a, b) => a.price - b.price)
      .slice(0, levels);
    const selectedBids = [...bids]
      .map(([price, size]) => ({ price, size }))
      .sort((a, b) => b.price - a.price)
      .slice(0, levels);
    let askTotal = 0;
    const askDisplay = selectedAsks.map((level) => ({ ...level, total: (askTotal += level.size) })).reverse();
    let bidTotal = 0;
    const bidDisplay = selectedBids.map((level) => ({ ...level, total: (bidTotal += level.size) }));
    const maxSize = Math.max(1, ...selectedAsks.map((level) => level.size), ...selectedBids.map((level) => level.size));
    askRows.forEach((row, index) => paintRow(row, askDisplay[index], maxSize));
    bidRows.forEach((row, index) => paintRow(row, bidDisplay[index], maxSize));
    const bestAsk = selectedAsks[0]?.price;
    const bestBid = selectedBids[0]?.price;
    spread.textContent = bestAsk !== undefined && bestBid !== undefined
      ? `Spread  ${price(bestAsk - bestBid)}  ·  ${((bestAsk - bestBid) / bestAsk * 100).toFixed(3)}%`
      : "Spread  —";
  };
  const schedule = () => {
    if (frame === undefined) frame = requestAnimationFrame(render);
  };
  const replace = (target: Map<number, number>, values: readonly OrderBookLevel[]) => {
    target.clear();
    values.forEach((level) => { if (valid(level) && level.size > 0) target.set(level.price, level.size); });
  };
  const apply = (target: Map<number, number>, values: readonly OrderBookLevel[]) => {
    values.forEach((level) => {
      if (!valid(level)) return;
      if (level.size === 0) target.delete(level.price);
      else target.set(level.price, level.size);
    });
  };
  return {
    setSnapshot(snapshot) {
      replace(bids, snapshot.bids);
      replace(asks, snapshot.asks);
      schedule();
      return this;
    },
    update(delta) {
      if (delta.bids) apply(bids, delta.bids);
      if (delta.asks) apply(asks, delta.asks);
      schedule();
      return this;
    },
    destroy() {
      if (frame !== undefined) cancelAnimationFrame(frame);
      host.replaceChildren();
    },
  };
}
