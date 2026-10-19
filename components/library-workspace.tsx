'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { api, type ConceptCard, type ConceptRelation, type EditorialUnit, type KnowledgeNode, type LearningGoal, type MaterialSummary, type Shelf, type StudyAvailability, type StudyPlan, type StudySuggestion, type StudyTask, type TaskActivity } from '../lib/api';
import { useI18n } from '../lib/i18n';
import { useRealtimeRefresh } from './realtime-provider';
import { PlanBuilder } from './plan-builder';
import { GoalEditor } from './goal-editor';
import styles from './library-workspace.module.css';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

const copy = {
  'pt-BR': { title: 'Sua biblioteca', subtitle: 'Guarde fontes, organize o tempo e volte ao trecho certo.', shelves: 'Estante', cards: 'Fichário', desk: 'Mesa do Dia', calendar: 'Calendário', newShelf: 'Nova prateleira', add: 'Adicionar', remove: 'Remover', noShelf: 'Crie uma prateleira para reunir materiais.', unfiled: 'Sem prateleira', noMaterial: 'Adicione um material para começar.', deleteMaterial: 'Apagar material', deleteMaterialConfirm: 'Apagar este material e todo seu histórico de estudo?', source: 'Abrir fonte', outline: 'Índice do material', page: 'Página', unstructured: 'Texto completo · sem divisão editorial detectável', fileCard: 'Guardar ficha', removeCard: 'Retirar ficha', note: 'Minha anotação', save: 'Salvar', goal: 'Objetivo', newGoal: 'Novo objetivo', plan: 'Roteiro', newPlan: 'Novo roteiro', task: 'Tarefa', newTask: 'Nova tarefa', minutes: 'Minutos', date: 'Dia', time: 'Horário', available: 'Tempo disponível', load: 'Carga planejada', excess: 'Excesso', start: 'Começar', done: 'Concluir', reopen: 'Reabrir', postpone: 'Mover', suggestions: 'Sugestões explicadas', accept: 'Adicionar ao roteiro', ignore: 'Ignorar', noSuggestions: 'Nenhuma sugestão pendente.', noTasks: 'Nenhuma tarefa para este dia.', allTasks: 'Todas as tarefas', today: 'Hoje', failed: 'Não foi possível concluir. Tente novamente.', empty: 'Escolha um material para ver o índice e os conceitos.', relation: 'Relações', noRelations: 'Ainda não há relações com fonte verificada.', material: 'Material', description: 'Descrição', deadline: 'Prazo', titleLabel: 'Título', chooseActivity: 'Atividade', reason: 'Motivo', noPlan: 'Sem roteiro', noGoal: 'Sem objetivo', everyMaterial: 'Todos os materiais' },
  'en-US': { title: 'Your library', subtitle: 'Keep sources, organize your time, and return to the right excerpt.', shelves: 'Shelves', cards: 'Index cards', desk: 'Today’s Desk', calendar: 'Calendar', newShelf: 'New shelf', add: 'Add', remove: 'Remove', noShelf: 'Create a shelf to group materials.', unfiled: 'Unfiled', noMaterial: 'Add a material to begin.', deleteMaterial: 'Delete material', deleteMaterialConfirm: 'Delete this material and all its study history?', source: 'Open source', outline: 'Material outline', page: 'Page', unstructured: 'Full text · no reliable editorial structure detected', fileCard: 'File card', removeCard: 'Remove card', note: 'My note', save: 'Save', goal: 'Goal', newGoal: 'New goal', plan: 'Plan', newPlan: 'New plan', task: 'Task', newTask: 'New task', minutes: 'Minutes', date: 'Date', time: 'Time', available: 'Available time', load: 'Planned load', excess: 'Overload', start: 'Start', done: 'Complete', reopen: 'Reopen', postpone: 'Move', suggestions: 'Explained suggestions', accept: 'Add to plan', ignore: 'Ignore', noSuggestions: 'No pending suggestions.', noTasks: 'No tasks for this day.', allTasks: 'All tasks', today: 'Today', failed: 'Could not finish. Try again.', empty: 'Choose a material to see its outline and concepts.', relation: 'Relations', noRelations: 'No source-backed relations yet.', material: 'Material', description: 'Description', deadline: 'Deadline', titleLabel: 'Title', chooseActivity: 'Activity', reason: 'Reason', noPlan: 'No plan', noGoal: 'No goal', everyMaterial: 'All materials' },
} as const;

