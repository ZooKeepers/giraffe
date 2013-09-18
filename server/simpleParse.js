var http = require('http'),
    https = require('https'),
    xml2js = require('xml2js'),
    urlParser = require ('url');

exports.parseRSS = dylansParseRSS;

function dylansParseRSS(url, onResult) {
    var parsedURL = urlParser.parse(url);

    var protocol = parsedURL.protocol == "https:" ? https : http;

    var options = {
        host: parsedURL.hostname,
        port: parsedURL.port ? parsedURL.port : 80,
        path: parsedURL.path,
        method: 'GET'
    };

    var req = protocol.request(options, function(res) {
        var output = '';
        res.setEncoding('utf8');

        res.on('data', function(chunk) {
            output += chunk;
        });

        res.on('end', function() {
            xml2js.parseString(output, function(err, result) {
                onResult(err, result);
            });
        });
    });

    req.on('error', function(err) {
    });

    req.end();
}

function parseRSS(event){
    if(event.which==13||event.keyCode==13)
    {
        var itemList= new Array();
        var textBox = document.getElementById('RSS').value;
        $.get(textBox, function(response) {
             //Store rss
            var $rss = $(response);
            //iterate through rss feed and extract elements of interest
            $rss.find("item").each(function() {
            var $this = $(this),
            item = {
                title: $this.find("title").text(),
                link: $this.find("link").text(),
                description: $this.find("description").text(),
                pubDate: $this.find("pubDate").text(),
                author: $this.find("author").text()
                // On cnn, the "link" is a temporary link that gets redirected
                }
                itemList.push(item);
               // $("p").append("<br><br>Item: "+itemList[0].title+"<br>Date: "+item.pubDate+"<br>Link: "+item.link);
            });
        }).done(function()
        {
                //displayItems(itemList);
                return itemList;
        });
        ;
    }
}

function displayItems(itemList)
{
    for (var i=0; i < itemList.length; i++){
        $("p").append("<br><br>Item: "+itemList[i].title+"<br>Date: "+itemList[i].pubDate+"<br>Link: "+itemList[i].link);
    }
}
