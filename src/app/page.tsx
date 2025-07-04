'use client';

import { TaskInputArea } from '@/components/keph/task-input-area';
import { TaskList } from '@/components/keph/task-list';
import { useTasks } from '@/hooks/use-tasks';
import { BrainCircuit, Bell } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { Notification, Task } from '@/types';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { NotificationPanel } from '@/components/keph/notification-panel';

export default function Home() {
  const {
    tasks,
    addTasks,
    addTask,
    updateTask,
    deleteTask,
    duplicateTask,
    search,
    setSearch,
    overdueTasks,
    updateMultipleTasks,
    clearOverdueTasks,
  } = useTasks();

  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    setNotifications(prevNotifications => {
        const overdueNotification = prevNotifications.find(n => n.type === 'overdue-tasks');

        if (overdueTasks.length > 0) {
            const newNotificationData: Notification = {
                id: 'overdue-tasks',
                type: 'overdue-tasks',
                title: `You have ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}`,
                description: 'What would you like to do with them?',
                createdAt: overdueNotification?.createdAt || new Date(),
                read: false,
                data: overdueTasks,
            };

            if (overdueNotification) {
                // Update existing
                const existingTaskIds = new Set(overdueNotification.data.map((t: Task) => t.id));
                const newTasksToAdd = overdueTasks.filter(t => !existingTaskIds.has(t.id));
                if (newTasksToAdd.length > 0) {
                    const combinedData = [...overdueNotification.data, ...newTasksToAdd];
                    return prevNotifications.map(n => n.id === 'overdue-tasks' ? {
                        ...newNotificationData,
                        data: combinedData,
                        title: `You have ${combinedData.length} overdue task${combinedData.length > 1 ? 's' : ''}`,
                     } : n);
                }
                return prevNotifications;
            } else {
                // Add new
                return [newNotificationData, ...prevNotifications];
            }
        } else {
            // Remove if no overdue tasks
            if (overdueNotification) {
                return prevNotifications.filter(n => n.id !== 'overdue-tasks');
            }
        }
        return prevNotifications;
    });
  }, [overdueTasks]);


  const updateNotificationsAfterAction = (actedTaskIds: string[]) => {
      setNotifications(prev => {
        const updated = prev.map(n => {
            if (n.id === 'overdue-tasks') {
                const remainingData = n.data.filter((t: Task) => !actedTaskIds.includes(t.id));
                if (remainingData.length > 0) {
                    return { 
                        ...n, 
                        data: remainingData, 
                        title: `You have ${remainingData.length} overdue task${remainingData.length > 1 ? 's' : ''}` 
                    };
                }
                return null;
            }
            return n;
        }).filter(Boolean);

        if (!updated.some(n => n?.id === 'overdue-tasks')) {
            clearOverdueTasks();
        }

        return updated as Notification[];
      });
  };

  const handleMoveOverdueToToday = (taskIds: string[]) => {
    updateMultipleTasks(taskIds, { dueDate: new Date(), status: 'current' });
    updateNotificationsAfterAction(taskIds);
  };

  const handleKeepInPending = (taskIds: string[]) => {
    // Tasks are already pending, so we just remove them from the notification
    updateNotificationsAfterAction(taskIds);
  };
  
  const dismissNotification = (notificationId: string) => {
    const notificationToDismiss = notifications.find(n => n.id === notificationId);
    if (notificationToDismiss && notificationToDismiss.type === 'overdue-tasks') {
        clearOverdueTasks();
    } else {
       setNotifications(prev => prev.filter(n => n.id !== notificationId));
    }
  };


  return (
    <Sheet>
      <div className="min-h-screen bg-background font-body">
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
          <header className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <BrainCircuit className="w-10 h-10 text-primary" />
              <div>
                <h1 className="text-3xl font-bold font-headline text-primary">KEPH</h1>
                <p className="text-muted-foreground">Your intelligent assistant.</p>
              </div>
            </div>
            <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {notifications.length > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground">
                            {notifications.length}
                        </span>
                    )}
                </Button>
            </SheetTrigger>
          </header>
          <main className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2">
              <TaskInputArea onTasksCreated={addTasks} onTaskCreated={addTask} />
            </div>
            <div className="lg:col-span-3">
              <TaskList
                tasks={tasks}
                onUpdateTask={updateTask}
                onDeleteTask={deleteTask}
                onDuplicateTask={duplicateTask}
                search={search}
                setSearch={setSearch}
              />
            </div>
          </main>
        </div>
        <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
            <SheetHeader className="p-6 pb-2">
                <SheetTitle>Notifications</SheetTitle>
            </SheetHeader>
            <div className="p-6 pt-4 overflow-y-auto flex-1">
                <NotificationPanel
                    notifications={notifications}
                    onDismissNotification={dismissNotification}
                    onKeepInPending={handleKeepInPending}
                    onMoveOverdueToToday={handleMoveOverdueToToday}
                />
            </div>
        </SheetContent>
      </div>
    </Sheet>
  );
}
