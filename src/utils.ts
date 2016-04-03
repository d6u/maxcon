import {Observable} from 'rx';

export interface RunningTask {
  observable: Observable<any>;
  childCount: number;
}

export type UpstreamTasks = {[key: string]: Observable<any>};

export interface TaskConfig {
  dependsOn?: string[];
  process: (upstream: UpstreamTasks) => Observable<any>;
}

export interface DevRunnerConfig {
  [key: string]: TaskConfig;
}

export function runTask(
  taskConfigs: DevRunnerConfig,
  taskName: string,
  remainingTaskNames: string[],
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

  if (taskConfig.dependsOn) {
    for (const upstreamTaskName of taskConfig.dependsOn) {
      if (runningTasks[upstreamTaskName]) {
        upstream[upstreamTaskName] = runningTasks[upstreamTaskName].observable;
        runningTasks[upstreamTaskName].childCount += 1;
      } else {
        removeTaskName(upstreamTaskName, remainingTaskNames);
        runTask(
          taskConfigs,
          upstreamTaskName,
          remainingTaskNames,
          runningTasks,
          parentTaskNames
        );
        upstream[upstreamTaskName] = runningTasks[upstreamTaskName].observable;
        runningTasks[upstreamTaskName].childCount += 1;
      }
    }
  }

  runningTasks[taskName] = {
    observable: taskConfig.process(upstream).share(),
    childCount: 0,
  };
}

export function removeTaskName(taskName: string, taskNames: string[]) {
  const index = taskNames.indexOf(taskName);
  if (index === -1) {
    throw new Error(`${taskName} not found in taskNames`);
  }
  taskNames.splice(index, 1);
}
