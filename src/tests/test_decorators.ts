import 'mocha';
import 'reflect-metadata';

import assert from 'assert';

import { Container } from '../container';
import { Alias, Factory, Implement, Inject, InjectOptional, InjectRaw, Service } from '../decorators';

describe('container: decorectors', () => {
    class Test1 {
        token: number
        constructor(token = 0) {
            this.token = token
        }
    }


    it('test decorectors: auto inject props', () => {

        class Test2 {
            @Inject()
            prop1!: Test1
        }
        const container = new Container()
        const t1 = new Test1(11)
        container.set(Test1, t1)
        const t2 = container.get(Test2)
        assert(!!t2.prop1, 'prop1 should be inject')
        assert(t2.prop1 instanceof Test1, 'check inject class')
        assert.strictEqual(t2.prop1.token, 11, 'should equal')
        container.aliasScope('scope1')

    });

    it('test decorectors: inject instance from special scope', (done) => {
        const container = new Container()
        container.set(Test1, new Test1(11))
        container.aliasScope('scope1')
        setImmediate(() => {
            container.aliasScope('scope2')
            container.set(Test1, new Test1(2))
            class Test3 {
                @Inject()
                prop1!: Test1
            }
            assert.strictEqual(container.get(Test3).prop1.token, 2, 'shuold resolve prop from current scope')
            class Test4 {
                @Inject({ scope: 'scope1', required: true })
                prop1!: Test1
            }
            assert.strictEqual(container.get(Test4).prop1.token, 11, 'shuold resolve prop from scope1')
            done()
        })
    });

    it('test decorectors: auto inject constructor ', () => {
        class Test3 {
            prop1!: Test1
            constructor(@Inject(Test1) param1: any) {
                this.prop1 = param1
            }
        }
        const container = new Container()
        container.bindValue(Test1, new Test1(10))
        const t3 = container.get(Test3)
        assert(!!t3.prop1, 'prop1 should be inject')
        assert(t3.prop1.token === 10, 'prop1 should be inject with value')
    });

    it('test decorectors: test custom resolver', () => {
        class Test3 {
            @InjectRaw((c) => c.get('test1_2'), { required: true })
            prop1!: Test1
        }
        const container = new Container()
        container.bindValue('test1_2', new Test1(1))
        const t3 = container.get(Test3)
        assert(!!t3.prop1, 'prop1 should be inject')
        assert(t3.prop1.token === 1, 'prop1 should be inject with value')
    });
    it('test optional inject', () => {
        class Test3 {
            @InjectOptional('xx')
            prop1?: Test1

            @InjectOptional('yy')
            prop2!: Test1
        }
        const container = new Container()
        container.set('yy', new Test1)
        const t3 = container.get(Test3)
        assert(!t3.prop1, 'prop1 should be undefined')
        assert(t3.prop2, 'prop1 should not be undefined')
    });



    it('test decorectors: auto bind', () => {
        @Service({ singleton: true })
        @Alias('a0')
        @Service('a1', { singleton: true })
        @Alias('a2', 'a1')
        class A {
            t = Math.random()
        }

        const container = new Container()
        container.autoBind(A)
        const a = container.get(A)
        const a0 = container.get('a0')
        assert.equal(a0, a, 'alias a should equal A instance')
        const a1 = container.get('a1')
        assert.notEqual(a, a1, 'a1 should not equal to a')
        const a2 = container.get('a2')
        assert.equal(a1, a2, 'alias a should equal A instance')
    })

    it('test decorectors: alias', () => {
        @Service({ singleton: false })
        @Alias('a')
        @Service('a1', { singleton: true })
        @Alias('a2', 'a1')
        class A {
            t = Math.random()
        }

        class B {
            @Inject()
            a: A
        }
        const container = new Container()
        const b1 = container.get(B)
        const b2 = container.get(B)
        assert.notEqual(b1, b2, 'should not equal')
        assert.notEqual(b1.a, b2.a, 'should not equal')

        const a = container.get('a')
        assert.notEqual(b1.a, a, 'service a is not singleton,should not be equal')
        const a1 = container.get('a1')
        assert.notEqual(b1.a, a1, 'a1 should not equal to a')
        const a2 = container.get('a2')
        assert.equal(a1, a2, 'alias a should equal A instance')
    })

    it('test decorectors: factory', () => {

        class AFactory {
            create () {
                // tslint:disable-next-line
                const ins = new A()
                ins.t = 1
                return ins
            }
        }
        @Factory(AFactory)
        class A {
            t = Math.random()
        }

        const container = new Container()
        const a = container.get(A)
        assert.equal(a.t, 1, 'should equal, a is create by factory')
    })

    it('test decorectors: anonymous factory', () => {
        @Factory({
            create () {
                // tslint:disable-next-line
                const ins = new A()
                ins.t = 1
                return ins
            }
        })
        class A {
            t = Math.random()
        }

        const container = new Container()
        const a = container.get(A)
        assert.equal(a.t, 1, 'should equal, a is create by factory')
    })

    it('test decorectors: implement', () => {

        // tslint:disable-next-line
        @Implement(() => A1)
        abstract class A {
            abstract test (): number;
        }

        class A1 extends A {
            test () {
                return 1
            }
        }
        const container = new Container()
        const a = container.get(A)
        assert.equal(a.test(), 1, 'should equal, a is create by factory')
    })

});