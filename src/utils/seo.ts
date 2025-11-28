/**
 * SEO Utilities for chatz.IO
 * Manages meta tags, schema markup, and SEO best practices
 */

export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  author?: string;
  robots?: string;
}

/**
 * Set page meta tags for SEO
 */
export const setSEOMetaTags = (config: SEOConfig) => {
  // Set title
  document.title = config.title;

  // Set or update description meta tag
  let descMeta = document.querySelector("meta[name='description']") as HTMLMetaElement;
  if (!descMeta) {
    descMeta = document.createElement('meta');
    descMeta.name = 'description';
    document.head.appendChild(descMeta);
  }
  descMeta.content = config.description;

  // Set keywords meta tag
  if (config.keywords && config.keywords.length > 0) {
    let keywordsMeta = document.querySelector("meta[name='keywords']") as HTMLMetaElement;
    if (!keywordsMeta) {
      keywordsMeta = document.createElement('meta');
      keywordsMeta.name = 'keywords';
      document.head.appendChild(keywordsMeta);
    }
    keywordsMeta.content = config.keywords.join(', ');
  }

  // Set canonical URL
  if (config.canonical) {
    let canonical = document.querySelector("link[rel='canonical']") as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = config.canonical;
  }

  // Set Open Graph tags
  const ogTags = [
    { property: 'og:title', content: config.title },
    { property: 'og:description', content: config.description },
    { property: 'og:type', content: config.ogType || 'website' },
    { property: 'og:image', content: config.ogImage || 'https://chatz-io.netlify.app/og-image.png' },
    { property: 'og:url', content: config.canonical || window.location.href },
  ];

  ogTags.forEach(tag => {
    let meta = document.querySelector(`meta[property='${tag.property}']`) as HTMLMetaElement;
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('property', tag.property);
      document.head.appendChild(meta);
    }
    meta.content = tag.content;
  });

  // Set Twitter Card tags
  const twitterTags = [
    { name: 'twitter:card', content: config.twitterCard || 'summary_large_image' },
    { name: 'twitter:title', content: config.title },
    { name: 'twitter:description', content: config.description },
    { name: 'twitter:image', content: config.ogImage || 'https://chatz-io.netlify.app/og-image.png' },
    { name: 'twitter:site', content: '@chatzio' },
  ];

  twitterTags.forEach(tag => {
    let meta = document.querySelector(`meta[name='${tag.name}']`) as HTMLMetaElement;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = tag.name;
      document.head.appendChild(meta);
    }
    meta.content = tag.content;
  });

  // Set robots meta tag
  if (config.robots) {
    let robotsMeta = document.querySelector("meta[name='robots']") as HTMLMetaElement;
    if (!robotsMeta) {
      robotsMeta = document.createElement('meta');
      robotsMeta.name = 'robots';
      document.head.appendChild(robotsMeta);
    }
    robotsMeta.content = config.robots;
  }

  // Set author meta tag
  if (config.author) {
    let authorMeta = document.querySelector("meta[name='author']") as HTMLMetaElement;
    if (!authorMeta) {
      authorMeta = document.createElement('meta');
      authorMeta.name = 'author';
      document.head.appendChild(authorMeta);
    }
    authorMeta.content = config.author;
  }

  // Set viewport meta tag if not present
  if (!document.querySelector("meta[name='viewport']")) {
    const viewportMeta = document.createElement('meta');
    viewportMeta.name = 'viewport';
    viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0';
    document.head.appendChild(viewportMeta);
  }

  // Set charset if not present
  if (!document.querySelector("meta[charset]")) {
    const charsetMeta = document.createElement('meta');
    charsetMeta.setAttribute('charset', 'UTF-8');
    document.head.insertBefore(charsetMeta, document.head.firstChild);
  }
};

/**
 * Add JSON-LD Schema markup for structured data
 */
export const addSchemaMarkup = (schema: Record<string, any>) => {
  let scriptTag = document.querySelector("script[type='application/ld+json']") as HTMLScriptElement;

  if (!scriptTag) {
    scriptTag = document.createElement('script');
    scriptTag.type = 'application/ld+json';
    document.head.appendChild(scriptTag);
  }

  scriptTag.textContent = JSON.stringify(schema);
};

/**
 * Organization schema for chatz.IO
 */
export const getOrganizationSchema = () => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'chatz.IO',
    alternateName: 'Chatz Student AI Assistant',
    url: 'https://chatz-io.netlify.app/',
    logo: 'https://chatz-io.netlify.app/logo.png',
    description: 'AI-powered student learning companion for homework help, study support, and exam preparation',
    sameAs: [
      'https://www.linkedin.com/in/kawin-m-s-a5a3b8330/',
      'https://www.instagram.com/kawin_m.s/',
      'https://kawin-portfolio.netlify.app/',
      'https://integer-io.netlify.app/'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Support',
      email: 'mskawin2004@gmail.com',
      telephone: '+91-8015355914'
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'IN',
      addressLocality: 'India'
    }
  };
};

