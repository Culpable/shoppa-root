import { site } from '../config/site.ts';

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
  name: site.name,
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
