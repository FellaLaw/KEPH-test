'use client';

import { useState, useRef, useEffect } from 'react';
import { voiceToTasks } from '@/ai/flows/voice-to-tasks';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Mic, StopCircle, Loader2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceRecorderProps {
  onTasksCreated: (tasks: Array<{ title: string; subtasks?: string[] }>) => void;
}

export function VoiceRecorder({ onTasksCreated }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(() => setHasPermission(true))
      .catch(() => setHasPermission(false));
  }, []);

  const startRecording = async () => {
    if (isRecording || hasPermission === false) return;
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setIsRecording(true);
        audioChunksRef.current = [];
        mediaRecorderRef.current = new MediaRecorder(stream);

        mediaRecorderRef.current.ondataavailable = (event) => {
            audioChunksRef.current.push(event.data);
        };

        mediaRecorderRef.current.onstop = async () => {
            setIsProcessing(true);
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = async () => {
                const base64data = reader.result as string;
                if(base64data) {
                    try {
                        const result = await voiceToTasks({ speechDataUri: base64data });
                        onTasksCreated(result.tasks);
                    } catch (error) {
                        console.error("Error generating tasks from voice:", error);
                        toast({
                            variant: "destructive",
                            title: "Error",
                            description: "Failed to process voice input. Please try again.",
                        });
                    } finally {
                        setIsProcessing(false);
                    }
                }
            };
            stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorderRef.current.start();
    } catch(err) {
        setHasPermission(false);
        toast({
            variant: "destructive",
            title: "Microphone Access Denied",
            description: "Please allow microphone access in your browser settings to use this feature.",
        });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  if (hasPermission === null) {
      return (
          <div className="flex flex-col items-center justify-center space-y-2 p-4 border rounded-lg h-32">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground text-sm">Requesting microphone access...</p>
          </div>
      )
  }

  if (hasPermission === false) {
    return (
        <div className="flex flex-col items-center justify-center space-y-2 p-4 border-destructive border-dashed border-2 rounded-lg h-32 text-destructive">
            <AlertTriangle className="w-6 h-6" />
            <p className="text-center text-sm font-medium">Microphone access denied. Please enable it in your browser settings.</p>
        </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-4 border rounded-lg">
      <p className="text-sm text-center text-muted-foreground">
        {isRecording
          ? 'Recording in progress...'
          : isProcessing
          ? 'AI is processing your thoughts...'
          : 'Click the button and speak your tasks.'}
      </p>
      <Button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
        size="lg"
        variant={isRecording ? 'destructive' : 'default'}
        className="w-24 h-24 rounded-full"
      >
        {isProcessing ? (
          <Loader2 className="w-8 h-8 animate-spin" />
        ) : isRecording ? (
          <StopCircle className="w-8 h-8" />
        ) : (
          <Mic className="w-8 h-8" />
        )}
      </Button>
    </div>
  );
}
