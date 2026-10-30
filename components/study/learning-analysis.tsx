'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { api, type Concept, type DueReview, type EditorialUnit, type LearningEvidence, type MaterialSummary, type StudySession, type StudyTask } from '../../lib/api';
import { getActiveMaterialId, saveActiveMaterialId } from '../../lib/study/active-material';
import { useI18n } from '../../lib/localization/i18n';
import { ActionButton } from '../ui/action-button';
import { LoadingSkeleton } from '../ui/loading-skeleton';
import { SelectField } from '../ui/select-field';
import styles from './learning-analysis.module.css';

type RecordOfWork = {
  id: string;
  conceptId: string | null;
  conceptName: string;
  offset: number | null;
  question: string;
  answer: string;
  diagnosis: string;
  source: string;
  gap: string;
  strength: string | null;
  nextAction: string | null;
  evidenceQuote: string | null;
  solutionRevealed: boolean;
  status: string;
  activity: string;
  assisted: boolean | null;
  date: string;
  evidenceId?: string;
};

const copy = {
  'en-US': {
    title: 'Your learning record', intro: 'Your answers, feedback, and next steps in source order.', material: 'Material', evidence: 'Evidence', map: 'Concept map', attempts: 'Answers reviewed', unresolved: 'Open gaps', assisted: 'With help', chapters: 'By chapter', noChapter: 'Material without a chapter', noEvidence: 'No answers yet. Open Study to answer a question.', patterns: 'Repeated difficulties', noPatterns: 'No repeated difficulty is supported by your answers yet.', possible: 'Possible recurring difficulty', patternDetail: 'Several answers show a similar gap. Read the attempts before deciding what it means.', review: 'Create review task', created: 'Review task added to Tasks.', taskError: 'Could not create the review task.', study: 'Study this concept', details: 'View answer and feedback', answer: 'Your answer', question: 'Question', reasoning: 'Reasoning', application: 'Application', retention: 'Recall', source: 'Source passage', openTasks: 'Open Tasks', noMaterial: 'Add material in Study to begin analyzing your learning.', initial: 'Explanation', edge: 'Challenge', loadError: 'Could not load your learning analysis.', independent: 'Without declared help', emptyChapter: 'No answer recorded here yet.', reviewTitle: 'Review', latest: 'Latest answer', all: 'All answers', outcome: 'Outcome', recorded: 'Recorded', tentative: 'Review the answers before treating a pattern as a difficulty.', contest: 'Challenge this diagnosis', contestReason: 'Why does this diagnosis seem wrong?', contestSaved: 'Challenge saved with this attempt.', openStudy: 'Open Study', due: 'Due reviews', dueHint: 'These reviews are suggestions until you open or schedule them.', reviewNow: 'Review now', strength: 'What worked', nextAction: 'Next step', quoted: 'Evidence in your words', revealed: 'Reference revealed',
  },
  'pt-BR': {
    title: 'Seu histórico de aprendizagem', intro: 'Respostas, feedback e próximos passos na ordem do material.', material: 'Material', evidence: 'Evidências', map: 'Mapa de conceitos', attempts: 'Respostas avaliadas', unresolved: 'Lacunas abertas', assisted: 'Com ajuda', chapters: 'Por capítulo', noChapter: 'Material sem capítulo', noEvidence: 'Ainda não há respostas. Abra Estudo para responder uma pergunta.', patterns: 'Dificuldades recorrentes', noPatterns: 'Suas respostas ainda não sustentam uma dificuldade recorrente.', possible: 'Possível dificuldade recorrente', patternDetail: 'Várias respostas mostram lacunas semelhantes. Leia as tentativas antes de decidir o que isso significa.', review: 'Criar tarefa de revisão', created: 'Tarefa de revisão adicionada em Tarefas.', taskError: 'Não foi possível criar a tarefa de revisão.', study: 'Estudar este conceito', details: 'Ver resposta e feedback', answer: 'Sua resposta', question: 'Pergunta', reasoning: 'Raciocínio', application: 'Aplicação', retention: 'Retomada', source: 'Trecho de origem', openTasks: 'Abrir Tarefas', noMaterial: 'Adicione material em Estudo para analisar sua aprendizagem.', initial: 'Explicação', edge: 'Desafio', loadError: 'Não foi possível carregar a análise.', independent: 'Sem ajuda declarada', emptyChapter: 'Ainda não há resposta registrada aqui.', reviewTitle: 'Revisar', latest: 'Última resposta', all: 'Todas as respostas', outcome: 'Resultado', recorded: 'Registrado em', tentative: 'Revise as respostas antes de tratar um padrão como dificuldade.', contest: 'Contestar este diagnóstico', contestReason: 'Por que o diagnóstico parece incorreto?', contestSaved: 'Contestação guardada nesta tentativa.', openStudy: 'Abrir Estudo', due: 'Revisões vencidas', dueHint: 'Estas revisões são sugestões até você abrir ou agendar.', reviewNow: 'Revisar agora', strength: 'O que funcionou', nextAction: 'Próximo passo', quoted: 'Evidência nas suas palavras', revealed: 'Referência revelada',
  },
} as const;

