import { type Template, type TemplateFile, type TemplateVariable } from '@/lib/models/template';

export class TemplateManager {
  private baseUrl = '/api/templates';

  /**
   * Get all available templates
   */
  async getTemplates(): Promise<Template[]> {
    const response = await fetch(`${this.baseUrl}`);
    if (!response.ok) throw new Error('Failed to fetch templates');
    return response.json();
  }

  /**
   * Get a specific template by ID
   */
  async getTemplate(id: string): Promise<Template> {
    const response = await fetch(`${this.baseUrl}/${id}`);
    if (!response.ok) throw new Error('Template not found');
    return response.json();
  }

  /**
   * Create a new template
   */
  async createTemplate(template: Omit<Template, 'id' | 'createdAt' | 'updatedAt' | 'downloadCount'>): Promise<Template> {
    const response = await fetch(`${this.baseUrl}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(template)
    });
    if (!response.ok) throw new Error('Failed to create template');
    return response.json();
  }

  /**
   * Update an existing template
   */
  async updateTemplate(id: string, updates: Partial<Template>): Promise<Template> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!response.ok) throw new Error('Failed to update template');
    return response.json();
  }

  /**
   * Delete a template
   */
  async deleteTemplate(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete template');
  }

  /**
   * Clone an existing template
   */
  async cloneTemplate(id: string, newName: string): Promise<Template> {
    const response = await fetch(`${this.baseUrl}/${id}/clone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName })
    });
    if (!response.ok) throw new Error('Failed to clone template');
    return response.json();
  }

  /**
   * Add a file to a template
   */
  async addFile(templateId: string, file: Omit<TemplateFile, 'id'>): Promise<TemplateFile> {
    const response = await fetch(`${this.baseUrl}/${templateId}/files`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(file)
    });
    if (!response.ok) throw new Error('Failed to add file');
    return response.json();
  }

  /**
   * Update a file in a template
   */
  async updateFile(templateId: string, fileId: string, updates: Partial<TemplateFile>): Promise<TemplateFile> {
    const response = await fetch(`${this.baseUrl}/${templateId}/files/${fileId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!response.ok) throw new Error('Failed to update file');
    return response.json();
  }

  /**
   * Delete a file from a template
   */
  async deleteFile(templateId: string, fileId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${templateId}/files/${fileId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete file');
  }

  /**
   * Process template variables in content
   */
  processTemplateVariables(content: string, variables: TemplateVariable[]): string {
    let processedContent = content;
    
    variables.forEach(variable => {
      const regex = new RegExp(`{{\\s*${variable.key}\\s*}}`, 'g');
      processedContent = processedContent.replace(regex, variable.value);
    });

    return processedContent;
  }

  /**
   * Generate template from existing project
   */
  async generateFromProject(projectPath: string, templateName: string): Promise<Template> {
    const response = await fetch(`${this.baseUrl}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectPath, templateName })
    });
    if (!response.ok) throw new Error('Failed to generate template');
    return response.json();
  }

  /**
   * Preview template without deploying
   */
  async previewTemplate(templateId: string, variables: TemplateVariable[]): Promise<{
    files: TemplateFile[];
    packageJson: object;
  }> {
    const response = await fetch(`${this.baseUrl}/${templateId}/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ variables })
    });
    if (!response.ok) throw new Error('Failed to preview template');
    return response.json();
  }

  /**
   * Export template as ZIP
   */
  async exportTemplate(templateId: string): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/${templateId}/export`);
    if (!response.ok) throw new Error('Failed to export template');
    return response.blob();
  }

  /**
   * Import template from ZIP
   */
  async importTemplate(file: File): Promise<Template> {
    const formData = new FormData();
    formData.append('template', file);

    const response = await fetch(`${this.baseUrl}/import`, {
      method: 'POST',
      body: formData
    });
    if (!response.ok) throw new Error('Failed to import template');
    return response.json();
  }
} 