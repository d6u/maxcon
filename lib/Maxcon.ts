import {CompositeDisposable} from 'rx';
import {RunningTask, DevRunnerConfig, runTask} from './utils';

export default class Maxcon {
  private runningTasks: {[key: string]: RunningTask} = {};
  private disposableBag: CompositeDisposable;

  constructor(private tasks: DevRunnerConfig) {}

  connect() {
    this.dispose();

    const remainingTaskNames = Object.keys(this.tasks);
    while (remainingTaskNames.length) {
      const taskName = remainingTaskNames.shift();
      this.runningTasks[taskName] =
        runTask(taskName, this.tasks, remainingTaskNames, this.runningTasks);
    }

    this.disposableBag = new CompositeDisposable();

    Object.keys(this.runningTasks).forEach((key) => {
      this.disposableBag.add(this.runningTasks[key].connect());
    });
  }

  dispose() {
    if (this.disposableBag) {
      this.disposableBag.dispose();
      this.disposableBag = null;
    }
  }
}