function recordsFor(concepts: Concept[], sessions: StudySession[], evidence: LearningEvidence[]): RecordOfWork[] {
  const byId = new Map(concepts.map((concept) => [concept.id, concept]));
  const fromSessions = sessions.flatMap((session) => {
    const concept = byId.get(session.conceptId);
    return session.attempts.map((attempt, index): RecordOfWork => ({
      id: `${session.id}:${index}`, conceptId: session.conceptId, conceptName: concept?.name ?? 'Concept',
      offset: concept?.sourceOffset ?? null,
      question: attempt.stage === 'INITIAL' ? session.question.text : session.edgeCaseChallenge?.question ?? session.question.text,
      answer: attempt.answer, diagnosis: attempt.evaluation.feedback,
      source: concept?.sourceExcerpt ?? '',
      gap: attempt.evaluation.gap ?? attempt.evaluation.logicalBreak ?? attempt.evaluation.missingPremises[0] ?? attempt.evaluation.feedback,
      strength: attempt.evaluation.strength ?? null,
      nextAction: attempt.evaluation.nextAction ?? null,
      evidenceQuote: attempt.evaluation.evidenceQuote ?? null,
      solutionRevealed: false,
      status: attempt.evaluation.status, activity: attempt.stage === 'INITIAL' ? 'INITIAL' : 'EDGE',
      assisted: attempt.assisted ?? null, date: attempt.createdAt,
    }));
  });
  const fromEvidence = evidence.filter((item) => item.status !== 'SELF_REPORTED').map((item): RecordOfWork => ({
    id: item.id, conceptId: item.concept_id, conceptName: item.concept_id ? byId.get(item.concept_id)?.name ?? 'Concept' : 'Material',
    offset: item.source_offset ?? (item.concept_id ? byId.get(item.concept_id)?.sourceOffset : undefined) ?? null,
    question: item.prompt, answer: item.answer, diagnosis: item.diagnosis, source: item.source_excerpt,
    gap: item.gap ?? item.logical_break ?? item.missing_premises?.[0] ?? item.diagnosis,
    strength: item.strength ?? null,
    nextAction: item.next_action ?? null,
    evidenceQuote: item.evidence_quote ?? null,
    solutionRevealed: item.solution_revealed,
    status: item.evidence_contestations?.length ? 'CONTESTED' : item.status, activity: item.activity_type, assisted: item.assisted, date: item.created_at,
    evidenceId: item.id,
  }));
  return [...fromSessions, ...fromEvidence].sort((a, b) => b.date.localeCompare(a.date));
}

