import 'mocha';
import 'reflect-metadata';

import assert from 'assert';

import { Container } from '../container';


describe('container: bind and get', () => {
    class Test1 {
        token: number
        constructor(token = 0) {
            this.token = token
        }
    }

    it('test bind factory', () => {
        const container = new Container()
        container.bind('test1', () => new Test1(10))
        const a1 = container.get('test1') as Test1
        assert(a1.token === 10)
    });

    it('test bind alias', () => {
        const container = new Container()
        container.bind('test1', () => new Test1(10))
        container.bindAlias('test2', 'test1')
        const a1 = container.get('test1') as Test1
        assert(a1.token === 10)
        const a2 = container.get('test1') as Test1
        assert(a2.token === 10)
    });

    it('test bind factory', () => {
        class AFactory {
            static inc = 1
            create () {
                // tslint:disable-next-line
                const ins = new A()
                ins.t = 1
                return ins
            }
        }
        class A {
            t = Math.random()
        }
        const container = new Container()
        container.bindFactory(A, AFactory)
        const a = container.get(A)
        assert.equal(a.t, 1, 'should equal, a is create by factory')
    });

    it('test bind factory with factory not singleton', () => {
        class AFactory {
            static inc = 1
            t: number
            constructor() {
                this.t = AFactory.inc++;
            }
            create () {
                // tslint:disable-next-line
                const ins = new A()
                ins.t = this.t
                return ins
            }
        }
        class A {
            t = Math.random()
        }
        const container = new Container()
        container.bindFactory(A, AFactory, { factorySingleton: false })
        const a1 = container.get(A)
        assert.equal(a1.t, 1, 'should equal, a is created by factory')
        const a2 = container.get(A)
        console.log(a2)
        assert.equal(a2.t, 2, 'should equal, a is created by factory')
    });

    it('test bind factory with opt', () => {
        class AFactory {
            static inc = 1
            t: number
            constructor() {
                this.t = AFactory.inc++;
            }
            create () {
                // tslint:disable-next-line
                const ins = new A()
                ins.t = this.t
                return ins
            }
        }
        class A {
            t = Math.random()
        }
        const container = new Container()
        container.bindFactory(A, AFactory, { singleton: true })
        const a1 = container.get(A)
        assert.equal(a1.t, 1, 'should equal, a is create by factory')
        const a2 = container.get(A)
        console.log(a2)
        assert.equal(a2, a1, 'should equal, a is singleton and created by factory')
    });


    it('test bind value ', () => {
        const container = new Container()
        container.bindValue('test1', new Test1(10))
        const a1 = container.get('test1') as Test1
        assert(a1.token === 10)
    });

    it('test singleton value', () => {
        const container = new Container()
        container.bindClass(Test1, { singleton: true })
        const a1 = container.get(Test1)
        const a2 = container.get(Test1)
        assert(!!a1 && !!a2, 'should get an class')
        assert(a1 === a2)
    });
    it('test singleton value with alias', () => {
        const container = new Container()
        container.bindClass(Test1, { singleton: true })
        container.bindAlias('test2', Test1)
        const a1 = container.get(Test1)
        const a2 = container.get('test2')
        assert(!!a1 && !!a2, 'should get an class')
        assert(a1 === a2)
    });



    it('test auto create class', () => {
        const container = new Container()
        const a1 = container.get(Test1)
        const a2 = container.get(Test1)
        assert(!!a1 && !!a2, 'should get an class')
        assert(a1 !== a2, 'should be diffrent class')
    });
});