type View = 'shelves' | 'cards' | 'desk' | 'calendar';
const activities: TaskActivity[] = ['READ', 'EXPLAIN', 'RELATE', 'APPLY', 'REVISIT', 'PRACTICE'];
const activityLabels: Record<'pt-BR' | 'en-US', Record<TaskActivity, string>> = {
  'pt-BR': { READ: 'Ler', EXPLAIN: 'Explicar', RELATE: 'Relacionar', APPLY: 'Aplicar', REVISIT: 'Retomar', PRACTICE: 'Praticar' },
  'en-US': { READ: 'Read', EXPLAIN: 'Explain', RELATE: 'Relate', APPLY: 'Apply', REVISIT: 'Revisit', PRACTICE: 'Practice' },
};

const suggestionCopy = {
  'pt-BR': { diagnosis: 'Tentativa anterior', proposedTask: 'Ajuste a tarefa antes de aceitar', duration: 'Duração em minutos', schedule: 'Quando estudar', plan: 'Roteiro', noPlan: 'Sem roteiro', search: 'Buscar materiais' },
  'en-US': { diagnosis: 'Previous attempt', proposedTask: 'Edit the task before accepting', duration: 'Duration in minutes', schedule: 'When to study', plan: 'Plan', noPlan: 'No plan', search: 'Search materials' },
} as const;

