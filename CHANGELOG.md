# Changelog

All notable changes to TradingCharts are documented here. This project follows
[Semantic Versioning](https://semver.org/) after its first stable release.

## Unreleased

### Added

- Public logical/time viewport readback, restoration, live-edge navigation,
  and range-change subscriptions for chart synchronization and historical-data
  loading.
- Main-plot coordinate conversion and typed crosshair subscriptions for
  external tooltips and linked cursors, with copied bar snapshots.
- A main-price `priceFormatter` hook applied consistently to axis ticks, OHLC
  inspection, and crosshair labels.
- Public main-price range readback, explicit fixed ranges, and autoscale reset.
- Configurable interaction policy for wheel, drag, and touch behavior; chart
  gestures now recover cleanly from pointer cancellation.

### Changed

- The public class, DOM hooks, and CustomEvent namespace now consistently use
  `TradingChart` / `tradingchart-*` names.
- Charts expose an accessible `region` landmark rather than the broad
  application role. `fitContent()` is now chainable like the other chart
  mutators, and full series writes deterministically retain the final point at
  each duplicate timestamp.

## 0.1.0-alpha.1 - 2026-07-22

### Added

- Canvas candlestick and line charts, generic custom series, panes, drawings,
  events, trade markers, order-book depth and ladder components, options-chain
  and surface components, and an examples gallery.
- Numeric, ordinal, and time X domains; numeric axes render and navigate in
  continuous coordinate space.
- Package verification, benchmark scripts, browser regression tests, and
  contributor/security documentation.
- Explicit validation for public bar, series-point, and depth-data inputs.
- Keyboard pan, zoom, fit, and cancel interactions for the primary chart;
  keyboard orbit and zoom controls for options surfaces.

### Compatibility

- `0.1.x` remains pre-stable. Public APIs are documented, but may receive a
  clearly described breaking change before `1.0.0`.
