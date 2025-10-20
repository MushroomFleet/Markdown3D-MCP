export interface MemoryStats {
  heapUsed: number;
  heapTotal: number;
  external: number;
  arrayBuffers: number;
  rss: number;
  heapUsedMB: number;
  heapTotalMB: number;
  percentUsed: number;
}

export class MemoryMonitor {
  private warningThreshold: number;
  private criticalThreshold: number;
  private checkInterval: NodeJS.Timeout | null = null;

  constructor(warningThresholdMB: number = 400, criticalThresholdMB: number = 800) {
    this.warningThreshold = warningThresholdMB * 1024 * 1024;
    this.criticalThreshold = criticalThresholdMB * 1024 * 1024;
  }

  getStats(): MemoryStats {
    const mem = process.memoryUsage();
    
    return {
      heapUsed: mem.heapUsed,
      heapTotal: mem.heapTotal,
      external: mem.external,
      arrayBuffers: mem.arrayBuffers,
      rss: mem.rss,
      heapUsedMB: mem.heapUsed / 1024 / 1024,
      heapTotalMB: mem.heapTotal / 1024 / 1024,
      percentUsed: (mem.heapUsed / mem.heapTotal) * 100,
    };
  }

  checkMemory(): 'ok' | 'warning' | 'critical' {
    const stats = this.getStats();
    
    if (stats.heapUsed > this.criticalThreshold) {
      console.error(`🚨 CRITICAL: Memory usage at ${stats.heapUsedMB.toFixed(2)}MB`);
      return 'critical';
    } else if (stats.heapUsed > this.warningThreshold) {
      console.error(`⚠️  WARNING: Memory usage at ${stats.heapUsedMB.toFixed(2)}MB`);
      return 'warning';
    }
    
    return 'ok';
  }

  startMonitoring(intervalMs: number = 30000): void {
    if (this.checkInterval) {
      return;
    }

    this.checkInterval = setInterval(() => {
      const status = this.checkMemory();
      
      if (status === 'critical') {
        // Trigger garbage collection if available
        if (global.gc) {
          console.error('🗑️  Running garbage collection...');
          global.gc();
        }
      }
    }, intervalMs);
  }

  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  forceGC(): void {
    if (global.gc) {
      console.error('🗑️  Forcing garbage collection...');
      global.gc();
      const stats = this.getStats();
      console.error(`   Memory after GC: ${stats.heapUsedMB.toFixed(2)}MB`);
    } else {
      console.error('⚠️  Garbage collection not available. Run with --expose-gc flag.');
    }
  }
}
