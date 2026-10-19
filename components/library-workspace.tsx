'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { api, type ConceptCard, type EditorialUnit, type KnowledgeNode, type LearningGoal, type MaterialSummary, type Shelf, type StudyAvailability, type StudyPlan, type StudySuggestion, type StudyTask, type TaskActivity } from '../lib/api';
import { useI18n } from '../lib/i18n';
import { useRealtimeRefresh } from './realtime-provider';
import styles from './library-workspace.module.css';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

const copy = {
  'pt-BR': { title: 'Sua biblioteca', subtitle: 'Guarde fontes, organize o tempo e volte ao trecho certo.', shelves: 'Estante', cards: 'Fichário', desk: 'Mesa do Dia', calendar: 'Calendário', newShelf: 'Nova prateleira', add: 'Adicionar', remove: 'Remover', noShelf: 'Crie uma prateleira para reunir materiais.', unfiled: 'Sem prateleira', noMaterial: 'Adicione um material para começar.', source: 'Abrir fonte', outline: 'Índice do material', unstructured: 'Texto completo · sem divisão editorial detectável', fileCard: 'Guardar ficha', removeCard: 'Retirar ficha', note: 'Minha anotação', save: 'Salvar', goal: 'Objetivo', newGoal: 'Novo objetivo', plan: 'Roteiro', newPlan: 'Novo roteiro', task: 'Tarefa', newTask: 'Nova tarefa', minutes: 'Minutos', date: 'Dia', time: 'Horário', available: 'Tempo disponível', load: 'Carga planejada', excess: 'Excesso', start: 'Começar', done: 'Concluir', reopen: 'Reabrir', postpone: 'Mover', suggestions: 'Sugestões explicadas', accept: 'Adicionar ao roteiro', ignore: 'Ignorar', noSuggestions: 'Nenhuma sugestão pendente.', noTasks: 'Nenhuma tarefa para este dia.', allTasks: 'Todas as tarefas', today: 'Hoje', failed: 'Não foi possível concluir. Tente novamente.', empty: 'Escolha um material para ver o índice e os conceitos.', relation: 'Relações', noRelations: 'Ainda não há relações com fonte verificada.', material: 'Material', description: 'Descrição', deadline: 'Prazo', titleLabel: 'Título', chooseActivity: 'Atividade', reason: 'Motivo', noPlan: 'Sem roteiro', noGoal: 'Sem objetivo', everyMaterial: 'Todos os materiais' },
  'en-US': { title: 'Your library', subtitle: 'Keep sources, organize your time, and return to the right excerpt.', shelves: 'Shelves', cards: 'Index cards', desk: 'Today’s Desk', calendar: 'Calendar', newShelf: 'New shelf', add: 'Add', remove: 'Remove', noShelf: 'Create a shelf to group materials.', unfiled: 'Unfiled', noMaterial: 'Add a material to begin.', source: 'Open source', outline: 'Material outline', unstructured: 'Full text · no reliable editorial structure detected', fileCard: 'File card', removeCard: 'Remove card', note: 'My note', save: 'Save', goal: 'Goal', newGoal: 'New goal', plan: 'Plan', newPlan: 'New plan', task: 'Task', newTask: 'New task', minutes: 'Minutes', date: 'Date', time: 'Time', available: 'Available time', load: 'Planned load', excess: 'Overload', start: 'Start', done: 'Complete', reopen: 'Reopen', postpone: 'Move', suggestions: 'Explained suggestions', accept: 'Add to plan', ignore: 'Ignore', noSuggestions: 'No pending suggestions.', noTasks: 'No tasks for this day.', allTasks: 'All tasks', today: 'Today', failed: 'Could not finish. Try again.', empty: 'Choose a material to see its outline and concepts.', relation: 'Relations', noRelations: 'No source-backed relations yet.', material: 'Material', description: 'Description', deadline: 'Deadline', titleLabel: 'Title', chooseActivity: 'Activity', reason: 'Reason', noPlan: 'No plan', noGoal: 'No goal', everyMaterial: 'All materials' },
} as const;

