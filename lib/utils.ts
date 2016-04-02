import {Observable, ConnectableObservable} from 'rx';

export type RunningTask = ConnectableObservable<any>;

export type UpstreamTasks = {[key: string]: ConnectableObservable<any>};

export interface TaskConfig {
  upstreamTasks?: string[];
  process: (upstream: UpstreamTasks) => Observable<any>;
}

export interface DevRunnerConfig {
  [key: string]: TaskConfig;
}

export function runTask(
  taskConfigs: DevRunnerConfig,
  taskName: string,
  remainingTaskNames: string[],
  topologicalOrderedTasks: string[],
  runningTasks: {[key: string]: RunningTask},
  parentTaskNames: string[]) {

  if (parentTaskNames.indexOf(taskName) !== -1) {
    throw new Error(`Circular dependency is detected among ${taskName} and ${parentTaskNames.join(', ')}`);
  }

  parentTaskNames.push(taskName);

  const taskConfig = taskConfigs[taskName];

  if (!taskConfig) {
    throw new Error(`Task configuration for ${taskName} is not found`);
  }

  const upstream: UpstreamTasks = {};

  if (taskConfig.upstreamTasks) {
    for (const upstreamTaskName of taskConfig.upstreamTasks) {
      if (runningTasks[upstreamTaskName]) {
        upstream[upstreamTaskName] = runningTasks[upstreamTaskName];
      } else {
        removeTaskName(upstreamTaskName, remainingTaskNames);
        runTask(
          taskConfigs,
          upstreamTaskName,
          remainingTaskNames,
          topologicalOrderedTasks,
          runningTasks,
          parentTaskNames
        );
        upstream[upstreamTaskName] = runningTasks[upstreamTaskName];
      }
    }
  }

  topologicalOrderedTasks.push(taskName);

  runningTasks[taskName] = taskConfig.process(upstream).publish();
}

export function removeTaskName(taskName: string, taskNames: string[]) {
  const index = taskNames.indexOf(taskName);
  if (index === -1) {
    throw new Error(`${taskName} not found in taskNames`);
  }
  taskNames.splice(index, 1);
}
