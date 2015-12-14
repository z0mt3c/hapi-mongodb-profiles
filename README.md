# hapi-mongodb-profiles

Simple hapi plugin to manage mongodb connection profiles

[![Build Status](https://travis-ci.org/z0mt3c/hapi-mongodb-profiles.png)](https://travis-ci.org/z0mt3c/hapi-mongodb-profiles)
[![Dependency Status](https://gemnasium.com/z0mt3c/hapi-mongodb-profiles.png)](https://gemnasium.com/z0mt3c/hapi-mongodb-profiles)


## Register plugin

```js
server.pack.register({
    plugin: require('hapi-mongodb-profiles'),
    options: {
        // decorateRequest: false // default: true
        options: {
            // default options for all profiles, will be extended by local profile options
        }
        profiles: [
            { name: 'test', url: 'hapi://test/db', options: {
                // local profile options
            }}
        ]
    }
}
```

## Get database

```js
server.plugins['hapi-mongodb-profiles'].db('profileName')
request.db('profileName')
request.db() // first database/profile will be returned
```

## Get collection

```js
server.plugins['hapi-mongodb-profiles'].collection('profileName', 'collectionName')
request.collection('test') // first database/profile will be used
request.collection('profile', 'test')
```
