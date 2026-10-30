'use client';

import styles from './library-workspace.module.css';

export function formatDuration(minutes: number | null, locale: 'pt-BR' | 'en-US'): string {
  if (minutes === null) return locale === 'pt-BR' ? 'Sem estimativa' : 'No estimate';
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return [hours ? `${hours}h` : '', rest ? `${rest}min` : ''].filter(Boolean).join(' ');
}

export function TaskDuration({ label, hours, minutes, onChange, locale }: {
  label: string;
  hours: string;
  minutes: string;
  onChange: (hours: string, minutes: string) => void;
  locale: 'pt-BR' | 'en-US';
}) {
  return <fieldset className={styles.durationField}>
    <legend>{label}</legend>
    <div>
      <label>{locale === 'pt-BR' ? 'Horas' : 'Hours'}<input type="number" min="0" max="8" value={hours} onInput={(event) => onChange(event.currentTarget.value, minutes)} /></label>
      <label>{locale === 'pt-BR' ? 'Minutos' : 'Minutes'}<input type="number" min="0" max={Number(hours) >= 8 ? 0 : 59} value={minutes} onInput={(event) => onChange(hours, event.currentTarget.value)} /></label>
    </div>
  </fieldset>;
}

export function durationMinutes(hours: string, minutes: string): number | undefined {
  const total = (Number(hours) || 0) * 60 + (Number(minutes) || 0);
  return total >= 1 && total <= 480 ? total : undefined;
}
