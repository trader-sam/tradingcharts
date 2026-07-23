import { createChart, type Bar } from "./index";
import "./docs.css";
import { mountSiteHeader } from "./site-header";

const docsHeader = document.querySelector<HTMLElement>(".shell > header");
document.querySelector<HTMLElement>(".shell")?.classList.add("site-shell");
if (docsHeader)
  mountSiteHeader(
    docsHeader,
    "Docs",
    "Canvas-native charts for the open web.",
  );

const page = document.querySelector<HTMLElement>(".page");
if (page) {
  const layout = document.createElement("div");
  layout.className = "docs-layout";
  const sidebar = document.createElement("aside");
  sidebar.className = "sidebar";
  const items = [
    ["Overview", "/docs.html"],
    ["Getting started", "/docs/getting-started.html"],
    ["Series & panes", "/docs/series-and-panes.html"],
    ["Axes & interaction", "/docs/axes-and-interactions.html"],
  ];
  const api = [
    ["Streaming", "/docs.html#streaming"],
    ["Events & drawings", "/docs.html#events"],
    ["Trade markers", "/docs.html#trade-markers"],
    ["Scatter plots", "/docs.html#scatter"],
    ["Depth & order book", "/docs.html#depth"],
    ["Options surface", "/docs.html#options-surface"],
    ["Options chain", "/docs.html#options-chain"],
    ["Benchmarks", "/benchmarks.html"],
    ["Examples", "/examples.html"],
  ];
  const link = ([label, href]: string[]) => `<a href="${href}" class="${location.pathname === href ? "active" : ""}">${label}</a>`;
  sidebar.innerHTML = `<b>GUIDES</b>${items.map(link).join("")}<b class="sidebar-group">API &amp; COMPONENTS</b>${api.map(link).join("")}`;
  page.before(layout);
  layout.append(sidebar, page);
}

const start = Date.UTC(2025, 0, 1);
const bars = (count = 90): Bar[] => {
  let price = 100;
  return Array.from({ length: count }, (_, index) => {
    const open = price;
    price += Math.sin(index / 7) * 1.2 + (Math.random() - 0.5) * 3;
    return {
      time: start + index * 86400000,
      open,
      high: Math.max(open, price) + 1.5,
      low: Math.min(open, price) - 1.5,
      close: price,
      volume: 100 + Math.round(Math.random() * 600),
    };
  });
};

document.querySelectorAll<HTMLElement>("[data-doc-example]").forEach((host) => {
  const kind = host.dataset.docExample;
  const data = bars();
  const chart = createChart(host, {
    background: "#0b1020",
  }).setData(data);
  if (kind === "series") {
    chart
      .addPane({ id: "signal", title: "Signal", height: 0.28 })
      .addSeries({ id: "wave", pane: "signal", type: "area", color: "#a78bfa" })
      .setSeriesData(
        "wave",
        data.map((bar, index) => ({
          time: bar.time,
          value: Math.sin(index / 8) * 40,
        })),
      );
  }
  if (kind === "axes") {
    chart.setXAxis({
      type: "numeric",
      formatter: (value) => Number(value).toFixed(0),
    });
    chart.setData(data.map((bar, index) => ({ ...bar, x: index - 45 })));
  }
  if (kind === "events") {
    const controls = host.parentElement?.querySelector<HTMLElement>(
      "[data-event-controls]",
    );
    if (!controls) return;
    const field = (name: string) =>
      controls.querySelector<HTMLInputElement | HTMLSelectElement>(`[name="${name}"]`)!;
    const preview = controls.querySelector<HTMLElement>("[data-event-popup-preview]")!;
    const update = () => {
      const label = field("label").value || "D";
      const title = field("title").value || "Event details";
      const amount = field("amount").value || "—";
      chart.setEvents([
        {
          time: data[57].time,
          type: "dividend",
          label,
          marker: {
            color: field("color").value,
            icon: label,
            shape: field("shape").value as "circle" | "square" | "diamond",
            filled: (field("filled") as HTMLInputElement).checked,
          },
          popup: {
            title,
            rows: [{ label: "Amount", value: amount }],
            actionLabel: "See dividend history",
          },
        },
      ]);
      preview.replaceChildren();
      const heading = document.createElement("strong");
      heading.textContent = title;
      const row = document.createElement("span");
      row.textContent = `Amount  ${amount}`;
      const action = document.createElement("button");
      action.type = "button";
      action.textContent = "See dividend history";
      preview.append(heading, row, action);
    };
    controls.addEventListener("input", update);
    controls.addEventListener("change", update);
    update();
  }
});
