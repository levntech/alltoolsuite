// tools/emailToolsLogic.ts
// Production-grade logic for email-tools category: Email Validator, Email Template Generator, Email Signature Generator

import { createLogger, transports, format } from 'winston';
import DOMPurify from 'dompurify';
import { apiClient } from '@/utils/apiClient';

// Logger setup for client-side logging
const logger = createLogger({
  level: 'info',
  format: format.combine(format.timestamp(), format.json()),
  transports: [new transports.Console()],
});

// Custom error class for email tools
class EmailToolError extends Error {
  constructor(message: string, public code: string, public suggestion?: string) {
    super(message);
    this.name = 'EmailToolError';
  }
}

// Interface for email template
export interface EmailTemplate {
  html: string;
  preview: string;
}

// Interface for email signature
export interface EmailSignature {
  html: string;
  fieldLengths: Record<string, number>;
}

// Analytics tracking
const usageAnalytics: Record<string, number> = {
  validateEmail: 0,
  generateEmailTemplate: 0,
  generateEmailSignature: 0,
};

// Cache for email templates and signatures
const templateCache: Record<string, { data: EmailTemplate; expiry: number }> = {};
const signatureCache: Record<string, { data: EmailSignature; expiry: number }> = {};
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

// Disposable email domains (partial list for demo purposes)
const disposableDomains = ['tempmail.com', 'mailinator.com', 'guerrillamail.com'];

// Sanitize input to prevent XSS
const sanitizeInput = (input: string): string => {
  return DOMPurify.sanitize(input, { USE_PROFILES: { html: false } });
};

// Invalidate cache for a specific key
export const invalidateCache = (cacheType: 'template' | 'signature', key: string): void => {
  if (cacheType === 'template') {
    delete templateCache[key];
  } else {
    delete signatureCache[key];
  }
  logger.info(`Cache invalidated`, { cacheType, key });
};

// Interface for WhoisXML API MX record response
interface MXRecord {
  host: string;
  pref: number;
}

// Interface for WhoisXML API response
interface DNSLookupResponse {
  success: boolean;
  records: {
    MX?: MXRecord[];
  };
  error?: {
    message: string;
    code: string;
  };
}

// Email Validator: Validate email address format, domain, disposable domains, and MX records
export const validateEmail = async (email: string): Promise<{ isValid: boolean; errors: string[] }> => {
  try {
    if (!email.trim()) {
      throw new EmailToolError(
        'Email Validator: Email cannot be empty',
        'EMPTY_EMAIL',
        'Please enter an email address.'
      );
    }

    const sanitizedEmail = sanitizeInput(email);
    const errors: string[] = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedEmail)) {
      errors.push('Invalid email format. It should be in the format user@domain.com.');
    }

    // Extract domain from email
    const domain = sanitizedEmail.split('@')[1]?.toLowerCase();
    if (!domain) {
      errors.push('Email must include a domain.');
    } else {
      // Check for disposable domains
      if (disposableDomains.includes(domain)) {
        errors.push('This email uses a disposable domain, which may not be reliable.');
      }

      // Perform real MX record check using WhoisXML API
      try {
        const apiKey = process.env.WHOISXML_API_KEY;
        if (!apiKey) {
          throw new Error('WhoisXML API key is not configured.');
        }

        const response = await apiClient.get<DNSLookupResponse>(
          `https://dns-lookup.whoisxmlapi.com/api/v1?apiKey=${apiKey}&domainName=${domain}&recordType=MX`
        );

        if (!response.data.success || response.data.error) {
          throw new Error(response.data.error?.message || 'Failed to fetch MX records');
        }

        const mxRecords = response.data.records.MX || [];
        if (mxRecords.length === 0) {
          errors.push('No MX records found for this domain. It may not be configured to receive emails.');
        } else {
          logger.info('MX records found', { domain, mxRecords: mxRecords.map((r:any) => r.host) });
        }
      } catch (apiError: any) {
        logger.warn('MX record check failed, falling back to basic validation', {
          domain,
          error: apiError.message,
        });
        errors.push('Unable to verify MX records due to an API error. Basic validation will be used instead.');
      }
    }

    const isValid = errors.length === 0;
    usageAnalytics.validateEmail++;
    logger.info('Email validation completed', { email: sanitizedEmail, isValid, usageCount: usageAnalytics.validateEmail });
    return { isValid, errors };
  } catch (error: any) {
    logger.error('Email Validator failed', { error: error.message, email });
    throw new EmailToolError(
      `Email Validator failed: ${error.message}`,
      'VALIDATION_ERROR',
      'Please check the email format and try again.'
    );
  }
};

