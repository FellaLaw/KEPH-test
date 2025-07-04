'use server';

/**
 * @fileOverview A flow that generates subtasks for a given task title and description.
 *
 * - generateSubtasks - A function that handles the generation of subtasks.
 * - GenerateSubtasksInput - The input type for the generateSubtasks function.
 * - GenerateSubtasksOutput - The return type for the generateSubtasks function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSubtasksInputSchema = z.object({
  taskTitle: z.string().describe('The title of the main task.'),
  description: z.string().describe('A detailed description of what needs to be accomplished for the task.'),
});
export type GenerateSubtasksInput = z.infer<typeof GenerateSubtasksInputSchema>;

const GenerateSubtasksOutputSchema = z.object({
  subtasks: z
    .array(z.string())
    .describe(
      'A list of smaller, concrete steps or sub-tasks needed to complete the main task.'
    ),
});
export type GenerateSubtasksOutput = z.infer<typeof GenerateSubtasksOutputSchema>;

export async function generateSubtasks(input: GenerateSubtasksInput): Promise<GenerateSubtasksOutput> {
  return generateSubtasksFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSubtasksPrompt',
  input: {schema: GenerateSubtasksInputSchema},
  output: {schema: GenerateSubtasksOutputSchema},
  prompt: `You are an assistant skilled at breaking down large tasks into smaller, actionable subtasks.

  Your goal is to generate a list of subtasks based on the main task's title and a more detailed description. You MUST consider both the title and the description to create a comprehensive and relevant list of subtasks. Each subtask should be a clear, concise action item.

  Task Title: {{taskTitle}}

  Detailed Description:
  {{description}}
  `,
});

const generateSubtasksFlow = ai.defineFlow(
  {
    name: 'generateSubtasksFlow',
    inputSchema: GenerateSubtasksInputSchema,
    outputSchema: GenerateSubtasksOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
