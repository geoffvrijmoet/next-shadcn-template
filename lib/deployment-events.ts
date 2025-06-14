export interface DeploymentEvent {
  deploymentId: string;
  stepId: string;
  status: string;
  message?: string;
  data?: unknown;
}

type Listener = (event: DeploymentEvent) => void;

class DeploymentEmitter {
  private listeners: Map<string, Set<Listener>> = new Map();

  /** Subscribe to events for a deployment */
  on(deploymentId: string, listener: Listener) {
    if (!this.listeners.has(deploymentId)) {
      this.listeners.set(deploymentId, new Set());
    }
    this.listeners.get(deploymentId)!.add(listener);
  }

  off(deploymentId: string, listener: Listener) {
    this.listeners.get(deploymentId)?.delete(listener);
  }

  emit(event: DeploymentEvent) {
    this.listeners.get(event.deploymentId)?.forEach((l) => l(event));
  }
}

export const deploymentEventBus = new DeploymentEmitter();