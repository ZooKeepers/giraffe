function RSSFeed(url, text, id) {
	this.url = url;
	this.text = url;
	this.id = id;
}

function SimpleWebClientViewModel() {
    var vm = this;
	
	vm.feeds = ko.observableArray([
		new RSSFeed("http://www.google.com/rss",
			"First Update",
			1),
		new RSSFeed("http://www.microsoft.com/rss",
			"Second Update",
			2),
		new RSSFeed("http://www.amazon.com/rss",
			"Third Update",
			3)
		]);
	
	/* Reading a RSS feed
	jQuery.getFeed({
		url: 'rss.xml',
		success: function(feed) {
			alert(feed.title);
		}
	});
	*/
}

(function ($, window, document) {
    $(document).ready(function () {

        window.swcvm = new SimpleWebClientViewModel();
        ko.applyBindings(swcvm);
		
    });
}($, window, document));