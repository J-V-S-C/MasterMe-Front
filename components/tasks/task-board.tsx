'use client';

import { DndContext, DragOverlay, KeyboardSensor, PointerSensor, pointerWithin, closestCorners, useDroppable, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState, type ReactNode } from 'react';
import type { StudyTask } from '../../lib/api';
import styles from './library-workspace.module.css';

export type BoardStatus = 'PENDING' | 'IN_PROGRESS' | 'DONE';
export const boardStatuses: BoardStatus[] = ['PENDING', 'IN_PROGRESS', 'DONE'];
const directionKeys: Record<string, string> = { KeyW: 'ArrowUp', KeyA: 'ArrowLeft', KeyS: 'ArrowDown', KeyD: 'ArrowRight' };

function Column({ status, title, tasks, renderCard, dragLabel }: { status: BoardStatus; title: string; tasks: StudyTask[]; renderCard: (task: StudyTask) => ReactNode; dragLabel: string }) {
  const { setNodeRef, isOver } = useDroppable({ id: `column:${status}` });
  return <section className={`${styles.boardColumn} ${isOver ? styles.boardDropTarget : ''}`} aria-label={title}>
    <header><h2>{title}</h2><span>{tasks.length}</span></header>
    <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
      <div ref={setNodeRef} className={styles.boardColumnBody}>
        {tasks.map((task) => <Card key={task.id} task={task} dragLabel={dragLabel}>{renderCard(task)}</Card>)}
      </div>
    </SortableContext>
  </section>;
}

function Card({ task, dragLabel, children }: { task: StudyTask; dragLabel: string; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const interactive = (target: EventTarget | null) => target instanceof Element && Boolean(target.closest('form, button, a, input, select, textarea, summary, [role="combobox"], [contenteditable="true"]'));
  return <article ref={(node) => { setNodeRef(node); setActivatorNodeRef(node); }} id={`task-${task.id}`} style={{ transform: CSS.Transform.toString(transform), transition }} className={`${styles.boardCard} ${isDragging ? styles.boardDragging : ''}`} {...attributes} role="group" tabIndex={0} aria-label={`${dragLabel}: ${task.title}`}
    onPointerDown={(event) => { if (!interactive(event.target)) listeners?.onPointerDown?.(event); }}
    onKeyDown={(event) => {
      if (interactive(event.target)) return;
      const direction = directionKeys[event.code];
      if (isDragging && direction && !event.altKey && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        event.currentTarget.ownerDocument.dispatchEvent(new KeyboardEvent('keydown', { key: direction, code: direction, bubbles: true, cancelable: true }));
        return;
      }
      listeners?.onKeyDown?.(event);
    }}>
    <span className={styles.dragCue} aria-hidden="true">⠿</span>
    {children}
  </article>;
}

export function TaskBoard({ tasks, labels, renderCard, onMove }: {
  tasks: StudyTask[];
  labels: Record<BoardStatus, string>;
  renderCard: (task: StudyTask) => ReactNode;
  onMove: (tasks: StudyTask[]) => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const columns = {
    PENDING: tasks.filter((task) => task.status === 'PENDING'),
    IN_PROGRESS: tasks.filter((task) => task.status === 'IN_PROGRESS'),
    DONE: tasks.filter((task) => task.status === 'DONE'),
  };
  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const moved = tasks.find((task) => task.id === active.id);
    if (!moved || moved.status === 'REMOVED') return;
    const targetTask = tasks.find((task) => task.id === over.id);
    const targetStatus = targetTask?.status ?? String(over.id).replace('column:', '');
    if (targetStatus !== 'PENDING' && targetStatus !== 'IN_PROGRESS' && targetStatus !== 'DONE') return;
    const nextColumns = {
      PENDING: columns.PENDING.filter((task) => task.id !== active.id),
      IN_PROGRESS: columns.IN_PROGRESS.filter((task) => task.id !== active.id),
      DONE: columns.DONE.filter((task) => task.id !== active.id),
    };
    const destination = nextColumns[targetStatus];
    const targetIndex = targetTask ? destination.findIndex((task) => task.id === targetTask.id) : destination.length;
    const sourceIndex = columns[moved.status].findIndex((task) => task.id === moved.id);
    const movingDown = moved.status === targetStatus && targetTask && sourceIndex < columns[targetStatus].findIndex((task) => task.id === targetTask.id);
    destination.splice(targetIndex < 0 ? destination.length : targetIndex + (movingDown ? 1 : 0), 0, { ...moved, status: targetStatus });
    onMove(boardStatuses.flatMap((status) => nextColumns[status]));
  };
  return <DndContext sensors={sensors} collisionDetection={(args) => {
    const candidates = { ...args, droppableContainers: args.droppableContainers.filter((container) => container.id !== args.active.id) };
    const pointer = pointerWithin(candidates);
    return pointer.length ? pointer : closestCorners(candidates);
  }} onDragStart={({ active }: DragStartEvent) => setActiveId(String(active.id))} onDragCancel={() => setActiveId(null)} onDragEnd={(event) => { setActiveId(null); handleDragEnd(event); }}>
    <div className={styles.board}>
      {boardStatuses.map((status) => <Column key={status} status={status} title={labels[status]} tasks={columns[status]} renderCard={renderCard} dragLabel={labels[status]} />)}
    </div>
    <DragOverlay dropAnimation={null}>{activeId && (() => {
      const task = tasks.find((item) => item.id === activeId);
      return task ? <article className={`${styles.boardCard} ${styles.boardOverlay}`} inert aria-hidden="true">{renderCard(task)}</article> : null;
    })()}</DragOverlay>
  </DndContext>;
}
