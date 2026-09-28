import type { SVGProps } from 'react'

export type IconName = 'book' | 'brain' | 'bolt' | 'check' | 'chevron' | 'document' | 'idea' | 'lock' | 'logout' | 'eye' | 'eyeOff' | 'mic' | 'moon' | 'sparkles' | 'sun' | 'warning'

const paths: Record<IconName, string> = {
  book: 'M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16ZM4 19.5A2.5 2.5 0 0 1 6.5 17H20M8 7h8M8 11h8',
  brain: 'M12 5.2a3 3 0 0 0-5.4 1.8A3.4 3.4 0 0 0 7 13.7a3.2 3.2 0 0 0 5 3.3M12 5.2a3 3 0 0 1 5.4 1.8 3.4 3.4 0 0 1-.4 6.7 3.2 3.2 0 0 1-5 3.3M12 5.2v12M7.5 9.5H12m0 0h4.5',
  bolt: 'm13 2-9 12h7l-1 8 9-12h-7l1-8Z',
  check: 'm5 12 4.2 4.2L19 6.5',
  chevron: 'm9 18 6-6-6-6',
  document: 'M6 2.8h8l4 4V21H6V2.8Zm8 0V7h4M9 11h6M9 15h6',
  idea: 'M9 18h6m-5 3h4m-2-19a7 7 0 0 0-4.4 12.4c.8.7 1.4 1.5 1.6 2.6h5.6c.2-1.1.8-1.9 1.6-2.6A7 7 0 0 0 12 2Z',
  lock: 'M7 11V8a5 5 0 0 1 10 0v3m-11 0h12v10H6V11Zm6 4v2',
  logout: 'M10 5H5v14h5m4-10 4 3-4 3m4-3H9',
  eye: 'M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Zm9.5 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  eyeOff: 'm3 3 18 18M10.6 6.2A10.9 10.9 0 0 1 12 6c6 0 9.5 6 9.5 6a17.7 17.7 0 0 1-3.1 3.9M6.2 6.2C3.9 7.8 2.5 12 2.5 12s3.5 6 9.5 6c1.1 0 2.1-.2 3-.5M9.9 9.9a3 3 0 0 0 4.2 4.2',
  mic: 'M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6 3 3 0 0 0 3 3Zm-6-3a6 6 0 0 0 12 0M12 18v4',
  moon: 'M20.5 14.2A8 8 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2Z',
  sparkles: 'm12 3 .9 3.1L16 7l-3.1.9L12 11l-.9-3.1L8 7l3.1-.9L12 3Zm6 9 .6 2.1L21 15l-2.4.7L18 18l-.6-2.3L15 15l2.4-.9L18 12ZM5 14l.7 2.3L8 17l-2.3.7L5 20l-.7-2.3L2 17l2.3-.7L5 14Z',
  sun: 'M12 4V2m0 20v-2m8-8h2M2 12h2m13.7-5.7 1.4-1.4M4.9 19.1l1.4-1.4m11.4 0 1.4 1.4M4.9 4.9l1.4 1.4M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0Z',
  warning: 'M12 3 2.8 20h18.4L12 3Zm0 6v4m0 3h.01',
}

export function Icon({ name, ...props }: { name: IconName } & SVGProps<SVGSVGElement>) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}><path d={paths[name]} /></svg>
}
