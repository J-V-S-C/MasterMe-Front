'use client';

import { useEffect, useId, useState, type ReactNode } from 'react';
import { Icon } from '../ui/icons';
import styles from './library-workspace.module.css';

export const dayKey = (value: string | Date): string => {
  const date = typeof value === 'string' ? new Date(value) : value;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export const clockValue = (minutes: number): string => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

export const clockMinutes = (value: string): number => (Number(value.slice(0, 2)) || 0) * 60 + (Number(value.slice(3, 5)) || 0);

export const formatClock = (value: string, locale: 'pt-BR' | 'en-US'): string => {
  if (!value) return '';
  return new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(new Date(`2000-01-01T${value}:00`));
};

export const formatDayShort = (day: string, locale: 'pt-BR' | 'en-US'): string => {
  if (!day) return '';
  return new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(`${day}T12:00:00`));
};

export const formatDuration = (minutes: number | null, locale: 'pt-BR' | 'en-US'): string => {
  if (minutes === null) return locale === 'pt-BR' ? 'Sem estimativa' : 'No estimate';
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return [hours ? `${hours}h` : '', rest ? `${rest}min` : ''].filter(Boolean).join(' ');
};

export type DayPickerLabels = {
  previousMonth: string;
  nextMonth: string;
  today: string;
  tomorrow: string;
  nextWeek: string;
  noDate: string;
};

export function Chip({ pressed, onClick, disabled = false, className = '', children }: {
  pressed?: boolean;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return <button type="button" className={`${styles.chip} ${className}`.trim()} aria-pressed={pressed} disabled={disabled} onClick={onClick}>{children}</button>;
}

function parseDay(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function DayPicker({ value, onChange, locale, counts, minDay, labels }: {
  value: string;
  onChange: (day: string) => void;
  locale: 'pt-BR' | 'en-US';
  counts: Record<string, number>;
  minDay?: string;
  labels: DayPickerLabels;
}) {
  const selected = parseDay(value) ?? new Date();
  const [cursor, setCursor] = useState(() => new Date(selected.getFullYear(), selected.getMonth(), 1));
  useEffect(() => {
    const next = parseDay(value);
    if (next) setCursor(new Date(next.getFullYear(), next.getMonth(), 1));
  }, [value]);
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const cells: Array<number | null> = Array.from({ length: firstWeekday }, () => null);
  for (let day = 1; day <= totalDays; day += 1) cells.push(day);
  while (cells.length % 7 !== 0) cells.push(null);
  const weekdays = locale === 'pt-BR' ? ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'] : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const monthTitle = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(cursor);
  const today = dayKey(new Date());
  const shift = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    onChange(dayKey(date));
  };

  return <div className={styles.dayPicker}>
    <header className={styles.dayHead}>
      <button type="button" className={styles.dayNav} aria-label={labels.previousMonth} disabled={Boolean(minDay && dayKey(new Date(year, month, 0)) < minDay)} onClick={() => setCursor(new Date(year, month - 1, 1))}><Icon name="chevron" /></button>
      <strong>{monthTitle}</strong>
      <button type="button" className={`${styles.dayNav} ${styles.dayNext}`} aria-label={labels.nextMonth} onClick={() => setCursor(new Date(year, month + 1, 1))}><Icon name="chevron" /></button>
    </header>
    <div className={styles.weekRow} aria-hidden="true">{weekdays.map((weekday, index) => <span key={`${weekday}-${index}`}>{weekday}</span>)}</div>
    <div className={styles.dayGrid} role="group" aria-label={monthTitle}>
      {cells.map((day, index) => {
        if (day === null) return <span key={`blank-${index}`} aria-hidden="true" />;
        const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const label = new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(year, month, day));
        const count = counts[key] ?? 0;
        return <button
          key={key}
          type="button"
          className={`${styles.dayCell} ${value === key ? styles.daySelected : ''} ${today === key ? styles.dayToday : ''}`}
          aria-label={label}
          aria-pressed={value === key}
          disabled={Boolean(minDay && key < minDay)}
          onClick={() => onChange(key)}
        >
          <span>{day}</span>
          {count > 0 && <small aria-hidden="true">{count}</small>}
        </button>;
      })}
    </div>
    <div className={styles.dayShortcuts}>
      <Chip pressed={value === today} onClick={() => shift(0)}>{labels.today}</Chip>
      <Chip pressed={value === dayKey(new Date(Date.now() + 86_400_000))} onClick={() => shift(1)}>{labels.tomorrow}</Chip>
      <Chip onClick={() => shift(7)}>{labels.nextWeek}</Chip>
      <Chip pressed={!value} onClick={() => onChange('')}>{labels.noDate}</Chip>
    </div>
  </div>;
}

export function TimeSlider({ value, onChange, label, locale, periods, compact = false, minTime }: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  locale: 'pt-BR' | 'en-US';
  periods: readonly [string, string, string];
  compact?: boolean;
  minTime?: string;
}) {
  const id = useId();
  const minutes = clockMinutes(value);
  const firstAllowedMinute = minTime ? clockMinutes(minTime) : 0;
  return <div className={`${styles.timeControl} ${compact ? styles.compact : ''}`}>
    <div className={styles.controlHead}>
      <span><Icon name="clock" />{label}</span>
      <input type="time" value={value} min={minTime} aria-label={label} onInput={(event) => { const next = event.currentTarget.value; onChange(minTime && next < minTime ? minTime : next); }} />
    </div>
    <input
      id={id}
      type="range"
      min={firstAllowedMinute}
      max="1439"
      step="1"
      value={minutes}
      aria-label={`${label} ${locale === 'pt-BR' ? 'controle deslizante' : 'slider'}`}
      onInput={(event) => onChange(clockValue(Number(event.currentTarget.value)))}
    />
    <div className={styles.timeTicks} aria-hidden="true"><span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>23:59</span></div>
    <div className={styles.timeShortcuts}>
      {[480, 840, 1140].map((period, index) => <Chip key={period} pressed={minutes === period} disabled={period < firstAllowedMinute} onClick={() => onChange(clockValue(period))}>{periods[index]}</Chip>)}
    </div>
  </div>;
}

export function DurationChips({ value, onChange, label, locale, noEstimate }: {
  value: number | null;
  onChange: (value: number | null) => void;
  label: string;
  locale: 'pt-BR' | 'en-US';
  noEstimate: string;
}) {
  return <fieldset className={styles.chipFieldset}>
    <legend>{label}</legend>
    <div className={styles.chipRow}>
      {[15, 30, 45, 60, 90, null].map((minutes) => <Chip key={minutes ?? 'none'} pressed={value === minutes} onClick={() => onChange(minutes)}>{minutes === null ? noEstimate : formatDuration(minutes, locale)}</Chip>)}
    </div>
    <label className={styles.customDuration}>{locale === 'pt-BR' ? 'Outro tempo (minutos)' : 'Custom duration (minutes)'}
      <input type="number" min="1" max="480" step="1" value={value ?? ''} placeholder={locale === 'pt-BR' ? '1 a 480' : '1 to 480'} onInput={(event) => {
        const raw = event.currentTarget.value;
        if (!raw) { onChange(null); return; }
        const minutes = Number(raw);
        if (Number.isFinite(minutes)) onChange(Math.min(480, Math.max(1, Math.trunc(minutes))));
      }} />
    </label>
  </fieldset>;
}
