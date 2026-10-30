'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { api, type FocusedDrillPreview, type KnowledgeNode, type LearningEvidence } from '../../lib/api';
import { MAX_QUESTION_VARIANT, MAX_STUDY_ANSWER_LENGTH, MIN_EXPLANATION_LENGTH } from '../../lib/validation/input-limits';
import { useI18n } from '../../lib/localization/i18n';
import { ActionButton } from '../ui/action-button';
import styles from './study-depth.module.css';
import { useBilling } from '../providers/billing-provider';

const copy = {
  'en-US': {
    note: 'This answer is evaluated and saved separately from your explanation.',
    reason: 'Reason', apply: 'Apply', recall: 'Recall', answer: 'Your answer',
    submit: 'Evaluate answer', waiting: 'Evaluating…',
    error: 'Could not evaluate this answer. Try again.',
    feedback: 'Feedback', next: 'Try another answer', status: 'Result',
    independent: 'Answer independently first. Help is recorded and does not expand the review interval.',
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
    assisted: 'Esta tentativa usou ajuda. Ela não fecha a lacuna sozinha.',
    review: 'Revisão programada', reviewNote: 'Tente recordar sem consultar a fonte. Uma recordação assistida volta ao intervalo de um dia.',
    strength: 'O que funcionou', gap: 'O que falta', nextAction: 'Próximo passo', quote: 'Suas palavras',
    previous: 'Nova tentativa após uma resposta anterior.',
  },
} as const;

type DepthActivity = 'REASONING' | 'APPLICATION' | 'RETENTION';

export function StudyDepth({ node, activity, reviewId, drill, questionVariant: initialQuestionVariant, questionTools, activityPicker, conceptHelpOpened = false, sourceOpened = false }: { node: KnowledgeNode; activity: DepthActivity; reviewId?: string; drill?: FocusedDrillPreview; questionVariant?: number; questionTools?: ReactNode; activityPicker?: ReactNode; conceptHelpOpened?: boolean; sourceOpened?: boolean }) {
  const { locale } = useI18n();
  const { refresh: refreshBilling } = useBilling();
  const t = copy[locale];
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<LearningEvidence | null>(null);
  const [previousEvidenceId, setPreviousEvidenceId] = useState<string | undefined>(drill?.previousEvidenceId ?? undefined);
  const [questionVariant, setQuestionVariant] = useState(drill?.questionVariant ?? initialQuestionVariant ?? (reviewId ? 1 : 0));
  const [prompts, setPrompts] = useState<{ reasoning: string; application: string; retention: string } | null>(null);
  const requestId = useRef('');
  const feedbackRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (drill && questionVariant === drill.questionVariant) return;
    let active = true;
    setPrompts(null); setError('');
    void api.activityPrompts(node.concept.id, questionVariant).then((value) => { if (active) { setPrompts(value); void refreshBilling(); } }).catch(() => { if (active) setError(t.error); });
    return () => { active = false; };
  }, [node.concept.id, questionVariant, drill, t.error, refreshBilling]);
  const prompt = drill && questionVariant === drill.questionVariant ? drill.prompt : prompts ? activity === 'REASONING' ? prompts.reasoning : activity === 'APPLICATION' ? prompts.application : prompts.retention : '';
  const resetAttempt = () => {
    setResult(null);
    setAnswer('');
    requestId.current = crypto.randomUUID();
  };
  const submit = async () => {
    if (busy || answer.trim().length < MIN_EXPLANATION_LENGTH || !prompt) return;
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
        assisted: conceptHelpOpened || sourceOpened,
        assistanceLevel: sourceOpened ? 3 : conceptHelpOpened ? 2 : 0,
        hintsUsed: [...(conceptHelpOpened ? ['concept-summary'] : []), ...(sourceOpened ? ['source-excerpt'] : [])],
        solutionRevealed: false,
        previousEvidenceId,
      });
      setResult(outcome.event);
      void refreshBilling();
      requestAnimationFrame(() => { feedbackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); feedbackRef.current?.focus(); });
    } catch (cause) { setError(cause instanceof Error ? cause.message : t.error); }
    finally { setBusy(false); }
  };
  const title = activity === 'REASONING' ? t.reason : activity === 'APPLICATION' ? t.apply : t.recall;
  return <>
    <section className="prompt-card" aria-label={locale === 'pt-BR' ? 'Pergunta de estudo' : 'Study question'}>
      {activityPicker}
      <div className="eyebrow">{locale === 'pt-BR' ? 'Pergunta de estudo' : 'Study question'} · {title}</div>
      {reviewId && <p className={styles.review}><strong>{t.review}</strong>{t.reviewNote}</p>}
      <h2>{prompt || '…'}</h2>
      {questionTools}
    </section>
    <section className={`answer-card ${styles.depth}`} aria-labelledby="study-depth-title">
    <header><h2 id="study-depth-title">{t.answer}</h2><p>{t.note}</p></header>
    <p className={styles.independent}>{previousEvidenceId ? t.previous : t.independent}</p>
    <label className={styles.answer}><span className="sr-only">{t.answer}</span><textarea rows={8} disabled={busy || result !== null} minLength={MIN_EXPLANATION_LENGTH} maxLength={MAX_STUDY_ANSWER_LENGTH} value={answer} onInput={(event) => setAnswer(event.currentTarget.value)} /></label>
    <ActionButton variant="primary" disabled={busy || !prompt || answer.trim().length < MIN_EXPLANATION_LENGTH || result !== null} onClick={() => void submit()}>{busy ? t.waiting : t.submit}</ActionButton>
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
      <ActionButton variant="secondary" onClick={() => { setPreviousEvidenceId(result.id); setQuestionVariant((current) => reviewId ? current === 1 ? MAX_QUESTION_VARIANT : 1 : (current + 1) % (MAX_QUESTION_VARIANT + 1)); resetAttempt(); }}>{t.next}</ActionButton>
    </div>}
  </section></>;
}
