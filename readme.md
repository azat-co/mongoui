# MongoUI


## Usage

Front-end development:

```
npm run dev-server
```

Back end start (and Node development):

```
npm start
```


Open <http://localhost:3000/> in your favorite browser.

You'll see something like this:

[![](https://raw.githubusercontent.com/azat-co/mongoui/master/demo-image.png)](https://raw.githubusercontent.com/azat-co/mongoui/master/demo.mp4)



## Additional Tasks



You'll need MongoDB running for MongoUI to work:

```
mongod
```



Front-end build:

```
npm run build
```


---

MongoUI (mongoui) is a web browser admin interface for MongoDB. Currently a standalone tool (run as an app locally or on your server); middleware later.

Here's a one and a half minute **video** that shows filtering, editing, and switching collections:

[![mongoui rocks!](http://img.youtube.com/vi/l8Rfpow0f9A/0.jpg)](http://www.youtube.com/watch?v=l8Rfpow0f9A)


## Branches

* Master — major releases, main branch
* Develop — current development branch (make your pull requests here)


## Why

Tired of typing `db.users.findOne({_id:ObjectId(...)})` just to look up data structure. Even more typing to modify the data. Can't find Node.js implementation (not true any more, there is [exprss-mongo](https://github.com/andzdroid/mongo-express)).


## How to Use

### Installation

SSH:

```bash
git clone git@github.com:azat-co/mongoui
```

or HTTPS

```bash
git clone https://github.com/azat-co/mongoui.git
```

or CURL

```
curl -O https://github.com/azat-co/mongoui/archive/master.zip
```

or WGET

```
wget https://github.com/azat-co/mongoui/archive/master.zip
unzip master.zip
cd mongoui-master
```

### Configs

Copy `config_default.json` file as `config.json`:

```
$ cp config_default.json config.json
```

Modify as needed (remote databases should work just fine!).




## Contributors

Via `git shortlog -s -n`:

    61  Azat Mardanov
    14  cultofmetatron
     1  Jan Carlo Viray



## TODO

The list is in the GitHub Issues.

How to contribute in the CONTRIBUTING.md



### Running Tests

In order to run the tests which are in `test` folder, you will need:

* Node.js
* NPM

With those installed, running `npm install` and ''npm test'' will run the tests.


## Non-node.js alternatives

* Mac OS X app: [MongoHub](http://mongohub.todayclose.com/)
* .NET based app: MongoVUE](http://www.mongovue.com/)


## License

License is in LICENSE.md
