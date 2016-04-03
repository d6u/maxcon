import Maxcon from './Maxcon';
import {MaxconTaskConfig} from './utils';

export {
  Maxcon as default,
  MaxconTaskConfig,
};

// Will overwrite ES2015 export above
// to work around common js format in Node
module.exports = Maxcon;
