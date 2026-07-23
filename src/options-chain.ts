export type OptionSide = "buy" | "sell";
export type OptionType = "call" | "put";

export type OptionQuote = {
  bid: number;
  ask: number;
  last?: number;
  volume?: number;
  openInterest?: number;
  impliedVolatility?: number;
};

export type OptionChainRow = {
  strike: number;
  call?: OptionQuote;
  put?: OptionQuote;
};

export type OptionExpiration = {
  id: string;
  label: string;
  rows: OptionChainRow[];
};

export type OptionLeg = {
  id: string;
  expirationId: string;
  expirationLabel: string;
  strike: number;
  type: OptionType;
  side: OptionSide;
  quantity: number;
  price: number;
};

export type OptionsChainOptions = {
  expirations: OptionExpiration[];
  initialExpirationId?: string;
  spot?: number;
  maxLegs?: number;
  priceFormatter?: (value: number) => string;
  strikeFormatter?: (value: number) => string;
  onLegsChange?: (legs: readonly OptionLeg[]) => void;
};

export type OptionsChainHandle = {
  setExpirations(expirations: OptionExpiration[]): OptionsChainHandle;
  setSpot(spot?: number): OptionsChainHandle;
  getLegs(): OptionLeg[];
  clearLegs(): OptionsChainHandle;
  destroy(): void;
};

const finiteQuote = (quote: OptionQuote | undefined): quote is OptionQuote =>
  quote !== undefined && Number.isFinite(quote.bid) && Number.isFinite(quote.ask);

/**
 * Renders an accessible, DOM-based options chain with expiry selection, strike
 * filtering, and a buy/sell multi-leg basket. Click an ask to buy or a bid to sell.
 */
