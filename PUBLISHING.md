# Publishing TradingCharts

## One-time public-repository setup

The intended public repository is `trader-sam/tradingcharts`, with project home
at `tradingcharts.xyz`. Keep the `repository`, `homepage`, and `bugs` metadata
in `package.json` aligned if ownership changes. Enable GitHub private
vulnerability reporting before the first publish, or replace that channel in
`SECURITY.md` with a maintainer security address.

## Release procedure

1. Update `package.json` and `CHANGELOG.md` with the intended version and date.
2. Start from a clean checkout and run `npm ci`.
3. Run `npm run release:check`. It builds the package, runs unit and browser
   tests, validates ESM/CommonJS typings and imports, and mounts a chart from a
   freshly packed tarball in Chromium.
4. Inspect `npm pack --dry-run --json --ignore-scripts` to confirm only the
   documented publish allowlist is included.
5. Commit and tag the release, then publish with `npm publish --access public
   --provenance` from the protected release workflow or an authenticated
   maintainer environment.
6. Install the published version into a fresh browser application and verify
   its release notes, npm metadata, and GitHub links.

## Pre-release policy

The `0.1.x` line is pre-stable. Breaking API changes require a changelog entry
and a clearly described migration note. Do not call a release stable until the
browser-support and accessibility limitations in `README.md` have been closed.
