import {Observable, Disposable} from 'rx';
import {RunningTask, DevRunnerConfig, runTask} from './utils';

export default class Maxcon {
  private runningTasks: {[key: string]: RunningTask} = {};
  private disposable: Disposable;

  constructor(private tasks: DevRunnerConfig) {}

  connect() {
    this.dispose();

    const remainingTaskNames = Object.keys(this.tasks);

    while (remainingTaskNames.length) {
      const taskName = remainingTaskNames.shift();
      runTask(
        this.tasks,
        taskName,
        remainingTaskNames,
        this.runningTasks,
        []
      );
    }

    const endingTasks = Object.keys(this.runningTasks)
      .map((taskName) => this.runningTasks[taskName])
      .filter((task) => task.childCount === 0)
      .map((task) => task.observable);

    this.disposable =
      Observable.merge.apply(null, endingTasks).publish().connect();
  }

  dispose() {
    if (this.disposable) {
      this.disposable.dispose();
      this.disposable = null;
    }
  }
}
