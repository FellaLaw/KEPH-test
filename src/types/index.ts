export type TaskStatus = 'current' | 'completed' | 'pending';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Url {
  id: string;
  value: string;
}

export interface Task {
  id: string;
  title: string;
  subtasks?: Subtask[];
  status: TaskStatus;
  createdAt: Date;
  notes?: string;
  urls?: Url[];
  dueDate?: Date;
  completedAt?: Date;
}

export type NotificationType = 'overdue-tasks';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  createdAt: Date;
  read: boolean;
  data: any;
}