export function createOptionsChain(host: HTMLElement, options: OptionsChainOptions): OptionsChainHandle {
  let expirations = options.expirations;
  let spot = options.spot;
  let expirationId = options.initialExpirationId ?? expirations[0]?.id ?? "";
  let filter = "";
  let sideFilter: "all" | OptionType = "all";
  let strikeRange = Infinity;
  let legs: OptionLeg[] = [];
  const maxLegs = Math.max(1, Math.floor(options.maxLegs ?? 8));
  const price = options.priceFormatter ?? ((value: number) => value.toFixed(2));
  const strike = options.strikeFormatter ?? ((value: number) => value.toFixed(0));
  const root = document.createElement("section");
  root.className = "tradingcharts-options-chain";
  root.setAttribute("aria-label", "Options chain");
  host.replaceChildren(root);

  const selectedExpiration = () => expirations.find((expiration) => expiration.id === expirationId) ?? expirations[0];
  const emit = () => options.onLegsChange?.([...legs]);
  const legId = (expiration: OptionExpiration, row: OptionChainRow, type: OptionType, side: OptionSide) => `${expiration.id}:${row.strike}:${type}:${side}`;

  const addLeg = (expiration: OptionExpiration, row: OptionChainRow, type: OptionType, side: OptionSide) => {
    const quote = type === "call" ? row.call : row.put;
    if (!finiteQuote(quote)) return;
    const id = legId(expiration, row, type, side);
    const opposite = legs.find((leg) => leg.expirationId === expiration.id && leg.strike === row.strike && leg.type === type && leg.side !== side);
    if (opposite) return;
    const existing = legs.find((leg) => leg.id === id);
    if (existing) { existing.quantity += 1; render(); emit(); return; }
    if (legs.length >= maxLegs) return;
    legs = [...legs, { id, expirationId: expiration.id, expirationLabel: expiration.label, strike: row.strike, type, side, quantity: 1, price: side === "buy" ? quote.ask : quote.bid }];
    render();
    emit();
  };

  const render = () => {
    const expiration = selectedExpiration();
    if (!expiration) { root.replaceChildren(); return; }
    const rows = expiration.rows.filter((row) =>
      (!filter || String(row.strike).includes(filter)) &&
      (strikeRange === Infinity || spot === undefined || Math.abs(row.strike - spot) <= strikeRange),
    );
    root.replaceChildren();
    const toolbar = document.createElement("div");
    toolbar.className = "tradingcharts-options-toolbar";
    const expiryLabel = document.createElement("label");
    expiryLabel.textContent = "Expiration";
    const select = document.createElement("select");
    select.setAttribute("aria-label", "Expiration");
    expirations.forEach((item) => { const option = document.createElement("option"); option.value = item.id; option.textContent = item.label; option.selected = item.id === expiration.id; select.append(option); });
    select.addEventListener("change", () => { expirationId = select.value; filter = ""; render(); });
    expiryLabel.append(select);
    const filterLabel = document.createElement("label");
    filterLabel.textContent = "Strike filter";
    const input = document.createElement("input");
    input.type = "search"; input.inputMode = "decimal"; input.placeholder = "Any strike"; input.value = filter; input.setAttribute("aria-label", "Filter strikes");
    input.addEventListener("input", () => { filter = input.value.trim(); render(); });
    filterLabel.append(input);
    const range = document.createElement("div");
    range.className = "tradingcharts-options-range";
    const rangeValues = [Infinity, 5, 10, 20];
    rangeValues.forEach((value) => {
      const button = document.createElement("button"); button.type = "button";
      button.textContent = value === Infinity ? "All strikes" : `ATM ±${value}`;
      button.classList.toggle("active", strikeRange === value);
      button.disabled = spot === undefined;
      button.addEventListener("click", () => { strikeRange = value; render(); });
      range.append(button);
    });
    const mode = document.createElement("div");
    mode.className = "tradingcharts-options-mode";
    (["all", "call", "put"] as const).forEach((item) => {
      const button = document.createElement("button"); button.type = "button"; button.textContent = item === "all" ? "All" : `${item[0].toUpperCase()}${item.slice(1)}s`;
      button.classList.toggle("active", sideFilter === item);
      button.addEventListener("click", () => { sideFilter = item; render(); });
      mode.append(button);
    });
    const spotLabel = document.createElement("span");
    spotLabel.className = "tradingcharts-options-spot";
    spotLabel.textContent = spot === undefined ? "Spot unavailable" : `Spot ${strike(spot)}`;
    toolbar.append(expiryLabel, filterLabel, range, mode, spotLabel);
    root.append(toolbar);

    const allRows = expiration.rows;
    const spotValue = spot;
    const atMoneyStrike = spotValue === undefined || !allRows.length ? undefined : allRows.reduce((nearest, row) => Math.abs(row.strike - spotValue) < Math.abs(nearest.strike - spotValue) ? row : nearest).strike;
    if (spot !== undefined && atMoneyStrike !== undefined) {
      const guide = document.createElement("div");
      guide.className = "tradingcharts-options-spot-guide";
      guide.innerHTML = `<span>UNDERLYING <b>${strike(spot)}</b></span><span>Nearest listed strike <b>${strike(atMoneyStrike)}</b></span>`;
      root.append(guide);
    }
    const table = document.createElement("div");
    table.className = `tradingcharts-options-table mode-${sideFilter}`;
    const calls = document.createElement("section"); calls.className = "tradingcharts-options-side calls"; calls.setAttribute("aria-label", "Call options metrics; scroll horizontally for more columns");
    const puts = document.createElement("section"); puts.className = "tradingcharts-options-side puts"; puts.setAttribute("aria-label", "Put options metrics; scroll horizontally for more columns");
    const strikePane = document.createElement("section"); strikePane.className = "tradingcharts-options-strikes";
    const makeSide = (type: OptionType, host: HTMLElement) => {
      const inner = document.createElement("div"); inner.className = "tradingcharts-options-side-inner";
      inner.innerHTML = `<div class="tradingcharts-options-head"><span>${type === "call" ? "CALL" : "PUT"} · SELL BID</span><span>${type === "call" ? "CALL" : "PUT"} · BUY ASK</span><span>IV</span><span>VOL</span><span>OI</span></div>`;
      host.append(inner);
      return inner;
    };
    const callRows = makeSide("call", calls);
    const putRows = makeSide("put", puts);
    strikePane.innerHTML = `<div class="tradingcharts-options-head"><b>STRIKE</b></div>`;
    rows.forEach((row) => {
      const callLine = document.createElement("div");
      const putLine = document.createElement("div");
      const strikeLine = document.createElement("div");
      callLine.className = "tradingcharts-options-row";
      putLine.className = "tradingcharts-options-row";
      strikeLine.className = "tradingcharts-options-row";
      if (row.strike === atMoneyStrike) { callLine.classList.add("at-money"); putLine.classList.add("at-money"); strikeLine.classList.add("at-money"); }
      const rowLegs = legs.filter((leg) => leg.expirationId === expiration.id && leg.strike === row.strike);
      if (rowLegs.length) { callLine.classList.add("selected"); putLine.classList.add("selected"); strikeLine.classList.add("selected"); }
      const quoteButton = (type: OptionType, side: OptionSide) => {
        const button = document.createElement("button"); button.type = "button";
        const quote = type === "call" ? row.call : row.put;
        const opposite = rowLegs.find((leg) => leg.type === type && leg.side !== side);
        button.className = `${type} ${side}`;
        button.disabled = !finiteQuote(quote) || (sideFilter !== "all" && sideFilter !== type) || opposite !== undefined;
        button.textContent = quote ? price(side === "buy" ? quote.ask : quote.bid) : "—";
        button.title = opposite ? `Remove the ${opposite.side} leg before selecting the opposite side` : side === "buy" ? `Buy ${type} at ask` : `Sell ${type} at bid`;
        button.setAttribute("aria-label", `${side === "buy" ? "Buy" : "Sell"} ${strike(row.strike)} ${type} at ${button.textContent}`);
        if (rowLegs.some((leg) => leg.type === type && leg.side === side)) button.classList.add("selected");
        button.addEventListener("click", () => addLeg(expiration, row, type, side));
        return button;
      };
      const metric = (type: OptionType, key: "impliedVolatility" | "volume" | "openInterest") => {
        const cell = document.createElement("span");
        cell.className = `${type} metric ${key}`;
        const quote = type === "call" ? row.call : row.put;
        const value = quote?.[key];
        const count = (number: number) => number >= 10_000 ? `${Math.round(number / 1_000)}k` : number >= 1_000 ? `${(number / 1_000).toFixed(1)}k` : String(Math.round(number));
        cell.textContent = value === undefined ? "—" : key === "impliedVolatility" ? `${(value * 100).toFixed(1)}%` : count(value);
        return cell;
      };
      callLine.append(quoteButton("call", "sell"), quoteButton("call", "buy"), metric("call", "impliedVolatility"), metric("call", "volume"), metric("call", "openInterest"));
      putLine.append(quoteButton("put", "sell"), quoteButton("put", "buy"), metric("put", "impliedVolatility"), metric("put", "volume"), metric("put", "openInterest"));
      const strikeCell = document.createElement("b");
      const strikeValue = document.createElement("span"); strikeValue.textContent = strike(row.strike); strikeCell.append(strikeValue);
      if (row.strike === atMoneyStrike && spot !== undefined) { const badge = document.createElement("small"); badge.textContent = `SPOT ${strike(spot)}`; strikeCell.append(badge); }
      strikeLine.append(strikeCell);
      callRows.append(callLine); putRows.append(putLine); strikePane.append(strikeLine);
    });
    table.append(calls, strikePane, puts);
    root.append(table);

    const basket = document.createElement("div");
    basket.className = "tradingcharts-options-basket";
    const title = document.createElement("div"); title.className = "tradingcharts-options-basket-title";
    const net = legs.reduce((total, leg) => total + (leg.side === "buy" ? 1 : -1) * leg.price * leg.quantity, 0);
    title.innerHTML = `<div><b>Strategy legs</b><span>${legs.length} / ${maxLegs} contracts</span></div><strong class="${net > 0 ? "debit" : net < 0 ? "credit" : "flat"}">${legs.length ? `Net ${net > 0 ? "debit" : net < 0 ? "credit" : "even"} ${price(Math.abs(net))}` : "No strategy selected"}</strong>`;
    const clear = document.createElement("button"); clear.type = "button"; clear.textContent = "Clear"; clear.disabled = legs.length === 0;
    clear.addEventListener("click", () => { legs = []; render(); emit(); }); title.append(clear);
    basket.append(title);
    if (!legs.length) {
      const empty = document.createElement("p"); empty.textContent = "Click an ask to buy or a bid to sell. Selected contracts remain when you change expiration, making calendars and diagonals easy to compose."; basket.append(empty);
    } else {
      const chips = document.createElement("div"); chips.className = "tradingcharts-options-legs";
      legs.forEach((leg) => {
        const chip = document.createElement("button"); chip.type = "button"; chip.className = leg.side;
        chip.textContent = `${leg.side === "buy" ? "+" : "−"}${leg.quantity} ${leg.expirationLabel} ${strike(leg.strike)} ${leg.type[0].toUpperCase()} @ ${price(leg.price)} ×`;
        chip.title = "Remove leg";
        chip.addEventListener("click", () => { legs = legs.filter((item) => item.id !== leg.id); render(); emit(); });
        chips.append(chip);
      });
      basket.append(chips);
    }
    root.append(basket);
  };

  render();
  return {
    setExpirations(next) { expirations = next; if (!expirations.some((item) => item.id === expirationId)) expirationId = expirations[0]?.id ?? ""; render(); return this; },
    setSpot(next) { spot = next; render(); return this; },
    getLegs: () => [...legs],
    clearLegs() { legs = []; render(); emit(); return this; },
    destroy() { root.remove(); },
  };
}
