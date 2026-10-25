'use client';

import { DndContext, KeyboardSensor, PointerSensor, pointerWithin, closestCorners, useDroppable, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ReactNode } from 'react';
import type { StudyTask } from '../lib/api';
import styles from './library-workspace.module.css';

export type BoardStatus = 'PENDING' | 'IN_PROGRESS' | 'DONE';
export const boardStatuses: BoardStatus[] = ['PENDING', 'IN_PROGRESS', 'DONE'];

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
  return <article ref={setNodeRef} id={`task-${task.id}`} tabIndex={-1} style={{ transform: CSS.Transform.toString(transform), transition }} className={`${styles.boardCard} ${isDragging ? styles.boardDragging : ''}`}>
    <button ref={setActivatorNodeRef} type="button" className={styles.dragHandle} title={dragLabel} {...attributes} {...listeners} aria-label={`${dragLabel}: ${task.title}`}>⠿</button>
    {children}
  </article>;
}

export function TaskBoard({ tasks, labels, renderCard, onMove }: {
  tasks: StudyTask[];
  labels: Record<BoardStatus, string>;
  renderCard: (task: StudyTask) => ReactNode;
  onMove: (tasks: StudyTask[]) => void;
}) {
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
  }} onDragEnd={handleDragEnd}>
    <div className={styles.board}>
      {boardStatuses.map((status) => <Column key={status} status={status} title={labels[status]} tasks={columns[status]} renderCard={renderCard} dragLabel={labels[status]} />)}
    </div>
  </DndContext>;
}
