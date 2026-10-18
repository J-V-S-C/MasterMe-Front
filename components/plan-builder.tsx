'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { api, type LearningGoal, type MaterialSummary, type StudyPlan, type StudyTask } from '../lib/api';
import { useI18n } from '../lib/i18n';
import styles from './library-workspace.module.css';

const labels = {
  'pt-BR': { newPlan: 'Novo roteiro', title: 'Título', goal: 'Objetivo', noGoal: 'Sem objetivo', materials: 'Materiais na ordem escolhida', add: 'Adicionar', save: 'Salvar roteiro', up: 'Subir', down: 'Descer', remove: 'Retirar', none: 'Nenhum material vinculado: há uma lacuna no acervo deste objetivo.', unverified: 'Materiais vinculados; confirme se cobrem o objetivo antes de considerar o estudo planejado.', limit: 'Máximo de 30 materiais por roteiro.', tasks: 'Ordem das tarefas', saveTasks: 'Salvar ordem das tarefas' },
  'en-US': { newPlan: 'New plan', title: 'Title', goal: 'Goal', noGoal: 'No goal', materials: 'Materials in your chosen order', add: 'Add', save: 'Save plan', up: 'Move up', down: 'Move down', remove: 'Remove', none: 'No material linked: this goal has a gap in your collection.', unverified: 'Materials linked; confirm that they cover the goal before considering it planned.', limit: 'Maximum of 30 materials per plan.', tasks: 'Task order', saveTasks: 'Save task order' },
} as const;

export function PlanBuilder({ materials, goals, plans, tasks, busy, operate }: {
  materials: MaterialSummary[];
  goals: LearningGoal[];
  plans: StudyPlan[];
  tasks: StudyTask[];
  busy: boolean;
  operate: (action: () => Promise<unknown>) => Promise<void>;
}) {
  const { locale } = useI18n();
  const t = labels[locale];
  const [title, setTitle] = useState('');
  const [goalId, setGoalId] = useState('');
  const [materialIds, setMaterialIds] = useState<string[]>([]);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    void operate(async () => {
      await api.createPlan(title.trim(), goalId || undefined, materialIds);
      setTitle(''); setGoalId(''); setMaterialIds([]);
    });
  };
  return <>
    <form onSubmit={submit} className={styles.form}>
      <h3>{t.newPlan}</h3>
      <label>{t.title}<input required maxLength={160} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
      <label>{t.goal}<select value={goalId} onChange={(event) => setGoalId(event.target.value)}><option value="">{t.noGoal}</option>{goals.map((goal) => <option value={goal.id} key={goal.id}>{goal.title}</option>)}</select></label>
      <fieldset><legend>{t.materials}</legend>{materials.map((material) => <label key={material.id}>
        <input type="checkbox" disabled={busy || (materialIds.length >= 30 && !materialIds.includes(material.id))} checked={materialIds.includes(material.id)} onChange={(event) => setMaterialIds((current) => event.target.checked ? [...current, material.id] : current.filter((id) => id !== material.id))} /> {material.title}
      </label>)}</fieldset>
      {materialIds.length >= 30 && <p>{t.limit}</p>}
      <button disabled={busy}>{t.add}</button>
    </form>
    <ul>{plans.map((plan) => <li key={plan.id}><PlanEditor plan={plan} materials={materials} goals={goals} tasks={tasks} busy={busy} operate={operate} labels={t} /></li>)}</ul>
  </>;
}

