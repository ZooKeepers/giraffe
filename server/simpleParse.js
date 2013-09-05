function parseRSS(event){
    if(event.which==13||event.keyCode==13)
    {
        var textBox = document.getElementById('RSS').value;
       return $.get(textBox, function(response) {
             //Store rss
            var $rss = $(response);
            //iterate through rss feed and extract elements of interest
            var itemArray = new Array();
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
                itemArray.push(item);
               // $("p").append("<br><br>Item: "+item.title+"<br>Date: "+item.pubDate+"<br>Link: "+item.link);
            });
                    /*for (var i = 0; i < itemArray.length; i++) {
                    var temp=itemArray[i];
                    $("p").append("<br><br>Item: "+temp.title+"<br>Date: "+temp.pubDate+"<br>Link: "+temp.link);
                    }*/
              return itemArray;
        });
    }
}