var sinon = require('sinon');
var Lab = require('lab');
var lab = exports.lab = Lab.script();
var describe = lab.experiment;
var it = lab.test;
var plugin = require('../index');
var Hapi = require('hapi');
var MongoDB = require('mongodb');

describe('utils', function () {
    it('simple plugin registering', function (done) {
        var server = new Hapi.Server('localhost', 8000);

        server.pack.register({
            plugin: plugin,
            options: {}
        }, function (err) {
            Lab.expect(err).not.to.exist;
            done();
        });
    });


    describe('initialization', function () {
        var mongoClientConnect;

        lab.beforeEach(function (done) {
            mongoClientConnect = sinon.stub(MongoDB.MongoClient, 'connect', function (url, options, reply) {
                if (url.indexOf('fail') !== -1) {
                    reply(new Error('failed'));
                } else {
                    reply(null, {});
                }
            });
            done();
        });

        lab.afterEach(function (done) {
            mongoClientConnect.restore();
            done();
        });

        it('it connects with profiles array', function (done) {
            var server = new Hapi.Server('localhost', 8000);

            server.pack.register({
                plugin: plugin,
                options: {
                    profiles: [
                        {name: 'test', url: 'hapi://test/db'}
                    ]
                }
            }, function (err) {
                Lab.expect(err).not.to.exist;
                Lab.expect(mongoClientConnect.calledWith('hapi://test/db', {}, sinon.match.func)).to.be.true;
                done();
            });
        });

        it('it connects with profiles object', function (done) {
            var server = new Hapi.Server('localhost', 8000);

            server.pack.register({
                plugin: plugin,
                options: {
                    profiles: {
                        test: {url: 'hapi://test/db'}
                    }
                }
            }, function (err) {
                Lab.expect(err).not.to.exist;
                Lab.expect(mongoClientConnect.calledWith('hapi://test/db', {}, sinon.match.func)).to.be.true;
                done();
            });
        });

        it('it fails', function (done) {
            var server = new Hapi.Server('localhost', 8000);

            server.pack.register({
                plugin: plugin,
                options: {
                    profiles: [
                        {name: 'test', url: 'hapi://test/failed'}
                    ]
                }
            }, function (err) {
                Lab.expect(err).to.exist;
                Lab.expect(mongoClientConnect.calledWith('hapi://test/failed', {}, sinon.match.func)).to.be.true;
                done();
            });
        });

        it('options are passed', function (done) {
            var server = new Hapi.Server('localhost', 8000);

            server.pack.register({
                plugin: plugin,
                options: {
                    options: {
                        globalOption: true
                    },
                    profiles: [
                        {name: 'test', url: 'hapi://test/failed', options: {profileOption: true}}
                    ]
                }
            }, function (err) {
                Lab.expect(err).to.exist;
                Lab.expect(mongoClientConnect.calledWith('hapi://test/failed', {
                    globalOption: true,
                    profileOption: true
                }, sinon.match.func)).to.be.true;
                done();
            });
        });
    });


    describe('exposed', function () {
        var mongoClientConnect;
        var mongoCollection;
        var server;

        lab.beforeEach(function (done) {
            mongoCollection = sinon.stub();
            mongoClientConnect = sinon.stub(MongoDB.MongoClient, 'connect', function (url, options, reply) {
                reply(null, {collection: mongoCollection, testDb: true});
            });

            server = new Hapi.Server('localhost', 8000);

            server.pack.register({
                plugin: plugin,
                options: {
                    profiles: [
                        {name: 'test', url: 'hapi://test/db'}
                    ]
                }
            }, function (err) {
                Lab.expect(err).not.to.exist;
                Lab.expect(mongoClientConnect.calledWith('hapi://test/db', {}, sinon.match.func)).to.be.true;
                done();
            });
        });

        lab.afterEach(function (done) {
            mongoClientConnect.restore();
            done();
        });

        it('test', function (done) {
            Lab.expect(server.plugins['hapi-mongodb-profiles'].db('test').testDb).to.be.true;
            mongoCollection.withArgs('test').returns('abc');
            Lab.expect(server.plugins['hapi-mongodb-profiles'].collection('test', 'test')).to.be.eql('abc');
            done();
        });
    });
});