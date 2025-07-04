'use client';

import { useState, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, X, CalendarIcon, Sparkles, GripVertical } from 'lucide-react';
import type { Task } from '@/types';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar } from '../ui/calendar';
import { Separator } from '../ui/separator';
import { generateSubtasks } from '@/ai/flows/generate-subtasks';

const formSchema = z.object({
  title: z.string().min(1, 'Task title cannot be empty.'),
  subtasks: z.array(z.object({
    title: z.string().min(1, 'Subtask cannot be empty.'),
  })).optional(),
  notes: z.string().optional(),
  urls: z.array(z.object({
    value: z.string().url({ message: "Please enter a valid URL." }).min(1, 'URL cannot be empty.'),
  })).optional(),
  dueDate: z.date().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ManualTaskFormProps {
  onTaskCreated: (taskData: Omit<Task, 'id' | 'status' | 'createdAt' | 'completedAt'>) => void;
  onCancel: () => void;
}

export function ManualTaskForm({ onTaskCreated, onCancel }: ManualTaskFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationPrompt, setGenerationPrompt] = useState('');
  const [suggestedSubtasks, setSuggestedSubtasks] = useState<string[]>([]);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      subtasks: [],
      notes: '',
      urls: [],
      dueDate: undefined,
    },
  });

  const { fields: subtaskFields, append: appendSubtask, remove: removeSubtask, move: moveSubtask } = useFieldArray({
    control: form.control,
    name: 'subtasks',
  });

  const { fields: urlFields, append: appendUrl, remove: removeUrl } = useFieldArray({
    control: form.control,
    name: 'urls',
  });

  const subtaskDragItem = useRef<number | null>(null);
  const subtaskDragOverItem = useRef<number | null>(null);

  const handleSubtaskDragStart = (index: number) => {
    subtaskDragItem.current = index;
  };

  const handleSubtaskDragEnter = (index: number) => {
    subtaskDragOverItem.current = index;
  };

  const handleSubtaskDrop = () => {
    if (subtaskDragItem.current !== null && subtaskDragOverItem.current !== null) {
      moveSubtask(subtaskDragItem.current, subtaskDragOverItem.current);
    }
    subtaskDragItem.current = null;
    subtaskDragOverItem.current = null;
  };

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
      onTaskCreated({
        title: values.title,
        notes: values.notes,
        urls: values.urls?.map(u => ({
            id: crypto.randomUUID(),
            value: u.value,
        })),
        subtasks: values.subtasks?.map(st => ({
            id: crypto.randomUUID(),
            title: st.title,
            completed: false,
        })),
        dueDate: values.dueDate,
      });
      form.reset();
      toast({
          title: 'Task Added',
          description: 'Your new task has been created.',
      })
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create task. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleGenerateSubtasks = async () => {
    const title = form.getValues('title');
    if (!title.trim()) {
        toast({
            variant: 'destructive',
            title: 'Task Title is empty',
            description: 'Please provide a title for the task before generating subtasks.',
        });
        return;
    }
    if (!generationPrompt.trim()) {
        toast({
            variant: 'destructive',
            title: 'Prompt is empty',
            description: 'Please describe the subtasks you want to generate.',
        });
        return;
    }
    setIsGenerating(true);
    setSuggestedSubtasks([]);
    try {
        const result = await generateSubtasks({
            taskTitle: title,
            description: generationPrompt
        });
        
        if (result.subtasks && result.subtasks.length > 0) {
            setSuggestedSubtasks(result.subtasks);
            setGenerationPrompt('');
            toast({
                title: 'Subtasks Suggested',
                description: `The AI suggested ${result.subtasks.length} subtasks. Review and add them below.`
            })
        } else {
            toast({
                title: 'No Subtasks Generated',
                description: 'The AI could not generate any subtasks from your prompt.'
            })
        }

    } catch(error) {
        console.error("Error generating subtasks:", error);
        toast({
            variant: 'destructive',
            title: 'Generation Failed',
            description: 'An error occurred while generating subtasks. Please try again.',
        });
    } finally {
        setIsGenerating(false);
    }
  }

  const handleAddSuggestedSubtask = (title: string) => {
    appendSubtask({ title });
    setSuggestedSubtasks(prev => prev.filter(st => st !== title));
    toast({
        title: `Subtask Added`,
        description: `"${title}" was added to the task.`
    })
  };

  return (
    <div className="space-y-4 pt-2">
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-x-6">
                <div className={cn("flex-1 space-y-4 transition-all duration-300", !isAiPanelOpen && "w-full")}>
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>Task Title</FormLabel>
                          <FormControl>
                              <Input placeholder="e.g., Buy milk" {...field} />
                          </FormControl>
                          <FormMessage />
                          </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Due Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormItem>
                        <FormLabel>Subtasks (Optional)</FormLabel>
                        <div className="space-y-2 max-h-48 overflow-y-auto p-2">
                            {subtaskFields.map((field, index) => (
                                <div 
                                    key={field.id}
                                    className="flex items-center gap-2 group"
                                    draggable
                                    onDragStart={() => handleSubtaskDragStart(index)}
                                    onDragEnter={() => handleSubtaskDragEnter(index)}
                                    onDragEnd={handleSubtaskDrop}
                                    onDragOver={(e) => e.preventDefault()}
                                >
                                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                                    <FormField
                                        control={form.control}
                                        name={`subtasks.${index}.title`}
                                        render={({ field }) => (
                                          <FormControl>
                                              <Input {...field} placeholder={`Subtask ${index + 1}`} />
                                          </FormControl>
                                        )}
                                    />
                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeSubtask(index)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2 mt-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => appendSubtask({ title: '' })}
                            >
                                Add Subtask
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setIsAiPanelOpen(prev => !prev)}
                                disabled={isSubmitting || isGenerating}
                            >
                                <Sparkles className="mr-2 h-4 w-4" />
                                {isAiPanelOpen ? 'Close AI Panel' : 'Generate with AI'}
                            </Button>
                        </div>
                    </FormItem>

                     <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Notes (Optional)</FormLabel>
                            <FormControl>
                                <Textarea {...field} placeholder="Add feedback or other notes here" />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    
                    <FormItem>
                        <FormLabel>URLs (Optional)</FormLabel>
                        <div className="space-y-2 max-h-48 overflow-y-auto p-2">
                            {urlFields.map((field, index) => (
                                <div key={field.id} className="flex items-center gap-2">
                                    <FormField
                                        control={form.control}
                                        name={`urls.${index}.value`}
                                        render={({ field }) => (
                                          <FormControl>
                                              <Input {...field} placeholder="https://related-link.com" />
                                          </FormControl>
                                        )}
                                    />
                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeUrl(index)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => appendUrl({ value: '' })}
                        >
                            Add URL
                        </Button>
                    </FormItem>
                </div>

                {isAiPanelOpen && (
                    <div className="w-full md:w-1/2 lg:w-2/5 md:border-l md:pl-6 space-y-4 mt-6 md:mt-0">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <FormLabel>Generate Subtasks with AI</FormLabel>
                                <Button type="button" variant="ghost" size="icon" onClick={() => setIsAiPanelOpen(false)} className="md:hidden">
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            <Textarea 
                                placeholder="Provide a detailed description of what needs to be done, and the AI will break it down into subtasks..."
                                value={generationPrompt}
                                onChange={(e) => setGenerationPrompt(e.target.value)}
                                rows={5}
                            />
                            <Button type="button" onClick={handleGenerateSubtasks} disabled={isGenerating} className="w-full">
                                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                Generate Subtasks
                            </Button>
                        </div>

                        {suggestedSubtasks.length > 0 && (
                            <>
                                <Separator />
                                <div className="space-y-2">
                                    <FormLabel>AI Suggestions</FormLabel>
                                    <p className="text-xs text-muted-foreground">Click the plus icon to add a subtask.</p>
                                    <div className="space-y-2 max-h-40 overflow-y-auto rounded-md border p-2">
                                        {suggestedSubtasks.map((suggestion, index) => (
                                            <div key={index} className="flex items-center justify-between gap-2 p-2 bg-muted/50 rounded-md">
                                                <span className="text-sm flex-1">{suggestion}</span>
                                                <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleAddSuggestedSubtask(suggestion)}>
                                                    <PlusCircle className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting || isGenerating}>
                  Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || isGenerating}>
                {(isSubmitting || isGenerating) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                Add Task
              </Button>
            </div>
        </form>
        </Form>
    </div>
  );
}
