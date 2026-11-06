// -----------------------------------------------------------------------------
// SPATIUM — brand methodology (static by design)
//
// Contextual static content per AGENTS.md §3.3: this is the studio's own
// methodology narrative, transcribed verbatim from the product-knowledge deck
// (docs/brand-guideline/Spatium-SpatialStudio-ProductKnowledge.pdf; web crops in public/images/spatium/web). It is not CMS-managed business data
// (no clients, prices or metrics), so it lives in config rather than the DB.
//   SPATIAL_BENEFITS  — slide 4 ("One Point, Unlimited Possibilities")
//   SPATIAL_PIPELINE  — slide 5 (laser scan → point cloud → geometry → splat)
//   MEDIA_COMPARISON  — slide 11 (photo vs video vs spatial media)
// -----------------------------------------------------------------------------

/**
 * Benefits of a single spatial capture — PDF slide 4 ("One Point, Unlimited
 * Possibilities"). Copy is verbatim from the deck.
 */
export const SPATIAL_BENEFITS = [
  { title: 'Real-world accuracy', body: 'True scale and detail as the foundation' },
  { title: 'Versatile data', body: 'Point cloud, mesh, textures, panoramas' },
  { title: 'Multiple outputs', body: '3D, 2D, interactive, immersive' },
  { title: 'Faster workflow', body: 'Capture once, use everywhere' },
  { title: 'Creative freedom', body: 'Fueling 3D and visual artists with real places to create' },
] as const

/** Digital-twin workflow — PDF slide 5. */
export const SPATIAL_PIPELINE = [
  {
    index: '01',
    title: 'Laser Scan',
    caption: 'Capture the real world',
    body: 'A laser scanner captures millions of spatial measurements (XYZ + intensity) from the real world with high accuracy.',
    image: '/images/spatium/web/pipe-01-laser.webp',
    alt: 'Laser scanner di atas tripod memindai rumah modern di malam hari',
  },
  {
    index: '02',
    title: 'Point Cloud',
    caption: 'Accurate spatial data',
    body: 'The result is a point cloud — a precise 3D representation made of millions of spatial points with color and intensity information.',
    image: '/images/spatium/web/pipe-02-pointcloud.webp',
    alt: 'Rumah yang sama direpresentasikan sebagai jutaan titik point cloud',
  },
  {
    index: '03',
    title: '3D Geometry',
    caption: 'Structured and editable',
    body: 'From the point cloud, we generate 3D geometry (mesh) — a structured, editable model with clean topology and textures, ready for 3D production, visualization, and simulation.',
    image: '/images/spatium/web/pipe-03-geometry.webp',
    alt: 'Model mesh wireframe rumah hasil olahan point cloud',
  },
  {
    index: '04',
    title: '3D Gaussian Splat',
    caption: 'Photorealistic and immersive',
    body: 'The same data can be converted into 3D Gaussian Splat — a lightweight, photorealistic, and immersive representation ideal for real-time experiences, virtual tours, and interactive applications.',
    image: '/images/spatium/web/pipe-04-splat.webp',
    alt: 'Rumah yang sama tampil fotorealistis sebagai 3D Gaussian Splat',
  },
] as const

/** Photography vs video vs spatial media — PDF slide 11. */
export const MEDIA_COMPARISON = {
  photography: ['2D view', 'Color information', 'Limited context', 'No depth', 'No measurement', 'Static'],
  video: ['2D view over time', 'Color information', 'Limited spatial context', 'Implied depth (no real depth)', 'No measurement', 'Fixed path (camera movement)'],
  spatial: [
    { title: 'True spatial context', body: 'Real-world scale and environment.' },
    { title: 'Real depth (3D structure)', body: 'Accurate geometry and spatial relationships.' },
    { title: 'Measurement (scale & dimension)', body: 'Get precise size, distance, and area.' },
    { title: 'Freedom of locomotion (explore)', body: 'Navigate freely from any angle.' },
    { title: 'Distance and spatial relationships', body: 'Understand how elements relate to each other.' },
    { title: 'Rich environmental information', body: 'Geometry, materials, lighting, and more.' },
    { title: 'Revisitable', body: 'Return anytime, from anywhere.' },
    { title: 'Reusable rich information', body: 'For further study, analysis, and exploration.' },
  ],
} as const
