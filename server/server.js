var express = require('express'),
    mongo = require('mongodb'),
    path = require('path'),
    rss = require('./simpleParse.js'),
    flash = require('connect-flash'),
    cronJob = require('cron').CronJob,
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    bcrypt = require('bcrypt-nodejs');
//var connect=require('connect');

var mongoUri= process.env.MONGOLAB_URI||'mongodb://heroku_app18429032:vlkr2be9re59tb7mjkigkdil1a@ds049538.mongolab.com:49538/heroku_app18429032';
console.log("URI: "+mongoUri+"\n");
var app = express();


var Server = mongo.Server,
    Db = mongo.Db,
    BSON = mongo.BSONPure;

var server = new Server('localhost', 27017, {auto_reconnect: true});
//db = new Db('feaderdb', server);
//mongo.connect(mongoUri, {}, function(error, db){
mongo.MongoClient.connect(mongoUri, function (err, db) {
if(err) console.log("ERROR: "+err);
if(!err)
{
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


    if (!err) {
        console.log("Connected to 'feaderdb' database");
        db.collection('users', {strict:true}, function(err, collection) {
            if (!err) collection.remove(function(err){if(err) console.log("ERROR REMOVING");});
            db.collection('articles', {strict:true}, function(err, collection) {
            if (!err) collection.remove(function(err){if(err) console.log("ERROR REMOVING");});
                populateDB();
            });
        });
    }
    else{
    console.log("Error: not connected to feaderdb" );
    }
    
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
        console.log("collection: "+collection);
        console.log("username: " + username);
        console.log("");
        collection.findOne({'username': username}, function(err, item) {
            if (err) {
                console.log("Authentication error: "+err);
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
    db.collection('users', function(err, collection) {
        collection.update({'username': user.username}, user);
        done(null, user.username),function(err){if(err) console.log("ERROR serializing");};
    });
});

passport.deserializeUser(function(username, done) {
    console.log("Deserializing " + username);
    db.collection('users', function(err, collection) {
        collection.findOne({'username': username}, function(err, item) {
            done(err, item),function(err){if(err) console.log("ERROR deserialize");};
        });
    });
});


//redirect to https
app.all('*', function (req, res, next) {
    if (req.get('x-forwarded-proto') != "https") {
        res.set('x-forwarded-proto', 'https');
        res.redirect('https://' + req.get('host') + req.url);
    }
    else
    {
    next();
    }
});

/*Redirect any static file requests
app.all('*', function(req, res, next)
{
    console.log("URL:" +res.url);
     filePath = __dirname+'/../client/',res.url);

    if (path.existsSync(filePath))
    {
        res.sendfile(filePath);
    }
    else
    {
       next();
    }
});*/


app.post('/login',
    passport.authenticate('local', null)
);

app.get('/login', function(req, res) {
    res.send('<form action="/login" method="post"><div><label>Username:</label><input type="text" name="username"/></div><div><label>Password:</label><input type="password" name="password"/></div><div><input type="submit" value="Log In"/></div></form>');
});

// TODO: remove
app.get('/logintest', function(req, res) {
    if (req.isAuthenticated()) {
        res.send("Hello " + req.user.username);
    } else {
        res.send("Not authenticated :(");
    }
});

app.get('/logout', function(req, res) {
    if (req.isAuthenticated()) {
        res.send({success: true})
    } else {
        res.send({error: "Not authenticated"})
    }
    req.logout();
});

// Create new user
app.post('/user', function(req, res) {
    var username = req.param('username');
    var password = req.param('password');

    var users = [
    {
        username: username,
        feeds: [
            { url: 'http://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml' },
            { url: 'http://omnifictruthcube.tumblr.com/rss' },
            { url: 'http://feeds.theonion.com/theonion/daily' }
        ],
        passHash: bcrypt.hashSync(password)
    }];

    db.collection('users', function(err, collection) {
        collection.insert(users, {safe:true}, function(err, result) {
            if (err) {
                res.send({error: err});
            } else if (result.length != 1) {
                res.send({error: "Bad database results"});
            } else {
                var toSend = result[0];
                toSend.success = true;
                delete toSend.passHash;
                res.send(toSend);
            }
        });
    });
});

app.put('/user/:username', function(req, res) {
    var body = req.body;//JSON.parse(req.body);
    var updates = {$set: {}, $addToSet: {}, $pullAll: {}};
    if (req.body.addFeeds) {
        db.collection('feeds', function(err, collection) {
            for (f in req.body.addFeeds) {
                collection.update(
                    {feed: req.body.addFeeds[f].url},
                    {feed: req.body.addFeeds[f].url},
                    {upsert: true}
                );
            }
        });
        updates.$addToSet.feeds = {$each: req.body.addFeeds};

    }
    if (req.body.removeFeeds) {
        updates.$pullAll.feeds = req.body.removeFeeds;
    }

    if (req.body.newPassword) {
        updates.$set.passHash = bcrypt.hashSync("body.newPassword");
    }

    db.collection('users', function(err, collection) {
        collection.update(
            {username: req.param('username')},
            updates
        );
    });

    res.send({success: true});
});

app.delete('/user', function(req, res) {
    db.collection('users', function(err, collection) {
        collection.remove({'username':req.user.username}, function(err, item) {
            res.send(item);
            req.logout();
        });
    });
});

app.delete('/user/:username', function(req, res) {
    db.collection('users', function(err, collection) {
        collection.remove({'username':req.param('username')}, function(err, item) {
            res.send(item);
            req.logout();
        });
    });
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

    if (res) {
        res.send("Updating RSS feeds...");
    }

    db.collection('feeds', function(err, feedsCollection) {
        db.collection('articles', function(err, articlesCollection) {
            feedsCollection.find().each(function(err, item) {
                console.log(item);
                if (item != null) {
                    // closure for variable capture
                    (function() {
                        var feed = item.feed;
                        rss.parseRSS(feed, function(err, obj) {
                            // Update feed info
                            var channel = obj.rss.channel[0];
                            feedsCollection.save(
                                {
                                    _id: item._id,
                                    feed: feed,
                                    title: channel.title[0],
                                    description: channel.description[0]
                                },function(err){if(err) console.log("ERROR Saving");}
                            );

                            // Update articles
                            var items = obj.rss.channel[0].item;
                            for (i in items) {
                                var toInsert = {
                                    feed: feed,
                                    title: items[i].title[0],
                                    link: items[i].link[0],
                                    description: items[i].description[0],
                                    author: items[i]['dc:creator'] ? items[i]['dc:creator'][0] : "",
                                    pubDate: items[i].pubDate[0],
                                    readBy: [],
                                    starredBy: []
                                };

                                articlesCollection.update({link: toInsert.link}, toInsert, {upsert: true}, function(err, result) {});
                            }
                        });
                    })();
                }
            });
        });
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

app.get('/users', function(req, res) {
    db.collection('users', function(err, collection) {
        collection.find(function(err, item) {
            item.toArray(function(err, array) {
                res.send(array);
            });
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
    var query = {
        feed: req.params.url
    };
    var filter = {
        feed: 1,
        title: 1,
        link: 1,
        description: 1,
        author: 1,
        pubDate: 1
    };
    if (req.query.hide_read == 1) {
        query.readBy = { $not: { $elemMatch: { username: "dylan"}}};
    }
    if (req.isAuthenticated()) {
        filter.readBy = {
            $elemMatch: { username: req.user.username }
        };
        filter.starredBy = {
            $elemMatch: { username: req.user.username }
        };
    } else {
        filter.readBy = 1;
        filter.starredBy = 1;
    }
    db.collection('articles', function(err, collection) {
        collection.find(
            query,
            filter
            , function(err, item) {
                item.toArray(function(err, array) {
                    res.send(array);
                });
            }
        );
    });
});


app.put('/articles', function(req, res) {
    if (req.isAuthenticated()) {
        if (req.body.addRead || req.body.addStarred || req.body.removeRead || req.body.removeStarred) {
            db.collection('articles', function(err, collection) {
                for (r in req.body.addRead) {
                    collection.update(
                        {_id: mongo.ObjectID(req.body.addRead[r]._id)},
                        {$addToSet: {readBy: {username: req.user.username}}}
                    );
                }

                for (s in req.body.addStarred) {
                    collection.update(
                        {_id: mongo.ObjectID(req.body.addStarred[s]._id)},
                        {$addToSet: {starredBy: {username: req.user.username}}}
                    );
                }

                for (r in req.body.removeRead) {
                    collection.update(
                        {_id: mongo.ObjectID(req.body.removeRead[r]._id)},
                        {$pull: {readBy: {username: req.user.username}}}
                    );
                }

                for (s in req.body.removeStarred) {
                    collection.update(
                        {_id: mongo.ObjectID(req.body.removeStarred[s]._id)},
                        {$pull: {starredBy: {username: req.user.username}}}
                    );
                }
            });
        }

        res.send({success: true});
    } else {
        res.send({error: "Not authenticated"});
    }
});

/*app.get('/article/:article_id', function(req, res) {
    db.collection('articles', function(err, collection) {
        collection.findOne({id:req.params.article_id}, function(err, item) {
            res.send(item);
        });
    });
});*/

var populateDB = function() {
    var defaultUsers = [
        {
            username: "dylan",
            passHash: bcrypt.hashSync("pass")
        },
        {
            username: "paco",
            passHash: bcrypt.hashSync("pass")
        }
    ];

    var defaultFeeds = [
        { url: 'http://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml' },
        { url: 'http://omnifictruthcube.tumblr.com/rss' },
        { url: 'http://feeds.theonion.com/theonion/daily' }
    ];

    var updates = {$set: {}, $addToSet: {}, $pullAll: {}};
    db.collection('feeds', function(err, collection) {
        for (f in defaultFeeds) {
            collection.update(
                {feed: defaultFeeds[f].url},
                {feed: defaultFeeds[f].url},
                {upsert: true},function(err){if(err) console.log("ERROR updating feed");}
            );
        }
    });
    updates.$addToSet.feeds = {$each: defaultFeeds};

    db.collection('users', function(err, collection) {
        collection.insert(defaultUsers, {safe:true}, function(err, result) {});
        for (u in defaultUsers) {
            collection.update(
                {username: defaultUsers[u].username},
                updates,function(err){if(err) console.log("ERROR updating users");}
            );
        }
    });

    rssReload();

};
var port = process.env.PORT || 5000;
app.listen(port, function(){
console.log("Listening on "+port);});
}
else
{
    console.log("ERROR"+err);
}
});

