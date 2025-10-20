import { Worker } from 'worker_threads';
import { cpus } from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface WorkerTask<T, R> {
  id: string;
  data: T;
  resolve: (result: R) => void;
  reject: (error: Error) => void;
}

export class WorkerPool<T, R> {
  private workers: Worker[] = [];
  private availableWorkers: Worker[] = [];
  private taskQueue: WorkerTask<T, R>[] = [];
  private workerScript: string;
  private maxWorkers: number;

  constructor(workerScript: string, maxWorkers?: number) {
    this.workerScript = workerScript;
    this.maxWorkers = maxWorkers || Math.max(1, cpus().length - 1);
    this.initializeWorkers();
  }

  private initializeWorkers(): void {
    for (let i = 0; i < this.maxWorkers; i++) {
      const worker = new Worker(this.workerScript);
      this.workers.push(worker);
      this.availableWorkers.push(worker);

      worker.on('message', (result: { id: string; result?: R; error?: string }) => {
        this.handleWorkerMessage(worker, result);
      });

      worker.on('error', (error) => {
        console.error('Worker error:', error);
      });

      worker.on('exit', (code) => {
        if (code !== 0) {
          console.error(`Worker stopped with exit code ${code}`);
        }
      });
    }
  }

  async execute(data: T): Promise<R> {
    return new Promise<R>((resolve, reject) => {
      const task: WorkerTask<T, R> = {
        id: Math.random().toString(36),
        data,
        resolve,
        reject,
      };

      const worker = this.availableWorkers.pop();
      
      if (worker) {
        this.assignTaskToWorker(worker, task);
      } else {
        this.taskQueue.push(task);
      }
    });
  }

  private assignTaskToWorker(worker: Worker, task: WorkerTask<T, R>): void {
    worker.postMessage({ id: task.id, data: task.data });
    
    // Store task for resolution
    (worker as any).__currentTask = task;
  }

  private handleWorkerMessage(
    worker: Worker,
    result: { id: string; result?: R; error?: string }
  ): void {
    const task = (worker as any).__currentTask as WorkerTask<T, R> | undefined;
    
    if (!task) return;

    // Resolve or reject the task
    if (result.error) {
      task.reject(new Error(result.error));
    } else {
      task.resolve(result.result!);
    }

    // Make worker available again
    delete (worker as any).__currentTask;
    
    // Process next queued task or return to pool
    const nextTask = this.taskQueue.shift();
    if (nextTask) {
      this.assignTaskToWorker(worker, nextTask);
    } else {
      this.availableWorkers.push(worker);
    }
  }

  async terminate(): Promise<void> {
    await Promise.all(this.workers.map(w => w.terminate()));
    this.workers = [];
    this.availableWorkers = [];
  }

  getStats(): {
    totalWorkers: number;
    availableWorkers: number;
    queuedTasks: number;
  } {
    return {
      totalWorkers: this.workers.length,
      availableWorkers: this.availableWorkers.length,
      queuedTasks: this.taskQueue.length,
    };
  }
}
