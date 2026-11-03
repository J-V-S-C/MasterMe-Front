"use client";

import type { KnowledgeNode } from '../../lib/api';
import { useI18n } from '../../lib/localization/i18n';
import styles from './concept-browser.module.css';

export function ConceptBrowser({ nodes, selectedId, hiddenIds = [], onSelect, onHide }: {
  nodes: KnowledgeNode[];
  selectedId: string;
  hiddenIds?: string[];
  onSelect: (id: string) => void;
  onHide?: (id: string, hidden: boolean) => void;
}) {
  const { locale } = useI18n();
  const visible = nodes.filter((node) => !hiddenIds.includes(node.concept.id));
  const hidden = nodes.filter((node) => hiddenIds.includes(node.concept.id));
  return <div className={styles.browser}>
    <div className={styles.heading}>
      <strong>{locale === 'pt-BR' ? 'Escolha um conceito para estudar' : 'Choose a concept to study'}</strong>
      <span>{visible.length}</span>
    </div>
    {onHide && <p className={styles.hint}>{locale === 'pt-BR' ? 'Ocultar tira o conceito das escolhas e sugestões. Respostas salvas continuam no histórico.' : 'Hiding removes a concept from choices and suggestions. Saved answers remain in history.'}</p>}
    <div className={styles.list} role="group" aria-label={locale === 'pt-BR' ? 'Conceitos do material' : 'Material concepts'}>
      {visible.map((node) => <div key={node.concept.id} className={styles.row}><button
        type="button"
        className={styles.item}
        aria-current={node.concept.id === selectedId ? 'true' : undefined}
        onClick={() => onSelect(node.concept.id)}
      ><span>{node.concept.name}</span>{node.concept.id === selectedId && <small>{locale === 'pt-BR' ? 'Em estudo' : 'Studying'}</small>}</button>{onHide && <button type="button" className={styles.hide} aria-label={`${locale === 'pt-BR' ? 'Ocultar' : 'Hide'} ${node.concept.name}`} onClick={() => onHide(node.concept.id, true)}>{locale === 'pt-BR' ? 'Ocultar' : 'Hide'}</button>}</div>)}
    </div>
    {hidden.length > 0 && <details className={styles.hidden}><summary>{locale === 'pt-BR' ? `Ocultos (${hidden.length})` : `Hidden (${hidden.length})`}</summary><div>{hidden.map((node) => <div key={node.concept.id}><span>{node.concept.name}</span><button type="button" onClick={() => onHide?.(node.concept.id, false)}>{locale === 'pt-BR' ? 'Restaurar' : 'Restore'}</button></div>)}</div></details>}
  </div>;
}