type View = 'shelves' | 'cards' | 'desk' | 'calendar';
const views: View[] = ['shelves', 'cards', 'desk', 'calendar'];
const viewDetails = {
  'pt-BR': { shelves: 'Materiais e fontes', cards: 'Conceitos guardados', desk: 'Ações de hoje', calendar: 'Tempo e roteiro' },
  'en-US': { shelves: 'Materials and sources', cards: 'Saved concepts', desk: 'Today’s actions', calendar: 'Time and plan' },
} as const;
const activities: TaskActivity[] = ['READ', 'EXPLAIN', 'RELATE', 'APPLY', 'REVISIT', 'PRACTICE'];
const activityLabels: Record<'pt-BR' | 'en-US', Record<TaskActivity, string>> = {
  'pt-BR': { READ: 'Ler', EXPLAIN: 'Explicar', RELATE: 'Relacionar', APPLY: 'Aplicar', REVISIT: 'Retomar', PRACTICE: 'Praticar' },
  'en-US': { READ: 'Read', EXPLAIN: 'Explain', RELATE: 'Relate', APPLY: 'Apply', REVISIT: 'Revisit', PRACTICE: 'Practice' },
};

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
  const [materialId, setMaterialId] = useState('');
  const [shelfName, setShelfName] = useState('');
  const [materialSearch, setMaterialSearch] = useState('');
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [goalDeadline, setGoalDeadline] = useState('');
  const [planTitle, setPlanTitle] = useState('');
  const [planGoalId, setPlanGoalId] = useState('');
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
    if (!materialId) { setNodes([]); setOutline([]); return; }
    void Promise.all([api.knowledgeMap(materialId), api.outline(materialId)]).then(([map, units]) => { setNodes(map); setOutline(units); }).catch(() => setError(t.failed));
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
  const sourceHref = (task: StudyTask) => task.material_id ? `/estudar?material=${task.material_id}${task.concept_id ? `&concept=${task.concept_id}` : ''}` : '/estudar';

  return <div className={styles.workspace}>
    <header className={styles.hero}><span>MASTERME · ATELIÊ DE ESTUDO</span><h1>{t.title}</h1><p>{t.subtitle}</p></header>
    <nav className={styles.tabs} aria-label={t.title}>{views.map((item) => <button key={item} type="button" aria-current={view === item ? 'page' : undefined} onClick={() => setView(item)}><span className={styles.tabTitle}>{t[item]}</span><span className={styles.tabDetail}>{viewDetails[locale][item]}</span></button>)}</nav>
    <p role="alert" className={styles.error}>{error}</p>
    <div className={`${styles.stage} ${view === 'calendar' ? styles.calendarStage : ''}`}>
    {view === 'shelves' && <>
      <section className={styles.paper}><h2>{t.shelves}</h2><label>Buscar materiais<input type="search" value={materialSearch} onChange={(event) => setMaterialSearch(event.target.value)} /></label><form onSubmit={(event) => submit(event, async () => { await api.createShelf(shelfName.trim()); setShelfName(''); })} className={styles.inline}><label className={styles.grow}>{t.newShelf}<input required maxLength={80} value={shelfName} onChange={(event) => setShelfName(event.target.value)} /></label><button disabled={busy}>{t.add}</button></form>
        {!shelves.length && <p>{t.noShelf}</p>}
        {shelves.map((shelf) => <article className={styles.shelf} key={shelf.id}><div className={styles.row}><h3>{shelf.name}</h3><button type="button" disabled={busy} onClick={() => void operate(() => api.deleteShelf(shelf.id))}>{t.remove}</button></div><ul>{visibleMaterials.filter(({ id }) => shelf.shelf_materials.some((link) => link.material_id === id)).map((material) => <li key={material.id}><button type="button" onClick={() => setMaterialId(material.id)}>{material.title}</button><button type="button" disabled={busy} onClick={() => void operate(() => api.setShelfMaterial(shelf.id, material.id, false))} aria-label={`${t.remove} ${material.title}`}>×</button></li>)}</ul><label>{t.add} {t.material}<select value="" onChange={(event) => { if (event.target.value) void operate(() => api.setShelfMaterial(shelf.id, event.target.value, true)); }}><option value="">—</option>{materials.filter(({ id }) => !shelf.shelf_materials.some((link) => link.material_id === id)).map((material) => <option key={material.id} value={material.id}>{material.title}</option>)}</select></label></article>)}
        <h3>{t.unfiled}</h3><ul>{visibleMaterials.filter(({ id }) => !shelves.some((shelf) => shelf.shelf_materials.some((link) => link.material_id === id))).map((material) => <li key={material.id}><button type="button" onClick={() => setMaterialId(material.id)}>{material.title}</button></li>)}</ul>{!materials.length && <p>{t.noMaterial}</p>}
      </section>
      <section className={styles.paper}><h2>{t.outline}</h2><label>{t.material}<select value={materialId} onChange={(event) => setMaterialId(event.target.value)}>{materials.map((material) => <option key={material.id} value={material.id}>{material.title}</option>)}</select></label>{currentMaterial ? <><ol className={styles.outline}>{outline.map((unit) => <li key={unit.id} style={{ marginInlineStart: `${Math.max(0, unit.level - 1) * 16}px` }}>{unit.title ?? t.unstructured}</li>)}</ol><Link href={`/estudar?material=${materialId}`}>{t.source} →</Link><h3>{t.relation}</h3><p className={styles.muted}>{t.noRelations}</p><h3>{t.cards}</h3><ul>{nodes.map(({ concept }) => <li key={concept.id} className={styles.concept}><strong>{concept.name}</strong><p>{concept.description}</p><button type="button" disabled={busy} onClick={() => void operate(() => cards.some((card) => card.concept_id === concept.id) ? api.deleteCard(concept.id) : api.saveCard(concept.id, ''))}>{cards.some((card) => card.concept_id === concept.id) ? t.removeCard : t.fileCard}</button></li>)}</ul></> : <p>{t.empty}</p>}</section>
    </>}
    {view === 'cards' && <><section className={styles.paper}><h2>{t.cards}</h2>{!cards.length && <p>{t.empty}</p>}{cards.map((card) => <CardEditor key={card.concept_id} card={card} busy={busy} save={(note) => operate(() => api.saveCard(card.concept_id, note))} remove={() => operate(() => api.deleteCard(card.concept_id))} labels={t} />)}</section>
      <section className={styles.paper}><h2>{t.outline}</h2><label>{t.material}<select value={materialId} onChange={(event) => setMaterialId(event.target.value)}>{materials.map((material) => <option key={material.id} value={material.id}>{material.title}</option>)}</select></label>{currentMaterial ? <><ol className={styles.outline}>{outline.map((unit) => <li key={unit.id} style={{ marginInlineStart: `${Math.max(0, unit.level - 1) * 16}px` }}>{unit.title ?? t.unstructured}</li>)}</ol><Link href={`/estudar?material=${materialId}`}>{t.source} →</Link><h3>{t.relation}</h3><p className={styles.muted}>{t.noRelations}</p><h3>{t.cards}</h3><ul>{nodes.map(({ concept }) => <li key={concept.id} className={styles.concept}><strong>{concept.name}</strong><p>{concept.description}</p><button type="button" disabled={busy} onClick={() => void operate(() => cards.some((card) => card.concept_id === concept.id) ? api.deleteCard(concept.id) : api.saveCard(concept.id, ''))}>{cards.some((card) => card.concept_id === concept.id) ? t.removeCard : t.fileCard}</button></li>)}</ul></> : <p>{t.empty}</p>}</section></>}
    {view === 'desk' && <><section className={styles.paper}><h2>{t.desk}</h2><div className={styles.inline}><label>{t.date}<input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} /></label><form onSubmit={(event) => submit(event, () => api.setAvailability(new Date(`${selectedDate}T12:00:00Z`).getUTCDay(), availableMinutes, timezone))} className={styles.inline}><label>{t.available}<input type="number" min="0" max="1440" value={availableMinutes} onChange={(event) => setAvailableMinutes(Number(event.target.value))} /></label><button disabled={busy}>{t.save}</button></form></div><p>{t.load}: <strong>{planned} / {deskData?.load.availableMinutes ?? 0} min</strong>{(deskData?.load.excessMinutes ?? 0) > 0 && <strong className={styles.overload}> · {t.excess}: {deskData?.load.excessMinutes} min</strong>}</p>{!dayTasks.length && <p>{t.noTasks}</p>}{dayTasks.map((task) => <TaskRow key={task.id} task={task} busy={busy} open={sourceHref(task)} setStatus={(status) => operate(() => api.updateTask(task.id, { status }))} labels={t} />)}</section><section className={styles.paper}><h2>{t.suggestions}</h2>{!suggestions.some(({ status }) => status === 'PENDING') && <p>{t.noSuggestions}</p>}{suggestions.filter(({ status }) => status === 'PENDING').map((suggestion) => <article className={styles.suggestion} key={suggestion.id}><h3>{suggestion.title}</h3><p>{suggestion.reason}</p><blockquote>{suggestion.learning_evidence.source_excerpt}</blockquote><div className={styles.inline}><button disabled={busy} onClick={() => void operate(() => api.decideSuggestion(suggestion.id, 'ACCEPTED'))}>{t.accept}</button><button disabled={busy} onClick={() => void operate(() => api.decideSuggestion(suggestion.id, 'IGNORED'))}>{t.ignore}</button></div></article>)}</section></>}
    {view === 'calendar' && <><section className={styles.paper}><h2>{t.goal} & {t.plan}</h2><form onSubmit={(event) => submit(event, async () => { await api.createGoal(goalTitle.trim(), goalDescription.trim(), goalDeadline || undefined); setGoalTitle(''); setGoalDescription(''); setGoalDeadline(''); })} className={styles.form}><h3>{t.newGoal}</h3><label>{t.titleLabel}<input required maxLength={160} value={goalTitle} onChange={(event) => setGoalTitle(event.target.value)} /></label><label>{t.description}<textarea maxLength={2000} value={goalDescription} onChange={(event) => setGoalDescription(event.target.value)} /></label><label>{t.deadline}<input type="date" value={goalDeadline} onChange={(event) => setGoalDeadline(event.target.value)} /></label><button disabled={busy}>{t.add}</button></form><ul>{goals.map((goal) => <li key={goal.id}><strong>{goal.title}</strong>{goal.deadline && <small> · {new Date(goal.deadline).toLocaleDateString(locale)}</small>}<p>{goal.description}</p></li>)}</ul><form onSubmit={(event) => submit(event, async () => { await api.createPlan(planTitle.trim(), planGoalId || undefined); setPlanTitle(''); })} className={styles.form}><h3>{t.newPlan}</h3><label>{t.titleLabel}<input required maxLength={160} value={planTitle} onChange={(event) => setPlanTitle(event.target.value)} /></label><label>{t.goal}<select value={planGoalId} onChange={(event) => setPlanGoalId(event.target.value)}><option value="">{t.noGoal}</option>{goals.map((goal) => <option value={goal.id} key={goal.id}>{goal.title}</option>)}</select></label><button disabled={busy}>{t.add}</button></form><ul>{plans.map((plan) => <li key={plan.id}>{plan.title}</li>)}</ul></section>
      <section className={styles.paper}><h2>{t.calendar}</h2><div className={styles.calendar}><FullCalendar plugins={[dayGridPlugin, interactionPlugin]} initialView="dayGridMonth" locale={locale} height="auto" events={sortedTasks.filter((task) => task.scheduled_at).map((task) => ({ id: task.id, title: task.title, start: task.scheduled_at ?? undefined, backgroundColor: task.status === 'DONE' ? '#6ea887' : undefined }))} editable eventDrop={(info) => { const start = info.event.start; if (!start) return; void api.updateTask(info.event.id, { scheduledAt: start.toISOString() }).then(() => refresh()).catch(() => { info.revert(); setError(t.failed); }); }} dateClick={(info) => { setSelectedDate(info.dateStr); setView('desk'); }} /></div><form onSubmit={(event) => submit(event, async () => { await api.createTask({ title: taskTitle.trim(), activityType: taskActivity, planId: taskPlanId || undefined, materialId: taskMaterialId || undefined, durationMinutes: taskMinutes ? Number(taskMinutes) : undefined, scheduledAt: taskDateTime ? new Date(taskDateTime).toISOString() : undefined }); setTaskTitle(''); })} className={styles.form}><h3>{t.newTask}</h3><label>{t.titleLabel}<input required maxLength={160} value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} /></label><div className={styles.inline}><label>{t.chooseActivity}<select value={taskActivity} onChange={(event) => setTaskActivity(event.target.value as TaskActivity)}>{activities.map((activity) => <option key={activity} value={activity}>{activityLabels[locale][activity]}</option>)}</select></label><label>{t.plan}<select value={taskPlanId} onChange={(event) => setTaskPlanId(event.target.value)}><option value="">{t.noPlan}</option>{plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.title}</option>)}</select></label></div><label>{t.material}<select value={taskMaterialId} onChange={(event) => setTaskMaterialId(event.target.value)}><option value="">{t.everyMaterial}</option>{materials.map((material) => <option key={material.id} value={material.id}>{material.title}</option>)}</select></label><div className={styles.inline}><label>{t.minutes}<input type="number" min="1" max="480" value={taskMinutes} onChange={(event) => setTaskMinutes(event.target.value)} /></label><label>{t.date} / {t.time}<input type="datetime-local" value={taskDateTime} onChange={(event) => setTaskDateTime(event.target.value)} /></label></div><button disabled={busy}>{t.add}</button></form><h3>{t.allTasks}</h3><ul>{sortedTasks.map((task) => <li key={task.id} className={styles.task}><TaskRow task={task} busy={busy} open={sourceHref(task)} setStatus={(status) => operate(() => api.updateTask(task.id, { status }))} labels={t} /><label>{t.postpone}<input type="datetime-local" defaultValue={task.scheduled_at ? new Date(task.scheduled_at).toISOString().slice(0, 16) : ''} onChange={(event) => { if (event.target.value) void operate(() => api.updateTask(task.id, { scheduledAt: new Date(event.target.value).toISOString() })); }} /></label></li>)}</ul></section></>}
    </div>
  </div>;
}

