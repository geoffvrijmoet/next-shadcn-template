export interface DNSRecord {
  type: 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'NS';
  name: string;
  value: string;
  ttl?: number;
  priority?: number;
}

export interface DNSProvider {
  createRecord(domain: string, record: DNSRecord): Promise<void>;
  deleteRecord(domain: string, recordId: string): Promise<void>;
  listRecords(domain: string): Promise<DNSRecord[]>;
  updateRecord(domain: string, recordId: string, record: Partial<DNSRecord>): Promise<void>;
}

// Internal helper types for external API responses
interface CloudflareAPIRecord {
  id: string;
  type: string;
  name: string;
  content: string;
  ttl: number;
  priority?: number;
}

interface GoogleDnsAnswer {
  data: string;
}

/**
 * Namecheap DNS API Service
 */
export class NamecheapDNS implements DNSProvider {
  private apiKey: string;
  private username: string;
  private baseUrl = 'https://api.namecheap.com/xml.response';

  constructor(apiKey: string, username: string) {
    this.apiKey = apiKey;
    this.username = username;
  }

  async createRecord(domain: string, record: DNSRecord): Promise<void> {
    const [domainName, tld] = domain.split('.');
    
    const params = new URLSearchParams({
      ApiUser: this.username,
      ApiKey: this.apiKey,
      UserName: this.username,
      Command: 'namecheap.domains.dns.setHosts',
      ClientIp: await this.getClientIP(),
      SLD: domainName,
      TLD: tld,
      HostName1: record.name,
      RecordType1: record.type,
      Address1: record.value,
      TTL1: (record.ttl || 300).toString()
    });

    const response = await fetch(`${this.baseUrl}?${params}`);
    if (!response.ok) {
      throw new Error(`Namecheap DNS error: ${response.statusText}`);
    }
  }

  async deleteRecord(domain: string, recordId: string): Promise<void> {
    // Namecheap requires getting all records and setting them again without the one to delete
    const records = await this.listRecords(domain);
    const filteredRecords = records.filter(r => r.name !== recordId);
    await this.setAllRecords(domain, filteredRecords);
  }

  async listRecords(domain: string): Promise<DNSRecord[]> {
    const [domainName, tld] = domain.split('.');
    
    const params = new URLSearchParams({
      ApiUser: this.username,
      ApiKey: this.apiKey,
      UserName: this.username,
      Command: 'namecheap.domains.dns.getHosts',
      ClientIp: await this.getClientIP(),
      SLD: domainName,
      TLD: tld
    });

    const response = await fetch(`${this.baseUrl}?${params}`);
    if (!response.ok) {
      throw new Error(`Namecheap DNS error: ${response.statusText}`);
    }

    // Parse XML response and extract records (placeholder – implement XML parsing as needed)
    await response.text();
    return [];
  }

  async updateRecord(domain: string, recordId: string, record: Partial<DNSRecord>): Promise<void> {
    const records = await this.listRecords(domain);
    const updatedRecords = records.map(r => 
      r.name === recordId ? { ...r, ...record } : r
    );
    await this.setAllRecords(domain, updatedRecords);
  }

  private async setAllRecords(domain: string, records: DNSRecord[]): Promise<void> {
    const [domainName, tld] = domain.split('.');
    
    const params = new URLSearchParams({
      ApiUser: this.username,
      ApiKey: this.apiKey,
      UserName: this.username,
      Command: 'namecheap.domains.dns.setHosts',
      ClientIp: await this.getClientIP(),
      SLD: domainName,
      TLD: tld
    });

    records.forEach((record, index) => {
      const i = index + 1;
      params.append(`HostName${i}`, record.name);
      params.append(`RecordType${i}`, record.type);
      params.append(`Address${i}`, record.value);
      params.append(`TTL${i}`, (record.ttl || 300).toString());
    });

    const response = await fetch(`${this.baseUrl}?${params}`);
    if (!response.ok) {
      throw new Error(`Namecheap DNS error: ${response.statusText}`);
    }
  }

  private async getClientIP(): Promise<string> {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  }
}

/**
 * Cloudflare DNS API Service
 */
