// Assignment and Class types based on database schema
export type AssignmentStatus = 'incomplete' | 'complete';

export interface Assignment {
  id: number;
  user_id: string;
  class_id: number;
  title: string;
  due_date: string; // ISO 8601 timestamp
  status: AssignmentStatus;
  created_at?: string;
}

export interface Class {
  id: number;
  user_id: string;
  name: string; // e.g., "MATH 113 - Calculus I"
  created_at?: string;
}

// Assignment with class information for dashboard display
export interface AssignmentWithClass extends Assignment {
  class: Class;
}

// User Profile type
export interface UserProfile {
  id: string;
  user_id: string; // FK to auth.users
  email: string;
  full_name?: string | null;
  has_completed_onboarding?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Syllabus types
export interface SyllabusUpload {
  id: string;
  user_id: string;
  class_id: number;
  file_url?: string; // Supabase Storage URL if file uploaded
  text_content?: string; // Direct text input
  original_filename?: string;
  file_size?: number;
  mime_type?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at?: string;
  updated_at?: string;
}

// AI Parsing types
export interface ParsedAssignment {
  title: string;
  due_date: string; // ISO 8601 timestamp
  description?: string;
  type?: string; // e.g., "homework", "exam", "project"
  points?: number;
  class_id: number;
}

export interface AIParsingResult {
  assignments: ParsedAssignment[];
  confidence?: number;
  notes?: string;
  className: string;
  message: string;
}

// Assignment Review types
export interface ReviewableAssignment extends ParsedAssignment {
  id: string; // Temporary ID for review interface
  isEdited: boolean;
  isNew: boolean;
}

export interface AssignmentReviewState {
  originalAssignments: ParsedAssignment[];
  reviewAssignments: ReviewableAssignment[];
  className: string;
  classId: number;
  isConfirming: boolean;
  hasChanges: boolean;
}

// Sub-task type for assignment planning
export interface SubTask {
  id: number;
  plan_id: number;
  title: string;
  description?: string;
  step_number: number;
  order_index: number;
  estimated_hours?: number;
  status: 'pending' | 'in_progress' | 'completed';
  generated_prompt?: string;
  created_at?: string;
  updated_at?: string;
}

// Assignment Planning types - Simplified for single prompt generation
export interface AssignmentPlan {
  id: number;
  assignment_id: number;
  original_instructions: string;
  generated_prompt?: string; // The single structured XML prompt
  prompt_status: 'pending' | 'generating' | 'completed' | 'failed';
  sub_tasks: SubTask[];
  created_at?: string;
  updated_at?: string;
}

export interface AssignmentPlanWithAssignment extends AssignmentPlan {
  assignment: AssignmentWithClass;
}

// Refinement message type for chat interface
export interface RefinementMessage {
  id: string;
  plan_id: number;
  message_type: 'user' | 'system';
  content: string;
  change_summary?: string;
  timestamp: string;
  created_at: string;
  isTemporary?: boolean;
}