export function LibraryWorkspace() {
  const { locale } = useI18n();
  const t = copy[locale];
  const [view, setView] = useState<View>('shelves');
  const [materials, setMaterials] = useState<MaterialSummary[]>([]);
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [cards, setCards] = useState<ConceptCard[]>([]);
  const [goals, setGoals] = useState<LearningGoal[]>([]);
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [suggestions, setSuggestions] = useState<StudySuggestion[]>([]);
  const [availability, setAvailability] = useState<StudyAvailability[]>([]);
  const [deskData, setDeskData] = useState<{ tasks: StudyTask[]; load: { plannedMinutes: number; availableMinutes: number; excessMinutes: number } } | null>(null);
  const [nodes, setNodes] = useState<KnowledgeNode[]>([]);
  const [outline, setOutline] = useState<EditorialUnit[]>([]);
  const [relations, setRelations] = useState<ConceptRelation[]>([]);
  const [materialId, setMaterialId] = useState('');
  const [shelfName, setShelfName] = useState('');
  const [materialSearch, setMaterialSearch] = useState('');
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [goalDeadline, setGoalDeadline] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskActivity, setTaskActivity] = useState<TaskActivity>('READ');
  const [taskPlanId, setTaskPlanId] = useState('');
  const [taskMaterialId, setTaskMaterialId] = useState('');
  const [taskMinutes, setTaskMinutes] = useState('40');
  const [taskDateTime, setTaskDateTime] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => new Intl.DateTimeFormat('en-CA').format(new Date()));
  const [availableMinutes, setAvailableMinutes] = useState(40);
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const [materialsData, shelvesData, cardsData, goalsData, plansData, tasksData, suggestionsData, availabilityData] = await Promise.all([
      api.materials(), api.shelves(), api.cards(), api.goals(), api.plans(), api.tasks(), api.suggestions(), api.availability(),
    ]);
    setMaterials(materialsData); setShelves(shelvesData); setCards(cardsData); setGoals(goalsData);
    setPlans(plansData); setTasks(tasksData); setSuggestions(suggestionsData); setAvailability(availabilityData);
    setMaterialId((current) => current && materialsData.some(({ id }) => id === current) ? current : materialsData[0]?.id ?? '');
  }, []);
  useEffect(() => { void refresh().catch(() => setError(t.failed)); }, [refresh, t.failed]);
  useRealtimeRefresh(() => { void refresh().catch(() => {}); });
  useEffect(() => {
    if (!materialId) { setNodes([]); setOutline([]); setRelations([]); return; }
    void Promise.all([api.knowledgeMap(materialId), api.outline(materialId), api.relations(materialId)]).then(([map, units, links]) => { setNodes(map); setOutline(units); setRelations(links); }).catch(() => setError(t.failed));
  }, [materialId, t.failed]);
  useEffect(() => {
    const weekday = new Date(`${selectedDate}T12:00:00Z`).getUTCDay();
    setAvailableMinutes(availability.find((item) => item.weekday === weekday)?.minutes ?? 0);
  }, [availability, selectedDate]);
  useEffect(() => { if (view === 'desk') void api.desk(selectedDate, timezone).then(setDeskData).catch(() => setError(t.failed)); }, [view, selectedDate, timezone, tasks, availability, t.failed]);
  const operate = async (action: () => Promise<unknown>) => { setBusy(true); setError(''); try { await action(); await refresh(); } catch { setError(t.failed); } finally { setBusy(false); } };
  const submit = (event: FormEvent, action: () => Promise<unknown>) => { event.preventDefault(); void operate(action); };
  const currentMaterial = materials.find(({ id }) => id === materialId);
  const visibleMaterials = materials.filter(({ title }) => title.toLocaleLowerCase(locale).includes(materialSearch.trim().toLocaleLowerCase(locale)));
  const sortedTasks = useMemo(() => tasks.filter(({ status }) => status !== 'REMOVED'), [tasks]);
  const dayTasks = deskData?.tasks ?? [];
  const planned = deskData?.load.plannedMinutes ?? 0;
  const sourceHref = (task: StudyTask) => task.material_id ? `/estudar?material=${task.material_id}${task.concept_id ? `&concept=${task.concept_id}` : ''}${task.unit_id ? `&unit=${task.unit_id}` : ''}${task.study_suggestions?.[0]?.learning_evidence.source_excerpt ? `&source=${encodeURIComponent(task.study_suggestions[0].learning_evidence.source_excerpt)}${task.study_suggestions[0].learning_evidence.source_offset != null ? `&offset=${task.study_suggestions[0].learning_evidence.source_offset}` : ""}` : ''}` : '/estudar';

  return <div className={styles.workspace}>
    <header className={styles.hero}><span>MASTERME · ATELIÊ DE ESTUDO</span><h1>{t.title}</h1><p>{t.subtitle}</p></header>
    <nav className={styles.tabs} aria-label={t.title}>{(['shelves', 'cards', 'desk', 'calendar'] as View[]).map((item) => <button key={item} type="button" aria-current={view === item ? 'page' : undefined} onClick={() => setView(item)}>{t[item]}</button>)}</nav>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {view === 'shelves' && <div className={styles.columns}>
      <section className={styles.paper}><h2>{t.shelves}</h2><label>{suggestionCopy[locale].search}<input type="search" value={materialSearch} onChange={(event) => setMaterialSearch(event.target.value)} /></label><form onSubmit={(event) => submit(event, async () => { await api.createShelf(shelfName.trim()); setShelfName(''); })} className={styles.inline}><label className={styles.grow}>{t.newShelf}<input required maxLength={80} value={shelfName} onChange={(event) => setShelfName(event.target.value)} /></label><button disabled={busy}>{t.add}</button></form>
        {!shelves.length && <p>{t.noShelf}</p>}
        {shelves.map((shelf) => <article className={styles.shelf} key={shelf.id}><div className={styles.row}><h3>{shelf.name}</h3><button type="button" disabled={busy} onClick={() => void operate(() => api.deleteShelf(shelf.id))}>{t.remove}</button></div><ul>{visibleMaterials.filter(({ id }) => shelf.shelf_materials.some((link) => link.material_id === id)).map((material) => <li key={material.id}><button type="button" onClick={() => setMaterialId(material.id)}>{material.title}</button><button type="button" disabled={busy} onClick={() => void operate(() => api.setShelfMaterial(shelf.id, material.id, false))} aria-label={`${t.remove} ${material.title}`}>×</button></li>)}</ul><label>{t.add} {t.material}<select value="" onChange={(event) => { if (event.target.value) void operate(() => api.setShelfMaterial(shelf.id, event.target.value, true)); }}><option value="">—</option>{materials.filter(({ id }) => !shelf.shelf_materials.some((link) => link.material_id === id)).map((material) => <option key={material.id} value={material.id}>{material.title}</option>)}</select></label></article>)}
        <h3>{t.unfiled}</h3><ul>{visibleMaterials.filter(({ id }) => !shelves.some((shelf) => shelf.shelf_materials.some((link) => link.material_id === id))).map((material) => <li key={material.id}><button type="button" onClick={() => setMaterialId(material.id)}>{material.title}</button></li>)}</ul>{!materials.length && <p>{t.noMaterial}</p>}
      </section>
      <section className={styles.paper}><h2>{t.outline}</h2><label>{t.material}<select value={materialId} onChange={(event) => setMaterialId(event.target.value)}>{materials.map((material) => <option key={material.id} value={material.id}>{material.title}</option>)}</select></label>{currentMaterial ? <><ol className={styles.outline}>{outline.map((unit) => <li key={unit.id} style={{ marginInlineStart: `${Math.max(0, unit.level - 1) * 16}px` }}><Link href={`/estudar?material=${materialId}&unit=${unit.id}`}>{unit.title ?? t.unstructured}{unit.pageNumber ? ` · ${t.page} ${unit.pageNumber}` : ''}</Link></li>)}</ol><div className={styles.inline}><Link href={`/estudar?material=${materialId}`}>{t.source} →</Link><button type="button" disabled={busy} onClick={() => { if (window.confirm(t.deleteMaterialConfirm)) void operate(() => api.deleteMaterial(materialId)); }}>{t.deleteMaterial}</button></div><h3>{t.relation}</h3>{relations.length ? <ul>{relations.map((relation) => <li key={relation.id} className={styles.concept}><strong>{relation.statement}</strong><p>{relation.justification}</p><blockquote>{relation.source_excerpt}</blockquote><Link href={`/estudar?material=${materialId}&source=${encodeURIComponent(relation.source_excerpt)}${relation.source_offset != null ? `&offset=${relation.source_offset}` : ""}`}>{t.source} →</Link></li>)}</ul> : <p className={styles.muted}>{t.noRelations}</p>}<h3>{t.cards}</h3><ul>{nodes.map(({ concept }) => <li key={concept.id} className={styles.concept}><strong>{concept.name}</strong><p>{concept.description}</p><button type="button" disabled={busy} onClick={() => void operate(() => cards.some((card) => card.concept_id === concept.id) ? api.deleteCard(concept.id) : api.saveCard(concept.id, ''))}>{cards.some((card) => card.concept_id === concept.id) ? t.removeCard : t.fileCard}</button></li>)}</ul></> : <p>{t.empty}</p>}</section>
    </div>}
    {view === 'cards' && <section className={styles.paper}><h2>{t.cards}</h2>{!cards.length && <p>{t.empty}</p>}{cards.map((card) => <CardEditor key={card.concept_id} card={card} busy={busy} save={(note) => operate(() => api.saveCard(card.concept_id, note))} remove={() => operate(() => api.deleteCard(card.concept_id))} labels={t} />)}</section>}
    {view === 'desk' && <div className={styles.columns}><section className={styles.paper}><h2>{t.desk}</h2><div className={styles.inline}><label>{t.date}<input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} /></label><form onSubmit={(event) => submit(event, () => api.setAvailability(new Date(`${selectedDate}T12:00:00Z`).getUTCDay(), availableMinutes, timezone))} className={styles.inline}><label>{t.available}<input type="number" min="0" max="1440" value={availableMinutes} onChange={(event) => setAvailableMinutes(Number(event.target.value))} /></label><button disabled={busy}>{t.save}</button></form></div><p>{t.load}: <strong>{planned} / {deskData?.load.availableMinutes ?? 0} min</strong>{(deskData?.load.excessMinutes ?? 0) > 0 && <strong className={styles.overload}> · {t.excess}: {deskData?.load.excessMinutes} min</strong>}</p>{!dayTasks.length && <p>{t.noTasks}</p>}{dayTasks.map((task) => <TaskRow key={task.id} task={task} busy={busy} open={sourceHref(task)} setStatus={(status) => operate(() => api.updateTask(task.id, { status }))} labels={t} />)}</section><section className={styles.paper}><h2>{t.suggestions}</h2>{!suggestions.some(({ status }) => status === 'PENDING') && <p>{t.noSuggestions}</p>}{suggestions.filter(({ status }) => status === 'PENDING').map((suggestion) => <SuggestionEditor key={suggestion.id} suggestion={suggestion} plans={plans} busy={busy} operate={operate} locale={locale} labels={t} />)}</section></div>}
    {view === 'calendar' && <div className={styles.columns}><section className={styles.paper}><h2>{t.goal} & {t.plan}</h2><form onSubmit={(event) => submit(event, async () => { await api.createGoal(goalTitle.trim(), goalDescription.trim(), goalDeadline || undefined); setGoalTitle(''); setGoalDescription(''); setGoalDeadline(''); })} className={styles.form}><h3>{t.newGoal}</h3><label>{t.titleLabel}<input required maxLength={160} value={goalTitle} onChange={(event) => setGoalTitle(event.target.value)} /></label><label>{t.description}<textarea maxLength={2000} value={goalDescription} onChange={(event) => setGoalDescription(event.target.value)} /></label><label>{t.deadline}<input type="date" value={goalDeadline} onChange={(event) => setGoalDeadline(event.target.value)} /></label><button disabled={busy}>{t.add}</button></form><ul>{goals.map((goal) => <li key={goal.id}><GoalEditor key={`${goal.id}:${goal.title}:${goal.description}:${goal.deadline ?? ''}`} goal={goal} busy={busy} operate={operate} /></li>)}</ul><PlanBuilder materials={materials} goals={goals} plans={plans} tasks={tasks} busy={busy} operate={operate} /></section>
      <section className={styles.paper}><h2>{t.calendar}</h2><div className={styles.calendar}><FullCalendar plugins={[dayGridPlugin, interactionPlugin]} initialView="dayGridMonth" locale={locale} height="auto" events={sortedTasks.filter((task) => task.scheduled_at).map((task) => ({ id: task.id, title: task.title, start: task.scheduled_at ?? undefined, backgroundColor: task.status === 'DONE' ? '#4a725f' : '#956b3c' }))} editable eventDrop={(info) => { const start = info.event.start; if (!start) return; void api.updateTask(info.event.id, { scheduledAt: start.toISOString() }).then(() => refresh()).catch(() => { info.revert(); setError(t.failed); }); }} dateClick={(info) => { setSelectedDate(info.dateStr); setView('desk'); }} /></div><form onSubmit={(event) => submit(event, async () => { await api.createTask({ title: taskTitle.trim(), activityType: taskActivity, planId: taskPlanId || undefined, materialId: taskMaterialId || undefined, durationMinutes: taskMinutes ? Number(taskMinutes) : undefined, scheduledAt: taskDateTime ? new Date(taskDateTime).toISOString() : undefined }); setTaskTitle(''); })} className={styles.form}><h3>{t.newTask}</h3><label>{t.titleLabel}<input required maxLength={160} value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} /></label><div className={styles.inline}><label>{t.chooseActivity}<select value={taskActivity} onChange={(event) => setTaskActivity(event.target.value as TaskActivity)}>{activities.map((activity) => <option key={activity} value={activity}>{activityLabels[locale][activity]}</option>)}</select></label><label>{t.plan}<select value={taskPlanId} onChange={(event) => setTaskPlanId(event.target.value)}><option value="">{t.noPlan}</option>{plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.title}</option>)}</select></label></div><label>{t.material}<select value={taskMaterialId} onChange={(event) => setTaskMaterialId(event.target.value)}><option value="">{t.everyMaterial}</option>{materials.map((material) => <option key={material.id} value={material.id}>{material.title}</option>)}</select></label><div className={styles.inline}><label>{t.minutes}<input type="number" min="1" max="480" value={taskMinutes} onChange={(event) => setTaskMinutes(event.target.value)} /></label><label>{t.date} / {t.time}<input type="datetime-local" value={taskDateTime} onChange={(event) => setTaskDateTime(event.target.value)} /></label></div><button disabled={busy}>{t.add}</button></form><h3>{t.allTasks}</h3><ul>{sortedTasks.map((task) => <li key={task.id} className={styles.task}><TaskRow task={task} busy={busy} open={sourceHref(task)} setStatus={(status) => operate(() => api.updateTask(task.id, { status }))} labels={t} /><label>{t.postpone}<input type="datetime-local" defaultValue={task.scheduled_at ? new Date(task.scheduled_at).toISOString().slice(0, 16) : ''} onChange={(event) => { if (event.target.value) void operate(() => api.updateTask(task.id, { scheduledAt: new Date(event.target.value).toISOString() })); }} /></label></li>)}</ul></section></div>}
  </div>;
}

