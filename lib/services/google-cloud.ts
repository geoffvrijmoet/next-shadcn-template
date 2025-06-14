import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

export interface GoogleCloudConfig {
  projectId: string; // must be unique (lowercase, digits, hyphen)
  projectName: string;
  organizationId?: string; // Optional org / folder placement
  billingAccountId?: string; // Optional billing account to link
  enableApis?: string[]; // list of api names to enable e.g. ["compute.googleapis.com"]
}

export class GoogleCloudService {
  private auth: JWT;

  constructor(clientEmail: string, privateKey: string) {
    const scopes = ['https://www.googleapis.com/auth/cloud-platform'];
    this.auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes,
    });
  }

  /** Create a new GCP project */
  async createProject(config: GoogleCloudConfig): Promise<string> {
    const crm = google.cloudresourcemanager({ version: 'v1', auth: this.auth });

    const body: any = {
      projectId: config.projectId,
      name: config.projectName,
    };
    if (config.organizationId) {
      body.parent = { type: 'organization', id: config.organizationId };
    }
    const res = await crm.projects.create({ requestBody: body });
    // Operation name returned; project creation may take seconds. Return projectId.
    return config.projectId;
  }

  /** Enable a list of services/APIs for the given project */
  async enableApis(projectId: string, apis: string[]): Promise<void> {
    if (apis.length === 0) return;
    const serviceUsage = google.serviceusage({ version: 'v1', auth: this.auth });
    const parent = `projects/${projectId}`;
    for (const api of apis) {
      const name = `${parent}/services/${api}`;
      try {
        await serviceUsage.services.enable({ name });
      } catch (err: any) {
        if (err?.errors?.[0]?.reason === 'failedPrecondition') {
          // already enabled
          continue;
        }
        throw err;
      }
    }
  }
}