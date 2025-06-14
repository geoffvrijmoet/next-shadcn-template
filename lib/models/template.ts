export interface TemplateFile {
  id: string;
  path: string;
  content: string;
  language: 'typescript' | 'javascript' | 'json' | 'css' | 'markdown' | 'text';
  description?: string;
  isRequired: boolean;
  category: 'config' | 'component' | 'page' | 'api' | 'style' | 'docs' | 'other';
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: 'nextjs-shadcn' | 'nextjs-ecommerce' | 'nextjs-blog' | 'nextjs-saas' | 'custom';
  version: string;
  author: string;
  tags: string[];
  files: TemplateFile[];
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  scripts: Record<string, string>;
  environmentVariables: {
    key: string;
    description: string;
    required: boolean;
    defaultValue?: string;
  }[];
  features: string[];
  previewUrl?: string;
  documentationUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
  downloadCount: number;
}

export interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  templates: Template[];
}

export interface TemplateVariable {
  key: string;
  value: string;
  description: string;
} 