var express = require('express'),
    mongo = require('mongodb'),
    path = require('path'),
    rss = require('./simpleParse.js');

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

app.get('/rss', function(req, res) {
    rss.parseRSS('http://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml', function(err, obj) {
        //obj.rss.channel[0].item = 0;
        //res.send(obj.rss.channel[0].item[0]);
        res.send(obj);
    });
});

app.get('/rssreload', function(req, res) {
    rssReload(res);
});

function rssReload(res) {
    var feeds = [
        'http://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml',
        'http://nobamazone.com/feed/',
        'http://omnifictruthcube.tumblr.com/rss',
        'http://feeds.theonion.com/theonion/daily'
    ];

    if (res) {
        res.send("Updating RSS feeds...");
    }

    db.collection('articles', function(err, collection) {
        for (f in feeds) {
            // closure for variable capture
            (function() {
                var feed = feeds[f];
                rss.parseRSS(feeds[f], function(err, obj) {
                    db.collection('feeds', function(err, collection) {
                        var channel = obj.rss.channel[0];
                        collection.update(
                            {feed: feed},
                            {
                                feed: feed,
                                title: channel.title[0],
                                description: channel.description[0]
                            },
                            {upsert: true},
                            function(err, result) {}
                        );
                    });
                    var items = obj.rss.channel[0].item;
                    for (i in items) {
                        var toInsert = {
                            feed: feed,
                            title: items[i].title[0],
                            link: items[i].link[0],
                            description: items[i].description[0]
                        };

                        collection.update({link: toInsert.link}, toInsert, {upsert: true}, function(err, result) {});
                    }
                });
            })();
        }
    });
};

app.get('/user', function(req, res) {
    db.collection('users', function(err, collection) {
        collection.findOne({'username':'dylan'}, function(err, item) {
            res.send(item);
        });
    });
});
app.get('/feed/:url', function(req, res) {
    db.collection('feeds', function(err, collection) {
        collection.find(
            {feed: req.params.url},
            {
                feed: 1,
                title: 1,
                description: 1
            },
            function(err, item) {
                item.toArray(function(err, array) {
                    res.send(array);
                });
            }
        );
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
                title: 1,
                link: 1,
                description: 1,
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
            { url: 'http://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml' },
            { url: 'http://nobamazone.com/feed/' },
            { url: 'http://omnifictruthcube.tumblr.com/rss' },
            { url: 'http://feeds.theonion.com/theonion/daily' }
        ]
    }];

    db.collection('users', function(err, collection) {
        collection.insert(users, {safe:true}, function(err, result) {});
    });

    rssReload();

    /*var articles = [
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
    });*/
};

app.listen(3000);
console.log('Listening on port 3000');
