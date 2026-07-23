import { describe, expect, it } from "vitest";
import type { CustomSeriesOptions, SeriesPoint } from "./chart";

/**
 * Public-data contract for custom series.
 *
 * Keep these values independent from OHLC `Bar`: a caller supplying a line,
 * histogram, area, or step-area should only need a logical time/value pair
 * plus an optional caller-owned X-domain coordinate.
 */
const numericPoint = {
  time: 1_725_000_000,
  x: 3_894.185,
  value: 247,
} satisfies SeriesPoint;

const ordinalPoint = {
  time: 1_725_000_001,
  x: "Level 3",
  value: 125,
} satisfies SeriesPoint;

const scatterOptions = {
  id: "observations",
  type: "scatter",
  color: "#7dd3fc",
  markerRadius: 5,
} satisfies CustomSeriesOptions;

describe("standalone custom-series point contract", () => {
  it("accepts numeric X-domain points without an OHLC bar", () => {
    expect(numericPoint).toEqual({
      time: 1_725_000_000,
      x: 3_894.185,
      value: 247,
    });
    expect("open" in numericPoint).toBe(false);
    expect("close" in numericPoint).toBe(false);
  });

  it("accepts ordinal X-domain points without requiring numeric X values", () => {
    expect(ordinalPoint.x).toBe("Level 3");
    expect(ordinalPoint.value).toBe(125);
  });

  it("exposes scatter as a normal custom-series type", () => {
    expect(scatterOptions.type).toBe("scatter");
    expect(scatterOptions.markerRadius).toBe(5);
  });
});
