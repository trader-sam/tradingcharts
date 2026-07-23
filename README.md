# TradingCharts

A browser-native financial-charting library for Canvas-based financial and analytical visualizations. `0.1.0-alpha.1` is a public pre-release: the API is documented and tested, but may receive clearly described breaking changes before `1.0.0`.

Maintained by Drift Research. Project home: [tradingcharts.xyz](https://tradingcharts.xyz).

## Explore

Run the demo, then open `http://127.0.0.1:5173/docs.html` for the API guide or `http://127.0.0.1:5173/examples.html` for live, reusable chart patterns. The shared navigation links to both.

## Install

The package is prepared for npm publication. Until the first release is published, install it from a local checkout or Git URL. Once published:

```sh
npm install tradingcharts
```

```ts
import { createChart } from "tradingcharts";

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

## Accessibility and browser support

The main chart is keyboard focusable: use Left/Right to pan, +/− to zoom, Home
to fit content, and Escape to cancel a drawing. Options surfaces support arrow
keys to orbit and +/− to zoom. The DOM order-book and options-chain components
use native controls and labels.

Chromium is exercised in CI. Firefox, WebKit, mobile/touch behavior, and richer
screen-reader data summaries are not yet release-gated; treat them as known
pre-release limitations when adopting this version.

TradingCharts is browser-only: it creates Canvas and DOM nodes immediately. In
SSR frameworks, import and create charts from a client-only component or after
the host element has mounted.

## Roadmap

1. Stabilize the public package/distribution surface and complete interaction regression tests.
2. Add richer screen-reader summaries, mobile interactions, expanded visual regression coverage, and more configurable tooltip UI.
3. Add a plugin API and broaden visual regression coverage.

The renderer itself has no runtime dependencies. Import `createChart(host, options)` from `tradingcharts` in consumers, or from `src/index.ts` while developing locally.

## Current public surface

- Bars with optional volume: `setData(bars)`, `update(bar)`, `updateMany(bars)`, and `setVolumeVisible(true)`
- User-defined plots: `addPane(options)`, `addSeries(options)`, `setSeriesData(id, points)`, `updateSeries(id, point)`, and `removeSeries(id)`; points accept `{ time, value, x? }` and can establish a series-only numeric or ordinal domain without placeholder OHLC bars. Set a series `label` and leave `removable` enabled to expose its hover removal control.
- Overlay controls: hovering the fixed `Vol.` legend or a removable main-pane series opens a compact floating control with a built-in Remove action. Consumers can observe removals with the `tradingchartoverlayremove` event.
- Ergonomic series handles: `createSeries(options)` returns `{ id, setData, update, remove }`
- X axes: `setXAxis({ type: 'time' | 'numeric' | 'ordinal', formatter })`; bars can supply an optional `x` display value
- Viewport control: `getVisibleLogicalRange()`, `setVisibleLogicalRange(range)`, `getVisibleRange()`, `setVisibleRange(range)`, `scrollToRealTime()`, and `subscribeVisibleRangeChange(listener)` support synchronized time/ordinal charts and historical-data loading. Continuous numeric axes deliberately return `null` for logical/time ranges.
- Integration coordinates: `logicalToCoordinate()`, `coordinateToLogical()`, `timeToCoordinate()`, `coordinateToTime()`, `priceToCoordinate()`, `coordinateToPrice()`, and `subscribeCrosshairMove(listener)` support external tooltips and linked cursors without Canvas event coupling. Crosshair events contain copied bar snapshots.
- Price formatting: `priceFormatter(value)` consistently formats the main price scale, OHLC inspection, and crosshair price badge. Use an `Intl.NumberFormat` formatter for currency, FX, crypto, or percentage conventions.
- Interaction policy: `interaction: { mouseWheel, dragPan, touchAction }` lets embedded charts preserve vertical page scrolling (`touchAction: 'pan-y'`, the default) while retaining horizontal chart gestures. Pointer cancellation is handled safely.
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
- Drawings: `setDrawingTool(tool)`, `getDrawings()`, `setDrawings(drawings)`, and `clearDrawings()`; returned drawings are safe snapshots for persistence
- Lifecycle: call `destroy()` when the host chart is permanently removed; `fitContent()` and every other chart mutator are chainable

This is a pre-release API. We welcome issues and contribution proposals before treating these contracts as stable.

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

## Publishing

Maintainers should follow [PUBLISHING.md](PUBLISHING.md) before creating a
public release. In particular, configure the final repository and vulnerability
reporting URLs before publishing.

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md), follow the [Code of Conduct](CODE_OF_CONDUCT.md), review the [security policy](SECURITY.md), and use the issue templates for bug reports or feature proposals. TradingCharts is MIT licensed.
