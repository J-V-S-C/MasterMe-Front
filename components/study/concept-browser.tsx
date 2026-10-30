"use client";

import type { KnowledgeNode } from '../../lib/api';
import { useI18n } from '../../lib/localization/i18n';
import styles from './concept-browser.module.css';

export function ConceptBrowser({ nodes, selectedId, onSelect }: {
  nodes: KnowledgeNode[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const { locale } = useI18n();
  return <div className={styles.browser}>
    <div className={styles.heading}>
      <strong>{locale === 'pt-BR' ? 'Escolha um conceito para estudar' : 'Choose a concept to study'}</strong>
      <span>{nodes.length}</span>
    </div>
    <div className={styles.list} role="group" aria-label={locale === 'pt-BR' ? 'Conceitos do material' : 'Material concepts'}>
      {nodes.map((node) => <button
        type="button"
        key={node.concept.id}
        className={styles.item}
        aria-current={node.concept.id === selectedId ? 'true' : undefined}
        onClick={() => onSelect(node.concept.id)}
      >
        <span>{node.concept.name}</span>
        {node.concept.id === selectedId && <small>{locale === 'pt-BR' ? 'Em estudo' : 'Studying'}</small>}
      </button>)}
    </div>
  </div>;
}
