export type Project = {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  client_id: string | null;
  created_at: string;
  is_archived: boolean | null;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | null;
  total_price: number | null;
};

export type Task = {
  id: string;
  project_id: string | null;
  client_id: string | null;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'done';
  owner_id: string;
  due_date: string | null;
  created_at: string;
  hours: number | null;
  price_per_hour: number | null;
  approved: boolean | null;
};

export type Client = {
  id: string;
  company: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  description: string | null;
  owner_id: string;
  created_at: string;
};

export type UserRole = {
  id: string;
  user_id: string;
  role: 'admin' | 'user';
  created_at: string;
};

export type TaskWithProject = Task & {
  project: Project | null;
};

export type TaskWithClient = Task & {
  client: Client | null;
};

export type TaskWithProjectAndClient = Task & {
  project: Project | null;
  client: Client | null;
};

export type ProjectWithClient = Project & {
  client: Client | null;
};

export type Database = {
  public: {
    Tables: {
      projects: {
        Row: Project;
        Insert: Omit<Project, 'id' | 'created_at'>;
        Update: Partial<Omit<Project, 'id' | 'created_at' | 'owner_id'>>;
      };
      tasks: {
        Row: Task;
        Insert: Omit<Task, 'id' | 'created_at'>;
        Update: Partial<Omit<Task, 'id' | 'created_at' | 'owner_id'>>;
      };
      clients: {
        Row: Client;
        Insert: Omit<Client, 'id' | 'created_at'>;
        Update: Partial<Omit<Client, 'id' | 'created_at' | 'owner_id'>>;
      };
      user_roles: {
        Row: UserRole;
        Insert: Omit<UserRole, 'id' | 'created_at'>;
        Update: Partial<Omit<UserRole, 'id' | 'created_at'>>;
      };
    };
  };
}; 