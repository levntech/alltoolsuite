// seoToolsLogic.ts
// Contains production-grade logic for seo-tools category: Meta Tag Generator, Keyword Density, SEO Audit Tool, Backlink Checker, and SERP Preview

// Interfaces for type safety and API contracts
export interface MetaTags {
    title: string;
    description: string;
    keywords: string;
    ogTitle: string;
    ogDescription: string;
    ogImage?: string;
    twitterCard?: string;
    twitterTitle?: string;
    twitterDescription?: string;
  }

  export interface KeywordDensityResult {
    word: string;
    count: number;
    density: number;
    isOverused: boolean;
  }

  export interface SEOAuditIssue {
    type: 'error' | 'warning' | 'info';
    message: string;
    details?: string;
  }

  export interface Backlink {
    sourceUrl: string;
    anchorText: string;
    domainAuthority: number;
  }

  export interface SERPPreview {
    html: string;
    titleLength: number;
    descriptionLength: number;
    isOptimized: boolean;
  }

  // Utility to validate non-empty strings
  const validateStringInput = (value: string, fieldName: string, toolName: string): void => {
    if (!value || typeof value !== 'string') {
      throw new Error(`${toolName}: ${fieldName} must be a non-empty string`);
    }
  };

  // Utility to validate URLs
  const validateUrl = (url: string, toolName: string): void => {
    try {
      new URL(url);
    } catch {
      throw new Error(`${toolName}: Invalid URL provided`);
    }
  };

  // Meta Tag Generator: Generates SEO-friendly meta tags with Open Graph and Twitter Card support
  export const metaTagGenerator = (
    title: string,
    description: string,
    keywords: string,
    imageUrl?: string
  ): MetaTags => {
    // Input validation
    validateStringInput(title, 'Title', 'Meta Tag Generator');
    validateStringInput(description, 'Description', 'Meta Tag Generator');
    validateStringInput(keywords, 'Keywords', 'Meta Tag Generator');
    if (imageUrl) validateUrl(imageUrl, 'Meta Tag Generator');

    // Ensure title and description lengths are SEO-friendly
    const trimmedTitle = title.slice(0, 60); // Google typically displays up to 60 characters
    const trimmedDescription = description.slice(0, 160); // Google typically displays up to 160 characters

    return {
      title: trimmedTitle,
      description: trimmedDescription,
      keywords: keywords.toLowerCase(),
      ogTitle: trimmedTitle,
      ogDescription: trimmedDescription,
      ogImage: imageUrl,
      twitterCard: imageUrl ? 'summary_large_image' : 'summary',
      twitterTitle: trimmedTitle,
      twitterDescription: trimmedDescription,
    };
  };

  // Keyword Density: Analyzes keyword density with over-usage detection
  export const keywordDensity = (text: string, maxDensity: number = 3): KeywordDensityResult[] => {
    validateStringInput(text, 'Text', 'Keyword Density');

    // Efficient regex-based word extraction
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const totalWords = words.length;

    // Skip processing if no words are found
    if (totalWords === 0) {
      return [];
    }

    // Count word frequencies using a Map for better performance
    const wordCount = new Map<string, number>();
    words.forEach((word) => {
      if (word.length > 2) { // Ignore short words (e.g., "a", "an", "the")
        wordCount.set(word, (wordCount.get(word) || 0) + 1);
      }
    });

    // Calculate density and flag overused keywords
    const results: KeywordDensityResult[] = [];
    wordCount.forEach((count, word) => {
      const density = (count / totalWords) * 100;
      results.push({
        word,
        count,
        density: Math.round(density * 100) / 100, // Round to 2 decimal places
        isOverused: density > maxDensity, // Flag keywords that exceed the max density threshold
      });
    });

    // Sort by count (descending) and limit to top 10 keywords
    return results
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  };

  // SEO Audit Tool: Simulates an SEO audit (placeholder for real API integration)
  export const seoAuditTool = async (url: string): Promise<{ issues: SEOAuditIssue[] }> => {
    validateUrl(url, 'SEO Audit Tool');

    // Placeholder: Basic client-side checks
    const issues: SEOAuditIssue[] = [];

    // Simulate fetching the page content (in a real app, use an API or server-side fetching)
    const mockPageContent = {
      title: 'Example Page',
      description: '',
      h1Count: 0,
      imagesWithoutAlt: 3,
      brokenLinks: ['/broken-link'],
    };

    // Perform basic SEO checks
    if (!mockPageContent.title || mockPageContent.title.length > 60) {
      issues.push({
        type: 'error',
        message: 'Page title is missing or too long',
        details: 'Titles should be between 10 and 60 characters.',
      });
    }

    if (!mockPageContent.description || mockPageContent.description.length > 160) {
      issues.push({
        type: 'error',
        message: 'Meta description is missing or too long',
        details: 'Descriptions should be between 50 and 160 characters.',
      });
    }

    if (mockPageContent.h1Count !== 1) {
      issues.push({
        type: 'warning',
        message: `Page has ${mockPageContent.h1Count} H1 tags`,
        details: 'A page should have exactly one H1 tag for proper structure.',
      });
    }

    if (mockPageContent.imagesWithoutAlt > 0) {
      issues.push({
        type: 'warning',
        message: `Found ${mockPageContent.imagesWithoutAlt} images without alt text`,
        details: 'All images should have descriptive alt text for accessibility and SEO.',
      });
    }

    if (mockPageContent.brokenLinks.length > 0) {
      issues.push({
        type: 'error',
        message: `Found ${mockPageContent.brokenLinks.length} broken links`,
        details: `Broken links: ${mockPageContent.brokenLinks.join(', ')}`,
      });
    }

    return { issues };

    // Production-grade implementation:
    // Use an SEO analysis API like Google Search Console, Ahrefs, or Moz
    // Example (commented out - requires axios and API integration):
    /*
    try {
      const response = await axios.get('https://api.example.com/seo-audit', {
        params: { url },
        headers: { Authorization: `Bearer YOUR_API_KEY` },
      });
      return {
        issues: response.data.issues.map((issue: any) => ({
          type: issue.severity,
          message: issue.title,
          details: issue.description,
        })),
      };
    } catch (error) {
      throw new Error('SEO Audit Tool: Failed to perform audit - ' + error.message);
    }
    */
  };

  // Backlink Checker: Simulates checking backlinks (placeholder for real API integration)
  export const backlinkChecker = async (url: string): Promise<Backlink[]> => {
    validateUrl(url, 'Backlink Checker');

    // Placeholder: Mock backlink data
    const mockBacklinks: Backlink[] = [
      { sourceUrl: 'https://example.com', anchorText: 'Example Link', domainAuthority: 45 },
      { sourceUrl: 'https://another-site.com', anchorText: 'Another Link', domainAuthority: 60 },
    ];

    return mockBacklinks;

    // Production-grade implementation:
    // Use an API like Ahrefs, Moz, or Majestic for real backlink data
    // Example (commented out - requires axios):
    /*
    try {
      const response = await axios.get('https://api.ahrefs.com/v1/backlinks', {
        params: { target: url, limit: 10 },
        headers: { Authorization: `Bearer YOUR_AHREFS_API_KEY` },
      });
      return response.data.backlinks.map((backlink: any) => ({
        sourceUrl: backlink.url_from,
        anchorText: backlink.anchor,
        domainAuthority: backlink.domain_rating,
      }));
    } catch (error) {
      throw new Error('Backlink Checker: Failed to fetch backlinks - ' + error.message);
    }
    */
  };

  // SERP Preview: Generates a mock SERP preview with optimization checks
  export const serpPreview = (title: string, description: string, url: string): SERPPreview => {
    // Input validation
    validateStringInput(title, 'Title', 'SERP Preview');
    validateStringInput(description, 'Description', 'SERP Preview');
    validateUrl(url, 'SERP Preview');

    // Calculate lengths and optimization status
    const titleLength = title.length;
    const descriptionLength = description.length;
    const isOptimized =
      titleLength >= 10 &&
      titleLength <= 60 &&
      descriptionLength >= 50 &&
      descriptionLength <= 160;

    // Truncate for display in preview
    const displayTitle = titleLength > 60 ? title.slice(0, 57) + '...' : title;
    const displayDescription =
      descriptionLength > 160 ? description.slice(0, 157) + '...' : description;

    // Generate HTML preview
    const html = `
      <div class="serp-preview p-2 border-b border-gray-200">
        <a href="${url}" class="text-blue-600 text-lg font-medium">${displayTitle}</a>
        <p class="text-green-700 text-sm">${url}</p>
        <p class="text-gray-600 text-sm">${displayDescription}</p>
      </div>
    `;

    return {
      html,
      titleLength,
      descriptionLength,
      isOptimized,
    };
  };