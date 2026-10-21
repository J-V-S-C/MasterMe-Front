'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { api, type MaterialSummary, type StudyPlan, type StudySuggestion, type StudyTask } from '../lib/api';
import { useI18n } from '../lib/i18n';
import { useRealtimeRefresh } from './realtime-provider';
import styles from './library-workspace.module.css';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { WorkspaceHeading } from './workspace-heading';

const copy = {
  'pt-BR': { title: 'Suas tarefas de estudo', intro: 'Defina o que fazer e quando pretende concluir.', task: 'Tarefa', taskPlaceholder: 'Ex.: Revisar os exemplos do capítulo 3', target: 'Data para concluir', material: 'Material', optionalMaterial: 'Sem material específico', add: 'Adicionar tarefa', open: 'A fazer', done: 'Concluídas', unscheduled: 'Sem data', empty: 'Nenhuma tarefa em andamento. Adicione a próxima ação acima.', doneEmpty: 'Nenhuma tarefa concluída ainda.', complete: 'Concluir', reopen: 'Reabrir', remove: 'Remover', save: 'Salvar', edit: 'Editar', cancel: 'Cancelar', study: 'Estudar conceito', suggestions: 'Sugestões de estudo', suggestionHint: 'Ideias opcionais baseadas nas suas explicações.', calendar: 'Calendário', allTasks: 'Todas as tarefas', today: 'Hoje', previous: 'Anterior', next: 'Próximo', accept: 'Adicionar tarefa', ignore: 'Ignorar', failed: 'Não foi possível salvar. Tente novamente.' },
  'en-US': { title: 'Your study tasks', intro: 'Decide what to do and when you aim to finish.', task: 'Task', taskPlaceholder: 'E.g. Review the examples in chapter 3', target: 'Target completion date', material: 'Material', optionalMaterial: 'No specific material', add: 'Add task', open: 'To do', done: 'Completed', unscheduled: 'No date', empty: 'No tasks in progress. Add your next action above.', doneEmpty: 'No completed tasks yet.', complete: 'Complete', reopen: 'Reopen', remove: 'Remove', save: 'Save', edit: 'Edit', cancel: 'Cancel', study: 'Study concept', suggestions: 'Study suggestions', suggestionHint: 'Optional ideas based on your explanations.', calendar: 'Calendar', allTasks: 'All tasks', today: 'Today', previous: 'Previous', next: 'Next', accept: 'Add task', ignore: 'Ignore', failed: 'Could not save. Try again.' },
} as const;

const suggestionCopy = {
  'pt-BR': { diagnosis: 'Tentativa anterior', proposedTask: 'Ajuste a tarefa antes de aceitar', duration: 'Duração em minutos', schedule: 'Quando estudar', plan: 'Roteiro', noPlan: 'Sem roteiro' },
  'en-US': { diagnosis: 'Previous attempt', proposedTask: 'Edit the task before accepting', duration: 'Duration in minutes', schedule: 'When to study', plan: 'Plan', noPlan: 'No plan' },
} as const;

