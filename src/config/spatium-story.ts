// -----------------------------------------------------------------------------
// SPATIUM — brand methodology (static by design)
//
// Contextual static content per AGENTS.md §3.3: this is the studio's own
// methodology narrative, transcribed verbatim from the product-knowledge deck
// (docs/brand-guideline/Spatium-SpatialStudio-ProductKnowledge.pdf; web crops in public/images/spatium/web). It is not CMS-managed business data
// (no clients, prices or metrics), so it lives in config rather than the DB.
//   SPATIAL_BENEFITS  — slide 4 ("One Point, Unlimited Possibilities")
//   SPATIAL_PIPELINE  — slide 5 (laser scan → point cloud → geometry → splat)
//   WAYS_OF_SEEING    — slide 7 ("The way we see space")
//   DISTANCE_PLACES   — slide 8 ("We are cursed by distance")
//   MEDIA_COMPARISON  — slide 11 (photo vs video vs spatial media)
//   USE_CASE_STORIES  — slides 12–23 (filmmaking, marketing, wedding memory)
//   BRAND_VALUES      — slides 3–6 (walkable image, ZMOT, benefits)
//   CONTACT_STEPS / CONTACT_FAQS — first-contact copy restating slides 4–7 and
//                       the SuperSplat delivery shown in the portfolio HTML
//
// Studio-managed data (use cases, scenes, sectors, clients, socials, contacts)
// is NOT here: it is read from the database or from NEXT_PUBLIC_* env vars.
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
    /** Indonesian rendering of `body` (ProcessTimeline). */
    summaryId:
      'Laser scanner merekam jutaan pengukuran spasial (XYZ + intensitas) dari dunia nyata dengan akurasi tinggi.',
    outputs: ['Pengukuran XYZ + intensitas', 'Data lokasi nyata'],
  },
  {
    index: '02',
    title: 'Point Cloud',
    caption: 'Accurate spatial data',
    body: 'The result is a point cloud — a precise 3D representation made of millions of spatial points with color and intensity information.',
    image: '/images/spatium/web/pipe-02-pointcloud.webp',
    alt: 'Rumah yang sama direpresentasikan sebagai jutaan titik point cloud',
    /** Indonesian rendering of `body` (ProcessTimeline). */
    summaryId:
      'Hasilnya point cloud — representasi 3D presisi dari jutaan titik spasial dengan informasi warna dan intensitas.',
    outputs: ['Point cloud berwarna', 'Data spasial akurat'],
  },
  {
    index: '03',
    title: '3D Geometry',
    caption: 'Structured and editable',
    body: 'From the point cloud, we generate 3D geometry (mesh) — a structured, editable model with clean topology and textures, ready for 3D production, visualization, and simulation.',
    image: '/images/spatium/web/pipe-03-geometry.webp',
    alt: 'Model mesh wireframe rumah hasil olahan point cloud',
    /** Indonesian rendering of `body` (ProcessTimeline). */
    summaryId:
      'Dari point cloud dibuat 3D geometry (mesh) — model terstruktur yang bisa diedit, dengan topologi dan tekstur rapi, siap untuk produksi 3D, visualisasi, dan simulasi.',
    outputs: ['Mesh bertekstur', 'Aset untuk produksi 3D'],
  },
  {
    index: '04',
    title: '3D Gaussian Splat',
    caption: 'Photorealistic and immersive',
    body: 'The same data can be converted into 3D Gaussian Splat — a lightweight, photorealistic, and immersive representation ideal for real-time experiences, virtual tours, and interactive applications.',
    image: '/images/spatium/web/pipe-04-splat.webp',
    alt: 'Rumah yang sama tampil fotorealistis sebagai 3D Gaussian Splat',
    /** Indonesian rendering of `body` (ProcessTimeline). */
    summaryId:
      'Data yang sama dikonversi menjadi 3D Gaussian Splat — representasi ringan, fotorealistis, dan imersif untuk pengalaman real-time, tur virtual, dan aplikasi interaktif.',
    outputs: ['Scene 3D Gaussian Splat', 'Viewer interaktif di browser'],
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

/** "The way we see space" — PDF slide 7. */
export const WAYS_OF_SEEING = [
  {
    title: 'Photograph',
    body: 'only captures image',
    src: '/images/spatium/web/way-photograph.webp',
    alt: 'Kamera foto dan cetakan foto sebuah rumah modern',
    featured: false,
  },
  {
    title: 'Videograph',
    body: 'only captures moment',
    src: '/images/spatium/web/way-videograph.webp',
    alt: 'Kamera video dan rangkaian frame video rumah yang sama',
    featured: false,
  },
  {
    title: 'Digital Twin',
    body: 'captures the whole space, objects around, and their context',
    src: '/images/spatium/web/way-digitaltwin.webp',
    alt: 'Laser scanner merekam rumah yang sama menjadi digital twin',
    featured: true,
  },
] as const

/** "Distance to our …" — PDF slide 8. */
export const DISTANCE_PLACES = ['holiday place', 'memorable place', 'remarkable place', 'working place', 'film set'] as const

/** Use-case walkthroughs — PDF slides 12–23 (stills cropped from the deck). */
export type UseCaseStory = {
  id: string
  name: string
  subtitle: string
  body: string
  /** Slug of the matching use case (`service_categories.slug`). */
  useCaseSlug: string
  /** `label` is omitted when the still already carries the deck's own caption. */
  shots: readonly { src: string; alt: string; label?: string }[]
}

export const USE_CASE_STORIES: readonly UseCaseStory[] = [
  {
    id: 'filmmaking',
    name: 'Filmmaking',
    subtitle: 'Suitable for Previz, Techviz, and VFX',
    body: 'Lokasi direkam sebagai raw point cloud, direkonstruksi menjadi 3DGS, lalu dikembangkan menjadi 3D concept, pre-visualization, dan tech-visualization — posisi kamera, lampu, dan kru direncanakan di atas lokasi yang sebenarnya.',
    useCaseSlug: 'filmmaking-vfx',
    shots: [
      { src: '/images/spatium/web/film-pointcloud.webp', alt: 'Raw point cloud sebuah gang permukiman' },
      { src: '/images/spatium/web/film-3dgs.webp', alt: 'Gang yang sama sebagai scene 3D Gaussian Splat' },
      { src: '/images/spatium/web/film-previz.webp', alt: 'Pre-visualization gang yang sama sebagai set reruntuhan' },
      { src: '/images/spatium/web/film-techviz.webp', alt: 'Tech-visualization dengan posisi kamera dan lampu di lokasi' },
    ],
  },
  {
    id: 'marketing',
    name: 'Marketing & Branding',
    subtitle: 'Suitable for First Impression (Zero Moment of Truth / ZMOT)',
    body: 'Calon pelanggan menjelajahi tempat Anda sebelum datang: 3D map, eksterior, interior, hingga display produk 3D — semuanya dalam satu showcase interaktif.',
    useCaseSlug: 'marketing-branding',
    shots: [
      { src: '/images/spatium/web/mkt-map.webp', alt: '3D map restoran Batuna dengan hotspot', label: '3D map' },
      { src: '/images/spatium/web/mkt-exterior.webp', alt: 'Eksterior restoran Batuna dalam spatial tour', label: 'Exterior' },
      { src: '/images/spatium/web/mkt-interior.webp', alt: 'Interior ruang makan Batuna dalam spatial tour', label: 'Interior' },
      { src: '/images/spatium/web/mkt-food.webp', alt: 'Display makanan 3D di dalam showcase interaktif', label: '3D food display' },
    ],
  },
  {
    id: 'memory',
    name: 'Wedding Memory',
    subtitle: 'Suitable for Immersive Memory Preservation',
    body: 'Venue, altar, dan detail dekorasi diabadikan sebagai ruang yang bisa dikunjungi kembali — lengkap dengan 3D map, galeri foto, dan galeri objek 3D.',
    useCaseSlug: 'memory-documentary',
    shots: [
      { src: '/images/spatium/web/wed-altar.webp', alt: 'Altar pernikahan dalam pengalaman spasial', label: 'Venue' },
      { src: '/images/spatium/web/wed-aisle.webp', alt: 'Lorong pernikahan berhias bunga dalam scene 3D', label: 'Aisle' },
      { src: '/images/spatium/web/wed-hall.webp', alt: 'Aula resepsi pernikahan dalam scene 3D', label: 'Hall' },
      { src: '/images/spatium/web/wed-dollhouse.webp', alt: 'Denah 3D venue pernikahan', label: '3D map' },
    ],
  },
]

/** Brand values — PDF slides 3–6 (walkable image, ZMOT, slide-4 benefits). */
export const BRAND_VALUES = [
  {
    title: 'Walkable Image',
    body: 'Bukan sekadar foto atau video. Jelajahi dan rasakan ruang seolah benar-benar berada di sana.',
    icon: 'eye',
  },
  {
    title: 'Real-World Accuracy',
    body: 'Skala dan detail ruang yang sebenarnya menjadi fondasi setiap output.',
    icon: 'target',
  },
  {
    title: 'Zero Moment of Truth (ZMOT)',
    body: 'First impression yang bisa dijelajahi: calon pelanggan merasakan ruang Anda sebelum datang.',
    icon: 'sparkle',
  },
  {
    title: 'One Point, Unlimited Possibilities',
    body: 'Capture once, use everywhere — satu data spasial untuk output 3D, 2D, interaktif, dan imersif.',
    icon: 'layers',
  },
  {
    title: 'Creative Freedom',
    body: 'Memberi seniman 3D dan visual tempat nyata untuk berkarya.',
    icon: 'brush',
  },
] as const

/**
 * What a first conversation covers (contact page). Restates slides 4–7 only —
 * no turnaround, accuracy or device claims.
 */
export const CONTACT_STEPS = [
  {
    title: 'Memahami ruang & tujuan Anda',
    body: 'Kami mempelajari jenis lokasi dan untuk apa digital twin akan dipakai — film, marketing, hiburan, atau memori.',
    icon: 'eye',
  },
  {
    title: 'Menentukan output yang tepat',
    body: 'Satu capture bisa menghasilkan point cloud, mesh, tekstur, panorama, atau 3D Gaussian Splat. Kami pilih yang sesuai kebutuhan.',
    icon: 'route',
  },
  {
    title: 'Lingkup & alur kerja transparan',
    body: 'Tahapan capture, pemrosesan, dan serah terima dijelaskan sejak awal — tanpa kotak hitam.',
    icon: 'shield',
  },
] as const

/** Contact-page FAQ — answers restate slides 4, 7 and the SuperSplat delivery in the portfolio HTML. */
export const CONTACT_FAQS = [
  {
    q: 'Apa bedanya digital twin dengan foto atau video?',
    a: 'Foto hanya menangkap gambar dan video hanya menangkap momen. Digital twin menangkap seluruh ruang, objek di sekitarnya, dan konteksnya — sehingga bisa dijelajahi dari sudut mana pun dan dikunjungi kembali kapan saja.',
  },
  {
    q: 'Apakah pengunjung harus mengunduh aplikasi untuk melihat scene 3D?',
    a: 'Tidak. Scene 3D Gaussian Splat kami dibuka langsung di peramban melalui viewer web. Waktu muat bergantung pada koneksi, perangkat, dan ukuran scene.',
  },
  {
    q: 'Bagaimana cara memasang scene ke website kami?',
    a: 'Scene dapat disematkan sebagai iframe di halaman Anda atau dibagikan sebagai tautan.',
  },
  {
    q: 'Apakah satu kali capture bisa dipakai untuk banyak kebutuhan?',
    a: 'Ya — capture once, use everywhere. Data yang sama dapat diolah menjadi output 3D, 2D, interaktif, maupun imersif.',
  },
] as const
