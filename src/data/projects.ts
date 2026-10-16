export type ProjectCategory = '2d' | '3d' | 'motion' | 'assets'

export type Project = {
  slug: string
  title: string
  category: ProjectCategory
  discipline: string
  year: string
  tagline: string
  brief: string
  approach: string[]
  delivered: string[]
  /** Generative visual variant index, used by the placeholder artwork component. */
  variant: number
  /** Optional real media. Leave empty until genuine project assets are supplied. */
  videoUrl?: string
  posterUrl?: string
}

export const PROJECT_CATEGORIES: { id: 'all' | ProjectCategory; label: string }[] = [
  { id: 'all', label: 'All work' },
  { id: '2d', label: '2D Animation' },
  { id: '3d', label: '3D Animation' },
  { id: 'motion', label: 'Motion Graphics' },
  { id: 'assets', label: 'Digital Assets' },
]

/**
 * Illustrative capability studies.
 *
 * These entries describe the *type* of work the studio takes on. No client
 * names, awards or performance results are claimed. Replace each entry (and
 * its placeholder artwork) with genuine project assets before launch.
 */
export const PROJECTS: Project[] = [
  {
    slug: 'explainer-series-concept',
    title: 'Explainer Series — Concept Study',
    category: '2d',
    discipline: '2D Animation · Explainer',
    year: 'Concept',
    tagline: 'A modular explainer system for a technical subject.',
    brief:
      'A short-form explainer concept built to test whether a modular 2D system can carry a technical topic without losing clarity across a series.',
    approach: [
      'Structured the message into a repeatable three-act spine: problem, mechanism, consequence.',
      'Designed a vector illustration language with a single hero metaphor reused each episode.',
      'Built a reusable asset kit so each episode shares composition rules but keeps its own focus.',
    ],
    delivered: ['Script structure', 'Storyboard panels', 'Style frames', 'Asset kit'],
    variant: 1,
  },
  {
    slug: 'character-rig-study',
    title: 'Character Performance — Rig Study',
    category: '2d',
    discipline: '2D Animation · Character',
    year: 'Concept',
    tagline: 'Rigging for expression, not just movement.',
    brief:
      'A character animation study exploring how far a limited rig can go before performance starts to feel mechanical.',
    approach: [
      'Built a layered rig with swappable hands, expressions and head angles.',
      'Tested pose-to-pose timing against a reference performance pass.',
      'Documented the rig so the setup can be reused across a series.',
    ],
    delivered: ['Character design', 'Layered rig', 'Animation test', 'Rig documentation'],
    variant: 2,
  },
  {
    slug: 'training-module-study',
    title: 'Training Module — Clarity Study',
    category: '2d',
    discipline: '2D Animation · Training',
    year: 'Concept',
    tagline: 'Procedure animation designed for retention.',
    brief:
      'A training-oriented study testing how step-by-step procedure animation holds attention compared with a narrated slide sequence.',
    approach: [
      'Reduced each step to one visual instruction with a consistent directional cue.',
      'Added recap beats so a single viewing leaves a usable mental model.',
      'Built a caption and contrast pass for accessibility.',
    ],
    delivered: ['Instructional frames', 'Step animation', 'Recap sequence', 'Accessible exports'],
    variant: 3,
  },
  {
    slug: 'product-reveal-study',
    title: 'Product Reveal — Look Development',
    category: '3d',
    discipline: '3D Animation · Product',
    year: 'Concept',
    tagline: 'Materials and lighting that make a render credible.',
    brief:
      'A look-development study for a hard-surface product animation, focused on getting materials and lighting right before any camera move is committed.',
    approach: [
      'Blocked the form first and validated silhouette before detailing.',
      'Built a physically-based material set with consistent roughness and reflection values.',
      'Developed the light rig as a reusable preset for future product work.',
    ],
    delivered: ['Blocked model', 'Material set', 'Light rig', 'Turntable renders'],
    variant: 4,
  },
  {
    slug: 'industrial-process-study',
    title: 'Process Visualisation — Industrial Study',
    category: '3d',
    discipline: '3D Animation · Industrial',
    year: 'Concept',
    tagline: 'Showing what cannot be filmed.',
    brief:
      'A process visualisation study for machinery that would be impractical to film in operation, using cutaway and exploded views to explain a flow.',
    approach: [
      'Mapped the process into discrete stages before modelling anything.',
      'Used cutaway geometry to keep internal movement visible without clutter.',
      'Animated camera moves to follow the sequence rather than the machine.',
    ],
    delivered: ['Process map', 'Cutaway model', 'Animated sequence', 'Static explainer stills'],
    variant: 5,
  },
  {
    slug: 'architectural-walkthrough-study',
    title: 'Architectural Walkthrough — Study',
    category: '3d',
    discipline: '3D Animation · Visualisation',
    year: 'Concept',
    tagline: 'A space explained in movement and light.',
    brief:
      'A walkthrough study exploring how daylight and camera pacing change the way a space is understood before it exists.',
    approach: [
      'Established a daylight study first, then designed the camera path around it.',
      'Kept the camera at human eye height to preserve spatial scale.',
      'Layered an optional plan-view overlay for orientation.',
    ],
    delivered: ['Massing model', 'Daylight study', 'Walkthrough animation', 'Plan overlay'],
    variant: 6,
  },
  {
    slug: 'kinetic-typography-study',
    title: 'Kinetic Typography — System Study',
    category: 'motion',
    discipline: 'Motion Graphics · Typography',
    year: 'Concept',
    tagline: 'Type as the lead performer.',
    brief:
      'A kinetic typography study building a pacing system that keeps spoken-word rhythm legible rather than decorative.',
    approach: [
      'Tied every transition to phrase structure rather than equal intervals.',
      'Kept a fixed type grid so movement never costs readability.',
      'Delivered as a template with adjustable timing controls.',
    ],
    delivered: ['Type system', 'Timing template', 'Animation masters', 'Style guide'],
    variant: 7,
  },
  {
    slug: 'data-infographic-study',
    title: 'Animated Infographic — Data Study',
    category: 'motion',
    discipline: 'Motion Graphics · Data',
    year: 'Concept',
    tagline: 'Data narrated with honest scales.',
    brief:
      'An animated infographic study focusing on reveal sequencing and how chart scales affect the honesty of a message.',
    approach: [
      'Chose chart forms based on the comparison, not the aesthetic.',
      'Sequenced reveals so each number is readable before the next arrives.',
      'Added direct labelling to remove reliance on legend recall.',
    ],
    delivered: ['Chart system', 'Reveal sequence', 'Animated master', 'Data template'],
    variant: 8,
  },
  {
    slug: 'brand-ident-study',
    title: 'Brand Ident — Motion Study',
    category: 'motion',
    discipline: 'Motion Graphics · Brand',
    year: 'Concept',
    tagline: 'A logo that behaves like a system.',
    brief:
      'A logo animation study building an ident that works in a two-second bumper and a longer brand film from the same rules.',
    approach: [
      'Defined motion principles — speed, easing and weight — before animating.',
      'Built a short and long version from one rigged composition.',
      'Added safe-area and background variants for broadcast and social.',
    ],
    delivered: ['Motion principles', 'Ident animation', 'Bumper cutdowns', 'Variant exports'],
    variant: 9,
  },
  {
    slug: 'ui-motion-study',
    title: 'Product UI Motion — Study',
    category: 'motion',
    discipline: 'Motion Graphics · UI',
    year: 'Concept',
    tagline: 'Interface motion that explains state.',
    brief:
      'A UI motion study exploring how transition timing communicates hierarchy and state change in product demos.',
    approach: [
      'Documented each transition against the interface state it communicates.',
      'Built the sequence as a component library rather than a single cut.',
      'Tested pacing at reduced speed to verify clarity.',
    ],
    delivered: ['Transition library', 'Product demo sequence', 'Component presets', 'Documentation'],
    variant: 10,
  },
  {
    slug: 'asset-library-study',
    title: 'Asset Library — Pipeline Study',
    category: 'assets',
    discipline: 'Digital Assets · Pipeline',
    year: 'Concept',
    tagline: 'Assets designed to survive the next project.',
    brief:
      'An asset-library study defining a naming, scale and material convention that keeps a library usable as it grows.',
    approach: [
      'Defined conventions before building a single asset.',
      'Built a small representative set then stress-tested the structure.',
      'Wrote a specification document alongside the assets.',
    ],
    delivered: ['Library structure', 'Convention guide', 'Representative asset set', 'Specification'],
    variant: 11,
  },
  {
    slug: 'real-time-assets-study',
    title: 'Real-time Assets — Engine Study',
    category: 'assets',
    discipline: 'Digital Assets · Real-time',
    year: 'Concept',
    tagline: 'Optimised for the engine, not the render farm.',
    brief:
      'A real-time asset study testing how far visual quality can be preserved while meeting engine performance budgets.',
    approach: [
      'Built to a stated polygon and material budget from the start.',
      'Used baked lighting and LODs rather than relying on runtime cost.',
      'Verified material and scale conventions inside the target engine.',
    ],
    delivered: ['Game-ready models', 'Material set', 'LOD variants', 'Engine import notes'],
    variant: 12,
  },
]

export function getProject(slug: string): Project | undefined {
  return PROJECTS.find((project) => project.slug === slug)
}
