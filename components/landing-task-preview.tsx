'use client'

import { useState } from 'react'
import { Icon } from '../lib/icons'
import styles from './landing-page.module.css'

type TaskView = 'date' | 'details' | 'board'

export type LandingTaskPreviewCopy = {
  example: string
  title: string
  tabs: { date: string; details: string; board: string }
  headings: { date: string; details: string; board: string }
  month: string
  shortMonth: string
  weekdays: readonly string[]
  dateLabel: string
  timeLabel: string
  durationLabel: string
  minutes: string
  viewBoard: string
  stageLabel: string
  stages: readonly [string, string, string]
  otherCards: readonly [string, string]
  caption: string
}

const views = [
  { key: 'date', icon: 'calendar' },
  { key: 'details', icon: 'clock' },
  { key: 'board', icon: 'columns' },
] as const

const durations = [30, 60, 90] as const

function calendarDays(selectedDay: number) {
  const days: { key: string; day: number | null }[] = []
  for (let index = 0; index < 4; index += 1) days.push({ key: `blank-${index}`, day: null })
  for (let day = 1; day <= 31; day += 1) days.push({ key: `day-${day}`, day })
  while (days.length % 7 !== 0) days.push({ key: `tail-${days.length}`, day: null })
  return days.map((cell) => ({ ...cell, selected: cell.day === selectedDay }))
}

export function LandingTaskPreview({ copy, locale }: { copy: LandingTaskPreviewCopy; locale: 'pt-BR' | 'en-US' }) {
  const [view, setView] = useState<TaskView>('date')
  const [day, setDay] = useState(22)
  const [hour, setHour] = useState(18)
  const [duration, setDuration] = useState(60)
  const [stage, setStage] = useState(0)
  const date = locale === 'pt-BR' ? `${day} ${copy.shortMonth}` : `${copy.shortMonth} ${day}`
  const time = `${String(hour).padStart(2, '0')}:00`

  return <figure className={styles.tasksFigure} aria-label={copy.example}>
    <div className={styles.taskDemoHeader}>
      <span>{copy.example}</span>
      <strong>{copy.title}</strong>
      <small aria-live="polite">{date} · {time} · {duration} {copy.minutes}</small>
    </div>
    <div className={styles.taskDemoTabs} role="tablist" aria-label={copy.example} onKeyDown={(event) => {
      const index = views.findIndex((entry) => entry.key === view)
      const next = event.key === 'ArrowRight' ? (index + 1) % views.length : event.key === 'ArrowLeft' ? (index + views.length - 1) % views.length : event.key === 'Home' ? 0 : event.key === 'End' ? views.length - 1 : -1
      if (next < 0) return
      const nextView = views[next]
      if (!nextView) return
      event.preventDefault()
      setView(nextView.key)
      event.currentTarget.querySelector<HTMLElement>(`#task-demo-tab-${nextView.key}`)?.focus()
    }}>
      {views.map(({ key, icon }) => <button key={key} id={`task-demo-tab-${key}`} type="button" role="tab" aria-selected={view === key} aria-controls={`task-demo-panel-${key}`} tabIndex={view === key ? 0 : -1} onClick={() => setView(key)}><Icon name={icon} />{copy.tabs[key]}</button>)}
    </div>
    <div className={styles.taskDemoPanel} id={`task-demo-panel-${view}`} role="tabpanel" aria-labelledby={`task-demo-tab-${view}`}>
      {view === 'date' && <>
        <h3>{copy.headings.date}</h3>
        <div className={styles.demoCalendar} role="group" aria-label={copy.dateLabel}>
          <div className={styles.demoCalendarHeader}>{copy.month}</div>
          <div className={styles.demoCalendarGrid}>
            {copy.weekdays.map((weekday, index) => <span className={styles.demoWeekday} key={`${weekday}-${index}`}>{weekday}</span>)}
            {calendarDays(day).map((cell) => {
              const cellDay = cell.day
              return cellDay === null
                ? <span key={cell.key} aria-hidden="true" />
                : <button key={cell.key} type="button" aria-label={locale === 'pt-BR' ? `${cellDay} de ${copy.month.toLowerCase()}` : `${copy.month} ${cellDay}`} aria-pressed={cell.selected} onClick={() => setDay(cellDay)}>{cellDay}</button>
            })}
          </div>
        </div>
      </>}
      {view === 'details' && <>
        <h3>{copy.headings.details}</h3>
        <div className={styles.demoTimeControl}>
          <div className={styles.demoControlHeading}><label htmlFor="task-demo-hour">{copy.timeLabel}</label><output htmlFor="task-demo-hour">{time}</output></div>
          <input id="task-demo-hour" type="range" min="8" max="20" step="1" value={hour} onChange={(event) => setHour(Number(event.target.value))} />
          <div className={styles.demoRangeEnds}><span>08:00</span><span>20:00</span></div>
        </div>
        <fieldset className={styles.demoDuration}>
          <legend>{copy.durationLabel}</legend>
          <div>{durations.map((minutes) => <button key={minutes} type="button" aria-pressed={duration === minutes} onClick={() => setDuration(minutes)}>{minutes} {copy.minutes}</button>)}</div>
        </fieldset>
        <button className={styles.demoNext} type="button" onClick={() => setView('board')}>{copy.viewBoard}<Icon name="chevron" /></button>
      </>}
      {view === 'board' && <>
        <h3>{copy.headings.board}</h3>
        <div className={styles.demoStages} role="group" aria-label={copy.stageLabel}>
          {copy.stages.map((name, index) => <button key={name} type="button" aria-pressed={stage === index} onClick={() => setStage(index)}>{name}</button>)}
        </div>
        <div className={styles.demoBoard}>
          {copy.stages.map((name, index) => <div className={styles.demoBoardColumn} key={name}>
            <span>{name}</span>
            {stage === index && <article className={styles.demoBoardActive}><strong>{copy.title}</strong><small>{date} · {time} · {duration} {copy.minutes}</small></article>}
            {index > 0 && <article className={styles.demoBoardQuiet}><strong>{copy.otherCards[index - 1]}</strong></article>}
          </div>)}
        </div>
      </>}
    </div>
    <figcaption>{copy.caption}</figcaption>
  </figure>
}
