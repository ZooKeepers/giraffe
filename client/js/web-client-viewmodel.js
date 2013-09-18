function RSSFeed(url, text, id) {
	this.url = url;
	this.text = url;
	this.id = id;
}

function SimpleWebClientViewModel() {
    var vm = this;
	var urlBase = 'http://localhost:3000/';
	
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
	
	vm.user = ko.observable({});
	
	function getUserInfo() {
		$.ajax({
		    url: urlBase + 'user',
			dataType: "json",
			success: function (data) {
				vm.user({
					username: data.username,
					feeds: data.feeds,
					id: data._id
				});
			}
		});
	}
	
	vm.feedItems = ko.observableArray([]);
	
	function getTestRSSFeed() {
		$.ajax({
		    url: urlBase + 'rss',
			dataType: "json",
			success: function (data) {
				ko.utils.arrayForEach(data.rss.channel[0].item, function(item) {
					vm.feedItems.push({
						feed: data.rss.channel[0].title[0],
						description: item.description[0],
						title: item.title[0],
						author: item['dc:creator'][0]
					});
					
					vm.y = 0;
				});
				
			}
		});
	}
	
	// Utility functions for generating the href links for the Accordion Elements
    vm.genAccLink = function (str, comp) {
        return "#" + str + comp.replace(/\W/g, '');
    };
	
    vm.genAccId = function (str, comp) {
        return "" + str + comp.replace(/\W/g, '');
    };
	
	getUserInfo();
	
	getTestRSSFeed();
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