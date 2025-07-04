'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import type { Task, TaskStatus } from '@/types';
import { isBefore, startOfToday, subDays, addDays, isToday } from 'date-fns';

const generateInitialTasks = (): Task[] => {
  const today = new Date();
  const initialTasksData: Omit<Task, 'id'>[] = [
    {
      title: 'Review the quarterly report from 2 days ago',
      subtasks: [
        { id: crypto.randomUUID(), title: 'Focus on the Q4 growth metrics.', completed: true },
        { id: crypto.randomUUID(), title: 'Verify the charts on page 5.', completed: false },
      ],
      status: 'current',
      createdAt: new Date(new Date().setDate(new Date().getDate() - 2)),
      notes: 'John mentioned to double check the figures with the finance team.',
      urls: [{ id: crypto.randomUUID(), value: 'https://example.com/reports/q4' }],
      dueDate: subDays(today, 2),
    },
    {
      title: 'Send follow-up email to the design team',
      subtasks: [
        { id: crypto.randomUUID(), title: 'Ask about the new mockups for the landing page.', completed: false },
      ],
      status: 'current',
      createdAt: new Date(),
      notes: 'Waiting for their response to proceed.',
      urls: [],
      dueDate: today,
    },
    {
      title: 'Prepare presentation for the weekly sync',
      subtasks: [
        { id: crypto.randomUUID(), title: 'Cover progress', completed: true },
        { id: crypto.randomUUID(), title: 'Cover blockers', completed: true },
        { id: crypto.randomUUID(), title: 'Cover next steps', completed: false },
      ],
      status: 'completed',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      urls: [],
      dueDate: subDays(today, 1),
      completedAt: subDays(today, 1),
    },
      {
      title: 'Onboard new marketing intern',
      subtasks: [
        { id: crypto.randomUUID(), title: 'Go through the onboarding checklist.', completed: false },
        { id: crypto.randomUUID(), title: 'Introduce them to the team.', completed: false },
      ],
      status: 'pending',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      urls: [{ id: crypto.randomUUID(), value: 'https://example.com/onboarding-docs' }],
      dueDate: addDays(today, 3),
    },
  ];

  return initialTasksData.map(taskData => {
    const taskWithId = { ...taskData, id: crypto.randomUUID() };
    return taskWithId;
  });
};


export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [search, setSearch] = useState('');
  const [overdueTasks, setOverdueTasks] = useState<Task[]>([]);

  useEffect(() => {
    const initial = generateInitialTasks();
    const today = startOfToday();
    
    const overdue = initial.filter(task => 
      task.status === 'current' && task.dueDate && isBefore(task.dueDate, today)
    );
    
    const updatedInitialTasks = initial.map(task => {
        const isOverdue = overdue.some(ot => ot.id === task.id);
        if (isOverdue) {
            return { ...task, status: 'pending' as TaskStatus };
        }
        return task;
    });
    
    if (overdue.length > 0) {
      setOverdueTasks(overdue);
    }
    
    setTasks(updatedInitialTasks);
  }, []);

  const addTasks = useCallback((newTasksData: Array<{ title: string; subtasks?: string[] }>) => {
    const newTasks: Task[] = newTasksData.map((data) => ({
      id: crypto.randomUUID(),
      title: data.title,
      subtasks: data.subtasks
        ? data.subtasks.map(subtaskTitle => ({
            id: crypto.randomUUID(),
            title: subtaskTitle,
            completed: false,
        }))
        : [],
      status: 'current',
      createdAt: new Date(),
      notes: '',
      urls: [],
      dueDate: new Date(),
    }));
    setTasks((prev) => [...newTasks, ...prev]);
  }, []);

  const addTask = useCallback((taskData: Omit<Task, 'id' | 'status' | 'createdAt' | 'completedAt'>) => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      ...taskData,
      status: 'current',
      createdAt: new Date(),
      dueDate: taskData.dueDate || new Date(),
    };
    setTasks((prev) => [newTask, ...prev]);
  }, []);

  const updateTask = useCallback((taskId: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id === taskId) {
            const updatedTask = { ...task, ...updates };
            if (updates.status === 'completed' && !task.completedAt) {
                updatedTask.completedAt = new Date();
            }
            if (updates.status && updates.status !== 'completed' && task.status === 'completed') {
                updatedTask.completedAt = undefined;
            }
            return updatedTask;
        }
        return task;
    })
    );
  }, []);

  const updateMultipleTasks = useCallback((taskIds: string[], updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => {
    setTasks(prev => 
      prev.map(task => {
        if (taskIds.includes(task.id)) {
          const updatedTask = { ...task, ...updates };
          if (updates.status === 'completed' && !task.completedAt) {
            updatedTask.completedAt = new Date();
          }
          if (updates.status && updates.status !== 'completed' && task.status === 'completed') {
            updatedTask.completedAt = undefined;
          }
          return updatedTask;
        }
        return task;
      })
    )
  }, []);

  const clearOverdueTasks = () => {
    setOverdueTasks([]);
  };

  const deleteTask = useCallback((taskId: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
  }, []);

  const duplicateTask = useCallback((taskId: string) => {
    setTasks(prev => {
      const taskToDuplicate = prev.find(t => t.id === taskId);
      if (!taskToDuplicate) return prev;

      const newTask: Task = {
        id: crypto.randomUUID(),
        title: `${taskToDuplicate.title} (Copy)`,
        status: 'current',
        createdAt: new Date(),
        dueDate: new Date(),
        completedAt: undefined,
        notes: taskToDuplicate.notes,
        subtasks: taskToDuplicate.subtasks?.map(st => ({
          ...st,
          id: crypto.randomUUID(),
          completed: false,
        })),
        urls: taskToDuplicate.urls?.map(url => ({
          ...url,
          id: crypto.randomUUID(),
        })),
      };

      const originalTaskIndex = prev.findIndex(t => t.id === taskId);
      const newTasks = [...prev];
      newTasks.splice(originalTaskIndex + 1, 0, newTask);
      
      return newTasks;
    });
  }, []);
  
  const searchedTasks = useMemo(() => {
    if (!search) {
      return tasks;
    }
    const lowercasedSearch = search.toLowerCase();
    return tasks.filter((task) =>
      (task.title.toLowerCase().includes(lowercasedSearch)) ||
      (task.notes?.toLowerCase().includes(lowercasedSearch)) ||
      (task.subtasks?.some(subtask => subtask.title.toLowerCase().includes(lowercasedSearch))) ||
      (task.urls?.some(url => url.value.toLowerCase().includes(lowercasedSearch)))
    );
  }, [tasks, search]);


  return {
    tasks: searchedTasks,
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
  };
}