const localDate = (value: string) => {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
const dateAtNoon = (value: string) => new Date(`${value}T12:00:00`).toISOString();

export function LibraryWorkspace() {
  const { locale } = useI18n();
  const t = copy[locale];
  const [materials, setMaterials] = useState<MaterialSummary[]>([]);
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [suggestions, setSuggestions] = useState<StudySuggestion[]>([]);
  const [title, setTitle] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [materialId, setMaterialId] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => localDate(new Date().toISOString()));
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [listView, setListView] = useState<'open' | 'done'>('open');
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const [materialRows, taskRows, suggestionRows] = await Promise.all([api.materials(), api.tasks(), api.suggestions()]);
    setMaterials(materialRows); setTasks(taskRows); setSuggestions(suggestionRows);
  }, []);
  useEffect(() => { void refresh().catch(() => setError(t.failed)); }, [refresh, t.failed]);
  useRealtimeRefresh(() => { void refresh().catch(() => {}); });
  const operate = async (action: () => Promise<unknown>) => {
    setBusy(true); setError('');
    try { await action(); await refresh(); return true; } catch { setError(t.failed); return false; } finally { setBusy(false); }
  };
  const create = (event: FormEvent) => {
    event.preventDefault();
    const nextTitle = title.trim();
    if (!nextTitle) return;
    void operate(async () => {
      await api.createTask({ title: nextTitle, activityType: 'READ', materialId: materialId || undefined, scheduledAt: targetDate ? dateAtNoon(targetDate) : undefined });
      setTitle(''); setTargetDate(''); setMaterialId('');
    });
  };
  const openTasks = useMemo(() => tasks.filter((task) => task.status === 'PENDING').sort((a, b) =>
    (a.scheduled_at ?? '9999').localeCompare(b.scheduled_at ?? '9999') || a.sort_order - b.sort_order), [tasks]);
  const doneTasks = useMemo(() => tasks.filter((task) => task.status === 'DONE'), [tasks]);
  const pendingSuggestions = suggestions.filter((suggestion) => suggestion.status === 'PENDING');

  return <div className={styles.workspace}>
    <WorkspaceHeading eyebrow={locale === 'pt-BR' ? 'PLANEJAMENTO' : 'PLANNING'} title={t.title} description={t.intro} aside={<div className={styles.heroMeta}><strong>{openTasks.length}</strong><span>{t.open}</span></div>} />
    {error && <p role="alert" className={styles.error}>{error}</p>}
    <form className={styles.create} onSubmit={create}>
      <label className={styles.titleField}>{t.task}<input ref={titleInputRef} required maxLength={160} value={title} placeholder={t.taskPlaceholder} onInput={(event) => setTitle(event.currentTarget.value)} /></label>
      <label>{t.target}<input type="date" value={targetDate} onInput={(event) => setTargetDate(event.currentTarget.value)} /></label>
      <label>{t.material}<select value={materialId} onChange={(event) => setMaterialId(event.target.value)}><option value="">{t.optionalMaterial}</option>{materials.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
      <button disabled={busy}>{t.add}</button>
    </form>
    <div className={styles.layout}>
      <section className={styles.list} aria-label={t.allTasks}><header><div><span className={styles.kicker}>{t.allTasks}</span><h2>{listView === 'open' ? t.open : t.done}</h2></div></header>
        <div className={styles.listSwitch} aria-label={t.allTasks}><button type="button" aria-pressed={listView === 'open'} onClick={() => setListView('open')}>{t.open} <span>{openTasks.length}</span></button><button type="button" aria-pressed={listView === 'done'} onClick={() => setListView('done')}>{t.done} <span>{doneTasks.length}</span></button></div>
        {listView === 'open' ? <>{!openTasks.length && <p className={styles.empty}>{t.empty}</p>}{openTasks.map((task) => <TaskItem key={task.id} task={task} materials={materials} locale={locale} busy={busy} operate={operate} labels={t} selected={selectedTaskId === task.id} />)}</> : <>{!doneTasks.length && <p className={styles.empty}>{t.doneEmpty}</p>}{doneTasks.map((task) => <TaskItem key={task.id} task={task} materials={materials} locale={locale} busy={busy} operate={operate} labels={t} selected={selectedTaskId === task.id} />)}</>}
      </section>
      <aside className={styles.calendarPanel} aria-label={t.calendar}>
        <header><span className={styles.kicker}>{t.calendar}</span><h2>{t.target}</h2></header>
        <div className={styles.calendar}><FullCalendar plugins={[dayGridPlugin, interactionPlugin]} initialView="dayGridMonth" locale={locale} height="auto" editable eventDurationEditable={false} buttonIcons={false} eventDrop={(info) => { if (!info.event.start) return; void operate(() => api.updateTask(info.event.id, { scheduledAt: dateAtNoon(localDate(info.event.start!.toISOString())) })).then((saved) => { if (!saved) info.revert(); }); }} headerToolbar={{ left: 'prev,next', center: 'title', right: 'today' }} buttonText={{ today: t.today, prev: t.previous, next: t.next }} dayCellClassNames={(arg) => localDate(arg.date.toISOString()) === selectedDate ? styles.selectedDay : ''} events={openTasks.filter((task) => task.scheduled_at).map((task) => ({ id: task.id, title: task.title, start: task.scheduled_at ? localDate(task.scheduled_at) : undefined, allDay: true }))} dateClick={(info) => { setSelectedDate(info.dateStr); setTargetDate(info.dateStr); titleInputRef.current?.focus(); }} eventClick={(info) => { setListView('open'); setSelectedTaskId(info.event.id); requestAnimationFrame(() => { const row = document.getElementById(`task-${info.event.id}`); row?.scrollIntoView({ block: 'center' }); row?.focus(); }); }} /></div>
      </aside>
    </div>
    {pendingSuggestions.length > 0 && <details className={styles.archive}><summary>{t.suggestions} · {pendingSuggestions.length}</summary><p>{t.suggestionHint}</p>{pendingSuggestions.map((suggestion) => <SuggestionEditor key={suggestion.id} suggestion={suggestion} plans={[]} busy={busy} operate={async (action) => { await operate(action); }} locale={locale} labels={t} />)}</details>}
  </div>;
}

