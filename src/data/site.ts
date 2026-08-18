export interface PageMetadata {
  title: string;
  description: string;
  path: string;
  indexable: boolean;
}

export const site = {
  name: 'Shoppa',
  origin: 'https://shoppa.au',
  locale: 'en-AU',
  title: 'Shoppa: The AI Shopping Agent Australian Retailers Own',
  description:
    'An out-of-the-box AI shopping agent you own. Two lines of code put discovery, checkout, and order support on your own site, answering from your catalogue.',
} as const;

export const pages = {
  home: {
    title: site.title,
    description: site.description,
    path: '/',
    indexable: true,
  },
  about: {
    title: 'About Us',
    description:
      'The team building Shoppa, the AI shopping agent Australian retailers deploy and own on their own sites.',
    path: '/about/',
    indexable: true,
  },
  process: {
    title: 'From Catalogue to Live Agent',
    description:
      'How Shoppa goes live on your site: connect your catalogue, add the two-line embed, and let your agent sell in conversation.',
    path: '/process/',
    indexable: true,
  },
  contact: {
    title: 'Contact Us',
    description: 'Contact us to put your own AI shopping agent on your site.',
    path: '/contact/',
    indexable: true,
  },
  thankYou: {
    title: 'Thank You',
    description: 'Confirmation that Shoppa received your business enquiry.',
    path: '/thank-you/',
    indexable: false,
  },
  notFound: {
    title: 'Page Not Found',
    description: 'The requested page could not be found.',
    path: '/404.html',
    indexable: false,
  },
} satisfies Record<string, PageMetadata>;

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
  name: 'Shoppa',
  summary:
    'Shoppa is an out-of-the-box AI shopping agent for Australian retailers. It runs product discovery, checkout, and order support on the retailer’s own site.',
  details: [
    'Shoppa connects to a retailer’s catalogue feed and is deployed with a two-line script embed.',
  ],
  sections: [
    {
      heading: 'Primary',
      links: [
        {
          label: 'Shoppa overview',
          href: '/',
          description: 'Product capabilities, catalogue grounding, live demo, and market context.',
        },
        {
          label: 'Implementation process',
          href: '/process/',
          description: 'How a retailer connects its catalogue and deploys the agent.',
        },
        {
          label: 'About Shoppa',
          href: '/about/',
          description: 'The team, product focus, and retailer-owned approach.',
        },
        {
          label: 'Contact Shoppa',
          href: '/contact/',
          description: 'Business enquiry details for Australian retailers.',
        },
      ],
    },
  ],
} as const;
