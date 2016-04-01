import {Observable} from 'rx';

export type RunningTask = Observable<any>;

export type UpstreamTasks = {[key: string]: Observable<any>};

export interface TaskConfig {
  upstreamTasks?: string[];
  process: (upstream: UpstreamTasks) => Observable<any>;
}

export interface DevRunnerConfig {
  [key: string]: TaskConfig;
}

export function runTask(
  taskName: string,
  tasks: DevRunnerConfig,
  remainingTaskNames: string[],
  runningTasks: {[key: string]: RunningTask}): RunningTask {

  const taskConfig = tasks[taskName];

  if (!taskConfig) {
    throw new Error(`Task configuration for ${taskName} is not found`);
  }

  const upstream: UpstreamTasks = {};

  for (const upstreamTaskName of (taskConfig.upstreamTasks || [])) {
    if (runningTasks[upstreamTaskName]) {
      upstream[upstreamTaskName] = runningTasks[upstreamTaskName];
    } else {
      removeTaskName(upstreamTaskName, remainingTaskNames);
      const upstreamRunningTask = runTask(upstreamTaskName, tasks, remainingTaskNames, runningTasks);
      upstream[upstreamTaskName] = upstreamRunningTask;
      runningTasks[upstreamTaskName] = upstreamRunningTask;
    }
  }

  return taskConfig.process(upstream).share();
}

export function removeTaskName(taskName: string, taskNames: string[]) {
  const index = taskNames.indexOf(taskName);
  if (index === -1) {
    throw new Error(`${taskName} not found in taskNames`);
  }
  taskNames.splice(index, 1);
}
