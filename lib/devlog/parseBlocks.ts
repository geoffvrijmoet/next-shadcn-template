import yaml from 'js-yaml';

export interface NewAppBlock {
  type: 'new-app';
  raw: string;
  data: {
    name: string;
    description: string;
    services?: string[];
    cluster?: string;
  };
}

export type DevlogBlock = NewAppBlock;

type NewAppData = {
  name: string;
  description: string;
  services?: string[];
  cluster?: string;
};

function isNewAppData(obj: unknown): obj is NewAppData {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'name' in obj &&
    'description' in obj
  );
}

/**
 * Parse markdown text for fenced code blocks like ```new-app\n...yaml...\n```.
 */
export function parseDevlog(content: string): DevlogBlock[] {
  const blocks: DevlogBlock[] = [];
  const regex = /```(new-app)([\s\S]*?)```/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    const [, tag, body] = match;
    if (tag === 'new-app') {
      try {
        const parsed = yaml.load(body.trim()) as unknown;
        if (isNewAppData(parsed)) {
          blocks.push({ type: 'new-app', raw: match[0], data: parsed });
        }
      } catch {
        // ignore malformed yaml
      }
    }
  }
  return blocks;
} 