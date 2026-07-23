import "./site-header.css";

export type SitePage = "Demo" | "Examples" | "Docs" | "Benchmarks";

const links: Array<[SitePage, string]> = [
  ["Demo", "/"],
  ["Examples", "/examples.html"],
  ["Docs", "/docs.html"],
  ["Benchmarks", "/benchmarks.html"],
];

/** Replaces a page header with the shared OpenCharts navigation shell. */
export function mountSiteHeader(
  host: HTMLElement,
  current: SitePage,
  description: string,
) {
  host.className = "site-header";
  host.replaceChildren();
  const brand = document.createElement("a");
  brand.className = "site-brand";
  brand.href = "/";
  brand.innerHTML = '<span class="site-mark">◌</span><span>Open<span>Charts</span></span>';
  const copy = document.createElement("p");
  copy.className = "site-header-copy";
  copy.textContent = description;
  const nav = document.createElement("nav");
  nav.className = "site-nav";
  links.forEach(([label, href]) => {
    const link = document.createElement("a");
    link.href = href;
    link.textContent = label;
    if (label === current) link.setAttribute("aria-current", "page");
    nav.append(link);
  });
  const github = document.createElement("a");
  github.href = "https://github.com";
  github.target = "_blank";
  github.rel = "noreferrer";
  github.textContent = "GitHub ↗";
  nav.append(github);
  host.append(brand, copy, nav);
}
