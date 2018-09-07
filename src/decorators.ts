import {
    BindOption,
    Constructor,
    ContainerBinder,
    ContainerResolver,
    Factory as TypeFactory,
    ID,
    InjectError,
    InjectOption,
} from './types';

const SYMBOL_INJECT_META = Symbol.for(require('../package.json').name + ':inject')
const SYMBOL_BIND_META = Symbol.for(require('../package.json').name + ':bind')

export type ResolveMethod = (container: ContainerResolver, scope?: string) => any

export interface DepencyResolver {
    resolve: ResolveMethod
    required: boolean
}


export class DepencyMeta {
    forceScope?: string
    constructorParams: { [k: number]: DepencyResolver } = {}
    props: { [k: string]: DepencyResolver } = {}
}

export type BindMethod<T> = (clz: Constructor<T>, container: ContainerBinder) => void

export class BindMeta {
    actions: BindMethod<any>[] = []
}

export function getBindMeta (target: Function) {
    return (Reflect as any).getMetadata(SYMBOL_BIND_META, target) as BindMeta | undefined
}
function addBindAction (target: Function, action: BindMethod<any>) {
    let meta = (Reflect as any).getMetadata(SYMBOL_BIND_META, target) as BindMeta
    if (!meta) {
        meta = new BindMeta();
        (Reflect as any).defineMetadata(SYMBOL_BIND_META, meta, target)
    }
    meta.actions.push(action)
}

export function getDepencyMeta (target: Function) {
    return (Reflect as any).getMetadata(SYMBOL_INJECT_META, target) as DepencyMeta | undefined
}

export function updateDepencyMeta (target: Function, modifier: (meta: DepencyMeta) => void) {
    let meta = (Reflect as any).getMetadata(SYMBOL_INJECT_META, target) as DepencyMeta
    if (!meta) {
        meta = new DepencyMeta();
        (Reflect as any).defineMetadata(SYMBOL_INJECT_META, meta, target)
    }
    modifier(meta)
}

export type OptionalInjectOption = Pick<InjectOption, Exclude<keyof InjectOption, "required">>
/**
 * Inject optional, undefined will be inject when can not resolve dependency
 * 
 * @export
 * @param {ID<any>} [id] 
 * @returns 
 */
export function InjectOptional (option?: ID<any> | (OptionalInjectOption & { id?: ID<any> })) {
    if (!option) {
        return Inject()
    }
    if (typeof option !== 'object') {
        return Inject({ id: option, required: false })
    } else {
        return Inject(Object.assign(option, { required: false }))
    }
}

/**
 * Inject with container
 * 
 * @export
 * @param {ID<any>} [id] 
 * @returns 
 */
export function Inject (option?: ID<any> | (InjectOption & { id?: ID<any> })) {
    let id: symbol | string | Function | undefined
    const opt: InjectOption = { required: true }
    if (typeof option === 'object') {
        id = option.id
        Object.assign(opt, option)
    } else if (option) {
        id = option
    }
    return function (target: any, prop?: any, index?: any) {
        let resolver !: DepencyResolver
        if (id) {
            resolver = {
                required: opt.required,
                resolve: (container, scope) => container.get<any>(id as any, scope)
            }
        } else {
            let type: Function
            if (typeof prop === 'string') {
                type = (Reflect as any).getMetadata("design:type", target, prop)
            } else if (typeof prop === 'undefined' && typeof index === 'number') {
                type = Reflect.getMetadata("design:paramtypes", target)[index]
            } else {
                throw new InjectError('@Inject() is only availeble at constructor parameters or properties')
            }
            const basicTypes: Function[] = [Number, Object, String, Date, Boolean]
            if (basicTypes.indexOf(type) > -1) {
                if (typeof prop === 'undefined' && typeof index === 'number') {
                    throw new InjectError(`can not resolve basic types at class ${target.name} constructor params: ${index} `)
                } else {
                    throw new InjectError(`can not resolve basic types at class ${target.name} property: ${prop}`)
                }
            }
            resolver = {
                required: opt.required,
                resolve: (container, scope) => container.get(type, scope)
            }
        }
        updateDepencyMeta(target, (meta) => {
            meta.forceScope = opt.scope
            if (typeof prop === 'undefined' && typeof index === 'number') {
                meta.constructorParams[index] = resolver
            } else {
                meta.props[prop] = resolver
            }
        })
    }
}

/**
 * Inject with custom rules
 * 
 * @export
 * @param {(container: ContainerResolver) => any} resolve 
 * @returns 
 */
export function InjectRaw (resolveMethod: ResolveMethod, opt: InjectOption = { required: true }) {
    return function (target: any, prop?: string, index?: any) {
        const isConstructor = typeof prop === 'undefined'
        const isParam = typeof index === 'number'
        if (!isConstructor && isParam) {
            throw new InjectError('@Inject() is only availeble at constructor parameters or properties')
        }
        updateDepencyMeta(target, (meta) => {
            if (typeof index === 'number') {
                meta.constructorParams[index] = {
                    resolve: resolveMethod,
                    required: opt.required
                }
            } else if (typeof prop === 'string') {
                meta.props[prop] = {
                    resolve: resolveMethod,
                    required: opt.required
                }
            }
        })
    }
}

/**
 * customize bind Action
 * 
 * @export
 * @template T
 * @param {BindMethod<T>} action
 * @returns
 */
export function BindAction<T extends Function> (action: BindMethod<T>) {
    return function (target: T) {
        addBindAction(target, action)
    }
}


export function Alias (id: symbol | string | Function, fromId?: symbol | string | Function, opt?: BindOption) {
    return function (target: any) {
        const action: BindMethod<any> = (clz, c) => c.bindAlias(id, fromId || target, opt)
        addBindAction(target, action)
    }
}


export function Factory<T> (factory: Constructor<TypeFactory<T>> | TypeFactory<T>, opt: BindOption = {}) {
    return function (target: Constructor<T>) {
        const action: BindMethod<T> = (clz, c) => {
            c.bindFactory(target, factory)
        }
        addBindAction(target, action)
    }
}
/**
 * bind a implement class for this class
 *
 * @export
 * @template T
 * @param {() => Constructor<T>} implementClassGetter
 * @param {BindOption} [opt]
 * @returns
 */
export function Implement<T> (implementClassGetter: () => Constructor<T>, opt?: BindOption) {
    return function (target: Constructor<T>) {
        const action: BindMethod<T> = (clz, c) => {
            c.bindClassWithId(target, implementClassGetter())
        }
        addBindAction(target, action)
    }
}

export function Service (opt?: BindOption): any;
export function Service (id: symbol | string | Function, opt?: BindOption): any;
export function Service (id?: symbol | string | Function | BindOption, opt?: BindOption) {
    return function (target: any) {
        let action !: BindMethod<any>
        if (!id) {
            action = (clz, c) => c.bindClass(clz)
        } else if (typeof id === 'object') {
            action = (clz, c) => c.bindClass(clz, id)
        } else {
            action = (clz, c) => c.bindClassWithId(id, clz, opt)
        }
        addBindAction(target, action)
    }
}
/**
 * bind a Singleton
 *
 * @export
 * @param {Pick<BindOption, 'scope'>} [opt={}]
 * @returns
 */
export function Singleton (opt: Pick<BindOption, 'scope'> = { scope: 'root' }) {
    return Service({
        singleton: true,
        scope: opt.scope
    })
}