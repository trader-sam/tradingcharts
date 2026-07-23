# Security policy

## Supported versions

Security fixes are applied to the latest released `0.x` version of OpenCharts.
Pre-release builds, local demos, and unreleased branches are not supported
release channels.

## Reporting a vulnerability

Please do not open a public issue for a potential vulnerability. Send a
private report to the repository maintainers with:

- a description of the impact and affected API or file;
- a minimal reproduction or proof of concept where safe to share; and
- the OpenCharts version and browser/runtime involved.

Maintainers will acknowledge a report within seven days, investigate it
privately, and coordinate a fix and disclosure timeline with the reporter.
Avoid including credentials, customer data, or production market data in a
report.

## Scope

OpenCharts is a browser rendering library. Applications embedding it remain
responsible for authentication, authorization, data-provider credentials,
content security policy, input validation, and any trading or account actions.
