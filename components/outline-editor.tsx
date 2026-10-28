'use client';

import { useEffect, useState } from 'react';
import { api, type EditorialUnit, type OutlineState } from '../lib/api';
import { useI18n } from '../lib/i18n';
import { ActionButton } from './action-button';
import styles from './outline-editor.module.css';

type OutlineUnitInput = { id: string; title: string | null } | { title: string; startOffset: number; endOffset: number };

export function OutlineEditor({ materialId, content, outline, onSaved }: {
  materialId: string;
  content: string;
  outline: EditorialUnit[];
  onSaved: (units: EditorialUnit[]) => void;
}) {
  const { locale } = useI18n();
  const [state, setState] = useState<OutlineState | null>(null);
  const [draft, setDraft] = useState<EditorialUnit[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [splitId, setSplitId] = useState('');
  const [splitPhrase, setSplitPhrase] = useState('');
  const [splitTitle, setSplitTitle] = useState('');
  useEffect(() => {
    let active = true;
    setState(null);
    setDraft([]);
    void api.outlineState(materialId).then((value) => {
      if (!active) return;
      setState(value);
      setDraft(value.units);
    }).catch(() => {
      if (active) setError(locale === 'pt-BR' ? 'Não foi possível abrir o índice.' : 'Could not open the outline.');
    });
    return () => { active = false; };
  }, [materialId, locale]);
  if (!outline.length) return null;
  const move = (index: number, direction: number) => {
    const target = index + direction;
    if (target < 0 || target >= draft.length) return;
    const next = [...draft];
    [next[index], next[target]] = [next[target]!, next[index]!];
    setDraft(next);
  };
  const save = async () => {
    if (!state || saving) return;
    setSaving(true);
    setError('');
    try {
      const updated = await api.updateOutline(materialId, state.revision, draft.map((unit) => ({ id: unit.id, title: unit.title?.trim() || null })));
      setState(updated);
      setDraft(updated.units);
      onSaved(updated.units);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : locale === 'pt-BR' ? 'Não foi possível salvar o índice.' : 'Could not save the outline.');
    } finally { setSaving(false); }
  };
  const applyStructuralEdit = async (units: OutlineUnitInput[]) => {
    if (!state || saving) return;
    setSaving(true); setError('');
    try {
      const updated = await api.updateOutline(materialId, state.revision, units);
      setState(updated); setDraft(updated.units); onSaved(updated.units);
      setSplitId(''); setSplitPhrase(''); setSplitTitle('');
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : locale === 'pt-BR' ? 'Não foi possível alterar o índice.' : 'Could not change the outline.');
    } finally { setSaving(false); }
  };
  const remove = (id: string) => {
    if (draft.length < 2) return;
    void applyStructuralEdit(draft.filter((unit) => unit.id !== id).map((unit) => ({ id: unit.id, title: unit.title })));
  };
  const split = () => {
    const unit = draft.find((item) => item.id === splitId);
    const phrase = splitPhrase.trim();
    const title = splitTitle.trim();
    if (!unit || !phrase || !title) return;
    if (draft.some((item) => item.id !== unit.id && item.startOffset < unit.endOffset && item.endOffset > unit.startOffset)) {
      setError(locale === 'pt-BR' ? 'Divida uma seção sem subseções sobrepostas.' : 'Split a section without overlapping subsections.');
      return;
    }
    const first = content.indexOf(phrase, unit.startOffset);
    const repeated = first >= 0 ? content.indexOf(phrase, first + phrase.length) : -1;
    if (first <= unit.startOffset || first >= unit.endOffset || (repeated >= 0 && repeated < unit.endOffset)) {
      setError(locale === 'pt-BR' ? 'Escolha uma frase única que comece dentro da seção, depois do início.' : 'Choose a unique phrase inside the section, after its beginning.');
      return;
    }
    const index = draft.findIndex((item) => item.id === unit.id);
    const units = draft.flatMap<OutlineUnitInput>((item, position) => position === index ? [
      { title: item.title || (locale === 'pt-BR' ? 'Primeira parte' : 'First part'), startOffset: item.startOffset, endOffset: first },
      { title, startOffset: first, endOffset: item.endOffset },
    ] : [{ id: item.id, title: item.title }]);
    void applyStructuralEdit(units);
  };
  return <details className={styles.editor}>
    <summary>{locale === 'pt-BR' ? 'Corrigir índice do material' : 'Correct material outline'}</summary>
    <p>{locale === 'pt-BR' ? 'Corrija títulos e ordem. Os trechos e as respostas já salvas permanecem ligados à fonte original.' : 'Correct titles and order. Source passages and saved answers keep their original links.'}</p>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {state && <ol className={styles.units}>{draft.map((unit, index) => <li key={unit.id}>
      <label>{locale === 'pt-BR' ? `Seção ${index + 1}` : `Section ${index + 1}`}
        <input value={unit.title ?? ''} maxLength={160} onInput={(event) => {
          const title = event.currentTarget.value;
          setDraft((current) => current.map((item) => item.id === unit.id ? { ...item, title } : item));
        }} />
      </label>
      <small>{unit.originalTitle ?? (locale === 'pt-BR' ? 'Título não detectado' : 'No detected title')}{unit.pageNumber ? ` · ${locale === 'pt-BR' ? 'página' : 'page'} ${unit.pageNumber}` : ''}</small>
      <div className={styles.move}>
        <button type="button" disabled={index === 0} onClick={() => move(index, -1)} aria-label={locale === 'pt-BR' ? `Mover seção ${index + 1} para cima` : `Move section ${index + 1} up`}>↑</button>
        <button type="button" disabled={index === draft.length - 1} onClick={() => move(index, 1)} aria-label={locale === 'pt-BR' ? `Mover seção ${index + 1} para baixo` : `Move section ${index + 1} down`}>↓</button>
      </div>
      <div className={styles.structureActions}><button type="button" disabled={saving} onClick={() => { setSplitId(unit.id); setSplitPhrase(''); setSplitTitle(''); }}>{locale === 'pt-BR' ? 'Dividir seção' : 'Split section'}</button><button type="button" disabled={saving || draft.length < 2} onClick={() => remove(unit.id)}>{locale === 'pt-BR' ? 'Remover seção' : 'Remove section'}</button></div>
    </li>)}</ol>}
    {splitId && <div className={styles.splitEditor}><p>{locale === 'pt-BR' ? 'A divisão cria duas seções a partir do texto original. Se esta seção já tiver progresso ou tarefas, ela não poderá ser substituída.' : 'Splitting creates two sections from the original text. A section with progress or linked tasks cannot be replaced.'}</p><label>{locale === 'pt-BR' ? 'Frase no início da nova seção' : 'Phrase at the start of the new section'}<input value={splitPhrase} onChange={(event) => setSplitPhrase(event.target.value)} /></label><label>{locale === 'pt-BR' ? 'Título da nova seção' : 'New section title'}<input maxLength={160} value={splitTitle} onChange={(event) => setSplitTitle(event.target.value)} /></label><div><ActionButton variant="secondary" disabled={saving || !splitPhrase.trim() || !splitTitle.trim()} onClick={split}>{locale === 'pt-BR' ? 'Dividir' : 'Split'}</ActionButton><ActionButton variant="secondary" onClick={() => setSplitId('')}>{locale === 'pt-BR' ? 'Cancelar' : 'Cancel'}</ActionButton></div></div>}
    <ActionButton variant="primary" onClick={() => void save()} disabled={!state || saving}>{saving ? locale === 'pt-BR' ? 'Salvando…' : 'Saving…' : locale === 'pt-BR' ? 'Salvar índice' : 'Save outline'}</ActionButton>
  </details>;
}
