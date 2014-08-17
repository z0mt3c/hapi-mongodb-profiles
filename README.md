# hapi-mongodb-profiles

Simple hapi plugin to manage mongodb connection profiles

[![Build Status](https://travis-ci.org/z0mt3c/hapi-mongodb-profiles.png)](https://travis-ci.org/z0mt3c/hapi-mongodb-profiles)
[![Dependency Status](https://gemnasium.com/z0mt3c/hapi-mongodb-profiles.png)](https://gemnasium.com/z0mt3c/hapi-mongodb-profiles)


## Register plugin

```js
server.pack.register({
    plugin: require('hapi-mongodb-profiles'),
    options: {
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
```

## Get collection

```js
server.plugins['hapi-mongodb-profiles'].collection('profileName', 'collectionName')
```

