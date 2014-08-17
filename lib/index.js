var async = require('async');
var MongoDB = require('mongodb');
var Hoek = require('hoek');

var internals = {
    connect: function (url, options, reply) {
        MongoDB.MongoClient.connect(url, options, function (err, db) {
            return reply(err, db);
        });
    },
    connectTask: function (url, options) {
        return function (reply) {
            return internals.connect(url, options, reply);
        };
    }
};

exports.register = function (plugin, options, next) {
    var profiles = options.profiles || [];

    var tasks = profiles.reduce(function (memo, profile, key) {
        var options = Hoek.applyToDefaults(options.options || {}, profile.options);
        memo[profile.name || key] = internals.connectTask(profile.url, options);
        return memo;
    }, {});

    var completed = function (err, results) {
        var getDatabase = function (profile) {
            Hoek.assert(profile, 'Profile name is required');
            Hoek.assert(results[profile], 'Profile with name ' + profile + ' not configured');

            return results[profile];
        };

        var getCollection = function (profile, collection) {
            var db = getDatabase(profile);
            Hoek.assert(collection, 'Collection name is required');

            if (db) {
                return db.collection(collection);
            } else {
                return null;
            }
        };

        plugin.expose('db', getDatabase);
        plugin.expose('collection', getCollection);
        plugin.expose('MongoDB', MongoDB);
        plugin.expose('ObjectID', MongoDB.ObjectID);

        next(err);
    };

    async.series(tasks, completed);
};

exports.register.attributes = {
    pkg: require('../package.json')
};