function CardEditor({ card, busy, save, remove, labels }: { card: ConceptCard; busy: boolean; save: (note: string) => Promise<unknown>; remove: () => Promise<unknown>; labels: typeof copy['pt-BR'] | typeof copy['en-US'] }) {
  const [note, setNote] = useState(card.note);
  return <article className={styles.card}><h3>{card.concepts.name}</h3><blockquote>{card.concepts.source_excerpt}</blockquote><form onSubmit={(event) => { event.preventDefault(); void save(note); }} className={styles.form}><label>{labels.note}<textarea value={note} maxLength={3000} onChange={(event) => setNote(event.target.value)} /></label><div className={styles.inline}><button disabled={busy}>{labels.save}</button><button type="button" disabled={busy} onClick={() => void remove()}>{labels.removeCard}</button><Link href={`/estudar?material=${card.concepts.material_id}&concept=${card.concept_id}`}>{labels.source} →</Link></div></form></article>;
}

function TaskRow({ task, busy, open, setStatus, labels }: { task: StudyTask; busy: boolean; open: string; setStatus: (status: StudyTask['status']) => Promise<unknown>; labels: typeof copy['pt-BR'] | typeof copy['en-US'] }) {
  return <article className={styles.task}><div><strong>{task.title}</strong><small>{task.duration_minutes ? ` · ${task.duration_minutes} min` : ''}{task.reason ? ` · ${task.reason}` : ''}</small></div><div className={styles.inline}><Link href={open}>{labels.start} →</Link><button type="button" disabled={busy} onClick={() => void setStatus(task.status === 'DONE' ? 'PENDING' : 'DONE')}>{task.status === 'DONE' ? labels.reopen : labels.done}</button><button type="button" disabled={busy} onClick={() => void setStatus('REMOVED')}>{labels.remove}</button></div></article>;
}
