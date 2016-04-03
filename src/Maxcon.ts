import {CompositeDisposable} from 'rx';
import {RunningTask, DevRunnerConfig, runTask} from './utils';

export default class Maxcon {
  private runningTasks: {[key: string]: RunningTask} = {};
  private disposableBag: CompositeDisposable;

  constructor(private tasks: DevRunnerConfig) {}

  connect() {
    this.dispose();

    const remainingTaskNames = Object.keys(this.tasks);

    // Tasks being depended will have lower index
    const topologicalOrderedTasks: string[] = [];

    while (remainingTaskNames.length) {
      const taskName = remainingTaskNames.shift();
      runTask(
        this.tasks,
        taskName,
        remainingTaskNames,
        topologicalOrderedTasks,
        this.runningTasks,
        []
      );
    }

    this.disposableBag = new CompositeDisposable();

    topologicalOrderedTasks.reverse().forEach((taskName) => {
      this.disposableBag.add(this.runningTasks[taskName].connect());
    });
  }

  dispose() {
    if (this.disposableBag) {
      this.disposableBag.dispose();
      this.disposableBag = null;
    }
  }
}