const commonGapWords = new Set('about after again also answer because before cannot concept could detail does each explain from have idea into more needs only same show that their them then there these this using what when where which with would sobre depois antes mesmo para pela pelas pelos entre como deve ideia falta faltaa isso essa esse esta este explicar conceito resposta mostra mostrar porque precisa ainda tambem também'.split(' '));
function gapTerms(value: string): Set<string> {
  return new Set((value.toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').match(/[a-z]{5,}/g) ?? []).filter((word) => !commonGapWords.has(word)));
}

function unresolvedRecords(records: RecordOfWork[]): RecordOfWork[] {
  const latest = new Map<string, RecordOfWork>();
  for (const row of records) {
    const key = `${row.conceptId ?? row.id}:${row.activity}`;
    if (!latest.has(key)) latest.set(key, row);
  }
  return [...latest.values()].filter((row) => row.status !== 'PASSED' && row.status !== 'CONTESTED');
}

function recurringDifficulties(records: RecordOfWork[]): Array<{ key: string; rows: RecordOfWork[]; conceptIds: string[] }> {
  const open = new Set(unresolvedRecords(records).map((row) => `${row.conceptId ?? row.id}:${row.activity}`));
  const failed = records.filter((row) => row.conceptId && row.status !== 'PASSED' && row.status !== 'CONTESTED' && open.has(`${row.conceptId}:${row.activity}`));
  const seen = new Set<string>();
  const groups: Array<{ key: string; rows: RecordOfWork[]; conceptIds: string[] }> = [];
  for (const conceptId of new Set(failed.map((row) => row.conceptId!))) {
    const rows = failed.filter((row) => row.conceptId === conceptId);
    if (rows.length < 2) continue;
    groups.push({ key: conceptId, rows, conceptIds: [conceptId] });
    rows.forEach((row) => seen.add(row.id));
  }
  for (const row of failed) {
    if (seen.has(row.id)) continue;
    const terms = gapTerms(row.gap);
    const other = failed.find((candidate) => {
      if (candidate.id === row.id || candidate.conceptId === row.conceptId || seen.has(candidate.id)) return false;
      const next = gapTerms(candidate.gap);
      const shared = [...terms].filter((term) => next.has(term)).length;
      return shared >= 2 && shared / Math.max(terms.size, next.size) >= 0.5;
    });
    if (!other) continue;
    groups.push({ key: `${row.id}:${other.id}`, rows: [row, other], conceptIds: [row.conceptId!, other.conceptId!] });
    seen.add(row.id); seen.add(other.id);
  }
  return groups;
}

export function LearningAnalysis({ selectedMaterialId, embedded = false }: { selectedMaterialId?: string; embedded?: boolean } = {}) {
  const { locale } = useI18n();
  const t = copy[locale];
  const [materials, setMaterials] = useState<MaterialSummary[]>([]);
  const [materialId, setMaterialId] = useState('');
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [activeConceptIds, setActiveConceptIds] = useState<string[]>([]);
  const [outline, setOutline] = useState<EditorialUnit[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [evidence, setEvidence] = useState<LearningEvidence[]>([]);
  const [reviews, setReviews] = useState<DueReview[]>([]);
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [materialContent, setMaterialContent] = useState('');
  const [taskState, setTaskState] = useState<Record<string, string>>({});

  useEffect(() => {
    void api.materials().then((rows) => {
      setMaterials(rows); setMaterialId(selectedMaterialId && rows.some((row) => row.id === selectedMaterialId) ? selectedMaterialId : getActiveMaterialId(rows.map((row) => row.id)) || rows[0]?.id || '');
    }).catch(() => setError(t.loadError)).finally(() => setLoading(false));
  }, [t.loadError, selectedMaterialId]);
  const load = useCallback(async () => {
    if (!materialId) return;
    setLoading(true); setError('');
    try {
      const [nextOutline, nextSessions, nextEvidence, nextTasks, nextReviews, nextMaterial] = await Promise.all([
        api.outline(materialId), api.materialSessions(materialId), api.evidence(materialId), api.tasks(), api.dueReviews(), api.material(materialId),
      ]);
      setOutline(nextOutline); setConcepts(nextSessions.concepts); setActiveConceptIds(nextSessions.activeConceptIds); setSessions(nextSessions.sessions); setEvidence(nextEvidence); setTasks(nextTasks); setReviews(nextReviews); setMaterialContent(nextMaterial.content);
    } catch { setError(t.loadError); }
    finally { setLoading(false); }
  }, [materialId, t.loadError]);
  useEffect(() => { void load(); }, [load]);

  const records = useMemo(() => recordsFor(concepts, sessions, evidence).map((row) => {
    if (!row.source || !materialContent) return row;
    if (row.offset !== null && materialContent.slice(row.offset, row.offset + row.source.length) === row.source) return row;
    const offset = materialContent.indexOf(row.source);
    return { ...row, offset: offset >= 0 && materialContent.indexOf(row.source, offset + 1) < 0 ? offset : null };
  }), [concepts, sessions, evidence, materialContent]);
  const unresolved = unresolvedRecords(records);
  const repeated = recurringDifficulties(records);
  const chapterUnits = outline.filter((unit) => unit.title && unit.provenance !== 'UNSTRUCTURED');
  const shallowest = [...new Set(chapterUnits.map((unit) => unit.level))].sort((a, b) => a - b)
    .find((level) => chapterUnits.filter((unit) => unit.level === level).length >= 2) ?? Infinity;
  const chapters = chapterUnits.filter((unit) => unit.level === shallowest);
  const unplaced = records.some((row) => row.offset === null || (chapters.length > 0 && row.offset < chapters[0]!.startOffset));
  const sections = chapters.length ? [...chapters, ...(unplaced ? [{ id: 'unstructured', title: t.noChapter, startOffset: Number.MAX_SAFE_INTEGER, endOffset: Number.MAX_SAFE_INTEGER, level: 0, order: 0, provenance: 'UNSTRUCTURED' as const, pageNumber: null }] : [])] : [{ id: 'unstructured', title: t.noChapter, startOffset: 0, endOffset: Number.MAX_SAFE_INTEGER, level: 0, order: 0, provenance: 'UNSTRUCTURED' as const, pageNumber: null }];
  const statusName = (status: string) => ({ PASSED: locale === 'pt-BR' ? 'Aprovada' : 'Passed', INCOMPLETE: locale === 'pt-BR' ? 'Incompleta' : 'Incomplete', LOGICAL_BREAK: locale === 'pt-BR' ? 'Rever lógica' : 'Review reasoning', CONTESTED: locale === 'pt-BR' ? 'Contestado' : 'Contested' }[status] ?? status);
  const activityName = (activity: string) => ({ INITIAL: t.initial, EDGE: t.edge, REASONING: t.reasoning, APPLICATION: t.application, RETENTION: t.retention }[activity] ?? activity);

  const createReview = async (key: string, conceptIds: string[], conceptName: string, rows: RecordOfWork[]) => {
    setTaskState((current) => ({ ...current, [key]: 'saving' }));
    try {
      const title = `${t.reviewTitle}: ${conceptName}`;
      const currentTasks = await api.tasks();
      if (currentTasks.some((task) => task.material_id === materialId && task.activity_type === 'REVISIT' && task.status !== 'REMOVED' && task.title === title)) {
        setTasks(currentTasks); setTaskState((current) => ({ ...current, [key]: 'created' })); return;
      }
      const task = await api.createTask({ title, activityType: 'REVISIT', materialId, conceptId: conceptIds.length === 1 && activeConceptIds.includes(conceptIds[0]!) ? conceptIds[0] : undefined, durationMinutes: 30,
        description: rows.slice(0, 2).map((row) => row.gap).join('\n'), reason: t.possible });
      setTasks((current) => [task, ...current]);
      setTaskState((current) => ({ ...current, [key]: 'created' }));
    } catch { setTaskState((current) => ({ ...current, [key]: 'error' })); }
  };

  if (loading && !materials.length) return <LoadingSkeleton variant="record" />;
  if (!materials.length) return <section className={styles.empty}><h1>{t.title}</h1><p>{error || t.noMaterial}</p><Link className="app-button secondary" href="/study">{t.openStudy}</Link></section>;
  return <div className={styles.analysis}>
    <header className={styles.header}><div>{embedded ? <h2>{t.title}</h2> : <h1>{t.title}</h1>}<p>{t.intro}</p></div>{!embedded && <SelectField label={t.material} icon="book" value={materialId} options={materials.map((item) => ({ value: item.id, label: item.title }))} onValueChange={(id) => { saveActiveMaterialId(id); setMaterialId(id); }} />}</header>
      {error && <p role="alert" className={styles.error}>{error}</p>}
      {loading ? <LoadingSkeleton variant="record" contentOnly /> : <>
        <div className={styles.stats}><p><strong>{records.length}</strong><span>{t.attempts}</span></p>{unresolved.length > 0 && <p data-kind="gap"><strong>{unresolved.length}</strong><span>{t.unresolved}</span></p>}{records.some((row) => row.assisted) && <p data-kind="assisted"><strong>{records.filter((row) => row.assisted).length}</strong><span>{t.assisted}</span></p>}</div>
        {reviews.filter((review) => review.materialId === materialId).length > 0 && <section className={styles.dueReviews} aria-labelledby="analysis-due-title"><header><span className={styles.eyebrow}>{t.due}</span><h2 id="analysis-due-title">{t.due}</h2><p>{t.dueHint}</p></header><div>{reviews.filter((review) => review.materialId === materialId).map((review) => <Link key={review.id} href={`/study?material=${review.materialId}&concept=${review.conceptId}&review=${review.id}`}><span>{review.conceptName}</span><small>{new Date(review.dueAt).toLocaleDateString(locale)} · {review.lastDiagnosis ?? t.reviewNow}</small></Link>)}</div></section>}
        {records.length === 0 && <p className={styles.emptyNote}>{t.noEvidence}</p>}
        {repeated.length > 0 && <section className={styles.patterns} aria-labelledby="patterns-title">
          <header><span className={styles.eyebrow}>{t.patterns}</span><h2 id="patterns-title">{repeated.length} {t.possible.toLocaleLowerCase(locale)}</h2><p>{t.tentative}</p></header>
          {repeated.map(({ key, rows, conceptIds }) => {
            const conceptName = [...new Set(rows.map((row) => row.conceptName))].join(' · ');
            const activeId = conceptIds.length === 1 && activeConceptIds.includes(conceptIds[0]!) ? conceptIds[0] : null;
            return <article key={key} className={styles.pattern}>
              <div><h3>{conceptName}</h3><p>{t.patternDetail}</p><ul>{rows.slice(0, 3).map((row) => <li key={row.id}><span>{new Date(row.date).toLocaleDateString(locale)}</span>{row.gap}</li>)}</ul></div>
              <div className={styles.actions}>
                {activeId && <Link className="app-button secondary" href={`/study?material=${materialId}&concept=${activeId}`}>{t.study}</Link>}
                <ActionButton variant="secondary" disabled={taskState[key] === 'saving' || taskState[key] === 'created' || tasks.some((task) => task.material_id === materialId && task.activity_type === 'REVISIT' && task.status !== 'REMOVED' && task.title === `${t.reviewTitle}: ${conceptName}`)} onClick={() => void createReview(key, conceptIds, conceptName, rows)}>{t.review}</ActionButton>
                {(taskState[key] === 'created' || tasks.some((task) => task.material_id === materialId && task.activity_type === 'REVISIT' && task.status !== 'REMOVED' && task.title === `${t.reviewTitle}: ${conceptName}`)) && <Link className="app-button secondary" href="/library">{t.openTasks}</Link>}
                {taskState[key] === 'error' && <span role="alert">{t.taskError}</span>}
              </div>
            </article>;
          })}
        </section>}
        <section className={styles.chapters} aria-labelledby="chapters-title"><header><span className={styles.eyebrow}>{t.chapters}</span><h2 id="chapters-title">{materials.find((item) => item.id === materialId)?.title}</h2></header>{sections.map((chapter, index) => {
          const end = sections[index + 1]?.startOffset ?? Number.MAX_SAFE_INTEGER;
          const chapterRows = records.filter((row) => chapter.id === 'unstructured' ? !chapters.length || row.offset === null || row.offset < chapters[0]!.startOffset : row.offset !== null && row.offset >= chapter.startOffset && row.offset < end);
          return <details key={chapter.id} className={styles.chapter} open={index === 0 && records.length > 0}><summary><span>{chapter.title}</span><small>{chapterRows.length} {t.attempts.toLocaleLowerCase(locale)}</small></summary><div className={styles.chapterBody}>{chapterRows.length ? chapterRows.map((row) => <article key={row.id} className={styles.record} data-status={row.status}>
            <header><div><small>{activityName(row.activity)} · {new Date(row.date).toLocaleDateString(locale)}</small><h3>{row.conceptName}</h3></div><strong data-status={row.status}>{statusName(row.status)}</strong></header>
            <p className={styles.question}>{row.question}</p>
            <p className={styles.insight}>{row.status === 'PASSED' ? row.strength || row.diagnosis : row.gap || row.diagnosis}</p>
            {row.assisted !== null && <small className={styles.assistance}>{row.assisted ? t.assisted : t.independent}</small>}
            <details className={styles.recordDetails}><summary>{t.details}</summary><div>
              <strong>{t.question}</strong><p>{row.question}</p>
              <strong>{t.answer}</strong><blockquote>{row.answer}</blockquote>
              <section className={styles.outcomePanel}><strong>{t.outcome}</strong><p>{row.diagnosis}</p></section>
              {row.nextAction && <section className={styles.nextActionPanel}><strong>{t.nextAction}</strong><p>{row.nextAction}</p></section>}
              {row.evidenceQuote && <p><strong>{t.quoted}:</strong> “{row.evidenceQuote}”</p>}
              {row.solutionRevealed && <p className={styles.revealed}>{t.revealed}</p>}
              {row.source && <><strong>{t.source}</strong><blockquote>{row.source}</blockquote></>}
              {row.conceptId && activeConceptIds.includes(row.conceptId) && <Link className="app-button secondary" href={`/study?material=${materialId}&concept=${row.conceptId}`}>{t.study}</Link>}
              {row.evidenceId && row.status !== 'CONTESTED' && <ContestDiagnosis evidenceId={row.evidenceId} locale={locale} onSaved={(contest) => setEvidence((current) => current.map((item) => item.id === row.evidenceId ? { ...item, evidence_contestations: [...(item.evidence_contestations ?? []), { ...contest, created_at: new Date().toISOString() }] } : item))} />}
            </div></details>
          </article>) : <p>{t.emptyChapter}</p>}</div></details>;
        })}</section>
      </>}
  </div>;
}

function ContestDiagnosis({ evidenceId, locale, onSaved }: { evidenceId: string; locale: 'pt-BR' | 'en-US'; onSaved: (contest: { id: string; reason: string }) => void }) {
  const t = copy[locale];
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy || reason.trim().length < 5) return;
    setBusy(true); setMessage('');
    try { const contest = await api.contestEvidence(evidenceId, reason.trim()); setMessage(t.contestSaved); onSaved(contest); }
    catch (cause) { setMessage(cause instanceof Error ? cause.message : t.taskError); }
    finally { setBusy(false); }
  };
  return <form className={styles.contest} onSubmit={(event) => void submit(event)}><label>{t.contestReason}<input minLength={5} maxLength={2000} value={reason} onChange={(event) => setReason(event.target.value)} /></label><ActionButton type="submit" variant="secondary" disabled={busy || reason.trim().length < 5}>{t.contest}</ActionButton>{message && <p role="status">{message}</p>}</form>;
}