function TaskItem({ task, materials, locale, busy, operate, labels, selected }: { task: StudyTask; materials: MaterialSummary[]; locale: 'pt-BR' | 'en-US'; busy: boolean; operate: (action: () => Promise<unknown>) => Promise<boolean>; labels: typeof copy['pt-BR'] | typeof copy['en-US']; selected: boolean }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [targetDate, setTargetDate] = useState(task.scheduled_at ? localDate(task.scheduled_at) : '');
  useEffect(() => {
    if (!editing) { setTitle(task.title); setTargetDate(task.scheduled_at ? localDate(task.scheduled_at) : ''); }
  }, [editing, task.title, task.scheduled_at]);
  const material = materials.find((item) => item.id === task.material_id);
  const dateLabel = task.scheduled_at ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(task.scheduled_at)) : labels.unscheduled;
  return <article id={`task-${task.id}`} tabIndex={-1} className={`${styles.task} ${selected ? styles.selectedTask : ''}`}>
    {editing ? <form className={styles.editForm} onSubmit={(event) => { event.preventDefault(); void operate(() => api.updateTask(task.id, { title: title.trim(), scheduledAt: targetDate ? dateAtNoon(targetDate) : null })).then((saved) => { if (saved) setEditing(false); }); }}>
      <label>{labels.task}<input required maxLength={160} value={title} onInput={(event) => setTitle(event.currentTarget.value)} /></label>
      <label>{labels.target}<input type="date" value={targetDate} onInput={(event) => setTargetDate(event.currentTarget.value)} /></label>
      <div className={styles.actions}><button disabled={busy}>{labels.save}</button><button type="button" onClick={() => { setEditing(false); setTitle(task.title); setTargetDate(task.scheduled_at ? localDate(task.scheduled_at) : ''); }}>{labels.cancel}</button></div>
    </form> : <><div className={styles.taskCopy}><strong>{task.title}</strong><div className={styles.meta}><time dateTime={task.scheduled_at ?? undefined}>{dateLabel}</time>{material && <span>{material.title}</span>}</div></div><div className={styles.actions}>
      {task.concept_id && task.material_id && <Link href={`/study?material=${task.material_id}&concept=${task.concept_id}`}>{labels.study}</Link>}
      <button type="button" onClick={() => setEditing(true)}>{labels.edit}</button>
      <button type="button" disabled={busy} onClick={() => void operate(() => api.updateTask(task.id, { status: task.status === 'DONE' ? 'PENDING' : 'DONE' }))}>{task.status === 'DONE' ? labels.reopen : labels.complete}</button>
      <button type="button" disabled={busy} onClick={() => void operate(() => api.updateTask(task.id, { status: 'REMOVED' }))}>{labels.remove}</button>
    </div></>}
  </article>;
}

export function SuggestionEditor({ suggestion, plans, busy, operate, locale, labels }: {
  suggestion: StudySuggestion;
  plans: StudyPlan[];
  busy: boolean;
  operate: (action: () => Promise<unknown>) => Promise<void>;
  locale: 'pt-BR' | 'en-US';
  labels: { accept: string; ignore: string };
}) {
  const t = suggestionCopy[locale];
  const [title, setTitle] = useState(suggestion.title);
  const [minutes, setMinutes] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [planId, setPlanId] = useState('');
  return <article className={styles.suggestion}>
    <h3>{suggestion.title}</h3><p>{suggestion.reason}</p>
    <details><summary>{t.diagnosis}</summary><p>{suggestion.learning_evidence.prompt}</p><p>{suggestion.learning_evidence.diagnosis}</p></details>
    <form className={styles.form} onSubmit={(event) => {
      event.preventDefault();
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
        <label>{t.schedule}<input type="datetime-local" value={scheduledAt} onInput={(event) => setScheduledAt(event.currentTarget.value)} /></label>
        <label>{t.plan}<select value={planId} onChange={(event) => setPlanId(event.target.value)}><option value="">{t.noPlan}</option>{plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.title}</option>)}</select></label>
      </div>
      <div className={styles.inline}><button disabled={busy}>{labels.accept}</button><button type="button" disabled={busy} onClick={() => void operate(() => api.decideSuggestion(suggestion.id, { decision: 'IGNORED' }))}>{labels.ignore}</button></div>
    </form>
  </article>;
}
