/** Pure, dependency-free primitives used by TradingCharts and its test suite. */
export type OhlcBar = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

export type OrderBookLevel = { price: number; size: number };
export type DepthChartData = {
  bars: Array<OhlcBar & { x: number }>;
  bids: Array<{ time: number; value: number }>;
  asks: Array<{ time: number; value: number }>;
  midPrice: number;
  midTime: number;
};

function assertFiniteBar(bar: OhlcBar) {
  if (
    !Number.isFinite(bar.time) ||
    !Number.isFinite(bar.open) ||
    !Number.isFinite(bar.high) ||
    !Number.isFinite(bar.low) ||
    !Number.isFinite(bar.close) ||
    (bar.volume !== undefined && !Number.isFinite(bar.volume))
  )
    throw new RangeError(
      "Bars require finite time, open, high, low, close, and optional volume values.",
    );
}

/**
 * Converts order-book levels into two cumulative, price-sorted depth curves.
 * The output is deliberately chart-agnostic: use `bars` for the numeric X
 * domain and the two point collections with any step-area capable renderer.
 */
export function createDepthData(
  bids: readonly OrderBookLevel[],
  asks: readonly OrderBookLevel[],
  midPrice: number,
  startTime = 0,
): DepthChartData {
  if (!Number.isFinite(midPrice) || !Number.isFinite(startTime))
    throw new RangeError("Depth data requires finite midPrice and startTime values.");
  const valid = (level: OrderBookLevel) =>
    Number.isFinite(level.price) && Number.isFinite(level.size) && level.size >= 0;
  const cumulative = (levels: readonly OrderBookLevel[]) => {
    let total = 0;
    return levels.map((level) => ({
      price: level.price,
      value: (total += level.size),
    }));
  };
  // Bids accumulate outward from the mid, then reverse to remain X-ascending.
  const bidCurve = cumulative(
    bids.filter(valid).sort((a, b) => b.price - a.price),
  )
    .reverse()
    .concat({ price: midPrice, value: 0 });
  // Asks naturally accumulate outward while remaining X-ascending.
  const askCurve = [{ price: midPrice, value: 0 }].concat(
    cumulative(asks.filter(valid).sort((a, b) => a.price - b.price)),
  );
  const prices = [...new Set([...bidCurve, ...askCurve].map((point) => point.price))]
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
  const times = new Map(prices.map((price, index) => [price, startTime + index]));
  const maxByPrice = new Map<number, number>();
  [...bidCurve, ...askCurve].forEach((point) =>
    maxByPrice.set(point.price, Math.max(maxByPrice.get(point.price) ?? 0, point.value)),
  );
  const bars = prices.map((price) => {
    const value = maxByPrice.get(price) ?? 0;
    return {
      time: times.get(price)!,
      x: price,
      open: value,
      high: value,
      low: value,
      close: value,
    };
  });
  const points = (curve: typeof bidCurve) =>
    curve.map((point) => ({ time: times.get(point.price)!, value: point.value }));
  return {
    bars,
    bids: points(bidCurve),
    asks: points(askCurve),
    midPrice,
    midTime: times.get(midPrice)!,
  };
}

export function nicePriceStep(span: number) {
  const raw = Math.max(Math.abs(span) / 11, 1e-9);
  const power = Math.pow(10, Math.floor(Math.log10(raw)));
  const unit = raw / power;
  return (unit <= 1 ? 1 : unit <= 2 ? 2 : unit <= 5 ? 5 : 10) * power;
}

export type AxisTicks = { step: number; values: number[] };

/**
 * Produces a zero-anchored numeric axis whose tick levels are nested.
 *
 * Each zoom level halves the prior step, so existing labels never move: the
 * next level only inserts values between them. This is shared by the price
 * axis and every pane axis to keep their interaction model identical.
 */
export function zeroAnchoredTicks(
  low: number,
  high: number,
  targetCount = 8,
  minimumCount = 3,
): AxisTicks {
  if (!Number.isFinite(low) || !Number.isFinite(high)) {
    return { step: 1, values: [] };
  }
  const lo = Math.min(low, high);
  const hi = Math.max(low, high);
  const span = Math.max(hi - lo, Number.EPSILON);
  const desired = Math.max(minimumCount, Math.floor(targetCount));
  // Powers of two guarantee that each finer level contains every previous
  // zero-anchored tick, unlike a conventional 1/2/5 "nice" sequence.
  let step = 2 ** Math.ceil(Math.log2(span / Math.max(1, desired - 1)));
  let firstIndex = Math.ceil(lo / step - 1e-10);
  let lastIndex = Math.floor(hi / step + 1e-10);
  // A coarse zero-anchored range can contain only one or two ticks. Refine it
  // once at a time until there is enough context, without exceeding the label
  // budget in normal viewports.
  while (lastIndex - firstIndex + 1 < minimumCount) {
    step /= 2;
    firstIndex = Math.ceil(lo / step - 1e-10);
    lastIndex = Math.floor(hi / step + 1e-10);
  }
  const values: number[] = [];
  for (let index = firstIndex; index <= lastIndex; index += 1) {
    values.push(index * step);
  }
  return { step, values };
}

/** Number of decimal places needed to display a tick step without collisions. */
export function tickDecimalPlaces(step: number) {
  if (!Number.isFinite(step) || step <= 0) return 0;
  for (let places = 0; places <= 12; places += 1) {
    const scaled = step * 10 ** places;
    if (Math.abs(scaled - Math.round(scaled)) < 1e-8) return places;
  }
  return 12;
}

export function ema(values: number[], period: number) {
  if (!Number.isInteger(period) || period < 1) {
    throw new RangeError("EMA period must be a positive integer");
  }
  const k = 2 / (period + 1);
  return values.reduce<number[]>((out, value, index) => {
    out.push(index ? value * k + out[index - 1] * (1 - k) : value);
    return out;
  }, []);
}

export function macd(
  values: number[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9,
) {
  const fast = ema(values, fastPeriod);
  const slow = ema(values, slowPeriod);
  const line = fast.map((value, index) => value - slow[index]);
  const signal = ema(line, signalPeriod);
  const hist = line.map((value, index) => value - signal[index]);
  const base = Math.max(...line.map(Math.abs), ...signal.map(Math.abs), 0.001);
  return { macd: line, signal, hist, base };
}

/** Inserts or replaces a bar by timestamp without mutating the input. */
export function mergeBar<T extends OhlcBar>(bars: readonly T[], bar: T) {
  assertFiniteBar(bar);
  const index = bars.findIndex((candidate) => candidate.time >= bar.time);
  if (index === -1) return [...bars, bar];
  if (bars[index].time === bar.time) {
    const next = [...bars];
    next[index] = bar;
    return next;
  }
  return [...bars.slice(0, index), bar, ...bars.slice(index)];
}

/** Sorts input and deterministically keeps the latest value for duplicate timestamps. */
export function normalizeBars<T extends OhlcBar>(bars: readonly T[]) {
  bars.forEach(assertFiniteBar);
  return [...bars]
    .sort((a, b) => a.time - b.time)
    .reduce<T[]>((out, bar) => {
      const last = out[out.length - 1];
      if (last?.time === bar.time) out[out.length - 1] = bar;
      else out.push(bar);
      return out;
    }, []);
}
