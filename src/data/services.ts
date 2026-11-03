export type ServiceVisual = '2d' | '3d' | 'motion' | 'assets'

export type Capability = { title: string; description: string }

export type Service = {
  slug: string
  index: string
  name: string
  shortName: string
  tagline: string
  summary: string
  metaDescription: string
  intro: string[]
  capabilities: Capability[]
  deliverables: string[]
  tools: string[]
  visual: ServiceVisual
  /** CSS colour token used for this discipline's accent. */
  accent: string
  faqs: { q: string; a: string }[]
  related: { label: string; to: string }[]
}

export const SERVICES: Service[] = [
  {
    slug: '2d-animation',
    index: '01',
    name: '2D Animation',
    shortName: '2D',
    tagline: 'Drawn clarity for complex subjects.',
    summary:
      'Explainers, educational animation and character work that turn dense information into something people actually follow.',
    metaDescription:
      '2D animation from UNIMASI: explainer videos, educational and training animation, character animation, infographic and illustration animation for teams that need clarity.',
    intro: [
      'Two-dimensional animation is the most direct way to make an abstract subject concrete. We design the visual language, script the narrative and animate it frame by frame so the idea survives contact with the audience.',
      'Our 2D pipeline runs from thumbnail and storyboard through to a finished master with sound design — always with the option of an animatic review before production commits.',
    ],
    capabilities: [
      { title: 'Explainer videos', description: 'Concept-led films that break a product, service or policy into a story anyone can retell.' },
      { title: 'Educational animation', description: 'Curriculum and course content designed for retention, not decoration.' },
      { title: 'Character animation', description: 'Expressive, on-model character performance with rigs built to scale across a series.' },
      { title: 'Infographic animation', description: 'Static data brought into motion with hierarchy, pacing and legible sequencing.' },
      { title: 'Illustration animation', description: 'Hand-drawn and vector artwork animated without losing its craft.' },
      { title: 'Training & safety animation', description: 'Procedure and compliance modules that respect attention spans and regulations alike.' },
    ],
    deliverables: [
      'Script and narrative structure',
      'Storyboards and style frames',
      'Animated masters (1080p / 4K)',
      'Vertical and square cutdowns',
      'Captioned and accessible versions',
      'Organised source project files',
    ],
    tools: ['Adobe Animate', 'After Effects', 'Toon Boom Harmony', 'Illustrator', 'Procreate'],
    visual: '2d',
    accent: 'var(--yellow)',
    faqs: [
      {
        q: 'How long is a typical 2D explainer?',
        a: 'Most explainers land between 60 and 120 seconds. We will recommend a runtime once we understand the message, the audience and where the video will be watched.',
      },
      {
        q: 'Can you match an existing illustration style?',
        a: 'Yes. Share your brand system or existing artwork and we will build a style frame for approval before production begins.',
      },
      {
        q: 'Do you handle voice-over and music?',
        a: 'We direct casting, record or source voice-over and license music and sound design as part of the production scope.',
      },
    ],
    related: [
      { label: 'See 2D work', to: '/portfolio?category=2d' },
      { label: 'Explore 3D Animation', to: '/services/3d-animation' },
      { label: 'Start a project', to: '/contact' },
    ],
  },
  {
    slug: '3d-animation',
    index: '02',
    name: '3D Animation & Visual Production',
    shortName: '3D',
    tagline: 'Precision you can look inside of.',
    summary:
      'Product, industrial and architectural animation — modelled, textured and lit to show exactly how something works.',
    metaDescription:
      '3D animation and visual production by UNIMASI: product animation, industrial and process visualisation, architectural visualisation, 3D modelling, texturing and asset production.',
    intro: [
      'When a subject cannot be filmed — too small, too large, too dangerous or simply not built yet — 3D makes it visible. We model from your CAD, photographs or sketches and build a scene that reads instantly.',
      'From wireframe to final render, every stage is reviewable. You get an exploded, cutaway or exploded-sequence view of your own product or facility, with the lighting and materials to make it credible.',
    ],
    capabilities: [
      { title: 'Product animation', description: 'Feature reveals, exploded views and mechanism breakdowns with believable materials.' },
      { title: 'Industrial animation', description: 'Plant, machinery and process animation for sales, training and safety.' },
      { title: 'Architectural visualization', description: 'Exterior massing, interior walkthroughs and daylight studies.' },
      { title: '3D modelling & texturing', description: 'Clean topology and physically-based materials built to be reused, not thrown away.' },
      { title: 'Character animation', description: 'Rigged, stylised or realistic character performance in a 3D pipeline.' },
      { title: 'Process visualization', description: 'Step-by-step sequences that make complex flows understandable at a glance.' },
      { title: '3D asset production', description: 'Consistent, game-ready and render-ready assets delivered as a managed library.' },
    ],
    deliverables: [
      'Modelled and textured scene assets',
      'Look development and lighting passes',
      'Animated masters and camera moves',
      'Turntables and product stills',
      'Real-time ready exports where required',
      'Source scene files and asset manifests',
    ],
    tools: ['Blender', 'Cinema 4D', 'Maya', 'Redshift', 'Substance Painter', 'Unreal Engine'],
    visual: '3d',
    accent: '#7FB2FF',
    faqs: [
      {
        q: 'Can you work from CAD files?',
        a: 'Yes. STEP, IGES, SolidWorks, Revit and mesh formats are all workable inputs. We will tell you early if a model needs retopology first.',
      },
      {
        q: 'How realistic can the render be?',
        a: 'As realistic as the brief requires. We agree on a look-development target early so realism never becomes an open-ended moving goal.',
      },
      {
        q: 'Do we receive the 3D files?',
        a: 'Yes — source scene files and asset manifests are part of final delivery, with naming conventions documented.',
      },
    ],
    related: [
      { label: 'See 3D work', to: '/portfolio?category=3d' },
      { label: 'Explore Motion Graphics', to: '/services/motion-graphics' },
      { label: 'Start a project', to: '/contact' },
    ],
  },
  {
    slug: 'motion-graphics',
    index: '03',
    name: 'Motion Graphics',
    shortName: 'Motion',
    tagline: 'Systems that move with intent.',
    summary:
      'Typography, data and brand motion graphics designed as a reusable system rather than a one-off.',
    metaDescription:
      'Motion graphics from UNIMASI: corporate motion graphics, kinetic typography, animated infographics, logo animation, UI motion, packages and compositing.',
    intro: [
      'Motion graphics carry the parts of your message that words alone cannot: hierarchy, sequence and emphasis. We design the system so the second video is as fast to produce as the first.',
      'Everything is built to be re-skinned and re-cut — templates, presets and a documented style guide come with the delivery.',
    ],
    capabilities: [
      { title: 'Corporate motion graphics', description: 'Reports, announcements and internal comms that people finish watching.' },
      { title: 'Kinetic typography', description: 'Type as the lead performer — paced, weighted and readable.' },
      { title: 'Animated infographics', description: 'Complex data narrated with clear reveals and honest scales.' },
      { title: 'Logo animation', description: 'Ident animation with brand rules baked into the build.' },
      { title: 'UI motion graphics', description: 'Interface animation for product demos, launches and onboarding.' },
      { title: 'Motion graphics packages', description: 'Template libraries your team can run without a studio.' },
      { title: 'Video graphics & compositing', description: 'Titles, lower thirds, keying and clean-up for live-action footage.' },
    ],
    deliverables: [
      'Designed motion system and style frames',
      'Reusable templates and presets',
      'Animated masters and platform exports',
      'Alpha-channel versions for editors',
      'Style guide and usage documentation',
      'Sound design and music direction',
    ],
    tools: ['After Effects', 'Cinema 4D', 'Illustrator', 'DaVinci Resolve', 'Redshift', 'Figma'],
    visual: 'motion',
    accent: 'var(--yellow-soft)',
    faqs: [
      {
        q: 'Can your templates be used by our team?',
        a: 'Yes. We build editable templates with clear controls and a short handover session so your team can produce variations confidently.',
      },
      {
        q: 'Do you animate data live from a spreadsheet?',
        a: 'For recurring reports we can connect charts to structured data so the graphics update with your numbers rather than being redrawn.',
      },
      {
        q: 'How many revisions are included?',
        a: 'Scope is agreed in the proposal — typically two structured review rounds per stage, with additional rounds quoted transparently.',
      },
    ],
    related: [
      { label: 'See motion work', to: '/portfolio?category=motion' },
      { label: 'Explore 2D Animation', to: '/services/2d-animation' },
      { label: 'Start a project', to: '/contact' },
    ],
  },
  {
    slug: 'digital-assets-ai',
    index: '04',
    name: 'Digital Visual Assets & AI-Assisted Production',
    shortName: 'Assets & AI',
    tagline: 'Asset pipelines built to be reused.',
    summary:
      '3D asset libraries, real-time assets and AI-assisted production that speed up delivery without lowering the bar.',
    metaDescription:
      'Digital visual assets and AI-assisted production from UNIMASI: 3D asset libraries, real-time 3D assets, animation assets and AI-assisted visual production.',
    intro: [
      'Studios and product teams do not just need a video — they need the assets behind it. We build libraries that stay consistent, documented and ready for the next project.',
      'AI-assisted production is a lever, not a shortcut. We use it for ideation, variation and clean-up under human art direction, and we are explicit about how and where it is used.',
    ],
    capabilities: [
      { title: '3D asset libraries', description: 'Catalogued, named and optimised asset sets with documented specifications.' },
      { title: 'Real-time 3D assets', description: 'Game-ready and engine-ready models, materials and LODs built to perform.' },
      { title: 'Animation assets', description: 'Rigs, motion libraries, sprite sheets and reusable animated components.' },
      { title: 'AI-assisted visual production', description: 'Concept variation, upscaling, rotoscoping and matte work under human art direction.' },
    ],
    deliverables: [
      'Documented asset library structure',
      'Source and export formats',
      'Material and shader definitions',
      'Specification and usage guide',
      'Handover session for your team',
      'Optional ongoing asset support',
    ],
    tools: ['Blender', 'Substance Painter', 'Houdini', 'Unreal Engine', 'Unity', 'Python tooling'],
    visual: 'assets',
    accent: '#8FF0C4',
    faqs: [
      {
        q: 'How is AI used in your production?',
        a: 'For exploration, variation and time-consuming clean-up tasks. Final creative direction, composition and brand accuracy stay with our artists, and we disclose AI use on every project.',
      },
      {
        q: 'Do you sign over the assets?',
        a: 'Yes. Delivery terms and licensing are set out in the proposal, including whether assets are exclusive to your organisation.',
      },
      {
        q: 'Can assets be delivered for an existing engine?',
        a: 'We export to your target engine and verify material and scale conventions before handover.',
      },
    ],
    related: [
      { label: 'Explore 3D Animation', to: '/services/3d-animation' },
      { label: 'Explore Motion Graphics', to: '/services/motion-graphics' },
      { label: 'Start a project', to: '/contact' },
    ],
  },
]

export const CORE_SERVICES = SERVICES

export function getService(slug: string): Service | undefined {
  return SERVICES.find((service) => service.slug === slug)
}
