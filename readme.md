# MongoUI

MongoUI (mongoui) is an web browser admin interface for MongoDB. Standalon tool (run as an app locally or on your server), middleware later.

## Branches

* Master — major releases, main branch
* Develop — current development branch (make your pull requests here)


## Why

Tired of typing `db.users.findOne({_id:ObjectId(...)})` just to look up data structure. Even more typing to modify the data. Can't find Node.js implementaton (not true any more, there is [exprss-mongo](https://github.com/andzdroid/mongo-express)).


# Use

To start the server run:

  $ node .

or:

  $ node index.js

# Chrome extension

Download and install [JSONView Chrome extension](https://chrome.google.com/webstore/detail/jsonview/chklaanhfefbnpoihckbnefhakgolnmc) to view JSON in a human readable format.

# TODO

## v0.1:

- [ ] blabla
- [x] boumboum
- [ ] nothing
* [x ] Hook up Derby
* [x ] Expand docs
* [x ] Main View (list of databases, list of collections, links, raw link to JSON REST API)
* [  ] Collection View
* [  ] Data (row) View ready-only

## v0.1.1:

* [ ] Data (row) View updatable 
* [ ] Connection to remote database (copy/paste connetion string or password+username+host+port)

# Non-node.js alternatives

* Mac OS X app: [MongoHub](http://mongohub.todayclose.com/)
* .NET based app: MongoVUE](http://www.mongovue.com/)
