# OpenCharts

An early, browser-native financial-charting prototype: a lightweight open-source alternative to proprietary embedded chart widgets.

## Explore

Run the demo, then open `http://127.0.0.1:5173/docs.html` for the API guide or `http://127.0.0.1:5173/examples.html` for live, reusable chart patterns. The shared navigation links to both.

## Install

The package is prepared for npm publication. Until the first release is published, install it from a local checkout or Git URL. Once published:

```sh
npm install opencharts
```

```ts
import { createChart } from "opencharts";

const chart = createChart(document.querySelector("#chart")!);
```

## Documentation map

- [Getting started](docs/getting-started.html): host sizing, OHLC data, streaming updates, and lifecycle.
- [Series and panes](docs/series-and-panes.html): caller-owned plots, independent scales, lower panes, and area fills.
- [Axes and interaction](docs/axes-and-interactions.html): time, numeric, and ordinal domains plus pan/zoom behavior.
- [API overview](docs.html): events, drawings, depth data, live order books, options surfaces, and verification.
- [Examples gallery](examples.html): live market, streaming, depth, order-book, payoff, and implied-volatility patterns.

The published package contains ESM and CommonJS builds, TypeScript declarations, the README, and license. It does not include the demo or documentation site.

## Run the playground

```powershell
npm install
npm run dev
```

The current prototype includes a canvas candlestick/line renderer, responsive resizing, free panning, cursor-anchored zoom, crosshair inspection with X/Y labels, drawings, generic lower panes, volume, corporate-event markers, arbitrary intraday timestamps, and a visual playground.

## Proposed roadmap

1. Stabilize the public package/distribution surface and complete interaction regression tests.
2. Add accessibility, mobile interactions, expanded visual regression coverage, and more configurable tooltip UI.
3. Add a plugin API and broaden visual regression coverage.

The renderer itself has no runtime dependencies. Import `createChart(host, options)` from `opencharts` in consumers, or from `src/index.ts` while developing locally.

## Current public surface

- Bars with optional volume: `setData(bars)`, `update(bar)`, `updateMany(bars)`, and `setVolumeVisible(true)`
- User-defined plots: `addPane(options)`, `addSeries(options)`, `setSeriesData(id, points)`, `updateSeries(id, point)`, and `removeSeries(id)`; points accept `{ time, value, x? }` and can establish a series-only numeric or ordinal domain without placeholder OHLC bars. Set a series `label` and leave `removable` enabled to expose its hover removal control.
- Overlay controls: hovering the fixed `Vol.` legend or a removable main-pane series opens a compact floating control with a built-in Remove action. Consumers can observe removals with the `openchartoverlayremove` event.
- Ergonomic series handles: `createSeries(options)` returns `{ id, setData, update, remove }`
- X axes: `setXAxis({ type: 'time' | 'numeric' | 'ordinal', formatter })`; bars can supply an optional `x` display value
- OHLC inspection: `ohlcTooltip: 'floating'` (default), `'fixed'`, or `false`; fixed legends accept `ohlcLegend: { title, showVolume }` and update from the crosshair without moving
- Custom-only charts: `primarySeriesVisible: false` and `ohlcTooltip: false`; series types are `line`, `histogram`, `area`, `step-area`, and `scatter`
- High-DPI control: `maxPixelRatio` caps Canvas backing-store density (for example, `maxPixelRatio: 1` for dense dashboard grids)
- Corporate events: `setEvents(events)` and `setEventsVisible(visible)`; markers can provide a fully customized popup with rows and an action callback
- Trade markers: `setTradeMarkers(markers)` draws buy/sell arrows at bar highs/lows or caller-supplied execution prices
- Generic annotations: `setOverlays(overlays)` supports reusable overlay primitives such as vertical lines
- Depth charts: `createDepthData(bids, asks, midPrice)` transforms order-book levels into cumulative bid/ask points for `step-area` series
- Live ladders: `createOrderBook(host, options)` renders a preallocated order-book DOM surface with snapshot and price-level delta updates coalesced to animation frames
- Options surfaces: `createOptionsSurface(host, options)` renders a themed, interactive 3D Canvas surface from strike, expiry, and value points
- Options chains: `createOptionsChain(host, options)` renders a filterable expiration/strike chain with bid/ask-driven multi-leg selection and a leg-change callback
- Drawings: `setDrawingTool(tool)`, `getDrawings()`, and `clearDrawings()`
- Lifecycle: call `destroy()` when the host chart is permanently removed

This is a prototype API. We welcome issues and contribution proposals before treating these contracts as stable.

Custom series accept timestamped `{ time, value }` data and render as a line, histogram, area, step-area, or scatter plot. Scatter series accept the same optional `x` value as every other custom series and support `markerRadius`; use multiple series for groups, centroids, and fitted models. Area plots support `fillColor` plus an optional `negativeFillColor` for the portion below zero. They can share OHLC price coordinates or use an independent normalized scale. Named panes have independent vertical pan/zoom and draggable height, while sharing horizontal navigation. Domain-specific signals stay application-owned rather than becoming a hardcoded indicator catalog.

## Quality checks

```powershell
npm run test       # pure data / scale regression checks
npm run build      # typecheck and production bundle
npm run bench      # attached-DOM performance comparison with Lightweight Charts
npm run bench:size # reports built asset and gzip sizes
npm run verify:package # typechecks and imports an npm-packed artifact in a temporary consumer
npm run release:check  # full build, unit, browser, and packed-consumer gate
```

`npm run bench` writes a timestamped result to `benchmark-results.json`. Benchmark numbers are environment-specific; compare runs on the same machine and browser.

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md), follow the [Code of Conduct](CODE_OF_CONDUCT.md), review the [security policy](SECURITY.md), and use the issue templates for bug reports or feature proposals. OpenCharts is MIT licensed.
