import { getDepencyMeta } from './decorators';
import { Constructor, ContainerResolver, Factory, ID, InjectError } from './types';

export abstract class Registion<T> {
    protected singleton: boolean
    protected scope?: string
    protected instance?: T
    constructor(singleton: boolean, scope?: string) {
        this.singleton = singleton
        this.scope = scope
    }
    /**
     * get instance of registion
     * 
     * @param {ContainerResolver} container 
     * @returns {T} 
     * @memberof Registion
     */
    getInstance (container: ContainerResolver, scope?: string): T {
        if (this.instance) {
            return this.instance
        }
        const ins = this.createInstance(container)
        if (this.singleton) {
            this.instance = ins
        }
        return ins
    }

    abstract createInstance (container: ContainerResolver): T

}

export class ValueRegistion<T> extends Registion<T>{
    constructor(ins: T, scope?: string) {
        super(true, scope)
        this.instance = ins
    }
    createInstance (container: ContainerResolver): T {
        throw new Error('should not access here')
    }
}

export class ClassRegistion<T> extends Registion<T>{
    readonly clazz: Constructor<T> | Function
    constructor(clazz: Constructor<T> | Function, singleton: boolean, scope?: string) {
        super(singleton, scope)
        this.clazz = clazz
    }
    createInstance (container: ContainerResolver): T {
        let params = [] as any[]
        const meta = getDepencyMeta(this.clazz)
        if (meta) {
            for (let k of Object.keys(meta.constructorParams)) {
                const index = parseInt(k, 10)
                if (meta.constructorParams[index]) {
                    const p = meta.constructorParams[index]
                    const value = p.resolve(container, this.scope)
                    if (p.required && typeof value === 'undefined') {
                        throw new InjectError(`cant resolve constructor param[${index}]`)
                    }
                    params[index] = value
                }
            }
        }
        const ins = Reflect.construct(this.clazz, params)
        container.fill(ins, this.scope)
        return ins
    }
}


export class FactoryRegistion<T> extends Registion<T>{
    readonly factory: Factory<T>
    constructor(factory: Factory<T>, singleton: boolean, scope?: string) {
        super(singleton, scope)
        this.factory = factory
    }
    createInstance (container: ContainerResolver): T {
        return this.factory.create()
    }
}


export class AliasRegistion<T> extends Registion<T> {
    readonly srcId: ID<T>
    constructor(srcId: ID<T>, scope?: string) {
        super(false, scope)
        this.srcId = srcId
    }
    getInstance (container: ContainerResolver, scope?: string): T {
        return container.get(this.srcId as string, scope) as T
    }
    createInstance (container: ContainerResolver): T {
        throw new Error('should not access here')
    }
}