/**
 * WebApplication schema for chatz.IO
 */
export const getWebApplicationSchema = () => {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'chatz.IO',
    description: 'AI-powered student learning companion',
    url: 'https://chatz-io.netlify.app/',
    applicationCategory: 'EducationalApplication',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD'
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '2500'
    }
  };
};

/**
 * FAQPage schema
 */
export const getFAQSchema = (faqs: Array<{ question: string; answer: string }>) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  };
};

/**
 * Breadcrumb schema
 */
export const getBreadcrumbSchema = (items: Array<{ name: string; url: string }>) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };
};

/**
 * Generate SEO config for home page
 */
export const getHomePageSEO = (): SEOConfig => ({
  title: 'chatz.IO - AI Student Learning Assistant | Homework Help & Study Support',
  description: 'Your AI-powered learning companion. Get instant homework help, exam prep, study support, and answers to all your academic questions 24/7.',
  keywords: [
    'AI homework help',
    'student study assistant',
    'exam preparation',
    'learning companion',
    'homework helper',
    'study guide',
    'academic support',
    'student resources',
    'online tutoring',
    'AI tutor'
  ],
  canonical: 'https://chatz-io.netlify.app/',
  ogType: 'website',
  robots: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'
});

/**
 * Generate SEO config for contact page
 */
export const getContactPageSEO = (): SEOConfig => ({
  title: 'Contact chatz.IO - Reach Us for Student Support',
  description: 'Get in touch with chatz.IO support team. Available 24/7 for student assistance, questions, and feedback.',
  keywords: [
    'contact chatz.IO',
    'student support',
    'customer support',
    'reach us',
    'contact form',
    'email support',
    'whatsapp support'
  ],
  canonical: 'https://chatz-io.netlify.app/contact',
  ogType: 'website',
  robots: 'index, follow'
});

/**
 * Generate SEO config for chat page
 */
export const getChatPageSEO = (): SEOConfig => ({
  title: 'Chat with chatz.IO - Get Instant Homework Help',
  description: 'Chat with our AI assistant for instant homework help, study support, and answers to your academic questions.',
  keywords: [
    'ai chat',
    'homework help',
    'study chat',
    'ask questions',
    'learning assistant',
    'academic help'
  ],
  canonical: 'https://chatz-io.netlify.app/chat',
  ogType: 'website',
  robots: 'noindex, follow'
});

/**
 * Add sitemap link to head
 */
export const addSitemap = () => {
  if (!document.querySelector("link[rel='sitemap']")) {
    const sitemapLink = document.createElement('link');
    sitemapLink.rel = 'sitemap';
    sitemapLink.href = 'https://chatz-io.netlify.app/sitemap.xml';
    document.head.appendChild(sitemapLink);
  }
};

/**
 * Add RSS feed link to head
 */
export const addRSSFeed = () => {
  if (!document.querySelector("link[rel='alternate'][type='application/rss+xml']")) {
    const rssLink = document.createElement('link');
    rssLink.rel = 'alternate';
    rssLink.type = 'application/rss+xml';
    rssLink.href = 'https://chatz-io.netlify.app/feed.xml';
    document.head.appendChild(rssLink);
  }
};

/**
 * Preconnect to important external domains
 */
export const addPreconnects = () => {
  const domains = [
    'https://api.github.com',
    'https://api.openrouter.ai',
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com'
  ];

  domains.forEach(domain => {
    if (!document.querySelector(`link[rel='preconnect'][href='${domain}']`)) {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = domain;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    }
  });
};

/**
 * Add DNS prefetch for external resources
 */
export const addDNSPrefetch = () => {
  const domains = [
    'https://cdn.jsdelivr.net',
    'https://www.google-analytics.com'
  ];

  domains.forEach(domain => {
    if (!document.querySelector(`link[rel='dns-prefetch'][href='${domain}']`)) {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = domain;
      document.head.appendChild(link);
    }
  });
};

/**
 * Initialize all SEO settings for a page
 */
export const initializeSEO = (seoConfig: SEOConfig, schemaMarkup?: Record<string, any>) => {
  // Set meta tags
  setSEOMetaTags(seoConfig);

  // Add schema markup
  if (schemaMarkup) {
    addSchemaMarkup(schemaMarkup);
  }

  // Add sitemap
  addSitemap();

  // Add preconnects
  addPreconnects();

  // Add DNS prefetch
  addDNSPrefetch();

  // Log SEO initialization
  // console.('✅ SEO initialized:', seoConfig.title);
};
