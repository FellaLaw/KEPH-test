'use client';

import { useState } from 'react';
import type { Task, TaskStatus } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Trash2, Archive, Circle, CheckCircle2, Edit, Link as LinkIcon, NotebookText, CalendarDays, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isPast, isToday } from 'date-fns';
import { EditTaskForm } from './edit-task-form';
import { Progress } from '../ui/progress';

interface TaskItemProps {
  task: Task;
  onUpdate: (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

export function TaskItem({ task, onUpdate, onDelete, onDuplicate }: TaskItemProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleCheck = (checked: boolean) => {
    const newStatus = checked ? 'completed' : 'current';
    const updates: Partial<Omit<Task, 'id' | 'createdAt'>> = {
      status: newStatus,
      completedAt: checked ? new Date() : undefined,
    };

    if (task.subtasks && task.subtasks.length > 0) {
      updates.subtasks = task.subtasks.map(st => ({ ...st, completed: checked }));
    }

    onUpdate(task.id, updates);
  };
  
  const handleUpdateStatus = (status: TaskStatus) => {
    onUpdate(task.id, { 
        status,
        completedAt: status === 'completed' ? new Date() : undefined
     });
  }

  const handleEditSubmit = async (values: Partial<Omit<Task, 'id' | 'createdAt'>>) => {
    onUpdate(task.id, values);
    setIsEditDialogOpen(false);
  };

  const handleSubtaskCheck = (subtaskId: string, checked: boolean) => {
    const updatedSubtasks = task.subtasks?.map(subtask =>
      subtask.id === subtaskId ? { ...subtask, completed: checked } : subtask
    );

    const allSubtasksCompleted = updatedSubtasks?.every(st => st.completed);

    const updates: Partial<Omit<Task, 'id' | 'createdAt'>> = { subtasks: updatedSubtasks };

    if (task.subtasks && task.subtasks.length > 0) {
      if (allSubtasksCompleted) {
        updates.status = 'completed';
        updates.completedAt = new Date();
      } else {
        updates.status = 'current';
        updates.completedAt = undefined;
      }
    }

    onUpdate(task.id, updates);
  };

  const completedSubtasks = task.subtasks?.filter(s => s.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  return (
    <>
      <Card
        onClick={() => setIsEditDialogOpen(true)}
        className={cn(
          'transition-all duration-200 ease-in-out hover:shadow-lg cursor-pointer',
          'bg-muted/50 hover:bg-muted/95'
        )}
      >
        <CardContent className="p-4 flex items-start gap-4">
          <div className="mt-1 flex items-center" onClick={(e) => e.stopPropagation()}>
            <Checkbox
                id={`task-${task.id}`}
                checked={task.status === 'completed'}
                onCheckedChange={handleCheck}
                aria-label={`Mark task as ${task.status === 'completed' ? 'current' : 'completed'}`}
            />
          </div>
          <div className="flex-grow space-y-2 min-w-0">
            <div
              className={cn(
                'font-medium',
                task.status === 'completed' && 'line-through text-muted-foreground'
              )}
            >
              {task.title}
            </div>

            {task.subtasks && task.subtasks.length > 0 && (
                <div className="space-y-2 pt-2">
                    <div className="flex items-center gap-2">
                        <Progress value={progress} className="h-2" />
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{completedSubtasks} / {totalSubtasks}</span>
                    </div>
                    <div className="space-y-2">
                        {task.subtasks.map(subtask => (
                            <div key={subtask.id} className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                    id={`subtask-${subtask.id}`}
                                    checked={subtask.completed}
                                    onCheckedChange={(checked) => handleSubtaskCheck(subtask.id, !!checked)}
                                    aria-label={`Mark subtask as ${subtask.completed ? 'not completed' : 'completed'}`}
                                />
                                <label
                                    htmlFor={`subtask-${subtask.id}`}
                                    className={cn(
                                        "text-sm",
                                        subtask.completed && "line-through text-muted-foreground",
                                        task.status === 'completed' && "line-through text-muted-foreground"
                                    )}
                                >
                                    {subtask.title}
                                </label>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {task.notes && (
                <p className="text-sm text-muted-foreground flex items-start gap-2 pt-1">
                    <NotebookText className="w-4 h-4 mt-0.5 shrink-0" />
                    <span className="whitespace-pre-wrap">{task.notes}</span>
                </p>
            )}
            {task.urls && task.urls.length > 0 && (
              <div className="space-y-1 pt-1">
                {task.urls.map(url => (
                   <a 
                      key={url.id}
                      href={url.value} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-sm text-link hover:underline flex items-center gap-2"
                      onClick={(e) => e.stopPropagation()}
                  >
                      <LinkIcon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{url.value}</span>
                  </a>
                ))}
              </div>
            )}
            {task.dueDate && (
              <div className="flex items-center pt-1 text-xs text-muted-foreground">
                  <div className={cn(
                      "flex items-center gap-1.5",
                      task.status !== 'completed' && isPast(task.dueDate) && !isToday(task.dueDate) ? "text-destructive" : ""
                  )}>
                      <CalendarDays className="h-3.5 w-3.5" />
                      <span>{format(task.dueDate, 'MMM d')}</span>
                  </div>
              </div>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={(e) => e.stopPropagation()}>
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
               <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                 <Edit className="mr-2 h-4 w-4" />
                 <span>Edit</span>
               </DropdownMenuItem>
               <DropdownMenuItem onClick={() => onDuplicate(task.id)}>
                 <Copy className="mr-2 h-4 w-4" />
                 <span>Duplicate</span>
               </DropdownMenuItem>
               <DropdownMenuSeparator />
              {task.status !== 'current' && (
                <DropdownMenuItem onClick={() => handleUpdateStatus('current')}>
                  <Circle className="mr-2 h-4 w-4" />
                  <span>Mark as Current</span>
                </DropdownMenuItem>
              )}
              {task.status !== 'completed' && (
                 <DropdownMenuItem onClick={() => handleUpdateStatus('completed')}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  <span>Mark as Completed</span>
                </DropdownMenuItem>
              )}
              {task.status !== 'pending' && (
                <DropdownMenuItem onClick={() => handleUpdateStatus('pending')}>
                  <Archive className="mr-2 h-4 w-4" />
                  <span>Move to Pending</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(task.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
                <DialogTitle>Edit Task</DialogTitle>
            </DialogHeader>
            <EditTaskForm 
                task={task} 
                onSubmit={handleEditSubmit}
                onCancel={() => setIsEditDialogOpen(false)}
            />
        </DialogContent>
      </Dialog>
    </>
  );
}
