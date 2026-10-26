import Link from 'next/link'

export function BrandLink({ href, label, className = '' }: { href: string; label: string; className?: string }) {
  return <Link className={`brand ${className}`.trim()} href={href} aria-label={label}>
    <span className="brand-mark" aria-hidden="true"><i>M</i></span>
    <strong>MASTERME</strong>
  </Link>
}
