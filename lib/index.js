var async = require('async')
var MongoDB = require('mongodb')
var Hoek = require('hoek')
var _ = require('lodash')

var internals = {
  connect: function (url, options, reply) {
    MongoDB.MongoClient.connect(url, options, function (err, db) {
      return reply(err, db)
    })
  },
  connectTask: function (url, options) {
    return function (reply) {
      return internals.connect(url, options, reply)
    }
  }
}

module.exports.register = function (plugin, options, next) {
  var profiles = options.profiles || []
  var defaultProfile = null

  var tasks = _.reduce(profiles, function (memo, profile, key) {
    var profileOptions = Hoek.applyToDefaults(options.options || {}, profile.options || {})
    var profileName = profile.name || key
    memo[profileName] = internals.connectTask(profile.url, profileOptions)
    defaultProfile = defaultProfile || profileName
    return memo
  }, {})

  var completed = function (err, results) {
    var getDatabase = function (profile) {
      Hoek.assert(profile, 'Profile name is required')
      Hoek.assert(results[profile], 'Profile with name ' + profile + ' not configured')

      return results[profile]
    }

    var getCollection = function (profile, collection) {
      var db = getDatabase(profile)
      Hoek.assert(collection, 'Collection name is required')
      return db.collection(collection)
    }

    var db = function (profile) {
      return getDatabase(profile || defaultProfile)
    }

    var collection = function (profile, collection) {
      if (_.isString(collection)) {
        return getCollection(profile, collection)
      } else {
        collection = profile
        return getCollection(defaultProfile, collection)
      }
    }

    plugin.expose('db', db)
    plugin.expose('collection', collection)
    plugin.expose('MongoDB', MongoDB)
    plugin.expose('ObjectID', MongoDB.ObjectID)

    if (options.decorateRequest !== false) {
      plugin.decorate('request', 'db', db)

      plugin.decorate('request', 'collection', collection)
    }

    next(err)
  }

  async.series(tasks, completed)
}

module.exports.register.attributes = {
  pkg: require('../package.json')
}