function PlanEditor({ plan, materials, goals, tasks, busy, operate, labels: t }: {
  plan: StudyPlan;
  materials: MaterialSummary[];
  goals: LearningGoal[];
  tasks: StudyTask[];
  busy: boolean;
  operate: (action: () => Promise<unknown>) => Promise<void>;
  labels: typeof labels['pt-BR'] | typeof labels['en-US'];
}) {
  const planTasks = tasks.filter((task) => task.plan_id === plan.id && task.status !== 'REMOVED').sort((a, b) => a.sort_order - b.sort_order);
  const [taskIds, setTaskIds] = useState(planTasks.map(({ id }) => id));
  const [title, setTitle] = useState(plan.title);
  const [goalId, setGoalId] = useState(plan.goal_id ?? '');
  const [ids, setIds] = useState(plan.study_plan_materials.map(({ material_id }) => material_id));
  useEffect(() => {
    setTitle(plan.title); setGoalId(plan.goal_id ?? '');
    setIds(plan.study_plan_materials.map(({ material_id }) => material_id));
  }, [plan]);
  useEffect(() => { setTaskIds(planTasks.map(({ id }) => id)); }, [tasks, plan.id]);
  const move = (index: number, direction: -1 | 1) => setIds((current) => {
    const next = [...current];
    const other = index + direction;
    if (other < 0 || other >= next.length) return current;
    [next[index], next[other]] = [next[other]!, next[index]!];
    return next;
  });
  return <form className={styles.form} onSubmit={(event) => {
    event.preventDefault();
    void operate(() => api.updatePlan(plan.id, { title: title.trim(), goalId: goalId || null, materialIds: ids }));
  }}>
    <label>{t.title}<input required maxLength={160} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
    <label>{t.goal}<select value={goalId} onChange={(event) => setGoalId(event.target.value)}><option value="">{t.noGoal}</option>{goals.map((goal) => <option value={goal.id} key={goal.id}>{goal.title}</option>)}</select></label>
    <strong>{t.materials}</strong>
    <ol>{ids.map((id, index) => <li key={id}>
      {materials.find((material) => material.id === id)?.title ?? id}
      <button type="button" disabled={busy || index === 0} onClick={() => move(index, -1)} aria-label={`${t.up}: ${id}`}>↑</button>
      <button type="button" disabled={busy || index === ids.length - 1} onClick={() => move(index, 1)} aria-label={`${t.down}: ${id}`}>↓</button>
      <button type="button" disabled={busy} onClick={() => setIds((current) => current.filter((item) => item !== id))} aria-label={`${t.remove}: ${materials.find((material) => material.id === id)?.title ?? id}`}>{t.remove}</button>
    </li>)}</ol>
    <label>{t.add} {t.materials}<select disabled={busy || ids.length >= 30} value="" onChange={(event) => { if (event.target.value) setIds((current) => [...current, event.target.value]); }}><option value="">—</option>{materials.filter(({ id }) => !ids.includes(id)).map((material) => <option key={material.id} value={material.id}>{material.title}</option>)}</select></label>
    {ids.length >= 30 && <p>{t.limit}</p>}
    {goalId && <p>{ids.length ? t.unverified : t.none}</p>}
    <button disabled={busy}>{t.save}</button>
    {taskIds.length > 0 && <div><strong>{t.tasks}</strong><ol>{taskIds.map((id, index) => <li key={id}>
      {planTasks.find((task) => task.id === id)?.title ?? id}
      <button type="button" disabled={busy || index === 0} onClick={() => setTaskIds((current) => swap(current, index, -1))} aria-label={`${t.up}: ${planTasks.find((task) => task.id === id)?.title ?? id}`}>↑</button>
      <button type="button" disabled={busy || index === taskIds.length - 1} onClick={() => setTaskIds((current) => swap(current, index, 1))} aria-label={`${t.down}: ${planTasks.find((task) => task.id === id)?.title ?? id}`}>↓</button>
    </li>)}</ol><button type="button" disabled={busy} onClick={() => void operate(() => api.reorderPlanTasks(plan.id, taskIds))}>{t.saveTasks}</button></div>}

  </form>;
}

function swap(ids: string[], index: number, direction: -1 | 1): string[] {
  const target = index + direction;
  if (target < 0 || target >= ids.length) return ids;
  const next = [...ids];
  [next[index], next[target]] = [next[target]!, next[index]!];
  return next;
}
