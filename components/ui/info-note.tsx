import type { ReactNode } from 'react';
import { Icon } from './icons';

export function InfoNote({ children }: { children: ReactNode }) {
  return <p className="tip"><Icon name="idea" /><span>{children}</span></p>;
}
