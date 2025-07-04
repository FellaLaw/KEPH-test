'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { textToTasks } from '@/ai/flows/text-to-tasks';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mic, MicOff } from 'lucide-react';
import { cn } from '@/lib/utils';

// The browser's SpeechRecognition API is not available on the server
// so we need to declare it to avoid TypeScript errors.
declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

const formSchema = z.object({
  description: z
    .string()
    .min(10, { message: 'Please enter at least 10 characters.' })
    .max(500, { message: 'Description cannot exceed 500 characters.' }),
});

interface TextToTasksFormProps {
  onTasksCreated: (tasks: Array<{ title: string; subtasks?: string[] }>) => void;
}

export function TextToTasksForm({ onTasksCreated }: TextToTasksFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: '',
    },
  });

  const { setValue, watch } = form;

  // Voice to text state
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const initialTranscriptRef = useRef('');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechError('Voice input is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
        initialTranscriptRef.current = watch('description');
        setIsListening(true);
        setSpeechError(null);
    };

    recognition.onend = () => {
        setIsListening(false);
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error', event);
        setSpeechError(`Speech error: ${event.error}. Please try again.`);
        setIsListening(false);
    };
    
    recognition.onresult = (event) => {
        const currentTranscript = Array.from(event.results)
            .map(result => result[0].transcript)
            .join('');
        
        let newText = initialTranscriptRef.current;
        if (newText.length > 0 && !newText.endsWith(' ')) {
            newText += ' ';
        }
        newText += currentTranscript;

        setValue('description', newText, { shouldValidate: true });
    };

    recognitionRef.current = recognition;

    return () => {
        recognitionRef.current?.abort();
    };
  }, [setValue, watch]);

  const handleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
    }
  };


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const result = await textToTasks({ description: values.description });
      onTasksCreated(result.tasks);
      form.reset();
    } catch (error) {
      console.error('Error generating tasks from text:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to generate tasks. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Describe your goals</FormLabel>
              <FormControl>
                <div className="relative">
                  <Textarea
                    placeholder="e.g., I need to prepare for the client meeting tomorrow, then pick up groceries and book a flight for my trip next month."
                    {...field}
                    rows={5}
                    className="pr-12"
                  />
                  <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleListen}
                      className={cn(
                          "absolute bottom-2 right-2 h-8 w-8 rounded-full text-muted-foreground transition-colors",
                          isListening && "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                          !isListening && "hover:bg-accent hover:text-accent-foreground"
                      )}
                      disabled={!!speechError && !isListening}
                      title={speechError ? speechError : (isListening ? 'Stop recording' : 'Start recording')}
                  >
                      {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      <span className="sr-only">{isListening ? 'Stop recording' : 'Start recording'}</span>
                  </Button>
                </div>
              </FormControl>
              <FormDescription>
                {speechError ? <span className="text-destructive">{speechError}</span> : 'The AI will extract tasks from your text. You can also use your voice.'}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting || isListening} className="w-full">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isListening ? 'Listening...' : 'Generate Tasks'}
        </Button>
      </form>
    </Form>
  );
}
