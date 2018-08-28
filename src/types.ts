
export interface BindOption {
    scope?: string
    singleton?: boolean
}

export interface Factory<T> {
    create (): T
}

export type Constructor<T> = Function | (Function & {
    new(...args: any[]): T
})

export type ID<T> = string | symbol | Constructor<T>


export interface InjectOption {
    required: boolean
    scope?: string
}

export interface ContainerResolver {
    /**
     * get instance from container
     *
     * @template T
     * @param {Constructor<T>} id
     * @param {string} [fromScope]
     * @returns {T}
     * @memberof ContainerResolver
     */
    get<T> (id: Constructor<T>, fromScope?: string): T
    get<T=any> (id: string | symbol, fromScope?: string): T | undefined

    /**
     * fill prop depencies of an exist instalce
     * it will ignore when target prop has value
     *
     * @param {*} target
     * @param {string} [fromScope]
     * @memberof ContainerResolver
     */
    fill (target: any, fromScope?: string): void
}

export interface ContainerBinder {
    /**
     * alias of bind Value
     *
     * @template T
     * @param {ID<T>} id
     * @param {T} value
     * @param {Pick<BindOption, 'scope'>} [opt]
     * @memberof ContainerBinder
     */
    set<T> (id: ID<T>, value: T, opt?: Pick<BindOption, 'scope'>): this
    /**
     * bind a exist instalce
     *
     * @template T
     * @param {ID<T>} id
     * @param {T} value
     * @param {Pick<BindOption, 'scope'>} [opt]
     * @memberof ContainerBinder
     */
    bindValue<T> (id: ID<T>, value: T, opt?: Pick<BindOption, 'scope'>): this
    /**
     * bind lazy initialize instance
     *
     * @template T
     * @param {ID<T>} id
     * @param {() => T} creater
     * @param {Partial<BindOption>} [opt]
     * @memberof ContainerBinder
     */
    bind<T> (id: ID<T>, creater: () => T, opt?: Partial<BindOption>): this

    /**
     * bind a class with factory
     *
     * @template T
     * @param {Constructor<T>} id
     * @param {(Factory<T> | Constructor<Factory<T>>)} factory
     * @param {Partial<BindOption>} [opt]
     * @returns {this}
     * @memberof ContainerBinder
     */
    bindFactory<T> (id: Constructor<T>, factory: Factory<T> | Constructor<Factory<T>>, opt?: Partial<BindOption & { factorySingleton: boolean }>): this

    /**
     * bind a class
     * set scope or singleton
     *
     * @template T
     * @param {Constructor<T>} cls
     * @param {Partial<BindOption>} [opt]
     * @memberof ContainerBinder
     */
    bindClass<T> (cls: Constructor<T>, opt?: Partial<BindOption>): this
    /**
     * bind a class with an diffrent id
     *
     * @param {ID<any>} id
     * @param {Constructor<any>} cls
     * @param {Partial<BindOption>} [opt]
     * @memberof ContainerBinder
     */
    bindClassWithId (id: ID<any>, cls: Constructor<any>, opt?: Partial<BindOption>): this

    /**
     * alias a id
     *
     * @param {ID<any>} id
     * @param {ID<any>} toId
     * @param {Pick<BindOption, 'scope'>} [opt]
     * @memberof ContainerBinder
     */
    bindAlias (id: ID<any>, toId: ID<any>, opt?: Pick<BindOption, 'scope'>): this

}

export class ContainerError extends Error {
    code = 'ERR_CONTAINER'
}

export class InjectError extends ContainerError {
    code = 'ERR_CONTAINER.INJECT'
}
