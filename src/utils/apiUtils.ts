// src/utils/apiUtils.ts
// Reusable utility for API-related logic across aiotoolsuite tools

import { NextApiRequest, NextApiResponse } from 'next';
import rateLimit from 'express-rate-limit';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { createLogger, transports, format } from 'winston';
import { createClient } from 'redis';

// Initialize Redis client for caching (optional, requires Redis setup)
const redisClient = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
redisClient.connect().catch((err) => console.error('Redis connection failed:', err));

// Initialize logger for all API-related operations
const logger = createLogger({
  level: 'info',
  format: format.combine(format.timestamp(), format.json()),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'logs/api.log' }),
  ],
});

// Interface for API response
interface APIResponse<T> {
  data?: T;
  error?: string;
}

// Interface for API request configuration
interface APIRequestConfig {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  params?: Record<string, any>;
  headers?: Record<string, string>;
  timeout?: number;
  cacheKey?: string;
  cacheTTL?: number; // Time-to-live in seconds
}

// Rate limiting configuration (shared across all API routes)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  keyGenerator: (req: NextApiRequest) => {
    return (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
  },
  handler: (req: NextApiRequest, res: NextApiResponse) => {
    logger.warn('Rate limit exceeded', { ip: req.socket.remoteAddress, endpoint: req.url });
    res.status(429).json({ error: 'Too many requests, please try again later.' });
  },
});

// Apply rate limiting to a request
export const applyRateLimit = (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
  return new Promise((resolve, reject) => {
    limiter(req as any, res as any, (err: any) => {
      if (err) return reject(err);
      resolve();
    });
  });
};

// Make an HTTP request with caching, logging, and error handling
export const makeAPIRequest = async <T>(
  config: APIRequestConfig,
  endpointName: string
): Promise<T> => {
  const { url, method = 'GET', params, headers, timeout = 10000, cacheKey, cacheTTL = 3600 } = config;

  // Check cache if cacheKey is provided
  if (cacheKey) {
    const cachedResult = await redisClient.get(cacheKey);
    if (cachedResult) {
      logger.info('Serving from cache', { endpoint: endpointName, cacheKey });
      return JSON.parse(cachedResult);
    }
  }

  try {
    const axiosConfig: AxiosRequestConfig = {
      url,
      method,
      params,
      headers,
      timeout,
    };

    logger.info('Making API request', { endpoint: endpointName, url, method });
    const response: AxiosResponse<T> = await axios(axiosConfig);

    // Cache the result if cacheKey is provided
    if (cacheKey) {
      await redisClient.setEx(cacheKey, cacheTTL, JSON.stringify(response.data));
      logger.info('Cached API response', { endpoint: endpointName, cacheKey });
    }

    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message;
    logger.error('API request failed', { endpoint: endpointName, url, error: errorMessage });
    throw new Error(`${endpointName}: ${errorMessage}`);
  }
};

// Handle API route requests with standard validation, logging, and response formatting
export const handleAPIRoute = async <T>(
  req: NextApiRequest,
  res: NextApiResponse,
  handler: (body: any) => Promise<T>,
  endpointName: string
): Promise<void> => {
  try {
    // Apply rate limiting
    await applyRateLimit(req, res);

    // Only allow POST requests
    if (req.method !== 'POST') {
      logger.warn('Invalid method', { method: req.method, ip: req.socket.remoteAddress, endpoint: endpointName });
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Execute the handler
    const result = await handler(req.body);

    logger.info('Request successful', { endpoint: endpointName, ip: req.socket.remoteAddress });
    return res.status(200).json({ data: result });
  } catch (error: any) {
    logger.error('Request failed', { endpoint: endpointName, ip: req.socket.remoteAddress, error: error.message });
    return res.status(500).json({ error: error.message });
  }
};