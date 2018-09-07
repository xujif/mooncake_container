import { AsyncHookMap } from 'async-hooks-map';

import { getBindMeta, getDepencyMeta } from './decorators';
import { AliasRegistion, ClassRegistion, FactoryRegistion, Registion, ValueRegistion } from './registion';
import { BindOption, Constructor, ContainerBinder, ContainerResolver, Factory, ID, InjectError } from './types';



export class Container implements ContainerResolver, ContainerBinder {

    protected _map = new AsyncHookMap<any, Registion<any>>()

    protected _lazyBinds: { [scope: string]: Map<any, Registion<any>> } = {}

    protected _autoBinds: Set<Function> = new Set()

    /**
     * alias of bindValue
     * 
     * @template T 
     * @param {ID<T>} id 
     * @param {T} value 
     * @memberof ContainerClass
     */
    set<T> (id: ID<T>, value: T, opt: { scope?: string } = {}): this {
        return this.bindValue(id, value, opt)
    }
    /**
     * bind with value, it will be singleton
     * 
     * @template T 
     * @param {ID<T>} id 
     * @param {T} value 
     * @memberof ContainerClass
     */
    bindValue<T> (id: ID<T>, value: T, opt: { scope?: string } = {}): this {
        const registion = new ValueRegistion(value, opt ? opt.scope : undefined)
        if (!opt.scope || this._map.hasName(opt.scope)) {
            this._map.set(id, registion)
        } else {
            const map = this._map.parent(opt.scope)
            if (map) {
                map.set(id, registion)
            } else {
                this._bindLazy(opt.scope, id, registion)
            }
        }
        return this
    }
    /**
     * bind lazy
     * 
     * @template T 
     * @param {ID<T>} id 
     * @param {() => T} func 
     * @param {BindOption} [opt] 
     * @memberof ContainerClass
     */
    bind<T> (id: ID<T>, creater: () => T, opt: BindOption = {}): this {
        const registion = new FactoryRegistion({ create: creater }, opt.singleton || false, opt.scope)
        if (!opt.scope || this._map.hasName(opt.scope)) {
            this._map.set(id, registion)
        } else {
            const map = this._map.parent(opt.scope)
            if (map) {
                map.set(id, registion)
            } else {
                this._bindLazy(opt.scope, id, registion)
            }
        }
        return this
    }

    bindFactory<T> (id: Constructor<T>, factory: Factory<T> | Constructor<Factory<T>>, opt: Partial<BindOption & { factorySingleton: boolean }> = {}): this {
        if (typeof factory === 'function') {
            // factory is constructor
            const factoryOpt = {
                scope: opt.scope,
                singleton: opt.factorySingleton === false ? false : true
            }
            this.bindClass(factory, factoryOpt)
            this.bind(id, () => {
                const f = this.get(factory, opt.scope)
                return f.create()
            }, opt)
        } else {
            this.bind(id, factory.create.bind(factory))
        }
        return this
    }
    /**
     * 
     *
     * @template T
     * @param {ID<T>} id
     * @param {Function} cls
     * @param {BindOption} [opt={}]
     * @memberof Container
     */
    bindClassWithId (id: ID<any>, cls: Constructor<any>, opt: BindOption = {}): this {
        const registion = new ClassRegistion(cls, opt.singleton || false, opt.scope)
        if (!opt.scope || this._map.hasName(opt.scope)) {
            this._map.set(id, registion)
        } else {
            const map = this._map.parent(opt.scope)
            if (map) {
                map.set(id, registion)
            } else {
                this._bindLazy(opt.scope, id, registion)
            }
        }
        return this
    }
    /**
     * bind a class, ignore the decoractors
     * 
     * @template T 
     * @param {Constructor<T>} cls 
     * @param {BindOption} [opt] 
     * @memberof ContainerClass
     */
    bindClass<T> (cls: Constructor<T>, opt: BindOption = {}): this {
        const registion = new ClassRegistion(cls, opt.singleton || false, opt.scope)
        if (!opt.scope || this._map.hasName(opt.scope)) {
            this._map.set(cls, registion)
        } else {
            const map = this._map.parent(opt.scope)
            if (map) {
                map.set(cls, registion)
            } else {
                this._bindLazy(opt.scope, cls, registion)
            }
        }
        return this
    }

    bindAlias<T> (id: ID<T>, toId: ID<T>, opt: Pick<BindOption, 'scope'> = {}): this {
        const registion = new AliasRegistion(toId)
        if (!opt.scope || this._map.hasName(opt.scope)) {
            this._map.set(id, registion)
        } else {
            const map = this._map.parent(opt.scope)
            if (map) {
                map.set(id, registion)
            } else {
                this._bindLazy(opt.scope, id, registion)
            }
        }
        return this
    }

    /**
     * auto bind a class with decorectors
     *
     * @param {Function} target
     * @memberof Container
     */
    autoBind (target: Function): this {
        if (this._autoBinds.has(target)) {
            return this
        }
        this._autoBinds.add(target)
        const bindMeta = getBindMeta(target)
        if (bindMeta) {
            bindMeta.actions.forEach(action => {
                action(target, this)
            })
        }
        return this
    }

    /**
     * create name or alias a async scope
     *
     * @param {string} name
     * @memberof Container
     */
    aliasScope (name: string) {
        if (this._map.parent(name)) {
            throw new Error('scope name should not be same with parent')
        }
        this._map.alias(name)
        if (this._lazyBinds[name]) {
            this._lazyBinds[name].forEach((reg, id) => {
                this._map.set(id, reg)
            })
        }
        return this
    }
    /**
     * detect a scope
     *
     * @param {string} name
     * @returns
     * @memberof Container
     */
    hasScope (name: string) {
        return this._map.hasName(name) || !!this._map.parent(name)
    }
    /**
     * fill a instance by it't prop decorectors
     *
     * @param {*} target
     * @param {string} [fromScope]
     * @memberof Container
     */
    fill (target: any, fromScope?: string) {
        const meta = getDepencyMeta(target)
        if (!meta) {
            return
        }
        for (let k of Object.keys(meta.props)) {
            if (!target[k]) {
                const resolver = meta.props[k]
                const value = resolver.resolve(this, meta.forceScope || fromScope)
                if (resolver.required && typeof value === 'undefined') {
                    throw new InjectError('cant resolve depency,bug target prop is required')
                }
                target[k] = value
            }
        }
    }
    /**
     * get instance with id or class
     *
     * @template T
     * @param {(Function | Constructor<T>)} id
     * @param {string} [fromScope]
     * @returns {T}
     * @memberof Container
     */
    get<T> (id: Function | Constructor<T>, fromScope?: string): T
    get<T=any> (id: string | symbol, fromScope?: string): T | undefined
    get (id: ID<any>, fromScope?: string): any {
        const map = fromScope ? this._map.closest(fromScope) : this._map
        let reg = map.get(id)
        if (reg) {
            return reg.getInstance(this, fromScope)
        }
        if (typeof id === 'function') {
            if (!this._autoBinds.has(id)) {
                this.autoBind(id)
                return this.get(id)
            }
            const reg = new ClassRegistion(id, false)
            return reg.getInstance(this, fromScope)
        }
    }


    /**
     * get the distance of scope which has the key
     *
     * @param {ID<any>} id
     * @returns
     * @memberof Container
     */
    distance (id: ID<any>) {
        return this._map.distance(id)
    }

    protected _bindLazy (scope: string, id: any, registion: Registion<any>) {
        if (!this._lazyBinds[scope]) {
            this._lazyBinds[scope] = new Map()
        }
        this._lazyBinds[scope].set(id, registion)
    }
}
