'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TextToTasksForm } from './text-to-tasks-form';
import { TranscriptToTasksForm } from './transcript-to-tasks-form';
import { FileText, ClipboardList, PlusCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';
import { ManualTaskForm } from './manual-task-form';
import type { Task } from '@/types';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface TaskInputAreaProps {
  onTasksCreated: (tasks: Array<{ title: string; subtasks?: string[] }>) => void;
  onTaskCreated: (taskData: Omit<Task, 'id' | 'status' | 'createdAt'>) => void;
}

export function TaskInputArea({ onTasksCreated, onTaskCreated }: TaskInputAreaProps) {
  const [isManualFormOpen, setIsManualFormOpen] = useState(false);

  const handleManualTaskCreated = (taskData: Omit<Task, 'id' | 'status' | 'createdAt'>) => {
    onTaskCreated(taskData);
    setIsManualFormOpen(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Tasks</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="text">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="text">
              <FileText className="w-4 h-4 mr-2" />
              Text
            </TabsTrigger>
            <TabsTrigger value="transcript">
              <ClipboardList className="w-4 h-4 mr-2" />
              Transcript
            </TabsTrigger>
          </TabsList>
          <TabsContent value="text" className="mt-4">
            <TextToTasksForm onTasksCreated={onTasksCreated} />
          </TabsContent>
          <TabsContent value="transcript" className="mt-4">
            <TranscriptToTasksForm onTasksCreated={onTasksCreated} />
          </TabsContent>
        </Tabs>

        <Separator className="my-6" />

        <Dialog open={isManualFormOpen} onOpenChange={setIsManualFormOpen}>
          <DialogTrigger asChild>
            <div className="flex justify-center">
              <Button variant="ghost" className="w-full">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add a task manually
              </Button>
            </div>
          </DialogTrigger>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>Add a New Task</DialogTitle>
            </DialogHeader>
            <ManualTaskForm
              onTaskCreated={handleManualTaskCreated}
              onCancel={() => setIsManualFormOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
