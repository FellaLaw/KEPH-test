'use client';

import { useRef, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useToast } from '@/hooks/use-toast';
import type { Task } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, Circle, NotebookText, Link as LinkIcon, Copy, Download, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';

interface DailySummaryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  formattedDate: string;
}

export function DailySummaryDialog({ isOpen, onClose, tasks, formattedDate }: DailySummaryDialogProps) {
  const reportContentRef = useRef<HTMLDivElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  if (!isOpen) return null;

  const totalTasks = tasks.length;
  
  const completedTasksList = tasks.filter(t => {
      if (t.subtasks && t.subtasks.length > 0) {
          return t.subtasks.every(st => st.completed);
      }
      return t.status === 'completed';
  });

  const incompleteTasksList = tasks.filter(t => !completedTasksList.some(ct => ct.id === t.id));
  const completedTasksCount = completedTasksList.length;
  
  let totalSubtasks = 0;
  let completedSubtasks = 0;
  tasks.forEach(task => {
    if (task.subtasks && task.subtasks.length > 0) {
      totalSubtasks += task.subtasks.length;
      completedSubtasks += task.subtasks.filter(st => st.completed).length;
    }
  });
  
  let itemsForCompletion = 0;
  let completedItemsForCompletion = 0;
  tasks.forEach(task => {
    if (task.subtasks && task.subtasks.length > 0) {
        itemsForCompletion += task.subtasks.length;
        completedItemsForCompletion += task.subtasks.filter(st => st.completed).length;
    } else {
        itemsForCompletion += 1;
        if (task.status === 'completed') {
            completedItemsForCompletion += 1;
        }
    }
  });
  const completionRate = itemsForCompletion > 0 ? (completedItemsForCompletion / itemsForCompletion) * 100 : 0;

  const generateMarkdown = () => {
    let md = `# End of Day Report: ${formattedDate}\n\n`;

    md += `## Daily Statistics\n`;
    md += `- **Overall Progress**: ${completionRate.toFixed(0)}%\n`;
    md += `- **Tasks Completed**: ${completedTasksCount} / ${totalTasks}\n`;
    md += `- **Subtasks Checked**: ${completedSubtasks} / ${totalSubtasks}\n\n`;
    md += '---\n\n';

    const renderTaskToMarkdown = (task: Task) => {
        let taskMd = `### ${task.status === 'completed' ? '✅' : '🔲'} ${task.title}\n\n`;
        if (task.subtasks && task.subtasks.length > 0) {
            taskMd += task.subtasks.map(st => `- [${st.completed ? 'x' : ' '}] ${st.title}`).join('\n') + '\n\n';
        }
        if (task.notes) {
            taskMd += `**Notes:**\n${task.notes}\n\n`;
        }
        if (task.urls && task.urls.length > 0) {
            taskMd += `**URLs:**\n` + task.urls.map(url => `- ${url.value}`).join('\n') + '\n\n';
        }
        return taskMd;
    }

    if (completedTasksList.length > 0) {
        md += '## Accomplishments\n\n';
        md += completedTasksList.map(renderTaskToMarkdown).join('---\n');
    }

    if (incompleteTasksList.length > 0) {
        md += '\n## Outstanding Items\n\n';
        md += incompleteTasksList.map(renderTaskToMarkdown).join('---\n');
    }

    if (tasks.length === 0) {
        md += 'No tasks recorded for this day.\n';
    }

    return md;
  };

  const handleCopyMarkdown = () => {
    const markdown = generateMarkdown();
    navigator.clipboard.writeText(markdown).then(() => {
        toast({
            title: "Copied to clipboard!",
            description: "The report has been copied in Markdown format."
        });
    }, (err) => {
        toast({
            variant: "destructive",
            title: "Copy Failed",
            description: "Could not copy to clipboard. Please try again."
        });
        console.error('Could not copy text: ', err);
    });
  };

  const handleDownloadPdf = () => {
    const reportElement = reportContentRef.current;
    if (!reportElement) return;

    setIsProcessing(true);

    html2canvas(reportElement, {
      scale: 2,
      useCORS: true,
      backgroundColor: null,
    }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
      });

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      let heightLeft = pdfHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`TaskWise-Report-${formattedDate.replace(/[\s,]+/g, '-')}.pdf`);
    }).catch(err => {
      console.error("Error generating PDF:", err);
      toast({
        variant: 'destructive',
        title: 'PDF Generation Failed',
        description: 'Could not generate PDF. Please try again.',
      });
    }).finally(() => {
      setIsProcessing(false);
    });
  };

  const renderTaskDetails = (task: Task) => (
    <div key={task.id} className="p-4 rounded-lg bg-muted/50 border">
        <div className="flex items-center gap-3">
            {task.status === 'completed' ? <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" /> : <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />}
            <span className="font-semibold">{task.title}</span>
        </div>
        {task.subtasks && task.subtasks.length > 0 && (
            <ul className="pl-8 mt-2 space-y-1.5">
                {task.subtasks.map(subtask => (
                    <li key={subtask.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                         {subtask.completed ? <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" /> : <Circle className="h-4 w-4 flex-shrink-0" />}
                         <span className={cn(subtask.completed && 'line-through')}>{subtask.title}</span>
                    </li>
                ))}
            </ul>
        )}
        {task.notes && (
             <p className="text-sm text-muted-foreground flex items-start gap-2 mt-2 pl-8">
                <NotebookText className="w-4 h-4 mt-0.5 shrink-0" />
                <span className="whitespace-pre-wrap">{task.notes}</span>
            </p>
        )}
        {task.urls && task.urls.length > 0 && (
            <div className="space-y-1 mt-2 pl-8">
            {task.urls.map(url => (
                <a 
                    key={url.id}
                    href={url.value} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-sm text-link hover:underline flex items-center gap-2"
                >
                    <LinkIcon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{url.value}</span>
                </a>
            ))}
            </div>
        )}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">End of Day Report: {formattedDate}</DialogTitle>
          <DialogDescription>
            A summary of your activities and progress for the day.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto pr-6" ref={reportContentRef}>
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Daily Statistics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <div className="flex justify-between items-center mb-1 text-sm">
                                <span className="font-medium">Overall Progress</span>
                                <span className="text-muted-foreground">{completionRate.toFixed(0)}%</span>
                            </div>
                            <Progress value={completionRate} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div className="p-3 bg-muted rounded-md">
                                <div className="text-muted-foreground">Tasks Completed</div>
                                <div className="text-2xl font-bold">{completedTasksCount} / {totalTasks}</div>
                            </div>
                            <div className="p-3 bg-muted rounded-md">
                                <div className="text-muted-foreground">Subtasks Checked</div>
                                <div className="text-2xl font-bold">{completedSubtasks} / {totalSubtasks}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <div className="space-y-6">
                    {completedTasksList.length > 0 && (
                        <div>
                            <h3 className="text-xl font-semibold mb-3 text-green-500">Accomplishments</h3>
                            <div className="space-y-3">
                                {completedTasksList.map(renderTaskDetails)}
                            </div>
                        </div>
                    )}
                     {incompleteTasksList.length > 0 && (
                        <div>
                            <Separator className="my-6" />
                            <h3 className="text-xl font-semibold mb-3 text-amber-500">Outstanding Items</h3>
                            <div className="space-y-3">
                                {incompleteTasksList.map(renderTaskDetails)}
                            </div>
                        </div>
                    )}
                    {tasks.length === 0 && (
                        <p className="text-muted-foreground text-center py-8">No tasks recorded for this day.</p>
                    )}
                </div>
            </div>
        </div>
        <DialogFooter className="pt-4 border-t mt-4">
            <Button variant="outline" onClick={handleCopyMarkdown} disabled={isProcessing}>
                <Copy className="mr-2 h-4 w-4" />
                Copy as Markdown
            </Button>
            <Button onClick={handleDownloadPdf} disabled={isProcessing}>
                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Download PDF
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
