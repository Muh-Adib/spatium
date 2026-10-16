import type { SVGProps } from 'react'

/**
 * Compact stroke-icon set. Each entry is one or more path definitions
 * separated by "|", rendered on a 24×24 grid.
 */
const PATHS: Record<string, string> = {
  'arrow-right': 'M5 12h14|M13 6l6 6-6 6',
  'arrow-up-right': 'M7 17 17 7|M8 7h9v9',
  'arrow-left': 'M19 12H5|M11 18l-6-6 6-6',
  'arrow-down': 'M12 5v14|M6 13l6 6 6-6',
  play: 'M8 5.5v13l11-6.5z',
  close: 'M6 6l12 12|M18 6 6 18',
  menu: 'M3 7h18|M3 12h18|M3 17h18',
  plus: 'M12 5v14|M5 12h14',
  minus: 'M5 12h14',
  check: 'M4 12.5 9.5 18 20 6.5',
  search: 'M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14z|M16.5 16.5 21 21',
  mail: 'M3 6.5h18v11H3z|M3.5 7.5 12 13.5l8.5-6',
  phone: 'M6 3.5h3l1.5 4-2 1.5a12 12 0 0 0 6.5 6.5l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4 5.7 2 2 0 0 1 6 3.5z',
  pin: 'M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z|M12 7.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5z',
  clock: 'M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18z|M12 7.5V12l3 2',
  calendar: 'M4 6.5h16v13H4z|M4 10.5h16|M8.5 3.5v4|M15.5 3.5v4',
  globe: 'M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18z|M3.2 12h17.6|M12 3c2.6 3 2.6 15 0 18M12 3c-2.6 3-2.6 15 0 18',
  sparkle: 'M12 3.5l1.9 5.1 5.1 1.9-5.1 1.9L12 17.5l-1.9-5.1L5 10.5l5.1-1.9z|M18.5 16.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z',
  layers: 'M12 3.5 3.5 8 12 12.5 20.5 8z|M3.5 12.5 12 17l8.5-4.5|M3.5 16.5 12 21l8.5-4.5',
  cube: 'M12 3 20 7.5v9L12 21 4 16.5v-9z|M4 7.5 12 12l8-4.5|M12 12v9',
  film: 'M3.5 5.5h17v13h-17z|M7.5 5.5v13|M16.5 5.5v13|M3.5 12h17',
  pen: 'M4 20l1-4.5L15.5 5 19 8.5 8.5 19z|M14 6.5 17.5 10',
  brain: 'M9.5 4.5a2.5 2.5 0 0 0-2.5 2.5c-1.4.4-2 1.5-2 2.8 0 .9.4 1.7 1 2.2-.3.5-.5 1-.5 1.6 0 1.6 1.3 2.9 3 2.9V19h5v-2.5c1.7 0 3-1.3 3-2.9 0-.6-.2-1.1-.5-1.6.6-.5 1-1.3 1-2.2 0-1.3-.6-2.4-2-2.8a2.5 2.5 0 0 0-2.5-2.5z|M12 4.5v14.5',
  grid: 'M4 4h7v7H4z|M13 4h7v7h-7z|M4 13h7v7H4z|M13 13h7v7h-7z',
  target: 'M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18z|M12 7.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9z|M12 11a1 1 0 1 1 0 2 1 1 0 0 1 0-2z',
  users: 'M9 11a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z|M2.5 20c0-3.6 2.9-5.5 6.5-5.5s6.5 1.9 6.5 5.5|M16 5.2a3.5 3.5 0 0 1 0 6.6|M17.5 14.8c2.4.5 4 2.2 4 5.2',
  shield: 'M12 3 5 5.8v5.4c0 4.3 3 8 7 9.8 4-1.8 7-5.5 7-9.8V5.8z|M9 12l2.2 2.2L15.5 10',
  wrench: 'M14.5 4a4.5 4.5 0 0 0-4 6.6L4 17v3h3l6.4-6.5A4.5 4.5 0 1 0 14.5 4z|M15.5 8.5h.01',
  building: 'M5 21V4h9v17|M14 10h5v11|M8 8h3|M8 12h3|M8 16h3|M17 14h1|M17 18h1',
  brush: 'M14 4.5 5.5 13a2.5 2.5 0 0 0 3.5 3.5L17.5 8z|M14 4.5 17.5 8|M5 20c1.5-1 2-2.5 2-2.5',
  gamepad: 'M7 8.5h10a4.5 4.5 0 0 1 4.4 3.6l.5 2.6A3 3 0 0 1 19 18l-1.6-1.5H6.6L5 18a3 3 0 0 1-2.9-3.3l.5-2.6A4.5 4.5 0 0 1 7 8.5z|M8 11v3|M6.5 12.5h3|M15.5 11.5h.01|M18 13.5h.01',
  device: 'M7 3.5h10v17H7z|M10.5 17.5h3',
  tag: 'M12.5 3.5H20v7.5l-9 9-7.5-7.5z|M16.5 7.5h.01',
  quote: 'M9.5 6.5C6.8 7.6 5 10 5 13v4.5h5V12H7.6c.2-1.6 1-2.9 2.6-3.7z|M19 6.5c-2.7 1.1-4.5 3.5-4.5 6.5v4.5h5V12h-2.4c.2-1.6 1-2.9 2.6-3.7z',
  external: 'M14 4h6v6|M20 4l-8.5 8.5|M18 14v5H5V6h5',
  download: 'M12 4v11|M7.5 10.5 12 15l4.5-4.5|M5 19h14',
  filter: 'M4 6.5h16|M7 12h10|M10 17.5h4',
  bolt: 'M13.5 3 6 13.5h4.5L10 21l7.5-10.5H13z',
  eye: 'M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12z|M12 9.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5z',
  route: 'M6.5 4a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5z|M17.5 15a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5z|M6.5 9v3.5a3 3 0 0 0 3 3H15',
  award: 'M12 3a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11z|M8.5 13.5 7 21l5-2.5L17 21l-1.5-7.5',
  puzzle: 'M10 4h4v2.2a1.8 1.8 0 1 0 3.6 0V4H20v4h-2.2a1.8 1.8 0 1 0 0 3.6H20V16h-2.4v3.5h-4V17a1.8 1.8 0 1 0-3.6 0v2.5h-4V16H4v-4.4h2.4a1.8 1.8 0 1 0 0-3.6H4V4h4z',
  type: 'M5 6.5V4.5h14v2|M12 4.5V20|M9 20h6',
  chart: 'M4 20V4|M4 20h16|M8 16v-4|M12.5 16V8|M17 16v-6.5',
  wave: 'M2.5 12c1.5-5 3-5 4.5 0s3 5 4.5 0 3-5 4.5 0 2.5 4 5.5 1.5',
  lock: 'M6.5 10.5h11v9h-11z|M8.8 10.5V8a3.2 3.2 0 0 1 6.4 0v2.5',
  refresh: 'M20 12a8 8 0 1 1-2.6-5.9|M20 4v4h-4',
}

export type IconName = keyof typeof PATHS | string

type IconProps = SVGProps<SVGSVGElement> & {
  name: IconName
  size?: number | string
  /** Render filled shapes instead of stroked outlines. */
  filled?: boolean
}

export function Icon({ name, size = 20, filled = false, ...rest }: IconProps) {
  const def = PATHS[name] ?? PATHS['arrow-right']
  const segments = def.split('|')

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? 'none' : 'currentColor'}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {segments.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  )
}

export default Icon
