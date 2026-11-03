export const STUDIO_EMAIL = process.env.NEXT_PUBLIC_STUDIO_EMAIL || 'hello@unimasi.studio'

export const CONTACT = {
  email: STUDIO_EMAIL,
  /* Placeholder studio details — replace with verified company information. */
  phone: '+00 000 000 000',
  location: 'Remote-first studio · working with teams worldwide',
  hours: 'Mon–Fri · 09:00–18:00',
} as const

export type NavChild = { label: string; to: string; blurb?: string }
export type NavItem = { label: string; to: string; children?: NavChild[] }

export const NAV: NavItem[] = [
  { label: 'Home', to: '/' },
  {
    label: 'Services',
    to: '/services',
    children: [
      { label: 'All Services', to: '/services', blurb: 'Three core disciplines, one studio' },
      { label: '2D Animation', to: '/services/2d-animation', blurb: 'Explainers, character & education' },
      { label: '3D Animation', to: '/services/3d-animation', blurb: 'Product, industrial & architectural' },
      { label: 'Motion Graphics', to: '/services/motion-graphics', blurb: 'Typography, data & brand motion' },
      { label: 'Digital Visual Assets & AI', to: '/services/digital-assets-ai', blurb: 'Libraries, real-time & AI-assisted' },
    ],
  },
  { label: 'Portfolio', to: '/portfolio' },
  { label: 'About', to: '/about' },
  { label: 'Articles', to: '/journal' },
  { label: 'Contact', to: '/contact' },
]

export const PROCESS = [
  {
    index: '01',
    title: 'Discovery & Brief',
    duration: 'Week 1',
    summary:
      'We start with the problem, not the pixels. Workshops, reference gathering and audience mapping define what the animation has to achieve.',
    outputs: ['Creative brief', 'Audience & message map', 'Reference direction', 'Scope and timeline'],
  },
  {
    index: '02',
    title: 'Concept & Storyboard',
    duration: 'Week 1–2',
    summary:
      'Ideas become sequences. We script the narrative, sketch the frames and lock a visual direction before a single frame is animated.',
    outputs: ['Script & voice direction', 'Storyboard panels', 'Style frames', 'Animatic'],
  },
  {
    index: '03',
    title: 'Production',
    duration: 'Week 2–5',
    summary:
      'Design, modelling, rigging and animation run in parallel tracks. Weekly reviews keep the work visible and the decisions close.',
    outputs: ['Asset build', 'Animation passes', 'Sound & music direction', 'Internal review cuts'],
  },
  {
    index: '04',
    title: 'Review & Refinement',
    duration: 'Week 5–6',
    summary:
      'Structured feedback rounds sharpen timing, clarity and polish. Every note is tracked until it is resolved or deliberately declined.',
    outputs: ['Review rounds', 'Revision log', 'Accessibility & legibility pass', 'Final approval'],
  },
  {
    index: '05',
    title: 'Final Delivery',
    duration: 'Week 6',
    summary:
      'We deliver masters, cutdowns and platform-ready exports, then hand over source files and a usage guide so the work keeps performing.',
    outputs: ['Master & cutdown exports', 'Platform versions', 'Source project files', 'Usage documentation'],
  },
] as const

export const VALUES = [
  {
    title: 'Professional expertise',
    body: 'A senior, specialist team across 2D, 3D and motion. No outsourcing the thinking, no junior roulette on your project.',
    icon: 'expertise',
  },
  {
    title: 'Creative storytelling',
    body: 'We build narrative structure first — because a clear story is what makes a technical subject land with real people.',
    icon: 'story',
  },
  {
    title: 'Technical capability',
    body: 'Rigging, simulation, real-time 3D and compositing pipelines that scale from one explainer to a full asset library.',
    icon: 'technical',
  },
  {
    title: 'Flexible collaboration',
    body: 'Plug into your team or run end-to-end. Adaptable contracts, transparent scope and reviews that respect your calendar.',
    icon: 'collaboration',
  },
  {
    title: 'Production quality',
    body: 'Design systems, naming conventions and QC passes — so the hundredth video looks as considered as the first.',
    icon: 'quality',
  },
] as const

export type Industry = { name: string; blurb: string; icon: string }

export const INDUSTRIES: Industry[] = [
  { name: 'Education', blurb: 'Curriculum explainers and course content that holds attention.', icon: 'education' },
  { name: 'Government', blurb: 'Public information, safety and policy communication.', icon: 'government' },
  { name: 'Manufacturing', blurb: 'Process, maintenance and training animation.', icon: 'manufacturing' },
  { name: 'Architecture', blurb: 'Visualisation, walkthroughs and spatial storytelling.', icon: 'architecture' },
  { name: 'Creative agencies', blurb: 'White-label production for campaigns and launches.', icon: 'agency' },
  { name: 'Gaming', blurb: 'Trailers, asset production and in-engine motion.', icon: 'gaming' },
  { name: 'Digital products', blurb: 'UI motion, onboarding and product explainers.', icon: 'product' },
  { name: 'Brands', blurb: 'Brand films, ident systems and social motion.', icon: 'brand' },
]

export const BUDGET_RANGES = [
  'Under $5k',
  '$5k – $10k',
  '$10k – $25k',
  '$25k – $50k',
  '$50k+',
  'Not sure yet — advise me',
] as const

export const TIMELINES = [
  'ASAP (under 2 weeks)',
  '2–4 weeks',
  '1–2 months',
  '3+ months',
  'Ongoing retainer',
] as const

export const SOCIALS = [
  // Handles await owner confirmation — generic platform roots were removed
  // because they send visitors nowhere useful (see docs/CONTENT_GAPS.md).
  { label: 'Behance', href: 'https://www.behance.net/unimasi' },
  { label: 'Vimeo', href: 'https://vimeo.com/unimasi' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/company/unimasi' },
  { label: 'Instagram', href: 'https://www.instagram.com/unimasi' },
] as const
