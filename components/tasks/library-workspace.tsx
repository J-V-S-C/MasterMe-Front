'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { api, type Concept, type DueReview, type MaterialSummary, type StudyPlan, type StudySuggestion, type StudyTask, type TodayPlan } from '../../lib/api';
import { useI18n } from '../../lib/localization/i18n';
import { useRealtimeRefresh } from '../providers/realtime-provider';
import { SelectField } from '../ui/select-field';
import { ActionButton } from '../ui/action-button';
import { Icon } from '../ui/icons';
import { TaskBoard, type BoardStatus } from './task-board';
import { DayPicker, DurationChips, TimeSlider, dayKey, formatClock, formatDayShort, formatDuration } from './task-controls';
import styles from './library-workspace.module.css';

const copy = {
  'pt-BR': {
    title: 'Tarefas',
    task: 'Tarefa',
    description: 'Descrição',
    descriptionPlaceholder: 'O que você pretende fazer nesta tarefa?',
    taskPlaceholder: 'Ex.: Revisar os exemplos do capítulo 3',
    tabsLabel: 'Áreas da tarefa',
    dateTab: 'Quando',
    detailsTab: 'Detalhes',
    resume: 'Resumo da tarefa',
    previewLabel: 'Prévia do cartão',
    previewTitle: 'Sua tarefa aparece assim',
    previewHint: 'A prévia acompanha cada escolha. Nada é salvo até você adicionar.',
    addHint: 'A tarefa entra como “A fazer”.',
    today: 'Hoje',
    tomorrow: 'Amanhã',
    nextWeek: 'Em 7 dias',
    noDate: 'Sem data',
    dateLabel: 'Data',
    previousMonth: 'Mês anterior',
    nextMonth: 'Próximo mês',
    time: 'Horário',
    duration: 'Duração',
    noEstimate: 'Sem estimativa',
    periods: ['Manhã', 'Tarde', 'Noite'],
    material: 'Material',
    optionalMaterial: 'Sem material específico',
    concept: 'Conceito',
    optionalConcept: 'Nenhum conceito específico',
    add: 'Adicionar tarefa',
    pending: 'A fazer',
    doing: 'Fazendo',
    done: 'Concluído',
    unscheduled: 'Sem horário',
    remove: 'Remover',
    save: 'Salvar',
    edit: 'Editar',
    editTitle: 'Editar tarefa',
    closeEdit: 'Fechar edição',
    cancel: 'Cancelar',
    study: 'Estudar conceito',
    suggestions: 'Sugestões de estudo',
    suggestionHint: 'Ideias opcionais baseadas nas suas explicações.',
    reviews: 'Revisões de hoje',
    reviewHint: 'Sugestões de retomada. Nada muda no seu cronograma até você confirmar.',
    reviewNow: 'Revisar agora',
    reviewPlan: 'Adicionar ao quadro',
    reviewOverdue: 'Atrasada',
    reviewDue: 'Vence hoje',
    board: 'Quadro',
    suggestionsTab: 'Sugestões',
    boardHint: 'Arraste cartões entre colunas. Pelo teclado, foque um cartão, pressione Espaço, use W/S ou ↑/↓ para mudar a prioridade e A/D ou ←/→ para mudar de coluna; pressione Espaço para soltar.',
    accept: 'Adicionar tarefa',
    ignore: 'Ignorar',
    failed: 'Não foi possível salvar. Tente novamente.',
    pastSchedule: 'Escolha uma data e um horário futuros para esta tarefa.',
    drag: 'Arrastar tarefa',
  },
  'en-US': {
    title: 'Tasks',
    task: 'Task',
    description: 'Description',
    descriptionPlaceholder: 'What do you plan to do in this task?',
    taskPlaceholder: 'E.g. Review the examples in chapter 3',
    tabsLabel: 'Task areas',
    dateTab: 'When',
    detailsTab: 'Details',
    resume: 'Task summary',
    previewLabel: 'Card preview',
    previewTitle: 'Your task will look like this',
    previewHint: 'The preview follows every choice. Nothing is saved until you add it.',
    addHint: 'The task starts in “To do”.',
    today: 'Today',
    tomorrow: 'Tomorrow',
    nextWeek: 'In 7 days',
    noDate: 'No date',
    dateLabel: 'Date',
    previousMonth: 'Previous month',
    nextMonth: 'Next month',
    time: 'Time',
    duration: 'Duration',
    noEstimate: 'No estimate',
    periods: ['Morning', 'Afternoon', 'Evening'],
    material: 'Material',
    optionalMaterial: 'No specific material',
    concept: 'Concept',
    optionalConcept: 'No specific concept',
    add: 'Add task',
    pending: 'To do',
    doing: 'Doing',
    done: 'Done',
    unscheduled: 'No time set',
    remove: 'Remove',
    save: 'Save',
    edit: 'Edit',
    editTitle: 'Edit task',
    closeEdit: 'Close editor',
    cancel: 'Cancel',
    study: 'Study concept',
    suggestions: 'Study suggestions',
    suggestionHint: 'Optional ideas based on your explanations.',
    reviews: 'Due reviews',
    reviewHint: 'Suggested returns. Nothing changes in your schedule until you confirm.',
    reviewNow: 'Review now',
    reviewPlan: 'Add to board',
    reviewOverdue: 'Overdue',
    reviewDue: 'Due today',
    board: 'Board',
    suggestionsTab: 'Suggestions',
    boardHint: 'Drag cards between columns. With a keyboard, focus a card, press Space, use W/S or ↑/↓ to change priority and A/D or ←/→ to change columns, then press Space to drop.',
    accept: 'Add task',
    ignore: 'Ignore',
    failed: 'Could not save. Try again.',
    pastSchedule: 'Choose a future date and time for this task.',
    drag: 'Drag task',
  },
} as const;

