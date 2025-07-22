// tools/currencyToolsLogic.ts
// Production-grade logic for currency-tools category: Converter, Historical Rates, and Fluctuation Analyzer

import { createLogger, transports, format } from 'winston';
import { exchangeRateApiClient } from '@/utils/apiClient';

// Logger setup for client-side logging
const logger = createLogger({
  level: 'info',
  format: format.combine(format.timestamp(), format.json()),
  transports: [new transports.Console()],
});

// Custom error class for currency tools
class CurrencyToolError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'CurrencyToolError';
  }
}

// Supported currencies (subset for simplicity; expand as needed)
export const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'AUD', 'CAD'];

// Interface for exchange rate data
export interface ExchangeRate {
  base: string;
  rates: Record<string, number>;
  date: string;
}

// Interface for historical rates result
export interface HistoricalRate {
  date: string;
  rate: number;
}

// Interface for fluctuation analysis result
export interface FluctuationAnalysis {
  currencyPair: string;
  startDate: string;
  endDate: string;
  rates: HistoricalRate[];
  minRate: number;
  maxRate: number;
  percentageChange: number;
  averageRate: number;
}

// Cache for exchange rates
const rateCache: Record<string, { data: any; expiry: number }> = {};
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

// Utility to validate currency codes
const validateCurrency = (currency: string, toolName: string): void => {
  if (!SUPPORTED_CURRENCIES.includes(currency)) {
    throw new CurrencyToolError(
      `${toolName}: Unsupported currency ${currency}. Supported currencies: ${SUPPORTED_CURRENCIES.join(', ')}`,
      'UNSUPPORTED_CURRENCY'
    );
  }
};

// Utility to validate dates
const validateDates = (startDate: string, endDate: string, toolName: string): void => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = new Date();

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new CurrencyToolError(`${toolName}: Invalid date format. Use YYYY-MM-DD`, 'INVALID_DATE');
  }

  if (start > end) {
    throw new CurrencyToolError(`${toolName}: startDate must be before endDate`, 'INVALID_DATE_RANGE');
  }

  if (end > today) {
    throw new CurrencyToolError(`${toolName}: endDate cannot be in the future`, 'INVALID_DATE_RANGE');
  }
};

// Fetch latest exchange rates with caching
export const fetchLatestRates = async (baseCurrency: string): Promise<ExchangeRate> => {
  try {
    validateCurrency(baseCurrency, 'Currency Converter');

    const cacheKey = `latest_${baseCurrency}`;
    const cached = rateCache[cacheKey];
    const now = Date.now();

    if (cached && now < cached.expiry) {
      logger.info('Using cached latest rates', { baseCurrency });
      return cached.data;
    }

    const response = await exchangeRateApiClient.get<{
      base_code: string;
      conversion_rates: Record<string, number>;
      time_last_update_utc: string;
    }>('/latest/' + baseCurrency);

    const result = {
      base: response.data.base_code,
      rates: response.data.conversion_rates,
      date: response.data.time_last_update_utc,
    };

    rateCache[cacheKey] = { data: result, expiry: now + CACHE_DURATION_MS };
    logger.info('Fetched and cached latest rates', { baseCurrency });
    return result;
  } catch (error: any) {
    logger.error('Failed to fetch latest rates', { error: error.message, baseCurrency });
    throw new CurrencyToolError(`Failed to fetch exchange rates: ${error.message}`, 'API_ERROR');
  }
};

