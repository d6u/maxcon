import {Observable, Disposable} from 'rx';
import {RunningTask, DevRunnerConfig, runTask} from './utils';

export default class Maxcon {
  private runningTasks: {[key: string]: RunningTask} = {};
  private disposable: Disposable;

  constructor(private tasks: DevRunnerConfig) {}

  connect(done?: (err?: Error) => void) {
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

    let hasError = false;

    this.disposable = Observable.merge.apply(null, endingTasks)
      .subscribe(
        undefined,
        (err: Error) => {
          hasError = true;
          if (done) {
            done(err);
          }
        },
        () => {
          if (!hasError && done) {
            done();
          }
        });
  }

  dispose() {
    if (this.disposable) {
      this.disposable.dispose();
      this.disposable = null;
    }
  }
}
