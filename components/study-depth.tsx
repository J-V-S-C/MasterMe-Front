'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { api, type FocusedDrillPreview, type KnowledgeNode, type LearningEvidence } from '../lib/api';
import { useI18n } from '../lib/i18n';
import { ActionButton } from './action-button';
import styles from './study-depth.module.css';
import { useBilling } from './billing-provider';

const copy = {
  'en-US': {
    note: 'This answer is evaluated and saved separately from your explanation.',
    reason: 'Reason', apply: 'Apply', recall: 'Recall', answer: 'Your answer',
    submit: 'Evaluate answer', waiting: 'Evaluating…',
    error: 'Could not evaluate this answer. Try again.',
    feedback: 'Feedback', next: 'Try another answer', status: 'Result',
    independent: 'Answer independently first. Help is recorded and does not expand the review interval.',
    hints: 'Need a hint?', cue: 'Cue', source: 'Source', outline: 'Outline', reveal: 'Reveal',
    cueText: 'Name the mechanism first: what causes what, and which condition is essential?',
    sourceLabel: 'Source excerpt', outlineLabel: 'Concept outline', revealLabel: 'Reference explanation',
    assisted: 'This attempt used help. It will not close the gap by itself.',
    review: 'Scheduled review', reviewNote: 'Try to recall without the source. Assisted recall returns to a one-day interval.',
    strength: 'What worked', gap: 'What is missing', nextAction: 'Next step', quote: 'Your words',
    previous: 'Retrying after a previous attempt.',
  },
  'pt-BR': {
    note: 'Esta resposta é avaliada e guardada separadamente da sua explicação.',
    reason: 'Raciocinar', apply: 'Aplicar', recall: 'Retomar', answer: 'Sua resposta',
    submit: 'Avaliar resposta', waiting: 'Avaliando…',
    error: 'Não foi possível avaliar a resposta. Tente novamente.',
    feedback: 'Feedback', next: 'Tentar outra resposta', status: 'Resultado',
    independent: 'Responda de forma independente primeiro. A ajuda é registrada e não amplia o intervalo de revisão.',
    hints: 'Precisa de uma pista?', cue: 'Pista', source: 'Fonte', outline: 'Estrutura', reveal: 'Revelar',
    cueText: 'Nomeie o mecanismo primeiro: o que causa o quê e qual condição é essencial?',
    sourceLabel: 'Trecho da fonte', outlineLabel: 'Estrutura do conceito', revealLabel: 'Explicação de referência',
    assisted: 'Esta tentativa usou ajuda. Ela não fecha a lacuna sozinha.',
    review: 'Revisão programada', reviewNote: 'Tente recordar sem consultar a fonte. Uma recordação assistida volta ao intervalo de um dia.',
    strength: 'O que funcionou', gap: 'O que falta', nextAction: 'Próximo passo', quote: 'Suas palavras',
    previous: 'Nova tentativa após uma resposta anterior.',
  },
} as const;

type DepthActivity = 'REASONING' | 'APPLICATION' | 'RETENTION';
type HintLevel = 0 | 1 | 2 | 3 | 4;