function CardEditor({ card, busy, save, remove, labels }: { card: ConceptCard; busy: boolean; save: (note: string) => Promise<unknown>; remove: () => Promise<unknown>; labels: typeof copy['pt-BR'] | typeof copy['en-US'] }) {
  const [note, setNote] = useState(card.note);
  return <article className={styles.card}><h3>{card.concepts.name}</h3><blockquote>{card.concepts.source_excerpt}</blockquote><form onSubmit={(event) => { event.preventDefault(); void save(note); }} className={styles.form}><label>{labels.note}<textarea value={note} maxLength={3000} onChange={(event) => setNote(event.target.value)} /></label><div className={styles.inline}><button disabled={busy}>{labels.save}</button><button type="button" disabled={busy} onClick={() => void remove()}>{labels.removeCard}</button><Link href={`/estudar?material=${card.concepts.material_id}&concept=${card.concept_id}`}>{labels.source} →</Link></div></form></article>;
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
    <details><summary>{t.diagnosis}</summary><p>{suggestion.learning_evidence.prompt}</p><p>{suggestion.learning_evidence.diagnosis}</p><blockquote>{suggestion.learning_evidence.source_excerpt}</blockquote></details>
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

function TaskRow({ task, busy, open, setStatus, labels }: { task: StudyTask; busy: boolean; open: string; setStatus: (status: StudyTask['status']) => Promise<unknown>; labels: typeof copy['pt-BR'] | typeof copy['en-US'] }) {
  const previous = task.study_suggestions?.[0]?.learning_evidence;
  return <article className={styles.task}><div><strong>{task.title}</strong><small>{task.duration_minutes ? ` · ${task.duration_minutes} min` : ''}{task.reason ? ` · ${task.reason}` : ''}</small>{previous && <details><summary>{labels.reason}: {previous.status}</summary><p>{previous.prompt}</p><p>{previous.diagnosis}</p><blockquote>{previous.source_excerpt}</blockquote></details>}</div><div className={styles.inline}><Link href={open}>{labels.start} →</Link><button type="button" disabled={busy} onClick={() => void setStatus(task.status === 'DONE' ? 'PENDING' : 'DONE')}>{task.status === 'DONE' ? labels.reopen : labels.done}</button><button type="button" disabled={busy} onClick={() => void setStatus('REMOVED')}>{labels.remove}</button></div></article>;
}
