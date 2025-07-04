'use client';

import { useState } from 'react';
import type { Notification, Task } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Bell, ChevronDown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Separator } from '../ui/separator';

interface NotificationPanelProps {
  notifications: Notification[];
  onMoveOverdueToToday: (taskIds: string[]) => void;
  onKeepInPending: (taskIds: string[]) => void;
  onDismissNotification: (notificationId: string) => void;
}

export function NotificationPanel({
  notifications,
  onMoveOverdueToToday,
  onKeepInPending,
  onDismissNotification,
}: NotificationPanelProps) {
  
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  
  if (notifications.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <Bell className="w-12 h-12 mb-4" />
            <h3 className="text-lg font-semibold">No new notifications</h3>
            <p className="text-sm">You're all caught up!</p>
        </div>
    );
  }

  const handleToggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds(prev => 
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

  const handleMoveSelected = () => {
    onMoveOverdueToToday(selectedTaskIds);
    setSelectedTaskIds([]);
  }

  const handleKeepSelected = () => {
    onKeepInPending(selectedTaskIds);
    setSelectedTaskIds([]);
  }

  const renderOverdueTasksNotification = (notification: Notification) => {
    const isSingleTask = notification.data.length === 1;
    const singleTask = isSingleTask ? notification.data[0] : null;

    if (isSingleTask && singleTask) {
        return (
            <Card key={notification.id} className="bg-muted/50">
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                   <div className="space-y-1.5">
                     <CardTitle className="text-base">{notification.title}</CardTitle>
                     <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                     </p>
                   </div>
                   <Button variant="ghost" size="icon" className="h-8 w-8 -m-2" onClick={() => onDismissNotification(notification.id)}>
                       <X className="h-4 w-4" />
                       <span className="sr-only">Dismiss</span>
                   </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground pt-1">Task: "{singleTask.title}"</p>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => onKeepInPending([singleTask.id])}>
                            Keep in Pending
                        </Button>
                        <Button size="sm" onClick={() => onMoveOverdueToToday([singleTask.id])}>
                            Move to Today
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
      <Collapsible 
        key={notification.id}
        open={expandedId === notification.id}
        onOpenChange={(isOpen) => {
          setExpandedId(isOpen ? notification.id : null);
          if (!isOpen) {
            setSelectedTaskIds([]);
          }
        }}
        asChild
      >
        <Card className="bg-muted/50">
            <CollapsibleTrigger asChild>
                <div className="p-4 cursor-pointer hover:bg-muted/80 rounded-t-lg">
                    <CardHeader className="flex flex-row items-start justify-between p-0">
                      <div className="space-y-1.5">
                          <CardTitle className="text-base">{notification.title}</CardTitle>
                          <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                          </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <ChevronDown className={cn("h-4 w-4 transition-transform", expandedId === notification.id && "rotate-180")} />
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onDismissNotification(notification.id); }}>
                            <X className="h-4 w-4" />
                            <span className="sr-only">Dismiss</span>
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0 pt-2">
                        <p className="text-sm text-muted-foreground">{notification.description}</p>
                    </CardContent>
                </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
                <div className="p-4 pt-2 space-y-3">
                  <Separator />
                   <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                    {notification.data.map((task: Task) => (
                      <div key={task.id} className="flex items-center gap-3 p-2 rounded-md bg-background">
                        <Checkbox 
                          id={`select-${task.id}`}
                          checked={selectedTaskIds.includes(task.id)}
                          onCheckedChange={() => handleToggleTaskSelection(task.id)}
                        />
                        <label htmlFor={`select-${task.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          {task.title}
                        </label>
                      </div>
                    ))}
                   </div>
                </div>
                <CardFooter className="flex justify-end gap-2 bg-muted/30 py-3">
                    <Button variant="outline" size="sm" onClick={handleKeepSelected} disabled={selectedTaskIds.length === 0}>
                        Keep Selected
                    </Button>
                    <Button size="sm" onClick={handleMoveSelected} disabled={selectedTaskIds.length === 0}>
                        Move Selected
                    </Button>
                </CardFooter>
            </CollapsibleContent>
        </Card>
      </Collapsible>
    )

  }

  return (
    <div className="space-y-4">
        {notifications.map((notification) => {
            if (notification.type === 'overdue-tasks') {
                return renderOverdueTasksNotification(notification);
            }
            // Future-proofing for other notification types
            return (
                <Card key={notification.id} className="bg-muted/50">
                    <CardHeader className="flex flex-row items-start justify-between pb-4">
                      <div className="space-y-1.5">
                        <CardTitle className="text-base">{notification.title}</CardTitle>
                        <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 -m-2" onClick={() => onDismissNotification(notification.id)}>
                          <X className="h-4 w-4" />
                          <span className="sr-only">Dismiss</span>
                      </Button>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">{notification.description}</p>
                    </CardContent>
                </Card>
            );
        })}
    </div>
  );
}
