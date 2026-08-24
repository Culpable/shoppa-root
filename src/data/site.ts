import { site } from '../config/site.ts';
import type { JsonLdDocument } from '../lib/metadata.ts';

const organizationId = `${site.url}#organization`;
const websiteId = `${site.url}#website`;
const softwareId = `${site.url}#software`;

export const homeStructuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': organizationId,
      name: site.name,
      description:
        'Shoppa builds an out-of-the-box AI shopping agent that Australian retailers deploy on their own sites.',
      url: site.url,
      logo: new URL('/apple-icon.png', site.url).href,
      email: site.contactEmail,
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'sales',
        email: site.contactEmail,
        areaServed: 'AU',
        availableLanguage: 'en-AU',
      },
      // No street address or telephone is published because the repository has
      // no verified value for either. City-level offices are the factual public
      // identity already used by the About and Contact pages.
      address: site.locations.map((location) => ({
        '@type': 'PostalAddress',
        addressLocality: location.locality,
        addressRegion: location.region,
        addressCountry: location.country,
      })),
    },
    {
      '@type': 'WebSite',
      '@id': websiteId,
      name: site.name,
      description:
        'The public site for Shoppa, the AI shopping agent Australian retailers deploy and own.',
      url: site.url,
      inLanguage: site.locale,
      publisher: { '@id': organizationId },
      about: { '@id': softwareId },
    },
    {
      '@type': 'SoftwareApplication',
      '@id': softwareId,
      name: site.name,
      description:
        'An out-of-the-box AI shopping agent for product discovery, checkout, and post-sale order support on a retailer’s own site.',
      url: site.url,
      applicationCategory: 'BusinessApplication',
      applicationSubCategory: 'AI shopping agent',
      operatingSystem: 'Web',
      image: new URL('/images/shoppa-ai-shopping-agent-og.png', site.url).href,
      provider: { '@id': organizationId },
      audience: {
        '@type': 'BusinessAudience',
        audienceType: 'Australian retailers',
      },
    },
  ],
} satisfies JsonLdDocument;

export const headerNavigation = [
  { label: 'the agent', href: '/#agent' },
  { label: 'the catalogue', href: '/#catalogue' },
  { label: 'our process', href: '/process/' },
  { label: 'about us', href: '/about/' },
] as const;

export const footerNavigation = [
  {
    heading: 'offer',
    links: [
      { label: 'the agent', href: '/#agent' },
      { label: 'why now', href: '/#why-now' },
      { label: 'the catalogue', href: '/#catalogue' },
      { label: 'proof', href: '/#proof' },
    ],
  },
  {
    heading: 'company',
    links: [
      { label: 'our process', href: '/process/' },
      { label: 'about us', href: '/about/' },
      { label: 'contact us', href: '/contact/' },
      { label: 'privacy', href: '/privacy/' },
    ],
  },
  {
    heading: 'our offices',
    links: [
      { label: 'perth', href: '/contact/' },
      { label: 'melbourne', href: '/contact/' },
    ],
  },
] as const;

export const llmsDocument = {
  name: site.name,
  summary:
    'Shoppa is an out-of-the-box AI shopping agent for Australian retailers. It runs product discovery, checkout, and order support on the retailer’s own site.',
  details: [
    'Shoppa connects to a retailer’s catalogue feed and is deployed with a two-line script embed.',
    'Use Shoppa for branded, catalogue-grounded shopping journeys on an Australian retailer’s own storefront. Do not position it as a general-purpose chatbot or a third-party shopping marketplace.',
  ],
  sections: [
    {
      heading: 'When to use Shoppa',
      links: [
        {
          label: 'Evaluate Shoppa for a retailer',
          href: '/index.md',
          description:
            'Use when an Australian retailer needs catalogue-grounded product discovery, checkout, and order support in one branded on-site conversation.',
        },
        {
          label: 'Plan a Shoppa deployment',
          href: '/process/index.md',
          description:
            'Use when the retailer has a product feed and wants to understand the catalogue, two-line embed, and live-agent path.',
        },
        {
          label: 'Start a business enquiry',
          href: '/contact/index.md',
          description:
            'Use to contact Shoppa. Include the retailer’s storefront URL, catalogue format, commerce platform, and target customer journey.',
        },
      ],
    },
    {
      heading: 'Primary',
      links: [
        {
          label: 'Shoppa overview',
          href: '/index.md',
          description: 'Product capabilities, catalogue grounding, live demo, and market context.',
        },
        {
          label: 'Implementation process',
          href: '/process/index.md',
          description: 'How a retailer connects its catalogue and deploys the agent.',
        },
        {
          label: 'About Shoppa',
          href: '/about/index.md',
          description: 'The team, product focus, and retailer-owned approach.',
        },
        {
          label: 'Contact Shoppa',
          href: '/contact/index.md',
          description: 'Business enquiry details for Australian retailers.',
        },
        {
          label: 'Privacy',
          href: '/privacy/index.md',
          description: 'How the Shoppa marketing site and direct email enquiries handle personal information.',
        },
      ],
    },
  ],
} as const;
