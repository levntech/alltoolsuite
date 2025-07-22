/** @type {import('next').NextConfig} */
const withPWA = (await import('next-pwa')).default({
    dest: 'public',
    disable: process.env.NODE_ENV === 'development',
  });

  const nextConfig = {
    reactStrictMode: true,
    images: {
      domains: ['localhost'],
    },
  };

  export default withPWA(nextConfig);