import { Container } from './container';
import * as Types from './types';

export { Types }

export { Types as Type }

export { Container }
export * from './decorators'

let container!: Container
Object.defineProperty(exports, 'default', {
    get () {
        if (container) {
            return container
        }
        container = new Container()
        return container
    },
    set () {
        // ignore
    }
})

// for lazy init
export default null as any as Container;
