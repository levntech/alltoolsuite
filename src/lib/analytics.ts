export const trackEvent = (event: string, data: Record<string, any>) => {
    // Mock analytics implementation (replace with GA, Mixpanel, etc.)
    console.log(`Analytics: ${event}`, data);
  };