export function StudyDepth({ node, activity, reviewId, drill }: { node: KnowledgeNode; activity: DepthActivity; reviewId?: string; drill?: FocusedDrillPreview }) {
  const { locale } = useI18n();
  const { refresh: refreshBilling } = useBilling();
  const t = copy[locale];
  const [answer, setAnswer] = useState('');
  const [hintLevel, setHintLevel] = useState<HintLevel>(0);
  const [hintsUsed, setHintsUsed] = useState<string[]>([]);
  const [solutionRevealed, setSolutionRevealed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<LearningEvidence | null>(null);
  const [previousEvidenceId, setPreviousEvidenceId] = useState<string | undefined>(drill?.previousEvidenceId ?? undefined);
  const [questionVariant, setQuestionVariant] = useState(drill?.questionVariant ?? (reviewId ? 1 : 0));
  const [prompts, setPrompts] = useState<{ reasoning: string; application: string; retention: string } | null>(null);
  const requestId = useRef('');
  const feedbackRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (drill && questionVariant === drill.questionVariant) return;
    let active = true;
    setPrompts(null); setError('');
    void api.activityPrompts(node.concept.id, questionVariant).then((value) => { if (active) setPrompts(value); }).catch(() => { if (active) setError(t.error); });
    return () => { active = false; };
  }, [node.concept.id, questionVariant, drill, t.error]);
  const prompt = drill && questionVariant === drill.questionVariant ? drill.prompt : prompts ? activity === 'REASONING' ? prompts.reasoning : activity === 'APPLICATION' ? prompts.application : prompts.retention : '';
  const resetAttempt = () => {
    setResult(null);
    setAnswer('');
    setHintLevel(0);
    setHintsUsed([]);
    setSolutionRevealed(false);
    requestId.current = crypto.randomUUID();
  };
  const useHint = (level: Exclude<HintLevel, 0>, label: string) => {
    setHintLevel((current) => level > current ? level : current);
    setHintsUsed((current) => current.includes(label) ? current : [...current, label]);
    if (level === 4) setSolutionRevealed(true);
    if (!requestId.current) requestId.current = crypto.randomUUID();
  };
  const submit = async () => {
    if (busy || answer.trim().length < 20 || !prompt) return;
    if (!requestId.current) requestId.current = crypto.randomUUID();
    setBusy(true); setError('');
    try {
      const outcome = await api.evaluateActivity({
        requestId: requestId.current,
        questionVariant,
        conceptId: node.concept.id,
        reviewId,
        attemptContext: drill ? 'DRILL' : 'STUDY',
        activityType: activity,
        answer: answer.trim(),
        assisted: hintLevel > 0 || solutionRevealed,
        assistanceLevel: hintLevel,
        hintsUsed,
        solutionRevealed,
        previousEvidenceId,
      });
      setResult(outcome.event);
      void refreshBilling();
      requestAnimationFrame(() => { feedbackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); feedbackRef.current?.focus(); });
    } catch (cause) { setError(cause instanceof Error ? cause.message : t.error); }
    finally { setBusy(false); }
  };
  const title = activity === 'REASONING' ? t.reason : activity === 'APPLICATION' ? t.apply : t.recall;
  return <section className={styles.depth} aria-labelledby="study-depth-title">
    <header><h2 id="study-depth-title">{title}</h2><p>{t.note}</p></header>
    {reviewId && <p className={styles.review}><strong>{t.review}</strong>{t.reviewNote}</p>}
    <p className={styles.prompt}>{prompt || '…'}</p>
    <p className={styles.independent}>{previousEvidenceId ? t.previous : t.independent}</p>
    <label className={styles.answer}>{t.answer}<textarea rows={6} disabled={busy || result !== null} minLength={20} maxLength={20000} value={answer} onInput={(event) => setAnswer(event.currentTarget.value)} /></label>
    <div className={styles.hintLadder}>
      <span>{t.hints}</span>
      <div role="group" aria-label={t.hints}>
        <ActionButton variant={hintLevel === 1 ? 'primary' : 'secondary'} aria-pressed={hintLevel >= 1} disabled={busy || result !== null} onClick={() => useHint(1, 'cue')}>{t.cue}</ActionButton>
        <ActionButton variant={hintLevel === 2 ? 'primary' : 'secondary'} aria-pressed={hintLevel >= 2} disabled={busy || result !== null || !node.concept.sourceExcerpt} onClick={() => useHint(2, 'source')}>{t.source}</ActionButton>
        <ActionButton variant={hintLevel === 3 ? 'primary' : 'secondary'} aria-pressed={hintLevel >= 3} disabled={busy || result !== null} onClick={() => useHint(3, 'outline')}>{t.outline}</ActionButton>
        <ActionButton variant={hintLevel === 4 ? 'primary' : 'secondary'} aria-pressed={hintLevel >= 4} disabled={busy || result !== null} onClick={() => useHint(4, 'reveal')}>{t.reveal}</ActionButton>
      </div>
      {hintLevel >= 1 && hintLevel < 4 && <p className={styles.hintText}>{t.cueText}</p>}
      {hintLevel >= 2 && <div className={styles.hintPanel}><strong>{t.sourceLabel}</strong><p>{node.concept.sourceExcerpt}</p></div>}
      {hintLevel >= 3 && <div className={styles.hintPanel}><strong>{t.outlineLabel}</strong><ul>{node.concept.fundamentalPremises.map((premise) => <li key={premise}>{premise}</li>)}</ul></div>}
      {hintLevel >= 4 && <div className={styles.hintPanel}><strong>{t.revealLabel}</strong><p>{node.concept.description}</p>{node.concept.edgeCases.length > 0 && <ul>{node.concept.edgeCases.map((edgeCase) => <li key={edgeCase}>{edgeCase}</li>)}</ul>}</div>}
      {hintLevel > 0 && <p className={styles.assisted}>{t.assisted}</p>}
    </div>
    <ActionButton variant="primary" disabled={busy || !prompt || answer.trim().length < 20 || result !== null} onClick={() => void submit()}>{busy ? t.waiting : t.submit}</ActionButton>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {result && <div ref={feedbackRef} className={styles.feedback} tabIndex={-1}>
      <span>{t.feedback} · {t.status}: {result.status}</span>
      {result.strength && <p><strong>{t.strength}:</strong> {result.strength}</p>}
      {(result.gap || result.logical_break || result.missing_premises?.length) && <p><strong>{t.gap}:</strong> {result.gap ?? result.logical_break ?? result.missing_premises?.[0]}</p>}
      {result.next_action && <p><strong>{t.nextAction}:</strong> {result.next_action}</p>}
      {result.evidence_quote && <blockquote>{t.quote}: “{result.evidence_quote}”</blockquote>}
      {result.source_excerpt && <Link className="app-button secondary" href={`/study?material=${node.concept.materialId}&concept=${node.concept.id}&source=1`}>{locale === 'pt-BR' ? 'Ver trecho no material' : 'View passage in the source'}</Link>}
      {!result.strength && !result.gap && !result.next_action && <p>{result.diagnosis}</p>}
      {result.assisted && <p className={styles.assisted}>{t.assisted}</p>}
      {(result.status === 'INCOMPLETE' || result.status === 'LOGICAL_BREAK') && <Link className="app-button secondary" href={`/practice?material=${node.concept.materialId}&concept=${node.concept.id}`}>{locale === 'pt-BR' ? 'Praticar esta lacuna' : 'Practice this gap'}</Link>}
      <ActionButton variant="secondary" onClick={() => { setPreviousEvidenceId(result.id); setQuestionVariant((current) => reviewId ? current === 1 ? 2 : 1 : (current + 1) % 3); resetAttempt(); }}>{t.next}</ActionButton>
    </div>}
  </section>;
}