// Email Template Generator: Generate a customizable HTML email template
export const generateEmailTemplate = (
  subject: string,
  body: string,
  cta: string,
  ctaLink: string,
  bgColor: string = '#f4f4f4',
  fontFamily: string = 'Arial, sans-serif'
): EmailTemplate => {
  try {
    if (!subject.trim() || !body.trim() || !cta.trim() || !ctaLink.trim()) {
      throw new EmailToolError(
        'Email Template Generator: All fields are required',
        'MISSING_FIELDS',
        'Please fill in all required fields (subject, body, CTA, and CTA link).'
      );
    }

    const sanitizedSubject = sanitizeInput(subject);
    const sanitizedBody = sanitizeInput(body);
    const sanitizedCta = sanitizeInput(cta);
    const sanitizedCtaLink = sanitizeInput(ctaLink);
    const sanitizedBgColor = sanitizeInput(bgColor);
    const sanitizedFontFamily = sanitizeInput(fontFamily);

    // Create a cache key based on inputs
    const cacheKey = `template_${sanitizedSubject}_${sanitizedBody}_${sanitizedCta}_${sanitizedCtaLink}_${sanitizedBgColor}_${sanitizedFontFamily}`;
    const cached = templateCache[cacheKey];
    const now = Date.now();

    if (cached && now < cached.expiry) {
      logger.info('Using cached email template', { cacheKey });
      return cached.data;
    }

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${sanitizedSubject}</title>
        <style>
          body { font-family: ${sanitizedFontFamily}; margin: 0; padding: 20px; background-color: ${sanitizedBgColor}; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 5px; }
          .header { text-align: center; padding-bottom: 20px; }
          .content { line-height: 1.6; }
          .cta { display: inline-block; padding: 10px 20px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container" role="main">
          <div class="header">
            <h1>${sanitizedSubject}</h1>
          </div>
          <div class="content">
            <p>${sanitizedBody}</p>
            <a href="${sanitizedCtaLink}" class="cta" role="button" aria-label="${sanitizedCta}">${sanitizedCta}</a>
          </div>
        </div>
      </body>
      </html>
    `.trim();

    const preview = sanitizedBody.slice(0, 100) + (sanitizedBody.length > 100 ? '...' : '');
    const template = { html, preview };

    templateCache[cacheKey] = { data: template, expiry: now + CACHE_DURATION_MS };
    usageAnalytics.generateEmailTemplate++;
    logger.info('Email template generated', {
      subject: sanitizedSubject,
      bodyLength: sanitizedBody.length,
      usageCount: usageAnalytics.generateEmailTemplate,
    });

    return template;
  } catch (error: any) {
    logger.error('Email Template Generator failed', { error: error.message, subject });
    throw new EmailToolError(
      `Email Template Generator failed: ${error.message}`,
      'TEMPLATE_ERROR',
      'Please ensure all fields are filled correctly and try again.'
    );
  }
};

// Email Signature Generator: Generate a customizable HTML email signature
export const generateEmailSignature = (
  name: string,
  title: string,
  email: string,
  phone: string,
  twitter: string = '',
  linkedin: string = '',
  textColor: string = '#333',
  fontSize: string = '14px'
): EmailSignature => {
  try {
    if (!name.trim() || !title.trim() || !email.trim() || !phone.trim()) {
      throw new EmailToolError(
        'Email Signature Generator: Required fields (name, title, email, phone) are missing',
        'MISSING_FIELDS',
        'Please fill in all required fields.'
      );
    }

    const sanitizedName = sanitizeInput(name);
    const sanitizedTitle = sanitizeInput(title);
    const sanitizedEmail = sanitizeInput(email);
    const sanitizedPhone = sanitizeInput(phone);
    const sanitizedTwitter = sanitizeInput(twitter);
    const sanitizedLinkedin = sanitizeInput(linkedin);
    const sanitizedTextColor = sanitizeInput(textColor);
    const sanitizedFontSize = sanitizeInput(fontSize);

    // Create a cache key based on inputs
    const cacheKey = `signature_${sanitizedName}_${sanitizedTitle}_${sanitizedEmail}_${sanitizedPhone}_${sanitizedTwitter}_${sanitizedLinkedin}_${sanitizedTextColor}_${sanitizedFontSize}`;
    const cached = signatureCache[cacheKey];
    const now = Date.now();

    if (cached && now < cached.expiry) {
      logger.info('Using cached email signature', { cacheKey });
      return cached.data;
    }

    const html = `
      <div style="font-family: Arial, sans-serif; font-size: ${sanitizedFontSize}; color: ${sanitizedTextColor};">
        <p><strong>${sanitizedName}</strong></p>
        <p>${sanitizedTitle}</p>
        <p>Email: <a href="mailto:${sanitizedEmail}" style="color: #007bff;" aria-label="Email ${sanitizedEmail}">${sanitizedEmail}</a></p>
        <p>Phone: <a href="tel:${sanitizedPhone}" style="color: #007bff;" aria-label="Call ${sanitizedPhone}">${sanitizedPhone}</a></p>
        ${sanitizedTwitter ? `<p>Twitter: <a href="${sanitizedTwitter}" style="color: #007bff;" aria-label="Visit Twitter profile">${sanitizedTwitter}</a></p>` : ''}
        ${sanitizedLinkedin ? `<p>LinkedIn: <a href="${sanitizedLinkedin}" style="color: #007bff;" aria-label="Visit LinkedIn profile">${sanitizedLinkedin}</a></p>` : ''}
      </div>
    `.trim();

    const fieldLengths: Record<string, number> = {
      name: sanitizedName.length,
      title: sanitizedTitle.length,
      email: sanitizedEmail.length,
      phone: sanitizedPhone.length,
      ...(sanitizedTwitter && { twitter: sanitizedTwitter.length }),
      ...(sanitizedLinkedin && { linkedin: sanitizedLinkedin.length }),
    };

    const signature = { html, fieldLengths };
    signatureCache[cacheKey] = { data: signature, expiry: now + CACHE_DURATION_MS };
    usageAnalytics.generateEmailSignature++;
    logger.info('Email signature generated', {
      name: sanitizedName,
      email: sanitizedEmail,
      usageCount: usageAnalytics.generateEmailSignature,
    });

    return signature;
  } catch (error: any) {
    logger.error('Email Signature Generator failed', { error: error.message, email });
    throw new EmailToolError(
      `Email Signature Generator failed: ${error.message}`,
      'SIGNATURE_ERROR',
      'Please ensure all required fields are filled correctly and try again.'
    );
  }
};

// Get usage analytics
export const getUsageAnalytics = (): Record<string, number> => {
  return { ...usageAnalytics };
};