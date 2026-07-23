import { describe, expect, it } from "vitest";
import {
  createDepthData,
  ema,
  macd,
  mergeBar,
  nicePriceStep,
  normalizeBars,
  tickDecimalPlaces,
  zeroAnchoredTicks,
} from "./core";

const bar = (time: number, close = time) => ({
  time,
  open: close - 1,
  high: close + 1,
  low: close - 2,
  close,
});

describe("core scale primitives", () => {
  it("returns stable 1/2/5 price steps for every finite viewport", () => {
    for (const span of [1e-14, 0.003, 1, 14, 9876]) {
      const step = nicePriceStep(span);
      expect(step).toBeGreaterThan(0);
      expect(Number.isFinite(step)).toBe(true);
      expect(span / step).toBeLessThanOrEqual(12);
    }
  });

  it("keeps zero-anchored numeric ticks nested as a viewport becomes granular", () => {
    const broad = zeroAnchoredTicks(-9, 9, 5);
    const narrow = zeroAnchoredTicks(-4, 4, 5);
    expect(broad.values).toContain(0);
    expect(narrow.values).toContain(0);
    expect(broad.step / narrow.step).toBeGreaterThanOrEqual(1);
    expect(Number.isInteger(broad.step / narrow.step)).toBe(true);
    expect(tickDecimalPlaces(0.125)).toBe(3);
  });

  it("honors the requested label budget while retaining minimum context", () => {
    const ticks = zeroAnchoredTicks(-100, 100, 5);
    expect(ticks.values.length).toBeLessThanOrEqual(5);
    expect(ticks.values.length).toBeGreaterThanOrEqual(3);
  });

  it("creates cumulative, X-sorted bid and ask curves around the mid price", () => {
    const depth = createDepthData(
      [
        { price: 99, size: 4 },
        { price: 98, size: 7 },
      ],
      [
        { price: 101, size: 5 },
        { price: 102, size: 8 },
      ],
      100,
    );
    expect(depth.bars.map((bar) => bar.x)).toEqual([98, 99, 100, 101, 102]);
    expect(depth.bids.at(-1)).toMatchObject({ value: 0 });
    expect(depth.asks[0]).toMatchObject({ value: 0 });
    expect(depth.asks.at(-1)).toMatchObject({ value: 13 });
  });

  it("calculates EMA from the first value and rejects invalid periods", () => {
    expect(ema([10, 20, 30], 3)).toEqual([10, 15, 22.5]);
    expect(() => ema([1], 0)).toThrow(RangeError);
  });

  it("keeps MACD arrays aligned to source data", () => {
    const result = macd([10, 12, 11, 14, 16, 15]);
    expect(result.macd).toHaveLength(6);
    expect(result.signal).toHaveLength(6);
    expect(result.hist).toHaveLength(6);
    expect(result.base).toBeGreaterThan(0);
  });
});

describe("live bar normalization", () => {
  it("replaces same-timestamp updates and inserts historical updates in order", () => {
    expect(
      mergeBar([bar(10), bar(30)], bar(30, 99)).map((item) => item.close),
    ).toEqual([10, 99]);
    expect(
      mergeBar([bar(10), bar(30)], bar(20)).map((item) => item.time),
    ).toEqual([10, 20, 30]);
  });

  it("sorts input and keeps the final duplicate deterministically", () => {
    expect(normalizeBars([bar(20), bar(10), bar(20, 77)])).toMatchObject([
      { time: 10 },
      { time: 20, close: 77 },
    ]);
  });
});
