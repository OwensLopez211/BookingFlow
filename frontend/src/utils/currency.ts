/**
 * Currency formatting utilities
 */

export interface CurrencyConfig {
  symbol: string;
  code: string;
  position: 'before' | 'after';
  locale: string;
}

export const CURRENCY_CONFIGS: Record<string, CurrencyConfig> = {
  CLP: {
    symbol: '$',
    code: 'CLP',
    position: 'before',
    locale: 'es-CL'
  },
  USD: {
    symbol: '$',
    code: 'USD',
    position: 'before',
    locale: 'en-US'
  },
  EUR: {
    symbol: '€',
    code: 'EUR',
    position: 'after',
    locale: 'de-DE'
  },
  ARS: {
    symbol: '$',
    code: 'ARS',
    position: 'before',
    locale: 'es-AR'
  },
  PEN: {
    symbol: 'S/',
    code: 'PEN',
    position: 'before',
    locale: 'es-PE'
  },
  COP: {
    symbol: '$',
    code: 'COP',
    position: 'before',
    locale: 'es-CO'
  },
  MXN: {
    symbol: '$',
    code: 'MXN',
    position: 'before',
    locale: 'es-MX'
  }
};

/**
 * Format a price with the appropriate currency symbol and formatting
 */
export function formatCurrency(
  amount: number,
  currencyCode: string = 'CLP'
): string {
  const config = CURRENCY_CONFIGS[currencyCode] || CURRENCY_CONFIGS.CLP;
  
  // Format the number with proper locale formatting
  const formattedAmount = new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.code,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);

  return formattedAmount;
}

/**
 * Get just the currency symbol for a given currency code
 */
export function getCurrencySymbol(currencyCode: string = 'CLP'): string {
  const config = CURRENCY_CONFIGS[currencyCode] || CURRENCY_CONFIGS.CLP;
  return config.symbol;
}

/**
 * Format currency manually (alternative approach for more control)
 */
export function formatCurrencyManual(
  amount: number,
  currencyCode: string = 'CLP'
): string {
  const config = CURRENCY_CONFIGS[currencyCode] || CURRENCY_CONFIGS.CLP;
  
  // Format the number with thousand separators
  const formattedNumber = amount.toLocaleString(config.locale);
  
  // Position the symbol based on currency configuration
  if (config.position === 'before') {
    return `${config.symbol}${formattedNumber}`;
  } else {
    return `${formattedNumber}${config.symbol}`;
  }
}