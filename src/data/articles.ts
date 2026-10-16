export type Block =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'quote'; text: string; cite?: string }
  | { type: 'callout'; title: string; text: string }

export type ArticleCategory =
  | 'Process'
  | '2D Animation'
  | '3D Animation'
  | 'Motion Graphics'
  | 'AI & Production'

export type Article = {
  slug: string
  title: string
  category: ArticleCategory
  excerpt: string
  metaDescription: string
  /** ISO date string (publication). */
  date: string
  author: string
  readMinutes: number
  tags: string[]
  artVariant: number
  featured?: boolean
  body: Block[]
  serviceCta: { label: string; to: string; blurb: string }
  relatedLinks: { label: string; to: string }[]
  relatedSlugs: string[]
}

export const ARTICLE_CATEGORIES: ArticleCategory[] = [
  'Process',
  '2D Animation',
  '3D Animation',
  'Motion Graphics',
  'AI & Production',
]

export const ARTICLES: Article[] = [
  {
    slug: 'brief-that-animation-can-actually-answer',
    title: 'Writing a brief that animation can actually answer',
    category: 'Process',
    excerpt:
      'Most animation projects that go sideways were ambiguous before a single frame was drawn. Here is the brief structure we ask for instead.',
    metaDescription:
      'A practical brief structure for animation projects: audience, single message, mandatory content, channel and success criteria — from the UNIMASI studio process.',
    date: '2026-09-18',
    author: 'UNIMASI Studio',
    readMinutes: 6,
    tags: ['Concept', 'Pre-production', 'Strategy'],
    artVariant: 2,
    featured: true,
    body: [
      {
        type: 'p',
        text: 'A brief is not a description of the video you want. It is a description of the problem the video has to solve. When those two get confused, the project still looks fine on the storyboard and falls apart in the review.',
      },
      { type: 'h2', text: 'One message per film' },
      {
        type: 'p',
        text: 'If you cannot write the film\'s single message in one sentence, the audience will not be able to either. We ask clients to complete the sentence: *After watching this, the viewer will understand that ______.* Everything that does not serve that sentence becomes an optional extra — and optional extras are the first casualties of a review round.',
      },
      {
        type: 'quote',
        text: 'If the brief contains four key messages, you have written a proposal for four films.',
      },
      { type: 'h2', text: 'Name the audience precisely' },
      {
        type: 'p',
        text: '“Everyone” is not an audience. Neither is “stakeholders”. The level of assumed knowledge in your audience sets the entire visual language — how much on-screen labelling you need, whether a metaphor will help or patronise, how fast the pacing can go.',
      },
      {
        type: 'ul',
        items: [
          'What does the audience already know, and what is genuinely new to them?',
          'Where will they watch this — a meeting room, a phone in a queue, a classroom?',
          'What do you want them to do immediately after watching?',
        ],
      },
      { type: 'h2', text: 'Separate mandatory content from wishlist content' },
      {
        type: 'p',
        text: 'Compliance text, legal language, a specific product name and a required call to action are mandatory. A particular colour, a favourite stock track and an idea someone had in 2019 are wishlist. Both lists are legitimate — they just behave differently when runtime gets tight. Labelling them up front makes the cut in the edit room a decision rather than an argument.',
      },
      {
        type: 'callout',
        title: 'A brief we can start from',
        text: 'Audience · single message · mandatory content · channel and aspect ratios · runtime range · what happens after the film. Six lines is enough to scope a project properly.',
      },
      { type: 'h3', text: 'Runtime is a design decision, not a constraint' },
      {
        type: 'p',
        text: 'A three-minute film with four messages will feel rushed. A forty-second film with one message will feel generous. When a client asks for both length and density, we show them the arithmetic early — it is far cheaper to have that conversation in week one than at the final review.',
      },
      { type: 'h2', text: 'Decide who approves, and how' },
      {
        type: 'p',
        text: 'The most expensive sentence in animation production is “I\'ll need to run this past a few people.” Agree your decision-maker, your reviewer group and your feedback format before production. We standardise feedback into a single timestamped document so notes are resolved rather than re-litigated.',
      },
      {
        type: 'p',
        text: 'Once a brief covers these five things, the [concept and storyboard stage](/services) tends to move in days rather than weeks — and the first animatic usually looks like the film you imagined.',
      },
    ],
    serviceCta: {
      label: 'Start with Discovery & Brief',
      to: '/services',
      blurb: 'Our first stage is designed to turn exactly this kind of ambiguity into a locked scope.',
    },
    relatedLinks: [
      { label: 'Our process', to: '/about#process' },
      { label: '2D Animation', to: '/services/2d-animation' },
      { label: 'Start a project', to: '/contact' },
    ],
    relatedSlugs: ['storyboard-to-animatic', 'accessibility-in-motion'],
  },
  {
    slug: 'storyboard-to-animatic',
    title: 'From storyboard to animatic: where a film is really made',
    category: 'Process',
    excerpt:
      'The animatic is the cheapest place to discover a problem and the most common stage to skip. Here is what we review at that stage and why.',
    metaDescription:
      'Why the animatic is the most important review point in animation production, what to look for in timing, clarity and story, and how to run the review well.',
    date: '2026-08-27',
    author: 'UNIMASI Studio',
    readMinutes: 7,
    tags: ['Storyboard', 'Timing', 'Pre-production'],
    artVariant: 5,
    body: [
      {
        type: 'p',
        text: 'An animatic is your storyboard cut to real time with scratch dialogue, music and sound effects. It is ugly on purpose. Its job is to prove the film works before the expensive parts begin.',
      },
      { type: 'h2', text: 'Why timing cannot be judged on a storyboard' },
      {
        type: 'p',
        text: 'A storyboard shows sequence. It cannot show rhythm. A gesture that reads perfectly as a still panel can feel rushed or sluggish once it has to happen in 1.5 seconds. The animatic is where the film stops being a plan and starts being a film.',
      },
      {
        type: 'ul',
        items: [
          'Does the story land without any finished art? If not, better animation will not save it.',
          'Is each beat long enough to be read at normal viewing speed?',
          'Does the narration carry the meaning, or is it competing with the visuals?',
          'Where does attention drift? That is usually where a beat is doing two jobs.',
        ],
      },
      { type: 'h2', text: 'Cut the narration first' },
      {
        type: 'p',
        text: 'We record a scratch voice track before animating a single movement. Spoken language has a natural pace, and animation that ignores it ends up either clipped or padded. Cutting to the voice early means the animation serves the sentence rather than the sentence being squeezed to fit the animation.',
      },
      {
        type: 'quote',
        text: 'Every frame you cut in the animatic saves a week in production. Every frame you cut in production saves nothing.',
      },
      { type: 'h2', text: 'Running a useful animatic review' },
      {
        type: 'ol',
        items: [
          'Watch it once all the way through without pausing. Note only the moments you lose the thread.',
          'Then review with timestamps, one note per beat, written not spoken.',
          'Separate “this is unclear” from “this is not to my taste”. The first is a defect, the second is a conversation.',
          'Approve timing explicitly before art production begins.',
        ],
      },
      {
        type: 'callout',
        title: 'A note on lock-in',
        text: 'Approving an animatic is approving structure and timing — not the final look. Art direction is still open, but the sequence is not. Changing sequence after animation starts is the single largest cause of budget overrun.',
      },
      {
        type: 'p',
        text: 'When you are ready to see how this fits into a full production, our [process timeline](/about#process) shows where the animatic sits and who signs it off.',
      },
    ],
    serviceCta: {
      label: 'See our storyboard stage',
      to: '/about#process',
      blurb: 'Concept & Storyboard is stage two of five — here is exactly what it produces.',
    },
    relatedLinks: [
      { label: 'Our process', to: '/about#process' },
      { label: 'Motion Graphics', to: '/services/motion-graphics' },
      { label: 'Journal index', to: '/journal' },
    ],
    relatedSlugs: ['brief-that-animation-can-actually-answer', 'modular-motion-systems'],
  },
  {
    slug: 'choosing-between-2d-and-3d',
    title: 'Choosing between 2D and 3D (and when the answer is both)',
    category: '2D Animation',
    excerpt:
      'The decision is rarely about which looks better. It is about what the subject needs to prove, and how often you need to reuse it.',
    metaDescription:
      'How to decide between 2D and 3D animation for a project: transparency, spatial understanding, repeatability, budget and hybrid pipelines.',
    date: '2026-07-30',
    author: 'UNIMASI Studio',
    readMinutes: 8,
    tags: ['Art direction', 'Comparison', 'Pipeline'],
    artVariant: 1,
    body: [
      {
        type: 'p',
        text: 'Clients often arrive with a format already chosen. Usually the choice was made aesthetically, when the real question is structural: what does this subject need to demonstrate?',
      },
      { type: 'h2', text: '2D wins on clarity and control' },
      {
        type: 'p',
        text: 'Two-dimensional animation lets you decide exactly what the viewer sees in every panel. You can simplify without explaining a camera, annotate freely, and build a visual metaphor that would be impossible to model. For concepts, processes and anything where the message matters more than the object, 2D is usually faster and clearer.',
      },
      { type: 'h2', text: '3D wins on spatial truth' },
      {
        type: 'p',
        text: 'If the audience has to understand a volume, a mechanism, an assembly or a space, 3D does something 2D cannot fake: it maintains consistency from an unlimited number of viewpoints. Once modelled, you can orbit, cut away, explode and relight without redrawing.',
      },
      {
        type: 'ul',
        items: [
          'Does the audience need to understand an object or a concept? Objects lean 3D.',
          'Will the same subject appear in multiple films or camera angles? 3D amortises.',
          'Is the visual style illustrative, diagrammatic or hand-drawn? That leans 2D.',
          'Will you need cutaways, exploded views or interiors? 3D is the honest choice.',
        ],
      },
      { type: 'h2', text: 'The hybrid answer' },
      {
        type: 'p',
        text: 'Most of our strongest work is neither purely 2D nor purely 3D. We frequently animate 3D renders with 2D annotation layers, or set 2D characters inside a 3D environment so the camera can move while the illustration style stays graphic. The pipeline choice should follow the storyboard, not precede it.',
      },
      {
        type: 'quote',
        text: 'Pick the format that makes the message unmissable. Everything else is a preference.',
      },
      {
        type: 'callout',
        title: 'A useful test',
        text: 'Write the single sentence the film has to land. Then ask which format a viewer would need in order to believe it. The answer is usually obvious once the sentence exists.',
      },
      {
        type: 'p',
        text: 'If you are weighing this up for a live project, look at [2D Animation](/services/2d-animation) and [3D Animation & Visual Production](/services/3d-animation) side by side, or send us the brief and we will recommend a pipeline with the trade-offs stated.',
      },
    ],
    serviceCta: {
      label: 'Compare 2D and 3D',
      to: '/services',
      blurb: 'Both disciplines, their deliverables and their typical timelines, side by side.',
    },
    relatedLinks: [
      { label: '2D Animation', to: '/services/2d-animation' },
      { label: '3D Animation', to: '/services/3d-animation' },
      { label: 'Start a project', to: '/contact' },
    ],
    relatedSlugs: ['pbr-materials-that-read', 'brief-that-animation-can-actually-answer'],
  },
  {
    slug: 'pbr-materials-that-read',
    title: 'Building PBR materials that read on a small screen',
    category: '3D Animation',
    excerpt:
      'Physically-based rendering rewards accuracy, but a phone screen punishes subtlety. Here is how we balance the two.',
    metaDescription:
      'A practical guide to PBR material design for product and industrial 3D animation that stays legible on mobile screens without looking plasticky.',
    date: '2026-06-12',
    author: 'UNIMASI Studio',
    readMinutes: 7,
    tags: ['Look development', 'Materials', 'Lighting'],
    artVariant: 4,
    body: [
      {
        type: 'p',
        text: 'A material that looks perfect on a calibrated studio monitor can turn to mush on a phone at 40% brightness. For product and industrial work, legibility beats physical accuracy every time — but only where the two actually conflict.',
      },
      { type: 'h2', text: 'Contrast does the work, not resolution' },
      {
        type: 'p',
        text: 'Viewers read form through contrast boundaries. If a brushed metal surface and a matte plastic sit at similar luminance, the object flattens regardless of how much detail is baked in. We separate materials by value first, then refine roughness and reflection.',
      },
      {
        type: 'ul',
        items: [
          'Define a value hierarchy for every material in the shot before texturing begins.',
          'Push edge highlight contrast slightly beyond physical accuracy to hold silhouette.',
          'Limit yourself to three dominant materials per hero object.',
        ],
      },
      { type: 'h2', text: 'Light the form, not the texture' },
      {
        type: 'p',
        text: 'Most “bad render” complaints are lighting complaints. A large soft key establishes the form; a hard rim separates it from the background; a subtle fill stops shadows going to pure black. We build this rig once and reuse it, which is also why our product work stays visually consistent project to project.',
      },
      {
        type: 'quote',
        text: 'If you can read the shape of the object with the materials removed, the lighting is doing its job.',
      },
      { type: 'h3', text: 'Test at output size, not at working size' },
      {
        type: 'p',
        text: 'We export a still at the exact pixel dimensions the final video will use and review it on a phone before committing to a full render. It is a five-minute check that prevents a very expensive conversation.',
      },
      {
        type: 'callout',
        title: 'Reusability',
        text: 'Every material set we build is catalogued with its parameters documented, so the same product can be re-lit for the next launch without redoing look development from scratch.',
      },
      {
        type: 'p',
        text: 'This is the same discipline behind our [3D asset libraries](/services/digital-assets-ai) — the difference between a render and a repeatable pipeline.',
      },
    ],
    serviceCta: {
      label: 'Explore 3D production',
      to: '/services/3d-animation',
      blurb: 'Modelling, texturing, lighting and animation, from CAD to final render.',
    },
    relatedLinks: [
      { label: '3D Animation', to: '/services/3d-animation' },
      { label: 'Digital assets & AI', to: '/services/digital-assets-ai' },
      { label: 'Start a project', to: '/contact' },
    ],
    relatedSlugs: ['choosing-between-2d-and-3d', 'modular-motion-systems'],
  },
  {
    slug: 'modular-motion-systems',
    title: 'Why motion graphics should be a system, not a video',
    category: 'Motion Graphics',
    excerpt:
      'If the second video costs as much as the first, you were sold a film instead of a system. Here is the difference in practice.',
    metaDescription:
      'How to commission motion graphics as a reusable design system: templates, rules, data binding and documentation that make the next video cheap.',
    date: '2026-05-21',
    author: 'UNIMASI Studio',
    readMinutes: 6,
    tags: ['Systems', 'Templates', 'Brand'],
    artVariant: 7,
    featured: true,
    body: [
      {
        type: 'p',
        text: 'Corporate teams rarely need one video. They need a dozen, spread across a year, produced by people who are not animators. The difference between a one-off film and a motion system is the difference between buying a car and buying a workshop.',
      },
      { type: 'h2', text: 'What a motion system actually contains' },
      {
        type: 'ul',
        items: [
          'A defined set of transitions with rules for when each is used.',
          'Type scales and safe areas that survive platform crops.',
          'Chart and data components that accept new numbers.',
          'Editable templates with named controls, not a mystery timeline.',
          'A written and video guide for the team who will use it.',
        ],
      },
      { type: 'h2', text: 'Rules prevent drift' },
      {
        type: 'p',
        text: 'The value of a system is not that it constrains creativity — it is that it prevents accidental divergence. Without rules, five regional teams produce five visual dialects and the brand looks inconsistent across a single campaign.',
      },
      {
        type: 'quote',
        text: 'A template is only a system if the person who did not design it can use it correctly.',
      },
      { type: 'h2', text: 'Bind the data where you can' },
      {
        type: 'p',
        text: 'For recurring reports, we connect chart graphics to structured data so numbers update on load rather than being re-keyed and silently mistyped. It is usually a small amount of setup that removes an entire category of error.',
      },
      {
        type: 'callout',
        title: 'What to ask for in the proposal',
        text: 'Template files · named controls · a style guide · a handover session · a stated revision process. If a quote includes none of these, you are buying a video, not a system.',
      },
      {
        type: 'p',
        text: 'We scope [motion graphics packages](/services/motion-graphics) with all of the above as standard, because an asset your team cannot use is not really delivered.',
      },
    ],
    serviceCta: {
      label: 'See motion packages',
      to: '/services/motion-graphics',
      blurb: 'Templates, presets and documentation your team can run without a studio.',
    },
    relatedLinks: [
      { label: 'Motion Graphics', to: '/services/motion-graphics' },
      { label: 'Journal index', to: '/journal' },
      { label: 'Start a project', to: '/contact' },
    ],
    relatedSlugs: ['storyboard-to-animatic', 'using-ai-responsibly'],
  },
  {
    slug: 'using-ai-responsibly',
    title: 'Using AI in animation production without losing the plot',
    category: 'AI & Production',
    excerpt:
      'AI is genuinely useful in narrow, unglamorous places. It is also a fast route to inconsistent work. Here is where we draw the line.',
    metaDescription:
      'Where AI-assisted production helps animation workflows — ideation, variation, rotoscoping and clean-up — and where human art direction must stay in control.',
    date: '2026-04-09',
    author: 'UNIMASI Studio',
    readMinutes: 8,
    tags: ['AI', 'Workflow', 'Ethics'],
    artVariant: 11,
    body: [
      {
        type: 'p',
        text: 'AI tooling arrived in animation the way it arrives everywhere: enthusiastically, and with very little regard for what a production actually needs. Having used it across real projects, we have a fairly specific view of where it earns its place.',
      },
      { type: 'h2', text: 'Where it genuinely helps' },
      {
        type: 'ul',
        items: [
          'Exploration: generating a wide field of visual references before committing to a direction.',
          'Variation: producing texture and background options for an artist to refine.',
          'Clean-up: rotoscoping, matte extraction and upscaling plates that would otherwise be tedious.',
          'Pre-viz: roughing out story beats before storyboard time is spent.',
        ],
      },
      { type: 'h2', text: 'Where it does not' },
      {
        type: 'p',
        text: 'Anything requiring consistency across time — a character staying on-model, a brand mark staying exact, a mechanism staying mechanically true. Generative tools are probabilistic; production needs determinism. We do not put an unreliable component on the critical path of a delivery.',
      },
      {
        type: 'quote',
        text: 'AI is a lever, not a replacement for art direction. Someone still has to know what good looks like.',
      },
      { type: 'h2', text: 'Disclosure and licensing' },
      {
        type: 'p',
        text: 'We disclose where AI has been used in a project, and we do not train on client material without written permission. Where a deliverable must be fully human-made — for legal, brand or regulatory reasons — we will say so clearly rather than quietly using tooling anyway.',
      },
      {
        type: 'callout',
        title: 'Our working rule',
        text: 'AI may propose. Artists decide. Nothing reaches a client review that has not passed human art direction.',
      },
      {
        type: 'p',
        text: 'This combines with the asset pipeline work covered under [Digital Visual Assets & AI](/services/digital-assets-ai), where documented, reusable assets are the real efficiency gain.',
      },
    ],
    serviceCta: {
      label: 'Digital Visual Assets & AI',
      to: '/services/digital-assets-ai',
      blurb: 'Asset libraries, real-time assets and AI-assisted production under human direction.',
    },
    relatedLinks: [
      { label: 'Digital assets & AI', to: '/services/digital-assets-ai' },
      { label: '3D Animation', to: '/services/3d-animation' },
      { label: 'Start a project', to: '/contact' },
    ],
    relatedSlugs: ['modular-motion-systems', 'pbr-materials-that-read'],
  },
  {
    slug: 'accessibility-in-motion',
    title: 'Accessibility in motion design: small decisions, big difference',
    category: 'Motion Graphics',
    excerpt:
      'Captions, contrast, pacing and reduced-motion support are not extras. They are part of what makes a film legible to more of your audience.',
    metaDescription:
      'Practical accessibility practices for animation and motion design: captioning, contrast ratios, pacing, legible typography and reduced-motion alternatives.',
    date: '2026-02-26',
    author: 'UNIMASI Studio',
    readMinutes: 6,
    tags: ['Accessibility', 'Typography', 'Inclusion'],
    artVariant: 8,
    body: [
      {
        type: 'p',
        text: 'Accessibility work in animation is mostly invisible when it is done well. It is also the fastest way to make a film more useful to every viewer, not just those with a stated access need.',
      },
      { type: 'h2', text: 'Captions are a design decision' },
      {
        type: 'p',
        text: 'Burned-in captions that fight the visuals are worse than none. We reserve space in the composition for caption safe areas, keep text on an opaque backing where the background is busy, and export both open and closed caption versions.',
      },
      { type: 'h2', text: 'Contrast and type size' },
      {
        type: 'ul',
        items: [
          'Aim for a contrast ratio of at least 4.5:1 for on-screen text.',
          'Avoid placing critical text over moving imagery without a backing plate.',
          'Keep a minimum on-screen dwell time so text can actually be read.',
          'Avoid relying on colour alone to distinguish meaning.',
        ],
      },
      { type: 'h2', text: 'Pacing is an accessibility property' },
      {
        type: 'p',
        text: 'Cuts, flashes and rapid camera movement are harder to process for some viewers, and for everyone on a small screen. We avoid unnecessary flashing, cap the frequency of hard cuts in a sequence, and resist the urge to fill every second.',
      },
      {
        type: 'callout',
        title: 'Reduced-motion alternatives',
        text: 'For interactive and web-delivered motion, we ship a reduced-motion path that preserves information while removing large movement. It is a CSS media query away, and it is the right default.',
      },
      {
        type: 'quote',
        text: 'If the film only works for viewers who can read fast, hear perfectly and sit close to a large screen, it does not work.',
      },
      {
        type: 'p',
        text: 'Accessibility passes are included in our standard [review and refinement stage](/about#process) rather than billed as an add-on.',
      },
    ],
    serviceCta: {
      label: 'See our review stage',
      to: '/about#process',
      blurb: 'Every project includes a legibility and accessibility pass before final delivery.',
    },
    relatedLinks: [
      { label: 'Our process', to: '/about#process' },
      { label: 'Motion Graphics', to: '/services/motion-graphics' },
      { label: 'Journal index', to: '/journal' },
    ],
    relatedSlugs: ['brief-that-animation-can-actually-answer', 'modular-motion-systems'],
  },
]

export function getArticle(slug: string): Article | undefined {
  return ARTICLES.find((article) => article.slug === slug)
}

export function getRelatedArticles(article: Article): Article[] {
  return article.relatedSlugs
    .map((slug) => ARTICLES.find((a) => a.slug === slug))
    .filter((a): a is Article => Boolean(a))
}

export const SORTED_ARTICLES = [...ARTICLES].sort(
  (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
)

export function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}
