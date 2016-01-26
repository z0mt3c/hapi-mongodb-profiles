'use strict'

const async = require('async')
const MongoDB = require('mongodb')
const Hoek = require('hoek')
const _ = require('lodash')

const internals = {
  connect (url, options, reply) {
    MongoDB.MongoClient.connect(url, options, (err, db) => {
      return reply(err, db)
    })
  },
  connectTask (url, options) {
    return function (reply) {
      return internals.connect(url, options, reply)
    }
  }
}

module.exports.register = function (plugin, options, next) {
  const profiles = options.profiles || []
  let defaultProfile = null

  const tasks = _.reduce(profiles, (memo, profile, key) => {
    const profileOptions = Hoek.applyToDefaults(options.options || {}, profile.options || {})
    let profileName = profile.name || key
    memo[profileName] = internals.connectTask(profile.url, profileOptions)
    defaultProfile = defaultProfile || profileName
    return memo
  }, {})

  const completed = function (err, results) {
    const getDatabase = function (profile) {
      Hoek.assert(profile, 'Profile name is required')
      Hoek.assert(results[profile], `Profile with name ${profile} not configured`)

      return results[profile]
    }

    const getCollection = function (profile, collection) {
      const db = getDatabase(profile)
      Hoek.assert(collection, 'Collection name is required')
      return db.collection(collection)
    }

    const db = function (profile) {
      return getDatabase(profile || defaultProfile)
    }

    let collection = function (profile, collection) {
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
