'use strict'

const sinon = require('sinon')
const Lab = require('lab')
const Code = require('code')
const expect = Code.expect
let lab = exports.lab = Lab.script()
const describe = lab.experiment
const it = lab.test
const plugin = require('../index')
const Hapi = require('hapi')
const MongoDB = require('mongodb')

describe('utils', () => {
  it('simple plugin registering', done => {
    const server = new Hapi.Server()
    server.connection({ port: 8000 })

    server.register({
      register: plugin,
      options: {}
    }, err => {
      expect(err).not.to.exist
      done()
    })
  })

  describe('initialization', () => {
    let mongoClientConnect

    lab.beforeEach(done => {
      mongoClientConnect = sinon.stub(MongoDB.MongoClient, 'connect', (url, options, reply) => {
        if (url.indexOf('fail') !== -1) {
          reply(new Error('failed'))
        } else {
          reply(null, {})
        }
      })
      done()
    })

    lab.afterEach(done => {
      mongoClientConnect.restore()
      done()
    })

    it('it connects with profiles array', done => {
      const server = new Hapi.Server()
      server.connection({ port: 8000 })

      server.register({
        register: plugin,
        options: {
          decorateRequest: false,
          profiles: [
            {name: 'test', url: 'hapi://test/db'}
          ]
        }
      }, err => {
        expect(err).not.to.exist
        expect(mongoClientConnect.calledWith('hapi://test/db', {}, sinon.match.func)).to.be.true
        done()
      })
    })

    it('it connects with profiles object', done => {
      const server = new Hapi.Server()
      server.connection({ port: 8000 })

      server.register({
        register: plugin,
        options: {
          profiles: {
            test: {url: 'hapi://test/db'}
          }
        }
      }, err => {
        expect(err).not.to.exist
        expect(mongoClientConnect.calledWith('hapi://test/db', {}, sinon.match.func)).to.be.true
        done()
      })
    })

    it('it fails', done => {
      const server = new Hapi.Server()
      server.connection({ port: 8000 })

      server.register({
        register: plugin,
        options: {
          profiles: [
            {name: 'test', url: 'hapi://test/failed'},
            {name: 'test2', url: 'hapi://test/failed'}
          ]
        }
      }, err => {
        expect(err).to.exist
        expect(mongoClientConnect.calledWith('hapi://test/failed', {}, sinon.match.func)).to.be.true
        done()
      })
    })

    it('options are passed', done => {
      const server = new Hapi.Server()
      server.connection({ port: 8000 })

      server.register({
        register: plugin,
        options: {
          options: {
            globalOption: true
          },
          profiles: [
            {name: 'test', url: 'hapi://test/failed', options: {profileOption: true}}
          ]
        }
      }, err => {
        expect(err).to.exist
        expect(mongoClientConnect.calledWith('hapi://test/failed', {
          globalOption: true,
          profileOption: true
        }, sinon.match.func)).to.be.true
        done()
      })
    })
  })

  describe('exposed', () => {
    let mongoClientConnect
    let mongoCollection
    let server

    lab.beforeEach(done => {
      mongoCollection = sinon.stub()
      mongoClientConnect = sinon.stub(MongoDB.MongoClient, 'connect', (url, options, reply) => {
        reply(null, {collection: mongoCollection, testDb: true})
      })

      server = new Hapi.Server()
      server.connection({ port: 8000 })

      server.register({
        register: plugin,
        options: {
          profiles: [
            {name: 'test', url: 'hapi://test/db'}
          ]
        }
      }, err => {
        expect(err).not.to.exist
        expect(mongoClientConnect.calledWith('hapi://test/db', {}, sinon.match.func)).to.be.true
        done()
      })
    })

    lab.afterEach(done => {
      mongoClientConnect.restore()
      done()
    })

    it('test', done => {
      expect(server.plugins['hapi-mongodb-profiles'].db('test').testDb).to.be.true
      mongoCollection.withArgs('test').returns('abc')
      expect(server.plugins['hapi-mongodb-profiles'].collection('test', 'test')).to.equal('abc')
      done()
    })

    it('request', done => {
      server.route({
        method: 'GET',
        path: '/test',
        handler (request, reply) {
          expect(request.db().testDb).to.be.true
          expect(request.db('test').testDb).to.be.true
          mongoCollection.withArgs('test').returns('abc')
          expect(request.collection('test')).to.equal('abc')
          expect(request.collection('test', 'test')).to.equal('abc')
          reply('OK')
        }
      })

      server.inject('/test', res => {
        expect(res.result).to.equal('OK')
        done()
      })
    })
  })
})
