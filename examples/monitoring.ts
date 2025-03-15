/**
 * Monitoring and debugging example for type-compiler's parallel processing
 * 
 * This example demonstrates how to monitor worker activity, debug performance issues,
 * and optimize the parallel processing configuration in type-compiler.
 * 
 * To run this example:
 * 1. Compile with: tsc --project tsconfig.json examples/monitoring.ts
 * 2. Run with: node examples/monitoring.js
 */

// ------------------------------------------------------------------------
// Example implementation of a monitoring interface for type-compiler
// ------------------------------------------------------------------------

/**
 * Interface representing a worker activity event
 */
interface WorkerEvent {
  workerId: number;
  eventType: 'start' | 'complete' | 'error';
  timestamp: number;
  taskId?: string;
  processingTime?: number;
  error?: string;
  typeComplexity?: number;
}

/**
 * Interface for worker performance metrics
 */
interface WorkerMetrics {
  workerId: number;
  tasksProcessed: number;
  totalProcessingTime: number;
  averageProcessingTime: number;
  errorCount: number;
  currentlyActive: boolean;
}

/**
 * Monitoring class that could be integrated with type-compiler
 * to track worker activity and performance
 */
class ParallelProcessingMonitor {
  private events: WorkerEvent[] = [];
  private workers: Map<number, WorkerMetrics> = new Map();
  private startTime: number;
  private endTime: number | null = null;
  
  constructor(workerCount: number) {
    this.startTime = Date.now();
    
    // Initialize worker metrics
    for (let i = 0; i < workerCount; i++) {
      this.workers.set(i, {
        workerId: i,
        tasksProcessed: 0,
        totalProcessingTime: 0,
        averageProcessingTime: 0,
        errorCount: 0,
        currentlyActive: false
      });
    }
  }
  
  /**
   * Record a worker event
   */
  recordEvent(event: WorkerEvent): void {
    this.events.push(event);
    
    const worker = this.workers.get(event.workerId);
    if (!worker) return;
    
    switch (event.eventType) {
      case 'start':
        worker.currentlyActive = true;
        break;
      
      case 'complete':
        worker.tasksProcessed++;
        worker.currentlyActive = false;
        
        if (event.processingTime) {
          worker.totalProcessingTime += event.processingTime;
          worker.averageProcessingTime = worker.totalProcessingTime / worker.tasksProcessed;
        }
        break;
      
      case 'error':
        worker.errorCount++;
        worker.currentlyActive = false;
        break;
    }
  }
  
  /**
   * Complete the monitoring session
   */
  complete(): void {
    this.endTime = Date.now();
  }
  
  /**
   * Get overall performance metrics
   */
  getPerformanceReport(): any {
    const totalDuration = (this.endTime || Date.now()) - this.startTime;
    const totalTasks = Array.from(this.workers.values()).reduce((sum, w) => sum + w.tasksProcessed, 0);
    const totalErrors = Array.from(this.workers.values()).reduce((sum, w) => sum + w.errorCount, 0);
    
    const workerUtilization = Array.from(this.workers.values()).map(w => ({
      workerId: w.workerId,
      tasksProcessed: w.tasksProcessed,
      percentOfTotal: (w.tasksProcessed / totalTasks * 100).toFixed(2) + '%',
      averageProcessingTime: w.averageProcessingTime.toFixed(2) + 'ms',
      errorRate: (w.errorCount / (w.tasksProcessed + w.errorCount) * 100).toFixed(2) + '%'
    }));
    
    return {
      overview: {
        duration: totalDuration + 'ms',
        totalTasks,
        tasksPerSecond: (totalTasks / (totalDuration / 1000)).toFixed(2),
        totalErrors,
        errorRate: (totalErrors / totalTasks * 100).toFixed(2) + '%'
      },
      workerUtilization,
      recommendations: this.generateRecommendations(totalTasks, totalDuration, workerUtilization)
    };
  }
  
