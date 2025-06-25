export interface OperationMetrics {
  operation: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  success: boolean;
  error?: string;
}

export class MetricsCollector {
  private operations: OperationMetrics[] = [];
  private counters: Map<string, number> = new Map();
  
  startOperation(operation: string): OperationMetrics {
    const metric: OperationMetrics = {
      operation,
      startTime: Date.now(),
      success: false
    };
    this.operations.push(metric);
    return metric;
  }
  
  endOperation(metric: OperationMetrics, success: boolean, error?: string): void {
    metric.endTime = Date.now();
    metric.duration = metric.endTime - metric.startTime;
    metric.success = success;
    metric.error = error;
    
    // Update counters
    const key = `${metric.operation}.${success ? 'success' : 'failure'}`;
    this.counters.set(key, (this.counters.get(key) || 0) + 1);
  }
  
  incrementCounter(name: string): void {
    this.counters.set(name, (this.counters.get(name) || 0) + 1);
  }
  
  getMetrics(): {
    operations: OperationMetrics[];
    counters: Record<string, number>;
    summary: {
      totalOperations: number;
      successRate: number;
      averageDuration: number;
    };
  } {
    const successful = this.operations.filter(op => op.success);
    const completed = this.operations.filter(op => op.duration !== undefined);
    
    return {
      operations: this.operations.slice(-100), // Last 100 operations
      counters: Object.fromEntries(this.counters),
      summary: {
        totalOperations: this.operations.length,
        successRate: this.operations.length > 0 
          ? (successful.length / this.operations.length) * 100 
          : 0,
        averageDuration: completed.length > 0
          ? completed.reduce((sum, op) => sum + (op.duration || 0), 0) / completed.length
          : 0
      }
    };
  }
  
  reset(): void {
    this.operations = [];
    this.counters.clear();
  }
}