const suggestionCopy = {
  'pt-BR': { diagnosis: 'Tentativa anterior', proposedTask: 'Ajuste a tarefa antes de aceitar', duration: 'Duração em minutos', schedule: 'Quando estudar', plan: 'Roteiro', noPlan: 'Sem roteiro' },
  'en-US': { diagnosis: 'Previous attempt', proposedTask: 'Edit the task before accepting', duration: 'Duration in minutes', schedule: 'When to study', plan: 'Plan', noPlan: 'No plan' },
} as const;

type WorkspaceTab = 'date' | 'details' | 'board' | 'suggestions';

const startIso = (value: string) => value ? new Date(value).toISOString() : null;
const localClock = (date: Date) => `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
const localSchedule = (date: Date) => `${dayKey(date)}T${localClock(date)}`;
const nextTaskStart = (tasks: StudyTask[], now: Date): Date => {
  const nextQuarterHour = new Date(Math.ceil(now.getTime() / 900_000) * 900_000);
  return tasks.reduce((latest, task) => {
    if (!task.scheduled_at || task.status === 'DONE' || task.status === 'REMOVED') return latest;
    const start = new Date(task.scheduled_at).getTime();
    if (!Number.isFinite(start)) return latest;
    const finish = Math.ceil((start + (task.duration_minutes ?? 0) * 60_000) / 60_000) * 60_000;
    return finish > latest.getTime() ? new Date(finish) : latest;
  }, nextQuarterHour);
};
const isPastSchedule = (value: string, now: Date) => Boolean(value) && new Date(value).getTime() < now.getTime();
const statusLabels = (locale: 'pt-BR' | 'en-US') => ({ PENDING: copy[locale].pending, IN_PROGRESS: copy[locale].doing, DONE: copy[locale].done });

export function LibraryWorkspace() {
  const { locale } = useI18n();
  const t = copy[locale];
  const [materials, setMaterials] = useState<MaterialSummary[]>([]);
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [suggestions, setSuggestions] = useState<StudySuggestion[]>([]);
  const [reviews, setReviews] = useState<DueReview[]>([]);
  const [todayPlan, setTodayPlan] = useState<TodayPlan | null>(null);
  const [todayError, setTodayError] = useState(false);
  const [sessionMinutes, setSessionMinutes] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => dayKey(nextTaskStart([], new Date())));
  const [time, setTime] = useState(() => localClock(nextTaskStart([], new Date())));
  const [now, setNow] = useState(() => new Date());
  const scheduleTouched = useRef(false);
  const [duration, setDuration] = useState<number | null>(30);
  const [materialId, setMaterialId] = useState('');
  const [conceptId, setConceptId] = useState('');
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [tab, setTab] = useState<WorkspaceTab>('date');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setTodayError(false);
    const [materialRows, taskRows, suggestionRows, reviewRows, recommended] = await Promise.all([
      api.materials(), api.tasks(), api.suggestions(), api.dueReviews(),
      api.today(dayKey(new Date()), Intl.DateTimeFormat().resolvedOptions().timeZone, sessionMinutes ?? undefined).catch(() => { setTodayError(true); return null; }),
    ]);
    setMaterials(materialRows); setTasks(taskRows); setSuggestions(suggestionRows); setReviews(reviewRows);
    setTodayPlan(recommended);
    if (!scheduleTouched.current) {
      const suggested = nextTaskStart(taskRows, new Date());
      setSelectedDate(dayKey(suggested)); setTime(localClock(suggested));
    }
  }, [sessionMinutes]);
  useEffect(() => { void refresh().catch(() => setError(t.failed)); }, [refresh, t.failed]);
  useEffect(() => { const timer = window.setInterval(() => setNow(new Date()), 30_000); return () => window.clearInterval(timer); }, []);
  useRealtimeRefresh(() => { void refresh().catch(() => {}); });
  useEffect(() => {
    if (!materialId) { setConcepts([]); return; }
    let active = true;
    void api.concepts(materialId).then((rows) => { if (active) setConcepts(rows); }).catch(() => { if (active) setConcepts([]); });
    return () => { active = false; };
  }, [materialId]);
  const operate = async (action: () => Promise<unknown>) => {
    setBusy(true); setError('');
    try { await action(); await refresh(); return true; }
    catch (cause) { setError(cause instanceof Error ? cause.message : t.failed); return false; }
    finally { setBusy(false); }
  };
  const saveEditedTask = async (id: string, input: Parameters<typeof api.updateTask>[1]) => {
    setBusy(true); setError('');
    try {
      const saved = await api.updateTask(id, input);
      setTasks((current) => current.map((task) => task.id === id ? saved : task));
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.failed);
      return false;
    } finally { setBusy(false); }
  };
  const create = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    if (selectedDate && isPastSchedule(`${selectedDate}T${time}`, new Date())) { setError(t.pastSchedule); setTab('details'); return; }
    void operate(async () => {
      await api.createTask({
        title: title.trim(), activityType: 'READ',
        description: description.trim() || undefined,
        materialId: materialId || undefined, conceptId: conceptId || undefined,
        durationMinutes: duration ?? undefined,
        scheduledAt: selectedDate ? startIso(`${selectedDate}T${time}`) ?? undefined : undefined,
      });
      setTitle('');
      setDescription('');
      scheduleTouched.current = false;
    });
  };
  const boardTasks = useMemo(() => tasks.filter((task) => task.status !== 'REMOVED').sort((a, b) => a.sort_order - b.sort_order || (a.scheduled_at ?? '9999').localeCompare(b.scheduled_at ?? '9999') || a.id.localeCompare(b.id)), [tasks]);
  const scheduleIsPast = selectedDate ? isPastSchedule(`${selectedDate}T${time}`, now) : false;
  const earliestStart = new Date(Math.ceil(now.getTime() / 60_000) * 60_000);
  const suggestedStart = useMemo(() => nextTaskStart(tasks, now), [tasks, now]);
  useEffect(() => {
    if (!scheduleTouched.current) { setSelectedDate(dayKey(suggestedStart)); setTime(localClock(suggestedStart)); }
  }, [suggestedStart]);
  const chooseDate = (day: string) => {
    scheduleTouched.current = true;
    setSelectedDate(day);
    if (day && isPastSchedule(`${day}T${time}`, now)) setTime(localClock(earliestStart));
  };
  const taskCounts = useMemo(() => boardTasks.reduce((counts, task) => {
    if (task.scheduled_at) {
      const key = dayKey(task.scheduled_at);
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
  }, {} as Record<string, number>), [boardTasks]);
  const persistBoard = async (next: StudyTask[]) => {
    if (busy) return;
    const previous = tasks;
    const ordered = next.map((task, index) => ({ ...task, sort_order: index }));
    setTasks([...ordered, ...tasks.filter((task) => task.status === 'REMOVED')]);
    setBusy(true); setError('');
    try {
      const statuses = Object.fromEntries(ordered.map((task) => [task.id, task.status])) as Record<string, BoardStatus>;
      await api.reorderTasks(ordered.map((task) => task.id), statuses);
      await refresh();
    } catch (cause) {
      setTasks(previous);
      setError(cause instanceof Error ? cause.message : t.failed);
    } finally { setBusy(false); }
  };
  const pendingSuggestions = suggestions.filter((suggestion) => suggestion.status === 'PENDING');
  const suggestionCount = pendingSuggestions.length + reviews.length;
  const activeTab: WorkspaceTab = tab === 'suggestions' && suggestionCount === 0 ? 'board' : tab;
  const tabs: Array<{ key: WorkspaceTab; label: string; detail: string; icon: 'calendar' | 'clock' | 'columns' | 'sparkles' }> = [
    { key: 'date', label: t.dateTab, detail: selectedDate ? formatDayShort(selectedDate, locale) : t.noDate, icon: 'calendar' },
    { key: 'details', label: t.detailsTab, detail: `${formatClock(time, locale)} · ${formatDuration(duration, locale)}`, icon: 'clock' },
    { key: 'board', label: t.board, detail: `${boardTasks.length} ${locale === 'pt-BR' ? (boardTasks.length === 1 ? 'tarefa' : 'tarefas') : (boardTasks.length === 1 ? 'task' : 'tasks')}`, icon: 'columns' },
    ...(suggestionCount > 0 ? [{ key: 'suggestions' as const, label: t.suggestionsTab, detail: String(suggestionCount), icon: 'sparkles' as const }] : []),
  ];
  const wide = activeTab === 'board' || activeTab === 'suggestions';
  const openTab = (key: WorkspaceTab) => {
    setTab(key);
    requestAnimationFrame(() => document.getElementById(`workspace-tab-${key}`)?.focus());
  };
  const moveTab = (offset: number) => {
    const index = tabs.findIndex((entry) => entry.key === activeTab);
    const next = tabs[(index + offset + tabs.length) % tabs.length] ?? tabs[0];
    if (next) openTab(next.key);
  };
  const selectedMaterial = materials.find((item) => item.id === materialId);
  const selectedConcept = concepts.find((item) => item.id === conceptId);

  return <div className={styles.workspace}>
    {error && <p role="alert" className={styles.error}>{error}</p>}

    <section className={styles.todayPanel} aria-labelledby="today-title">
      <div className={styles.todayHead}>
        <div><span>{locale === 'pt-BR' ? 'SUGESTÃO PARA HOJE' : 'SUGGESTED FOR TODAY'}</span><h2 id="today-title">{locale === 'pt-BR' ? 'Uma forma de continuar' : 'A way to continue'}</h2><p className={styles.todayIntro}>{locale === 'pt-BR' ? 'Escolha quanto tempo tem; esta sugestão abre o próximo trecho do material.' : 'Choose your available time; this suggestion opens the next part of your material.'}</p></div>
        <SelectField label={locale === 'pt-BR' ? 'Tempo disponível' : 'Available time'} icon={null} value={String(sessionMinutes ?? todayPlan?.availableMinutes ?? 30)} onValueChange={(value) => setSessionMinutes(Number(value))} options={[
          ...(todayPlan && ![10, 20, 30, 45, 60, 90].includes(todayPlan.availableMinutes) ? [{ value: String(todayPlan.availableMinutes), label: `${todayPlan.availableMinutes} min` }] : []),
          ...[10, 20, 30, 45, 60, 90].map((minutes) => ({ value: String(minutes), label: `${minutes} min` })),
        ]} />
      </div>
      {todayPlan?.actions.length ? <ol className={styles.todayActions}>{todayPlan.actions.map((action) => <li key={action.id}>
        <div><strong>{action.title}</strong><p>{({
          SCHEDULED: locale === 'pt-BR' ? 'Você agendou esta atividade para hoje.' : 'You scheduled this activity for today.',
          DUE_REVIEW: locale === 'pt-BR' ? 'Uma revisão está disponível para retomar sem consultar a resposta.' : 'A review is due for an independent recall attempt.',
          OPEN_GAP: locale === 'pt-BR' ? 'Uma tentativa anterior deixou uma lacuna para trabalhar.' : 'An earlier attempt left a gap to work on.',
          CONTINUE_BOOK: locale === 'pt-BR' ? 'Continue a leitura na ordem do livro.' : 'Continue in the book’s chapter order.',
          CONTINUE_MATERIAL: locale === 'pt-BR' ? 'Continue o material de onde parou.' : 'Continue the material where you stopped.',
        })[action.reason]} · {action.estimatedMinutes} min</p></div>
        <Link href={action.href}>{locale === 'pt-BR' ? 'Começar' : 'Start'}</Link>
      </li>)}</ol> : <p className={styles.todayEmpty} role={todayError ? 'alert' : undefined}>{todayError ? locale === 'pt-BR' ? 'Não foi possível carregar as sugestões. Suas tarefas abaixo continuam disponíveis.' : 'Could not load suggestions. Your tasks below are still available.' : todayPlan ? locale === 'pt-BR' ? 'Nenhuma atividade cabe no tempo escolhido. Ajuste o tempo ou escolha uma tarefa abaixo.' : 'No activity fits the selected time. Adjust it or choose a task below.' : locale === 'pt-BR' ? 'Preparando sugestões…' : 'Preparing suggestions…'}</p>}
    </section>

    <section className={styles.composer} aria-labelledby="composer-title">
      <header className={styles.composerHead}>
        <h1 id="composer-title">{t.title}</h1>
        <ol className={styles.summaryChips} aria-label={t.resume}>
          <li><Icon name="calendar" />{selectedDate ? formatDayShort(selectedDate, locale) : t.noDate}</li>
          {selectedDate && <li><Icon name="clock" />{formatClock(time, locale)}</li>}
          <li><Icon name="bolt" />{formatDuration(duration, locale)}</li>
        </ol>
      </header>
      {scheduleIsPast && <p role="alert" className={styles.scheduleError}>{t.pastSchedule}</p>}
      <div className={`${styles.composerForm} ${wide ? styles.formWide : ''}`}>
        <div className={styles.composerMain}>
          <form id="task-create-form" className={styles.titleRow} onSubmit={create}>
            <label className={styles.titleField}>{t.task}<input required maxLength={160} value={title} placeholder={t.taskPlaceholder} onInput={(event) => setTitle(event.currentTarget.value)} /></label>
            {wide && <ActionButton variant="primary" type="submit" disabled={busy || !title.trim() || scheduleIsPast}>{t.add}</ActionButton>}
          </form>
          <div className={styles.composerTabs} role="tablist" aria-label={t.tabsLabel} onKeyDown={(event) => {
            if (event.key === 'ArrowRight') { event.preventDefault(); moveTab(1); }
            if (event.key === 'ArrowLeft') { event.preventDefault(); moveTab(-1); }
            if (event.key === 'Home') { event.preventDefault(); openTab('date'); }
            if (event.key === 'End') { event.preventDefault(); openTab(tabs[tabs.length - 1]?.key ?? 'board'); }
          }}>
            {tabs.map((entry) => <button key={entry.key} id={`workspace-tab-${entry.key}`} type="button" role="tab" aria-selected={activeTab === entry.key} aria-controls={`workspace-panel-${entry.key}`} tabIndex={activeTab === entry.key ? 0 : -1} onClick={() => setTab(entry.key)}><Icon name={entry.icon} />{entry.label}<small>{entry.detail}</small></button>)}
          </div>

          {activeTab === 'date' && <div id="workspace-panel-date" role="tabpanel" aria-labelledby="workspace-tab-date" className={styles.composerPanel}>
            <DayPicker value={selectedDate} onChange={chooseDate} locale={locale} counts={taskCounts} minDay={dayKey(earliestStart)} labels={{ previousMonth: t.previousMonth, nextMonth: t.nextMonth, today: t.today, tomorrow: t.tomorrow, nextWeek: t.nextWeek, noDate: t.noDate }} />
          </div>}

          {activeTab === 'details' && <div id="workspace-panel-details" role="tabpanel" aria-labelledby="workspace-tab-details" className={styles.composerPanel}>
            <label className={styles.descriptionField}>{t.description}<textarea maxLength={500} value={description} placeholder={t.descriptionPlaceholder} onInput={(event) => setDescription(event.currentTarget.value)} /></label>
            <div className={styles.detailsGrid}>
              <TimeSlider value={time} onChange={(clock) => { scheduleTouched.current = true; setTime(clock); }} label={t.time} locale={locale} periods={t.periods} minTime={selectedDate === dayKey(earliestStart) ? localClock(earliestStart) : undefined} />
              <DurationChips value={duration} onChange={setDuration} label={t.duration} locale={locale} noEstimate={t.noEstimate} />
            </div>
            <div className={styles.contextFields}>
              <SelectField label={t.material} value={materialId} icon="document" options={[{ value: '', label: t.optionalMaterial }, ...materials.map((item) => ({ value: item.id, label: item.title }))]} onValueChange={(id) => { setMaterialId(id); setConceptId(''); setConcepts([]); }} />
              <SelectField label={t.concept} value={conceptId} icon="idea" disabled={!materialId || !concepts.length} options={[{ value: '', label: t.optionalConcept }, ...concepts.map((item) => ({ value: item.id, label: item.name }))]} onValueChange={setConceptId} />
            </div>
          </div>}

          {activeTab === 'board' && <div id="workspace-panel-board" role="tabpanel" aria-labelledby="workspace-tab-board" className={`${styles.composerPanel} ${styles.boardPanel}`}>
            <p className={styles.boardHint}>{t.boardHint}</p>
            <TaskBoard tasks={boardTasks} labels={statusLabels(locale)} onMove={(next) => void persistBoard(next)} renderCard={(task) => <TaskCard task={task} materials={materials} locale={locale} busy={busy} operate={operate} onSave={saveEditedTask} suggestedStart={suggestedStart} now={now} />} />
          </div>}

          {activeTab === 'suggestions' && <div id="workspace-panel-suggestions" role="tabpanel" aria-labelledby="workspace-tab-suggestions" className={styles.composerPanel}>
            <div className={styles.suggestionsPanel}>
              {reviews.length > 0 && <section className={styles.reviewSuggestions} aria-labelledby="due-reviews-title">
                <header><div><span className={styles.eyebrow}>{t.reviewDue}</span><h2 id="due-reviews-title">{t.reviews}</h2></div><p>{t.reviewHint}</p></header>
                {reviews.map((review) => {
                  const overdue = new Date(review.dueAt).getTime() < new Date(dayKey(now)).getTime();
                  return <article key={review.id} className={styles.reviewSuggestion}>
                    <div><span className={styles.reviewStatus}>{overdue ? t.reviewOverdue : t.reviewDue}</span><h3>{review.conceptName}</h3><p>{review.materialTitle}</p>{review.lastDiagnosis && <small>{review.lastDiagnosis}</small>}</div>
                    <div className={styles.reviewActions}>
                      <Link className={styles.reviewLink} href={`/study?material=${review.materialId}&concept=${review.conceptId}&review=${review.id}`}>{t.reviewNow}</Link>
                      <ActionButton variant="secondary" disabled={busy} onClick={() => void operate(async () => {
                        await api.createTask({
                          title: `${locale === 'pt-BR' ? 'Revisar' : 'Review'} ${review.conceptName}`,
                          description: review.lastDiagnosis ?? undefined,
                          activityType: 'REVISIT',
                          materialId: review.materialId,
                          conceptId: review.conceptId,
                          reviewId: review.id,
                          durationMinutes: 15,
                          scheduledAt: suggestedStart.toISOString(),
                          reason: t.reviewHint,
                        });
                      })}>{t.reviewPlan}</ActionButton>
                      <ActionButton variant="secondary" disabled={busy} onClick={() => void operate(() => api.reviewReminder(review.id, { action: 'POSTPONE', days: 1 }))}>{locale === 'pt-BR' ? 'Amanhã' : 'Tomorrow'}</ActionButton>
                      <ActionButton variant="secondary" disabled={busy} onClick={() => void operate(() => api.reviewReminder(review.id, { action: 'SKIP' }))}>{locale === 'pt-BR' ? 'Dispensar' : 'Skip'}</ActionButton>
                    </div>
                  </article>;
                })}
              </section>}
              <p>{t.suggestionHint}</p>
              {pendingSuggestions.map((suggestion) => <SuggestionEditor key={suggestion.id} suggestion={suggestion} plans={[]} busy={busy} operate={async (action) => { await operate(action); }} locale={locale} labels={t} suggestedStart={suggestedStart} now={now} />)}
            </div>
          </div>}
        </div>
        {(activeTab === 'date' || activeTab === 'details') && <aside className={styles.preview} aria-label={t.previewLabel}>
          <span className={styles.previewLabel}>{t.previewLabel}</span>
          <article className={styles.previewCard}>
            <div className={styles.previewTop}>
              <span>{selectedDate ? formatDayShort(selectedDate, locale) : t.noDate}</span>
              {selectedDate && <span>{formatClock(time, locale)}</span>}
            </div>
            <strong>{title.trim() || t.previewTitle}</strong>
            {description.trim() && <p className={styles.cardDescription}>{description.trim()}</p>}
            <div className={styles.cardMeta}>
              <span>{formatDuration(duration, locale)}</span>
              {selectedMaterial && <span>{selectedMaterial.title}</span>}
              {selectedConcept && <span>{selectedConcept.name}</span>}
            </div>
            <span className={styles.previewStage}><Icon name="columns" />{t.pending}</span>
          </article>
          <p>{t.previewHint}</p>
          <ActionButton variant="primary" type="submit" form="task-create-form" disabled={busy || !title.trim() || scheduleIsPast}>{t.add}</ActionButton>
          <small>{t.addHint}</small>
        </aside>}
      </div>
    </section>
  </div>;
}

function TaskCard({ task, materials, locale, busy, operate, onSave, suggestedStart, now }: { task: StudyTask; materials: MaterialSummary[]; locale: 'pt-BR' | 'en-US'; busy: boolean; operate: (action: () => Promise<unknown>) => Promise<boolean>; onSave: (id: string, input: Parameters<typeof api.updateTask>[1]) => Promise<boolean>; suggestedStart: Date; now: Date }) {
  const t = copy[locale];
  const [editing, setEditing] = useState(false);
  const [dialogMode, setDialogMode] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? '');
  const [scheduledAt, setScheduledAt] = useState(task.scheduled_at ? `${dayKey(task.scheduled_at)}T${String(new Date(task.scheduled_at).getHours()).padStart(2, '0')}:${String(new Date(task.scheduled_at).getMinutes()).padStart(2, '0')}` : '');
  const [duration, setDuration] = useState<number | null>(task.duration_minutes);
  const [materialId, setMaterialId] = useState(task.material_id ?? '');
  const [conceptId, setConceptId] = useState(task.concept_id ?? '');
  const [editError, setEditError] = useState('');
  const [concepts, setConcepts] = useState<Concept[]>([]);
  useEffect(() => {
    if (!editing || !materialId) { setConcepts([]); return; }
    let active = true;
    void api.concepts(materialId).then((rows) => { if (active) setConcepts(rows); }).catch(() => { if (active) setConcepts([]); });
    return () => { active = false; };
  }, [editing, materialId]);
  useEffect(() => {
    if (!editing || !dialogMode) return;
    const dialog = dialogRef.current;
    if (!dialog || typeof dialog.showModal !== 'function') { setDialogMode(false); return; }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    closeButtonRef.current?.focus();
    return () => { document.body.style.overflow = previousOverflow; if (dialog.open) dialog.close(); };
  }, [editing, dialogMode]);
  useEffect(() => { if (editing && !dialogMode) closeButtonRef.current?.focus(); }, [editing, dialogMode]);
  const reset = () => {
    setEditError('');
    setTitle(task.title);
    setDescription(task.description ?? '');
    setScheduledAt(task.scheduled_at ? `${dayKey(task.scheduled_at)}T${String(new Date(task.scheduled_at).getHours()).padStart(2, '0')}:${String(new Date(task.scheduled_at).getMinutes()).padStart(2, '0')}` : '');
    setDuration(task.duration_minutes);
    setMaterialId(task.material_id ?? '');
    setConceptId(task.concept_id ?? '');
  };
  const material = materials.find((item) => item.id === task.material_id);
  const originalSchedule = task.scheduled_at ? localSchedule(new Date(task.scheduled_at)) : '';
  const datePart = scheduledAt.slice(0, 10);
  const timePart = scheduledAt.slice(11, 16) || localClock(suggestedStart);
  const editSchedulePast = Boolean(scheduledAt && scheduledAt !== originalSchedule && isPastSchedule(scheduledAt, now));
  const closeEditor = () => {
    reset();
    setEditing(false);
    requestAnimationFrame(() => editButtonRef.current?.focus());
  };
  const editor = <form className={styles.cardEdit} onSubmit={(event) => { event.preventDefault(); event.stopPropagation(); if (editSchedulePast) { setEditError(t.pastSchedule); return; } void onSave(task.id, { title: title.trim(), description: description.trim(), materialId: materialId || null, conceptId: conceptId || null, durationMinutes: duration, scheduledAt: startIso(scheduledAt) }).then((saved) => { if (saved) { setEditing(false); requestAnimationFrame(() => editButtonRef.current?.focus()); } }); }}>
    <header className={styles.editHeader}><h2>{t.editTitle}</h2><button ref={closeButtonRef} type="button" className={styles.editClose} aria-label={t.closeEdit} onClick={closeEditor}>×</button></header>
    <div className={styles.cardEditFields}>
      <label className={styles.editFull}>{t.task}<input required maxLength={160} value={title} onInput={(event) => setTitle(event.currentTarget.value)} /></label>
      <label className={styles.editFull}>{t.description}<textarea maxLength={500} value={description} placeholder={t.descriptionPlaceholder} onInput={(event) => setDescription(event.currentTarget.value)} /></label>
      <label>{t.dateLabel}<input type="date" min={originalSchedule && isPastSchedule(originalSchedule, now) ? undefined : dayKey(now)} value={datePart} onInput={(event) => { const day = event.currentTarget.value; if (!day) { setScheduledAt(''); return; } const candidate = `${day}T${timePart}`; setScheduledAt(isPastSchedule(candidate, new Date()) ? localSchedule(new Date(Math.ceil(Date.now() / 60_000) * 60_000)) : candidate); }} /></label>
      <TimeSlider value={timePart} onChange={(next) => setScheduledAt(`${datePart || dayKey(suggestedStart)}T${next}`)} label={t.time} locale={locale} periods={t.periods} minTime={(datePart || dayKey(suggestedStart)) === dayKey(now) ? localClock(new Date(Math.ceil(now.getTime() / 60_000) * 60_000)) : undefined} compact />
      <div className={styles.editFull}><DurationChips value={duration} onChange={setDuration} label={t.duration} locale={locale} noEstimate={t.noEstimate} /></div>
      <SelectField label={t.material} value={materialId} options={[{ value: '', label: t.optionalMaterial }, ...materials.map((item) => ({ value: item.id, label: item.title }))]} onValueChange={(id) => { setMaterialId(id); setConceptId(''); }} />
      <SelectField label={t.concept} value={conceptId} disabled={!materialId || !concepts.length} options={[{ value: '', label: t.optionalConcept }, ...concepts.map((item) => ({ value: item.id, label: item.name }))]} onValueChange={setConceptId} />
    </div>
    {(editSchedulePast || editError) && <p role="alert" className={styles.scheduleError}>{t.pastSchedule}</p>}
    <div className={styles.cardActions}><ActionButton variant="primary" type="submit" disabled={busy || editSchedulePast}>{t.save}</ActionButton><ActionButton variant="secondary" onClick={closeEditor}>{t.cancel}</ActionButton></div>
  </form>;
  const card = <div className={styles.cardBody}>
    <div className={styles.cardTop}>
      <span className={styles.cardWhen}><Icon name="clock" />{task.scheduled_at ? new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(task.scheduled_at)) : t.unscheduled}</span>
      <span>{formatDuration(task.duration_minutes, locale)}</span>
    </div>
    <strong>{task.title}</strong>
    {task.description && <p className={styles.cardDescription}>{task.description}</p>}
    <div className={styles.cardMeta}>{material && <span>{material.title}</span>}{task.concepts && <span>{task.concepts.name}</span>}</div>
    <div className={styles.cardActions}>
      {task.project_id && task.material_id ? <Link className={styles.cardAction} href={`/practice?material=${task.material_id}&project=${task.project_id}`}>{locale === 'pt-BR' ? 'Abrir projeto' : 'Open project'}</Link> : task.concept_id && task.material_id && <Link className={styles.cardAction} href={`${task.activity_type === 'PRACTICE' ? '/practice' : '/study'}?material=${task.material_id}&concept=${task.concept_id}${task.review_id && task.activity_type !== 'PRACTICE' ? `&review=${task.review_id}` : ''}`}>{task.activity_type === 'PRACTICE' ? locale === 'pt-BR' ? 'Praticar' : 'Practice' : t.study}</Link>}
      <button ref={editButtonRef} className={styles.cardAction} type="button" onClick={() => { reset(); setDialogMode(window.matchMedia?.('(min-width: 768px)').matches ?? false); setEditing(true); }}>{t.edit}</button>
      <button className={styles.cardAction} type="button" disabled={busy} onClick={() => void operate(() => api.updateTask(task.id, { status: 'REMOVED' }))}>{t.remove}</button>
    </div>
  </div>;
  return <>
    {editing && dialogMode && <dialog ref={dialogRef} className={styles.editDialog} aria-label={t.editTitle} onCancel={(event) => { event.preventDefault(); closeEditor(); }}>{editor}</dialog>}
    {editing && !dialogMode ? editor : card}
  </>;
}

export function SuggestionEditor({ suggestion, plans, busy, operate, locale, labels, suggestedStart, now }: {
  suggestion: StudySuggestion;
  plans: StudyPlan[];
  busy: boolean;
  operate: (action: () => Promise<unknown>) => Promise<void>;
  locale: 'pt-BR' | 'en-US';
  labels: { accept: string; ignore: string };
  suggestedStart: Date;
  now: Date;
}) {
  const t = suggestionCopy[locale];
  const [title, setTitle] = useState(suggestion.title);
  const [minutes, setMinutes] = useState('');
  const [scheduledAt, setScheduledAt] = useState(() => localSchedule(suggestedStart));
  const scheduleTouched = useRef(false);
  const [planId, setPlanId] = useState('');
  const scheduleIsPast = isPastSchedule(scheduledAt, now);
  useEffect(() => { if (!scheduleTouched.current) setScheduledAt(localSchedule(suggestedStart)); }, [suggestedStart]);
  return <article className={styles.suggestion}>
    <h3>{suggestion.title}</h3><p>{suggestion.reason}</p>
    <details><summary>{t.diagnosis}</summary><p>{suggestion.learning_evidence.prompt}</p><p>{suggestion.learning_evidence.diagnosis}</p></details>
    <form className={styles.form} onSubmit={(event) => {
      event.preventDefault();
      if (scheduleIsPast) return;
      void operate(() => api.decideSuggestion(suggestion.id, {
        decision: 'ACCEPTED', title: title.trim(),
        durationMinutes: minutes ? Number(minutes) : undefined,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
        planId: planId || undefined,
      }));
    }}>
      <label>{t.proposedTask}<input required maxLength={160} value={title} onInput={(event) => setTitle(event.currentTarget.value)} /></label>
      <div className={styles.inline}>
        <label>{t.duration}<input type="number" min="1" max="480" value={minutes} onInput={(event) => setMinutes(event.currentTarget.value)} /></label>
        <label>{t.schedule}<input type="datetime-local" min={localSchedule(new Date(Math.ceil(now.getTime() / 60_000) * 60_000))} value={scheduledAt} onInput={(event) => { scheduleTouched.current = true; setScheduledAt(event.currentTarget.value); }} /></label>
        <SelectField label={t.plan} icon={null} value={planId} onValueChange={setPlanId} options={[{ value: '', label: t.noPlan }, ...plans.map((plan) => ({ value: plan.id, label: plan.title }))]} />
      </div>
      {scheduleIsPast && <p role="alert" className={styles.scheduleError}>{copy[locale].pastSchedule}</p>}
      <div className={styles.inline}><ActionButton variant="primary" type="submit" disabled={busy || scheduleIsPast}>{labels.accept}</ActionButton><ActionButton variant="secondary" disabled={busy} onClick={() => void operate(() => api.decideSuggestion(suggestion.id, { decision: 'IGNORED' }))}>{labels.ignore}</ActionButton></div>
    </form>
  </article>;
}