  /**
   * Get a timeline of events
   */
  getTimeline(): any[] {
    return this.events.map(event => ({
      time: new Date(event.timestamp).toISOString(),
      workerId: event.workerId,
      event: event.eventType,
      taskId: event.taskId,
      processingTime: event.processingTime ? event.processingTime + 'ms' : undefined,
      error: event.error
    }));
  }
  
  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(totalTasks: number, duration: number, workerUtilization: any[]): string[] {
    const recommendations: string[] = [];
    
    // Check for idle workers
    const idleWorkers = workerUtilization.filter(w => w.tasksProcessed === 0);
    if (idleWorkers.length > 0) {
      recommendations.push(`${idleWorkers.length} workers were idle. Consider reducing workerCount.`);
    }
    
    // Check for uneven distribution
    const taskCounts = workerUtilization.map(w => parseInt(w.tasksProcessed));
    const max = Math.max(...taskCounts);
    const min = Math.min(...taskCounts.filter(t => t > 0));
    
    if (max > min * 2) {
      recommendations.push('Task distribution is uneven. Consider adjusting workerBatchSize for better balance.');
    }
    
    // Check overall throughput
    const tasksPerSecond = totalTasks / (duration / 1000);
    if (tasksPerSecond < 10) {
      recommendations.push('Processing throughput is low. Consider profiling type processing logic for bottlenecks.');
    }
    
    // Check if we need more workers
    const workerCount = this.workers.size;
    if (workerCount < 4 && tasksPerSecond < 20 && totalTasks > 100) {
      recommendations.push('Consider increasing workerCount to improve parallelism.');
    }
    
    return recommendations.length > 0 ? recommendations : ['Current configuration appears optimal for the workload.'];
  }
}

// ------------------------------------------------------------------------
// Demonstration of monitoring with simulated worker activity
// ------------------------------------------------------------------------

// Simulate a type compiler run with monitored parallel processing
function simulateTypesProcessing(): void {
  // Configuration
  const workerCount = 4;
  const typeCount = 100;
  const simulatedDuration = 2000; // 2 seconds
  
  console.log(`Simulating processing ${typeCount} types with ${workerCount} workers...`);
  console.log('');
  
  // Create monitor
  const monitor = new ParallelProcessingMonitor(workerCount);
  
  // Simulate worker events
  const startTime = Date.now();
  const endTime = startTime + simulatedDuration;
  let currentTime = startTime;
  let taskId = 0;
  
  // Pre-generate all events to ensure time moves forward properly
  const events: WorkerEvent[] = [];
  
  // Helper to select an available worker
  const busyWorkers = new Set<number>();
  const selectAvailableWorker = () => {
    const availableWorkers = Array.from(Array(workerCount).keys())
      .filter(id => !busyWorkers.has(id));
    
    if (availableWorkers.length === 0) return null;
    
    const workerId = availableWorkers[Math.floor(Math.random() * availableWorkers.length)];
    busyWorkers.add(workerId);
    return workerId;
  };
  
  // Helper to mark a worker as available
  const markWorkerAvailable = (workerId: number) => {
    busyWorkers.delete(workerId);
  };
  
  // Generate all tasks and completions
  while (taskId < typeCount && currentTime < endTime) {
    const workerId = selectAvailableWorker();
    if (workerId === null) {
      // All workers busy, advance time
      currentTime += 10;
      continue;
    }
    
    // Calculate a processing time between 10ms and 100ms
    const complexity = Math.floor(Math.random() * 10) + 1;
    const processingTime = (complexity * 10) * (0.8 + Math.random() * 0.4);
    
    // Add start event
    events.push({
      workerId,
      eventType: 'start',
      timestamp: currentTime,
      taskId: `task_${taskId}`,
      typeComplexity: complexity
    });
    
    // Add completion event (or error event with small probability)
    const isError = Math.random() < 0.05; // 5% error rate
    
    if (isError) {
      events.push({
        workerId,
        eventType: 'error',
        timestamp: currentTime + processingTime,
        taskId: `task_${taskId}`,
        error: 'Simulated error in type processing',
        typeComplexity: complexity
      });
    } else {
      events.push({
        workerId,
        eventType: 'complete',
        timestamp: currentTime + processingTime,
        taskId: `task_${taskId}`,
        processingTime,
        typeComplexity: complexity
      });
    }
    
    // Schedule worker to become available when task is complete
    setTimeout(() => markWorkerAvailable(workerId), processingTime);
    
    // Next task
    taskId++;
    
    // Move time forward randomly
    currentTime += Math.floor(Math.random() * 20) + 1;
  }
  
  // Sort events by timestamp
  events.sort((a, b) => a.timestamp - b.timestamp);
  
  // Process events in simulated real-time
  console.log('LIVE MONITORING:');
  console.log('---------------');
  
  // Process events
  let lastTimestamp = startTime;
  const processEvents = () => {
    const now = Date.now();
    const simulatedNow = startTime + (now - startTime) * 10; // Speed up simulation 10x
    
    // Process all events up to simulated now
    const pendingEvents = events.filter(e => e.timestamp <= simulatedNow && e.timestamp >= lastTimestamp);
    
    for (const event of pendingEvents) {
      monitor.recordEvent(event);
      
      // Output live monitoring info
      const relativeTime = ((event.timestamp - startTime) / 1000).toFixed(2);
      const workerStatus = Array.from(monitor.getPerformanceReport().workerUtilization)
        .map((w: any) => `W${w.workerId}:${w.tasksProcessed}`).join(' ');
      
      console.log(`[${relativeTime}s] Worker ${event.workerId} ${event.eventType} ${event.taskId} ${workerStatus}`);
    }
    
    lastTimestamp = simulatedNow;
    
    // Continue if there are more events and we haven't reached the end time
    if (events.some(e => e.timestamp > lastTimestamp) && now - startTime < simulatedDuration / 10) {
      setTimeout(processEvents, 100);
    } else {
      // Complete monitoring
      monitor.complete();
      
      // Display final report
      displayReport(monitor);
    }
  };
  
  // Start processing events
  processEvents();
}

