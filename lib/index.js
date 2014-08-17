var async = require('async');
var MongoDB = require('mongodb');
var Hoek = require('hoek');
var _ = require('lodash');

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

module.exports.register = function (plugin, options, next) {
    var profiles = options.profiles || [];

    var tasks = _.reduce(profiles, function (memo, profile, key) {
        var profileOptions = Hoek.applyToDefaults(options.options || {}, profile.options || {});
        memo[profile.name || key] = internals.connectTask(profile.url, profileOptions);
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
            return db.collection(collection);
        };

        plugin.expose('db', getDatabase);
        plugin.expose('collection', getCollection);
        plugin.expose('MongoDB', MongoDB);
        plugin.expose('ObjectID', MongoDB.ObjectID);

        next(err);
    };

    async.series(tasks, completed);
};

module.exports.register.attributes = {
    pkg: require('../package.json')
};