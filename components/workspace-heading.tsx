import type { ReactNode } from 'react';

export function WorkspaceHeading({ eyebrow, title, description, aside, className = '' }: {
  eyebrow: ReactNode;
  title: ReactNode;
  description: ReactNode;
  aside?: ReactNode;
  className?: string;
}) {
  return <header className={`workspace-heading ${className}`.trim()}>
    <div className="workspace-heading-copy">
      <span className="workspace-heading-eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
    {aside && <div className="workspace-heading-aside">{aside}</div>}
  </header>;
}
