var express = require('express'),
    mongo = require('mongodb'),
    path = require('path'),
    rss = require('./simpleParse.js'),
    flash = require('connect-flash'),
    cronJob = require('cron').CronJob,
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    bcrypt = require('bcrypt-nodejs');

var app = express();

var Server = mongo.Server,
    Db = mongo.Db,
    BSON = mongo.BSONPure;

var server = new Server('localhost', 27017, {auto_reconnect: true});
db = new Db('feaderdb', server);

//run every 15 mins
var job = new cronJob({
    //run our update every 30 minutes
    cronTime: '0 */15 * * * *',
    onTick: function() {
        //call the RSS reload function
        rssReload(null);
    },
    onComplete: function() {
        //This funciton is executed when the job stops
    },
    start: true
});

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
    app.use(express.cookieParser());
    app.use(express.bodyParser());
    app.use(express.session({ secret: 'I shot a man in Reno, just to watch him die' }));
    app.use(flash());
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(app.router);
});

passport.use(new LocalStrategy(function(username, password, done) {
    console.log("SOMEONE'S LOGGING IN")
    db.collection('users', function(err, collection) {
        collection.findOne({'username': username}, function(err, item) {
            if (err) {
                console.log("Authentication error");
                return done(err);
            }
            if (!item) {
                console.log("Bad username");
                return done(null, false, { message: 'Incorrect username' });
            }
            if (!bcrypt.compareSync(password, item.passHash)) {
                console.log("Bad password");
                return done(null, false, { message: 'Incorrect password' });
            }
            console.log("Successful login: " + item.username);
            return done(null, item);
        });
    });
}));

passport.serializeUser(function(user, done) {
    console.log("Serializing: " + user.username);
    done(null, user.username);
});

passport.deserializeUser(function(username, done) {
    console.log("Deserializing " + username);
    db.collection('users', function(err, collection) {
        collection.findOne({'username': username}, function(err, item) {
            done(err, item);
        });
    });
});

app.post('/login',
    passport.authenticate('local', null)
);

app.get('/login', function(req, res) {
    res.send('<form action="/login" method="post"><div><label>Username:</label><input type="text" name="username"/></div><div><label>Password:</label><input type="password" name="password"/></div><div><input type="submit" value="Log In"/></div></form>');
});

app.get('/logintest', function(req, res) {
    if (req.isAuthenticated()) {
        res.send("Hello " + req.user.username);
    } else {
        res.send("Not authenticated :(");
    }
});

app.get('/logout', function(req, res) {
    if (req.isAuthenticated()) {
        res.send({sucess: true})
    } else {
        res.send({error: "Not authenticated"})
    }
    req.logout();
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
    console.log("running reload");
    var feeds = [
        'http://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml',
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
                    // Update feed info
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

                    // Update articles
                    var items = obj.rss.channel[0].item;
                    for (i in items) {
                        var toInsert = {
                            feed: feed,
                            title: items[i].title[0],
                            link: items[i].link[0],
                            description: items[i].description[0],
                            author: items[i]['dc:creator'] ? items[i]['dc:creator'][0] : "",
                            pubDate: items[i].pubDate[0]
                        };

                        collection.update({link: toInsert.link}, toInsert, {upsert: true}, function(err, result) {});
                    }
                });
            })();
        }
    });
};

// TODO: STOP LEAKING PASSWORD HASH
app.get('/user', function(req, res) {
    /*db.collection('users', function(err, collection) {
        collection.findOne({'username':'dylan'}, function(err, item) {
            res.send(item);
        });
    });*/

    if (req.isAuthenticated()) {
        res.send(req.user);
    } else {
        res.send({ error: "Not authenticated" });
    }
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
                author: 1,
                pubDate: 1,
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
            { url: 'http://omnifictruthcube.tumblr.com/rss' },
            { url: 'http://feeds.theonion.com/theonion/daily' }
        ],
        passHash: bcrypt.hashSync("pass")
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

var port = process.env.PORT || 3000;
app.listen(port, function(){
console.log("Listening on "+port);});

