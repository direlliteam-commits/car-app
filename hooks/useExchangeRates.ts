import { useQuery } from '@tanstack/react-query';

interface ExchangeRates {
  USD: number;
  AMD: number;
  RUB: number;
  EUR: number;
  updatedAt: string;
}

export function useExchangeRates() {
  return useQuery<ExchangeRates>({
    queryKey: ['/api/exchange-rates'],
    staleTime: 60 * 60 * 1000,
  });
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

export function convertPrice(price: number, fromCurrency: string, toCurrency: string, rates: ExchangeRates): number {
  if (fromCurrency === toCurrency) return price;
  const fromRate = rates[fromCurrency as keyof ExchangeRates] as number || 1;
  const toRate = rates[toCurrency as keyof ExchangeRates] as number || 1;
  const priceInUSD = fromCurrency === 'USD' ? price : price / fromRate;
  const converted = toCurrency === 'USD' ? priceInUSD : priceInUSD * toRate;
  return smartRound(converted);
}
