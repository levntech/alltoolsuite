// components/Seo.tsx
import Head from 'next/head';
import { useRouter } from 'next/router';

interface SeoProps {
  title: string;
  desc: string;
  canonicalUrl?: string;
  ogImage?: string;
  noIndex?: boolean;
  structuredData?: object; // Optional schema.org LD-JSON
}

export default function Seo({
  title,
  desc,
  canonicalUrl,
  ogImage = 'https://aiotoolsuite.com/default-og.png',
  noIndex = false,
  structuredData,
}: SeoProps) {
  const router = useRouter();
  const fullUrl = canonicalUrl || `https://aiotoolsuite.com${router.asPath}`;

  const defaultStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    description: desc,
    url: fullUrl,
    publisher: {
      '@type': 'Organization',
      name: 'AIOToolSuite',
      url: 'https://aiotoolsuite.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://aiotoolsuite.com/logo.png',
      },
    },
  };

  return (
    <Head>
      {/* Title & Description */}
      <title>{title} | AIOToolSuite</title>
      <meta name="description" content={desc} />

      {/* Canonical */}
      <link rel="canonical" href={fullUrl} />

      {/* Open Graph Tags */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={desc} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:image" content={ogImage} />

      {/* Twitter Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={ogImage} />

      {/* Robots */}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Structured Data (LD-JSON) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData || defaultStructuredData),
        }}
      />
    </Head>
  );
}
