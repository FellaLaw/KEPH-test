'use client';

import type { Task } from '@/types';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

interface OverdueTasksDialogProps {
  overdueTasks: Task[];
  onMoveToToday: (taskIds: string[]) => void;
  onMoveToPending: (taskIds: string[]) => void;
  onClose: () => void;
}

export function OverdueTasksDialog({ overdueTasks, onMoveToToday, onMoveToPending, onClose }: OverdueTasksDialogProps) {
  const taskIds = overdueTasks.map(t => t.id);

  const handleMoveToToday = () => {
    onMoveToToday(taskIds);
    onClose();
  };

  const handleMoveToPending = () => {
    onMoveToPending(taskIds);
    onClose();
  };
  
  // This component is no longer used directly, but kept for potential future use.
  // The logic has been moved to the NotificationPanel.
  if (overdueTasks.length === 0) {
    return null;
  }
  
  return (
    <AlertDialog open={overdueTasks.length > 0} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>You have {overdueTasks.length} overdue task{overdueTasks.length > 1 ? 's' : ''}</AlertDialogTitle>
          <AlertDialogDescription>
            What would you like to do with the tasks from previous days that were not completed?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="max-h-60 overflow-y-auto rounded-md border p-4 space-y-2">
            {overdueTasks.map(task => (
                <div key={task.id} className="text-sm p-2 bg-muted rounded-md">
                    {task.title}
                </div>
            ))}
        </div>
        <AlertDialogFooter>
          <Button variant="outline" onClick={handleMoveToPending}>
            Move to Pending
          </Button>
          <Button onClick={handleMoveToToday}>
            Move to Today
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
