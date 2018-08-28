### DI(dependency injection)container for JavaScript and TypeScript.
Only support node 9+ (suggest node 10), powered by [async_hooks](https://nodejs.org/api/async_hooks.html)

Example:
```TypeScript
const container = new Container()
container.aliasScope('scope1')
const t1 = new Test1(1)
container.set('test', t1)
process.nextTick(() => {
    container.aliasScope('nt1')
    const t11 = container.get('test') as Test1
    assert.equal(t1, t11, 'should equal')
    const t2 = new Test1(2)
    container.set('test', t2)
    assert.equal(t2, container.get('test'), 'should equal')
    process.nextTick(() => {
        assert(container.hasScope('scope1'))
        assert(container.hasScope('nt1'))
        assert.equal(t2, container.get('test'), 'should equal')
        assert.equal(t1, container.get('test', 'scope1'), 'should equal')
    })
})
```

## API
```TypeScript
interface Container {
 
    /**
     * get instance from container
     *
     * @template T
     * @param {Constructor<T>} id
     * @param {string} [fromScope]
     * @returns {T}
     * @memberof ContainerResolver
     */
    get<T>(id: Constructor<T>, fromScope?: string): T
    get<T=any>(id: string | symbol, fromScope?: string): T | undefined

    /**
     * fill prop depencies of an exist instalce
     * it will ignore when target prop has value
     *
     * @param {*} target
     * @param {string} [fromScope]
     * @memberof ContainerResolver
     */
    fill (target: any, fromScope?: string): void

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
    bindFactory<T> (id: Constructor<T>, factory: Factory<T> | Constructor<Factory<T>>, opt?: Partial<BindOption>): this

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


    /**
     * alias current async scope
     *
     * @param {string} name
     * @memberof ContainerBinder
     */
    aliasScope (name: string): this

    /**
     * detect if exist a scope
     * 
     * @param {string} name
     * @memberof ContainerBinder
     */
    hasScope (name: string): boolean
    /**
     * scan the decoractors and auto bind class
     *
     * @param {Constructor<any>} target
     * @memberof ContainerBinder
     */
    autoBind (target: Constructor<any>): this
}

```
## decorators 

#### 1.injection
```TypeScript
class Test1 {
   
}
// prop inject
class Test2 {
    @Inject()
    prop1!: Test1
}
// constructor inject
class Test3 {
    prop1!: Test1
    constructor(@Inject() param1: Test1) {
        this.prop1 = param1
    }
}
// optional inject
class Test4 {
    @InjectOptional()
    prop1!: Test1   // prop1 will be undefined if resolve Test1 Fail
}

// custom inject action
class Test4 {
    @InjectRaw((c) => c.get('id'), { required: true })
    prop1!: Test1  
}


```

#### 2. bind with decorators
```TypeScript
@Singleton({scope:'root'})  // Singleton's default scope is 'root'
// alias as @Service({ singleton: true,scope:'any scope' })

// a service will define a bind action 
@Service({ singleton: true,scope:'request' })
@Alias('a',{scope:'request'}) // alias 'a' to class A 
// Container.get(A) and Container.get('a') will return same result in 'request' scope

@Implement(() => A1)   // container.get(A) will return A1 instead

@Factory(FactoryA)    // customize instance with factory 
@BindAction((cls,container)=>{
    // customize bind Action
    const instance = new cls()
    // instance.doSomeAction()
    container.set(cls,instance)
})
class A {}

class A1{}

class FactoryA{
    create(){
        const ins = new A1()
        // instance.doSomeAction()
        return ins
    }
}
```

 


