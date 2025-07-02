'use client';

import { useState } from 'react';
import type { Task, TaskStatus } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { TaskItem } from './task-item';
import { Search, Circle, CheckCircle2, Archive } from 'lucide-react';
import { isToday, isYesterday, format } from 'date-fns';

interface TaskListProps {
  tasks: Task[];
  onUpdateTask: (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => void;
  onDeleteTask: (id: string) => void;
  search: string;
  setSearch: (search: string) => void;
}

const formatDateHeading = (dateKey: string): string => {
    if (dateKey === 'No Date') {
        return 'No Due Date';
    }
    // The key is 'yyyy-MM-dd'. Split it to avoid timezone issues with new Date().
    const [year, month, day] = dateKey.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMMM d, yyyy');
};

export function TaskList({ tasks, onUpdateTask, onDeleteTask, search, setSearch }: TaskListProps) {
  const [activeTab, setActiveTab] = useState<TaskStatus>('current');

  const filteredTasks = tasks.filter((task) => task.status === activeTab);

  const sortTasks = (tasksToSort: Task[]) => {
    return tasksToSort.sort((a, b) => {
        if (activeTab === 'completed') {
            return (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0);
        }
        // Sort by due date, tasks with no due date last
        if (a.dueDate && b.dueDate) return a.dueDate.getTime() - b.dueDate.getTime();
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }

  const renderTaskList = (tasksToRender: Task[]) => {
    if (tasksToRender.length === 0) {
      return (
        <div className="text-center text-muted-foreground py-10">
          <p>No tasks here. ✨</p>
        </div>
      );
    }

    const groupedTasks = tasksToRender.reduce((acc, task) => {
        let dateKeySource: Date | undefined;
        if (activeTab === 'completed') {
            dateKeySource = task.completedAt;
        } else {
            dateKeySource = task.dueDate;
        }

        const dateKey = dateKeySource ? format(dateKeySource, 'yyyy-MM-dd') : 'No Date';

        if (!acc[dateKey]) {
            acc[dateKey] = [];
        }
        acc[dateKey].push(task);
        return acc;
    }, {} as Record<string, Task[]>);

    const sortedGroupKeys = Object.keys(groupedTasks).sort((a, b) => {
        if (a === 'No Date') return 1;
        if (b === 'No Date') return -1;
        return new Date(b).getTime() - new Date(a).getTime();
    });

    return (
      <div className="space-y-6">
        {sortedGroupKeys.map((dateKey) => {
            const groupTasks = groupedTasks[dateKey];
            const sortedGroupTasks = sortTasks(groupTasks);
            
            return (
                <div key={dateKey}>
                    <h3 className="text-md font-semibold mb-3 text-muted-foreground px-1">
                       {formatDateHeading(dateKey)}
                    </h3>
                    <div className="space-y-4">
                        {sortedGroupTasks.map(task => (
                            <TaskItem
                                key={task.id}
                                task={task}
                                onUpdate={onUpdateTask}
                                onDelete={onDeleteTask}
                            />
                        ))}
                    </div>
                </div>
            )
        })}
      </div>
    );
  };

  const getCount = (status: TaskStatus) => tasks.filter(t => t.status === status).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Tasks</CardTitle>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TaskStatus)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="current">
              <Circle className="w-4 h-4 mr-2"/>
              Current ({getCount('current')})
            </TabsTrigger>
            <TabsTrigger value="completed">
              <CheckCircle2 className="w-4 h-4 mr-2"/>
              Completed ({getCount('completed')})
            </TabsTrigger>
            <TabsTrigger value="pending">
              <Archive className="w-4 h-4 mr-2"/>
              Pending ({getCount('pending')})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="current" className="mt-4">
            {renderTaskList(filteredTasks)}
          </TabsContent>
          <TabsContent value="completed" className="mt-4">
            {renderTaskList(filteredTasks)}
          </TabsContent>
          <TabsContent value="pending" className="mt-4">
            {renderTaskList(filteredTasks)}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