// Display monitoring report
function displayReport(monitor: ParallelProcessingMonitor): void {
  const report = monitor.getPerformanceReport();
  
  console.log('');
  console.log('PERFORMANCE REPORT:');
  console.log('------------------');
  console.log('Overall:');
  console.log(`- Duration: ${report.overview.duration}`);
  console.log(`- Total tasks: ${report.overview.totalTasks}`);
  console.log(`- Tasks per second: ${report.overview.tasksPerSecond}`);
  console.log(`- Error rate: ${report.overview.errorRate}`);
  console.log('');
  
  console.log('Worker Utilization:');
  for (const worker of report.workerUtilization) {
    console.log(`- Worker ${worker.workerId}: ${worker.tasksProcessed} tasks (${worker.percentOfTotal}), avg ${worker.averageProcessingTime}/task`);
  }
  console.log('');
  
  console.log('Recommendations:');
  for (const recommendation of report.recommendations) {
    console.log(`- ${recommendation}`);
  }
  
  console.log('');
  console.log('INTEGRATION WITH TYPE-COMPILER:');
  console.log('-----------------------------');
  console.log('To add this type of monitoring to your type-compiler project:');
  console.log('');
  console.log('1. Create a monitoring class similar to ParallelProcessingMonitor');
  console.log('2. Instrument WorkerPool to record events:');
  console.log('   - When sending a task to a worker');
  console.log('   - When receiving a completed task');
  console.log('   - When handling errors from workers');
  console.log('');
  console.log('3. Add monitoring output to your build process:');
  console.log('');
  console.log('```typescript');
  console.log('// In your plugin configuration');
  console.log('const monitor = new ParallelProcessingMonitor(options.workerCount);');
  console.log('');
  console.log('// In your worker pool');
  console.log('processTypeWithWorker(type: ts.Type): string {');
  console.log('  monitor.recordEvent({');
  console.log('    workerId: this.currentWorkerId,');
  console.log('    eventType: "start",');
  console.log('    timestamp: Date.now(),');
  console.log('    taskId: type.id?.toString()');
  console.log('  });');
  console.log('');
  console.log('  // Process type...');
  console.log('');
  console.log('  monitor.recordEvent({');
  console.log('    workerId: this.currentWorkerId,');
  console.log('    eventType: "complete",');
  console.log('    timestamp: Date.now(),');
  console.log('    taskId: type.id?.toString(),');
  console.log('    processingTime: Date.now() - startTime');
  console.log('  });');
  console.log('}');
  console.log('```');
  console.log('');
  console.log('4. Log or visualize the monitoring data during the build process');
}

// Run the simulation
simulateTypesProcessing(); 