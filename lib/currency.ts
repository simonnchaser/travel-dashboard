// Currency conversion utility using ExchangeRate-API

export type Currency = 'KRW' | 'EUR' | 'HUF' | 'CZK' | 'USD';

export const currencyLabels: Record<Currency, string> = {
  KRW: '원 (₩)',
  EUR: '유로 (€)',
  HUF: '포린트 (Ft)',
  CZK: '코루나 (Kč)',
  USD: '달러 ($)',
};

interface ExchangeRates {
  conversion_rates: Record<string, number>;
  time_last_update_unix: number;
}

let cachedRates: ExchangeRates | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Fetch exchange rates from ExchangeRate-API
 * Free tier: 1,500 requests/month
 */
export async function fetchExchangeRates(): Promise<ExchangeRates | null> {
  const now = Date.now();

  // Return cached rates if still valid
  if (cachedRates && (now - lastFetchTime) < CACHE_DURATION) {
    return cachedRates;
  }

  try {
    // Using free tier endpoint with USD as base
    // You can replace 'demo' with your API key from https://www.exchangerate-api.com/
    const API_KEY = process.env.NEXT_PUBLIC_EXCHANGE_RATE_API_KEY || 'demo';
    const response = await fetch(
      `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/USD`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch exchange rates');
    }

    const data: ExchangeRates = await response.json();
    cachedRates = data;
    lastFetchTime = now;

    return data;
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    return cachedRates; // Return cached data if available
  }
}

/**
 * Convert amount from one currency to another
 * @param amount - Amount to convert
 * @param fromCurrency - Source currency
 * @param toCurrency - Target currency (default: KRW)
 * @returns Converted amount or null if conversion fails
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency = 'KRW'
): Promise<number | null> {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  const rates = await fetchExchangeRates();
  if (!rates) {
    return null;
  }

  // Convert from source currency to USD, then to target currency
  const fromRate = rates.conversion_rates[fromCurrency];
  const toRate = rates.conversion_rates[toCurrency];

  if (!fromRate || !toRate) {
    return null;
  }

  // Amount in USD = amount / fromRate
  // Amount in target currency = amountInUSD * toRate
  const amountInUSD = amount / fromRate;
  const convertedAmount = amountInUSD * toRate;

  return Math.round(convertedAmount);
}

/**
 * Format currency amount with symbol
 */
export function formatCurrency(amount: number, currency: Currency): string {
  const symbols: Record<Currency, string> = {
    KRW: '₩',
    EUR: '€',
    HUF: 'Ft',
    CZK: 'Kč',
    USD: '$',
  };

  const formatted = new Intl.NumberFormat('ko-KR').format(amount);

  if (currency === 'KRW') {
    return `${formatted}원`;
  } else if (currency === 'EUR' || currency === 'USD') {
    return `${symbols[currency]}${formatted}`;
  } else {
    return `${formatted} ${symbols[currency]}`;
  }
}

/**
 * Parse amount and currency from string
 * Examples: "50000 HUF", "€120", "30000원"
 */
export function parseAmountWithCurrency(input: string): { amount: number; currency: Currency } | null {
  const cleaned = input.replace(/,/g, '').trim();

  // Check for currency symbols/codes
  if (cleaned.includes('원') || cleaned.includes('₩')) {
    const amount = parseFloat(cleaned.replace(/[^0-9.]/g, ''));
    return { amount, currency: 'KRW' };
  } else if (cleaned.includes('€') || cleaned.toUpperCase().includes('EUR')) {
    const amount = parseFloat(cleaned.replace(/[^0-9.]/g, ''));
    return { amount, currency: 'EUR' };
  } else if (cleaned.toUpperCase().includes('HUF') || cleaned.includes('Ft')) {
    const amount = parseFloat(cleaned.replace(/[^0-9.]/g, ''));
    return { amount, currency: 'HUF' };
  } else if (cleaned.toUpperCase().includes('CZK') || cleaned.includes('Kč')) {
    const amount = parseFloat(cleaned.replace(/[^0-9.]/g, ''));
    return { amount, currency: 'CZK' };
  } else if (cleaned.includes('$') || cleaned.toUpperCase().includes('USD')) {
    const amount = parseFloat(cleaned.replace(/[^0-9.]/g, ''));
    return { amount, currency: 'USD' };
  }

  // Default to KRW if no currency specified
  const amount = parseFloat(cleaned);
  return isNaN(amount) ? null : { amount, currency: 'KRW' };
}
