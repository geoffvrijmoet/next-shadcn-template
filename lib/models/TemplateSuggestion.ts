export interface TemplateSuggestion {
  _id?: string;
  title: string;
  description: string;
  category: 'component' | 'library' | 'feature' | 'configuration' | 'other';
  submitterName?: string;
  submitterUrl?: string;
  codeExample?: string;
  implementationNotes?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'approved' | 'rejected' | 'implemented';
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTemplateSuggestionInput {
  title: string;
  description: string;
  category: 'component' | 'library' | 'feature' | 'configuration' | 'other';
  submitterName?: string;
  submitterUrl?: string;
  codeExample?: string;
  implementationNotes?: string;
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
} 