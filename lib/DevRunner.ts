import {Observable} from 'rx';
import {RunningTask, DevRunnerConfig, runTask} from './utils';

export default class DevRunner {
  private runningTasks: {[key: string]: RunningTask} = {};

  constructor(private tasks: DevRunnerConfig) {}

  run() {
    const remainingTaskNames = Object.keys(this.tasks);
    while (remainingTaskNames.length) {
      const taskName = remainingTaskNames.shift();
      this.runningTasks[taskName] =
        runTask(taskName, this.tasks, remainingTaskNames, this.runningTasks);
    }
  }
}
