import { translate } from "@/lib/i18n";

let _displayCurrency: string | null = null;
let _exchangeRates: Record<string, number> | null = null;

export function setGlobalDisplayCurrency(currency: string | null) {
  _displayCurrency = currency;
}

export function setGlobalExchangeRates(rates: Record<string, number> | null) {
  _exchangeRates = rates;
}

export function getGlobalDisplayCurrency(): string {
  return _displayCurrency || "USD";
}

function smartRound(value: number): number {
  const abs = Math.abs(value);
  let step: number;
  if (abs < 1000) step = 1;
  else if (abs < 10000) step = 100;
  else if (abs < 100000) step = 500;
  else if (abs < 1000000) step = 1000;
  else if (abs < 10000000) step = 10000;
  else step = 50000;
  return Math.round(value / step) * step;
}

export function convertForDisplay(price: number, fromCurrency: string): { price: number; currency: string } {
  const target = _displayCurrency || "USD";
  if (fromCurrency === target || !_exchangeRates) return { price, currency: fromCurrency };
  const fromRate = _exchangeRates[fromCurrency] || 1;
  const toRate = _exchangeRates[target] || 1;
  const priceInUSD = fromCurrency === "USD" ? price : price / fromRate;
  const converted = target === "USD" ? priceInUSD : priceInUSD * toRate;
  return { price: smartRound(converted), currency: target };
}

export function usdToDisplayRaw(usdPrice: number): number {
  const target = _displayCurrency || "USD";
  if (target === "USD" || !_exchangeRates) return usdPrice;
  const toRate = _exchangeRates[target] || 1;
  return Math.round(usdPrice * toRate);
}

export function usdToDisplayRounded(usdPrice: number): number {
  const raw = usdToDisplayRaw(usdPrice);
  return smartRound(raw);
}

export function displayToUsdRaw(displayPrice: number): number {
  const target = _displayCurrency || "USD";
  if (target === "USD" || !_exchangeRates) return displayPrice;
  const toRate = _exchangeRates[target] || 1;
  return Math.round(displayPrice / toRate);
}

export function getActiveDisplayCurrency(): string {
  if (!_exchangeRates) return "USD";
  return _displayCurrency || "USD";
}

export function getCurrencySymbol(currency?: string): string {
  const c = currency || getActiveDisplayCurrency();
  if (c === "AMD") return "֏";
  if (c === "RUB") return "₽";
  if (c === "EUR") return "€";
  return "$";
}

export function formatPrice(price: number, currency: "USD" | "AMD" | "RUB" | "EUR" | string = "USD"): string {
  const display = convertForDisplay(price, currency);
  return formatPriceRaw(display.price, display.currency);
}

export function formatPriceRaw(price: number, currency: string): string {
  const rounded = Math.round(price);
  if (currency === "AMD") {
    const formatted = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return `${formatted} ֏`;
  }
  if (currency === "RUB") {
    const formatted = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return `${formatted} ₽`;
  }
  if (currency === "EUR") {
    const formatted = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return `€${formatted}`;
  }
  const formatted = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `$${formatted}`;
}

export function formatWarranty(warranty: string, t: (key: string) => string): string {
  const num = parseInt(warranty, 10);
  if (!isNaN(num) && String(num) === warranty.trim()) {
    const mod10 = num % 10;
    const mod100 = num % 100;
    if (mod100 >= 11 && mod100 <= 19) return `${num} ${t("addListing.warrantyYearMany")}`;
    if (mod10 === 1) return `${num} ${t("addListing.warrantyYearSingle")}`;
    if (mod10 >= 2 && mod10 <= 4) return `${num} ${t("addListing.warrantyYearFew")}`;
    return `${num} ${t("addListing.warrantyYearMany")}`;
  }
  return warranty;
}