// Currency Converter: Convert amount between two currencies
export const currencyConverter = async (
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<{ convertedAmount: number; rate: number; date: string }> => {
  try {
    if (typeof amount !== 'number' || amount <= 0) {
      throw new CurrencyToolError('Currency Converter: Amount must be a positive number', 'INVALID_AMOUNT');
    }

    validateCurrency(fromCurrency, 'Currency Converter');
    validateCurrency(toCurrency, 'Currency Converter');

    const exchangeRateData = await fetchLatestRates(fromCurrency);
    const rate = exchangeRateData.rates[toCurrency];

    if (!rate) {
      throw new CurrencyToolError(
        `Currency Converter: Rate not available for ${toCurrency}`,
        'RATE_NOT_FOUND'
      );
    }

    const convertedAmount = amount * rate;

    logger.info('Currency conversion successful', {
      amount,
      fromCurrency,
      toCurrency,
      convertedAmount,
    });

    return {
      convertedAmount,
      rate,
      date: exchangeRateData.date,
    };
  } catch (error: any) {
    logger.error('Currency Converter failed', {
      error: error.message,
      amount,
      fromCurrency,
      toCurrency,
      code: error.code,
    });
    throw error;
  }
};

// Fetch historical exchange rates for a specific date with caching
export const fetchHistoricalRates = async (
  baseCurrency: string,
  targetCurrency: string,
  date: string
): Promise<HistoricalRate> => {
  try {
    validateCurrency(baseCurrency, 'Historical Rates');
    validateCurrency(targetCurrency, 'Historical Rates');

    const today = new Date();
    validateDates(date, today.toISOString().split('T')[0], 'Historical Rates');

    const cacheKey = `historical_${baseCurrency}_${targetCurrency}_${date}`;
    const cached = rateCache[cacheKey];
    const now = Date.now();

    if (cached && now < cached.expiry) {
      logger.info('Using cached historical rates', { baseCurrency, targetCurrency, date });
      return cached.data;
    }

    const response = await exchangeRateApiClient.get<{
      base_code: string;
      conversion_rates: Record<string, number>;
      date: string;
    }>(`/historical/${date}`, { base: baseCurrency });

    const rate = response.data.conversion_rates[targetCurrency];
    if (!rate) {
      throw new CurrencyToolError(
        `Historical Rates: Rate not available for ${targetCurrency} on ${date}`,
        'RATE_NOT_FOUND'
      );
    }

    const result = {
      date: response.data.date,
      rate,
    };

    rateCache[cacheKey] = { data: result, expiry: now + CACHE_DURATION_MS };
    logger.info('Fetched and cached historical rates', { baseCurrency, targetCurrency, date });
    return result;
  } catch (error: any) {
    logger.error('Failed to fetch historical rates', {
      error: error.message,
      baseCurrency,
      targetCurrency,
      date,
    });
    throw new CurrencyToolError(`Failed to fetch historical rates: ${error.message}`, 'API_ERROR');
  }
};

// Historical Exchange Rates: Fetch rates over a date range
export const getHistoricalRates = async (
  baseCurrency: string,
  targetCurrency: string,
  startDate: string,
  endDate: string
): Promise<HistoricalRate[]> => {
  try {
    validateCurrency(baseCurrency, 'Historical Rates');
    validateCurrency(targetCurrency, 'Historical Rates');
    validateDates(startDate, endDate, 'Historical Rates');

    const start = new Date(startDate);
    const end = new Date(endDate);
    const rates: HistoricalRate[] = [];

    // Fetch rates for each day in the range
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];
      try {
        const rateData = await fetchHistoricalRates(baseCurrency, targetCurrency, dateStr);
        rates.push(rateData);
      } catch (error: any) {
        logger.warn(`Skipping date ${dateStr} due to error`, { error: error.message });
        continue;
      }
    }

    if (rates.length === 0) {
      throw new CurrencyToolError(
        'Historical Rates: No rates available for the selected date range',
        'NO_DATA'
      );
    }

    return rates;
  } catch (error: any) {
    logger.error('Historical Rates failed', {
      error: error.message,
      baseCurrency,
      targetCurrency,
      startDate,
      endDate,
      code: error.code,
    });
    throw error;
  }
};

// Currency Fluctuation Analyzer: Analyze rate changes over a period
export const analyzeCurrencyFluctuation = async (
  baseCurrency: string,
  targetCurrency: string,
  startDate: string,
  endDate: string
): Promise<FluctuationAnalysis> => {
  try {
    const rates = await getHistoricalRates(baseCurrency, targetCurrency, startDate, endDate);

    const rateValues = rates.map((r) => r.rate);
    const minRate = Math.min(...rateValues);
    const maxRate = Math.max(...rateValues);
    const firstRate = rateValues[0];
    const lastRate = rateValues[rateValues.length - 1];
    const percentageChange = ((lastRate - firstRate) / firstRate) * 100;
    const averageRate = rateValues.reduce((sum, rate) => sum + rate, 0) / rateValues.length;

    const result: FluctuationAnalysis = {
      currencyPair: `${baseCurrency}/${targetCurrency}`,
      startDate,
      endDate,
      rates,
      minRate,
      maxRate,
      percentageChange,
      averageRate,
    };

    logger.info('Currency fluctuation analysis successful', {
      currencyPair: result.currencyPair,
      startDate,
      endDate,
      percentageChange,
    });

    return result;
  } catch (error: any) {
    logger.error('Currency Fluctuation Analyzer failed', {
      error: error.message,
      baseCurrency,
      targetCurrency,
      startDate,
      endDate,
      code: error.code,
    });
    throw error;
  }
};