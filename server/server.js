var express = require('express'),
    mongo = require('mongodb'),
    path = require('path');

var app = express();

var Server = mongo.Server,
    Db = mongo.Db,
    BSON = mongo.BSONPure;

var server = new Server('localhost', 27017, {auto_reconnect: true});
db = new Db('feaderdb', server);

db.open(function(err, db) {
    if (!err) {
        console.log("Connected to 'feaderdb' database");
        db.collection('users', {strict:true}, function(err, collection) {
            if (!err) collection.remove();
            db.collection('articles', {strict:true}, function(err, collection) {
                if (!err) collection.remove();
                populateDB();
            });
        });
    }
});

app.configure(function() {
    app.use(express.static(path.join(__dirname, '..',  'client')));
});

app.get('/user', function(req, res) {
    db.collection('users', function(err, collection) {
        collection.findOne({'username':'dylan'}, function(err, item) {
            res.send(item);
        });
    });
});
app.get('/articles', function(req, res) {
    db.collection('articles', function(err, collection) {
        collection.find(function(err, item) {
            item.toArray(function(err, array) {
                res.send(array);
            });
        });
    });
});
app.get('/articles/:url', function(req, res) {
    console.log(req.params.url);
    var filter = {
        feed: req.params.url
    };
    if (req.query.hide_read == 1) {
        filter.read_by = { $not: { $elemMatch: { username: "dylan"}}};
    }
    db.collection('articles', function(err, collection) {
        collection.find(
            filter,
            {
                feed: 1,
                content: 1,
                read_by: {
                    $elemMatch: { username: "dylan" }
                }
            }
            , function(err, item) {
                item.toArray(function(err, array) {
                    res.send(array);
                });
            }
        );
    });
});
/*app.get('/article/:article_id', function(req, res) {
    db.collection('articles', function(err, collection) {
        collection.findOne({id:req.params.article_id}, function(err, item) {
            res.send(item);
        });
    });
});*/

var populateDB = function() {
    var users = [
    {
        username: "dylan",
        feeds: [
            {
                url: "http://lol"
            },
            {
                url: "http://notlol"
            }
        ]
    }];

    db.collection('users', function(err, collection) {
        collection.insert(users, {safe:true}, function(err, result) {});
    });

    var articles = [
        {
            feed: "http://lol",
            content: "lol",
            read_by: [ {username:"bob"} ]
        },
        {
            feed: "http://lol",
            content: "read by dylan and bob",
            read_by: [ {username:"dylan"}, {username:"bob"} ]
        },
        {
            feed: "http://notlol",
            content: "not lol",
            read_by: []
        }
    ];

    db.collection('articles', function(err, collection) {
        collection.insert(articles, {safe:true}, function(err, result) {});
    });
};

app.listen(3000);
console.log('Listening on port 3000');
