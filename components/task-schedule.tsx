'use client';

import { useEffect, useState } from 'react';
import styles from './library-workspace.module.css';

function displayDate(isoDate: string, locale: 'pt-BR' | 'en-US') {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('-');
  return locale === 'pt-BR' ? `${day}/${month}/${year}` : `${month}/${day}/${year}`;
}

function parseDate(value: string, locale: 'pt-BR' | 'en-US'): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return null;
  const day = Number(locale === 'pt-BR' ? match[1] : match[2]);
  const month = Number(locale === 'pt-BR' ? match[2] : match[1]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() + 1 !== month || date.getDate() !== day) return null;
  return `${match[3]}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function TaskSchedule({ label, value, onValueChange, locale }: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  locale: 'pt-BR' | 'en-US';
}) {
  const [dateText, setDateText] = useState(displayDate(value.slice(0, 10), locale));
  useEffect(() => { setDateText(displayDate(value.slice(0, 10), locale)); }, [value, locale]);
  const date = value.slice(0, 10);
  const time = value.slice(11, 16);
  const placeholder = locale === 'pt-BR' ? 'DD/MM/AAAA' : 'MM/DD/YYYY';
  return <fieldset className={styles.scheduleField}>
    <legend>{label}</legend>
    <div>
      <label>{locale === 'pt-BR' ? 'Data' : 'Date'}<input type="text" inputMode="numeric" placeholder={placeholder} pattern="[0-9]{2}/[0-9]{2}/[0-9]{4}" value={dateText} onInput={(event) => {
        const next = event.currentTarget.value;
        setDateText(next);
        const parsed = parseDate(next, locale);
        event.currentTarget.setCustomValidity(next.length === 10 && !parsed ? (locale === 'pt-BR' ? 'Informe uma data válida.' : 'Enter a valid date.') : '');
        if (!next) onValueChange('');
        else if (parsed) onValueChange(`${parsed}T${time || '09:00'}`);
      }} /></label>
      <label>{locale === 'pt-BR' ? 'Hora' : 'Time'}<input type="time" value={time} disabled={!date} onInput={(event) => { if (date) onValueChange(`${date}T${event.currentTarget.value}`); }} /></label>
    </div>
  </fieldset>;
}
