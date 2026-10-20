'use client';

import type { FormEvent } from 'react';
import { api, type LearningGoal } from '../lib/api';
import { useI18n } from '../lib/i18n';
import styles from './library-workspace.module.css';

export function GoalEditor({ goal, busy, operate }: {
  goal: LearningGoal;
  busy: boolean;
  operate: (action: () => Promise<unknown>) => Promise<void>;
}) {
  const { locale } = useI18n();
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const fields = new FormData(event.currentTarget as HTMLFormElement);
    const title = String(fields.get('title') ?? '').trim();
    if (!title) return;
    const description = String(fields.get('description') ?? '');
    const deadline = String(fields.get('deadline') ?? '');
    void operate(() => api.updateGoal(goal.id, {
      title,
      description,
      deadline: deadline || null,
    }));
  };
  return <form className={styles.form} onSubmit={submit}>
    <label>{locale === 'pt-BR' ? 'Título do objetivo' : 'Goal title'}<input name="title" required maxLength={160} defaultValue={goal.title} /></label>
    <label>{locale === 'pt-BR' ? 'Descrição' : 'Description'}<textarea name="description" maxLength={2000} defaultValue={goal.description} /></label>
    <label>{locale === 'pt-BR' ? 'Prazo opcional' : 'Optional deadline'}<input name="deadline" type="date" defaultValue={goal.deadline?.slice(0, 10) ?? ''} /></label>
    <button disabled={busy}>{locale === 'pt-BR' ? 'Salvar objetivo' : 'Save goal'}</button>
  </form>;
}
