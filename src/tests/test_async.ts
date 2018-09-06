import 'mocha';
import 'reflect-metadata';

import assert from 'assert';

import { Container } from '../container';


describe('container: async scope', () => {
    class Test1 {
        token: number
        constructor(token = 0) {
            this.token = token
        }
    }

    it('test async scope', (done) => {
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
                done()
            })
        })
    })

    it('test lazy bind', (done) => {
        const container = new Container()
        const t1 = new Test1(1)
        container.set('test', t1, { scope: 'nt1' })
        const t10 = container.get('test')
        assert.equal(t10, undefined, 'should be undefined')
        process.nextTick(() => {
            container.aliasScope('nt1')
            const t11 = container.get('test') as Test1
            assert.equal(t1, t11, 'should equal')
            done()
        })
    })
});