export class CloudflareDNS implements DNSProvider {
  private apiToken: string;
  private baseUrl = 'https://api.cloudflare.com/client/v4';

  constructor(apiToken: string) {
    this.apiToken = apiToken;
  }

  async createRecord(domain: string, record: DNSRecord): Promise<void> {
    const zoneId = await this.getZoneId(domain);
    
    const response = await fetch(`${this.baseUrl}/zones/${zoneId}/dns_records`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: record.type,
        name: record.name,
        content: record.value,
        ttl: record.ttl || 300,
        priority: record.priority
      })
    });

    if (!response.ok) {
      throw new Error(`Cloudflare DNS error: ${response.statusText}`);
    }
  }

  async deleteRecord(domain: string, recordId: string): Promise<void> {
    const zoneId = await this.getZoneId(domain);
    
    const response = await fetch(`${this.baseUrl}/zones/${zoneId}/dns_records/${recordId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Cloudflare DNS error: ${response.statusText}`);
    }
  }

  async listRecords(domain: string): Promise<DNSRecord[]> {
    const zoneId = await this.getZoneId(domain);
    
    const response = await fetch(`${this.baseUrl}/zones/${zoneId}/dns_records`, {
      headers: {
        'Authorization': `Bearer ${this.apiToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Cloudflare DNS error: ${response.statusText}`);
    }

    const data = await response.json();
    return (data.result as CloudflareAPIRecord[]).map((record) => ({
      type: record.type as DNSRecord['type'],
      name: record.name,
      value: record.content,
      ttl: record.ttl,
      priority: record.priority
    }));
  }

  async updateRecord(domain: string, recordId: string, record: Partial<DNSRecord>): Promise<void> {
    const zoneId = await this.getZoneId(domain);
    
    const response = await fetch(`${this.baseUrl}/zones/${zoneId}/dns_records/${recordId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(record)
    });

    if (!response.ok) {
      throw new Error(`Cloudflare DNS error: ${response.statusText}`);
    }
  }

  private async getZoneId(domain: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/zones?name=${domain}`, {
      headers: {
        'Authorization': `Bearer ${this.apiToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Cloudflare DNS error: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.result.length === 0) {
      throw new Error(`Domain ${domain} not found in Cloudflare`);
    }

    return data.result[0].id;
  }
}

/**
 * DNS Manager that handles multiple providers
 */
export class DNSManager {
  private providers: Map<string, DNSProvider> = new Map();

  addProvider(name: string, provider: DNSProvider): void {
    this.providers.set(name, provider);
  }

  async setupVercelDomain(domain: string, provider: string): Promise<void> {
    const dnsProvider = this.providers.get(provider);
    if (!dnsProvider) {
      throw new Error(`DNS provider ${provider} not configured`);
    }

    // Add CNAME record pointing to Vercel
    await dnsProvider.createRecord(domain, {
      type: 'CNAME',
      name: '@',
      value: 'cname.vercel-dns.com',
      ttl: 300
    });

    // Add www CNAME record
    await dnsProvider.createRecord(domain, {
      type: 'CNAME',
      name: 'www',
      value: 'cname.vercel-dns.com',
      ttl: 300
    });
  }

  async setupClerkDomain(domain: string, provider: string, clerkFrontendApi: string): Promise<void> {
    const dnsProvider = this.providers.get(provider);
    if (!dnsProvider) {
      throw new Error(`DNS provider ${provider} not configured`);
    }

    // Add CNAME record for Clerk authentication
    await dnsProvider.createRecord(domain, {
      type: 'CNAME',
      name: 'clerk',
      value: clerkFrontendApi,
      ttl: 300
    });
  }

  async verifyDomainSetup(domain: string, expectedRecords: DNSRecord[]): Promise<boolean> {
    try {
      // Use a DNS lookup service to verify records are properly set
      for (const record of expectedRecords) {
        const response = await fetch(`https://dns.google/resolve?name=${record.name}.${domain}&type=${record.type}`);
        const data = await response.json();
        
        if (!data.Answer || !data.Answer.some((answer: GoogleDnsAnswer) => answer.data === record.value)) {
          return false;
        }
      }
      return true;
    } catch {
      return false;
    }
  }
} 