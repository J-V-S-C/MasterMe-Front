'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { api, type EditorialUnit, type Material } from '../lib/api';
import { useI18n } from '../lib/i18n';
import styles from './material-reader.module.css';

type Labels = { outline: string; fullText: string; page: string; progress: string; source: string; failed: string; occurrence: string };
const labels: Record<'pt-BR' | 'en-US', Labels> = {
  'pt-BR': { outline: 'Índice', fullText: 'Texto completo', page: 'Página', progress: 'Posição de leitura salva', source: 'Trecho-fonte', failed: 'Não foi possível salvar sua posição de leitura.', occurrence: 'Ocorrência do trecho' },
  'en-US': { outline: 'Contents', fullText: 'Full text', page: 'Page', progress: 'Reading position saved', source: 'Source excerpt', failed: 'Could not save your reading position.', occurrence: 'Excerpt occurrence' },
};

export function MaterialReader({ material, requestedUnitId, sourceExcerpt, requestedSourceOffset }: {
  material: Material | null;
  requestedUnitId: string | null;
  sourceExcerpt?: string;
  requestedSourceOffset?: number;
}) {
  const { locale } = useI18n();
  const t = labels[locale];
  const [units, setUnits] = useState<EditorialUnit[]>([]);
  const [activeUnitId, setActiveUnitId] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [readingOffset, setReadingOffset] = useState(0);
  const [occurrenceIndex, setOccurrenceIndex] = useState(0);
  const contentRef = useRef<HTMLParagraphElement>(null);
  const markRef = useRef<HTMLElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current); }, []);

  useEffect(() => {
    if (!material) return;
    let current = true;
    setUnits([]);
    setActiveUnitId('');
    void Promise.all([api.outline(material.id), api.readingPosition(material.id)])
      .then(([outline, position]) => {
        if (!current) return;
        setUnits(outline);
        setReadingOffset(position.offset);
        const requested = outline.find((unit) => unit.id === requestedUnitId);
        const last = [...outline].reverse().find((unit) => unit.startOffset <= position.offset);
        setActiveUnitId((requested ?? last ?? outline[0])?.id ?? '');
      })
      .catch(() => { if (current) setError(t.failed); });
    return () => { current = false; };
  }, [material, requestedUnitId, t.failed]);

  const occurrences = useMemo(() => {
    if (!sourceExcerpt || !material) return [];
    const offsets: number[] = [];
    let at = 0;
    while ((at = material.content.indexOf(sourceExcerpt, at)) >= 0) {
      offsets.push(at);
      at += sourceExcerpt.length;
    }
    return offsets;
  }, [sourceExcerpt, material]);
  const sourceOffset = occurrences[occurrenceIndex] ?? -1;
  const missingUnit = Boolean(material && units.length && requestedUnitId && !units.some(({ id }) => id === requestedUnitId));
  const missingSource = Boolean(material && sourceExcerpt && (!occurrences.length || (requestedSourceOffset !== undefined && !occurrences.includes(requestedSourceOffset))));
  useEffect(() => {
    if (!occurrences.length) return;
    if (requestedSourceOffset !== undefined && occurrences.includes(requestedSourceOffset)) {
      setOccurrenceIndex(occurrences.indexOf(requestedSourceOffset));
      return;
    }
    const closest = occurrences.reduce((best, offset, index) =>
      Math.abs(offset - readingOffset) < Math.abs(occurrences[best]! - readingOffset) ? index : best, 0);
    setOccurrenceIndex(closest);
  }, [occurrences, readingOffset, requestedSourceOffset]);
  useEffect(() => {
    if (requestedUnitId || sourceOffset < 0) return;
    const matching = units.find((unit) => sourceOffset >= unit.startOffset && sourceOffset < unit.endOffset);
    if (matching) setActiveUnitId(matching.id);
  }, [requestedUnitId, sourceOffset, units]);

  const active = units.find((unit) => unit.id === activeUnitId) ?? units[0];
  const text = useMemo(() => material && active
    ? material.content.slice(active.startOffset, active.endOffset)
    : material?.content ?? '', [material, active]);
  const highlight = active && sourceOffset >= active.startOffset && sourceOffset < active.endOffset
    ? sourceOffset - active.startOffset : -1;
  useEffect(() => {
    const content = contentRef.current;
    if (!content || !active) return;
    if (highlight >= 0) {
      markRef.current?.scrollIntoView?.({ block: 'center' });
      return;
    }
    const max = content.scrollHeight - content.clientHeight;
    if (max > 0) content.scrollTop = Math.max(0, Math.min(max,
      (readingOffset - active.startOffset) / Math.max(1, active.endOffset - active.startOffset) * max));
  }, [active, highlight, readingOffset]);

  const saveScrollPosition = () => {
    const content = contentRef.current;
    if (!content || !material || !active) return;
    const max = content.scrollHeight - content.clientHeight;
    if (max <= 0) return;
    const offset = active.startOffset + Math.round(content.scrollTop / max * (active.endOffset - active.startOffset));
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void api.setReadingPosition(material.id, offset).then(() => { setReadingOffset(offset); setSaved(true); }).catch(() => setError(t.failed));
    }, 500);
  };

  const select = async (unit: EditorialUnit) => {
    if (!material) return;
    setActiveUnitId(unit.id);
    setReadingOffset(unit.startOffset);
    setSaved(false);
    setError('');
    try {
      await api.setReadingPosition(material.id, unit.startOffset);
      setSaved(true);
    } catch { setError(t.failed); }
  };

  return <div className={styles.reader}>
    {units.length > 1 && <nav aria-label={t.outline} className={styles.outline}>
      <strong>{t.outline}</strong>
      <ol>{units.map((unit) => <li key={unit.id}>
        <button type="button" aria-current={unit.id === active?.id ? 'location' : undefined}
          onClick={() => void select(unit)} style={{ paddingInlineStart: `${Math.max(0, unit.level - 1) * 12 + 8}px` }}>
          {unit.title ?? t.fullText}{unit.pageNumber ? ` · ${t.page} ${unit.pageNumber}` : ''}
        </button>
      </li>)}</ol>
    </nav>}
    <article className="reading-card">
      <h1>{material?.title}</h1>
      {(missingUnit || missingSource) && <p role="alert">{locale === 'pt-BR' ? 'A referência solicitada não foi encontrada neste material. O texto disponível aparece abaixo.' : 'The requested reference was not found in this material. The available text appears below.'}</p>}
      {active?.title && <h2>{active.title}</h2>}
      {occurrences.length > 1 && <label className={styles.occurrence}>{t.occurrence}
        <select value={occurrenceIndex} onChange={(event) => setOccurrenceIndex(Number(event.target.value))}>
          {occurrences.map((offset, index) => <option key={offset} value={index}>{index + 1} / {occurrences.length}</option>)}
        </select>
      </label>}
      <p ref={contentRef} className="source-content" onScroll={saveScrollPosition}>{highlight >= 0 && sourceExcerpt
        ? <>{text.slice(0, highlight)}<mark ref={markRef} title={t.source}>{sourceExcerpt}</mark>{text.slice(highlight + sourceExcerpt.length)}</>
        : text}</p>
      {saved && <small role="status">{t.progress}</small>}
      {error && <small role="alert">{error}</small>}
    </article>
  </div>;
}
