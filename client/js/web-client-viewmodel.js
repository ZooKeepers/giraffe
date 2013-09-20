function RSSFeed(url, text, id) {
	this.url = url;
	this.text = url;
	this.id = id;
}

function SimpleWebClientViewModel() {
    var vm = this;
	var urlBase = 'http://localhost:3000/';
	
	vm.currentFeed = ko.observable('All Feeds');
	vm.user = ko.observable({});
	vm.feeds = ko.observableArray([]);

	function getUserInfo() {
		$.ajax({
		    url: urlBase + 'user',
			dataType: "json",
			success: function (data) {
				vm.user({
					username: toTitleCase(data.username),
					feeds: data.feeds,
					id: data._id
				});
				
				getFeedData();
			}
		});
	}
	
	function toTitleCase(str)
	{
		return str.replace(/\w\S*/g, function(txt){
			return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
		});
	}
	
	vm.displayedItems = ko.observableArray([]);
	
	// Changes the display to a specific feed
	// bug: requeries atm, maybe cache instead?
	vm.changeFeed = function (feed) {
		vm.currentFeed(feed.title);
		
		vm.displayedItems([]);
		getFeedItems(feed);
	};
	
	// Get items for all feeds!
	// big: requeries atm, maybe cache instead?
	vm.showAllFeeds = function () {
		vm.currentFeed('All Feeds');
		
		vm.displayedItems([]);
		
		ko.utils.arrayForEach(vm.feeds(), function(feed) {
			getFeedItems(feed);
		});
	};
	
	// Get information about the current feeds
	// -- Also pulls the items of that feed
	function getFeedData() {
		ko.utils.arrayForEach(vm.user().feeds, function(feed) {
			$.ajax({
				url: urlBase + 'feed/' + encodeURIComponent(feed.url),
				dataType: "json",
				success: function (data) {
					vm.feeds.push({
						feed: data[0].feed,
						description: data[0].description,
						title: data[0].title,
						id: data[0]._id
					});
					
					getFeedItems(vm.feeds()[vm.feeds().length - 1]);
				}
			});
		});
	}
	
	// Pull the items from a specific feed
	function getFeedItems(feed) {
		$.ajax({
		    url: urlBase + 'articles/' + encodeURIComponent(feed.feed),
			dataType: "json",
			success: function (data) {
				ko.utils.arrayForEach(data, function(item) {
					vm.displayedItems.push({
						feed: feed.title,
						description: item.description,
						title: item.title,
						timestamp: item.pubDate,
						author: item.author,
						id: item._id
					});
				});
			}
		});
	}
	
	// Utility functions for generating the href links for the Accordion Elements
    vm.genAccLink = function (str, comp) {
        return "#" + str + comp.replace(/\W/g, '');
    };
	
	// Utility functions for generating the href links for the Accordion Elements
    vm.genAccId = function (str, comp) {
        return "" + str + comp.replace(/\W/g, '');
    };
	
	getUserInfo();
}

(function ($, window, document) {
    $(document).ready(function () {

        window.swcvm = new SimpleWebClientViewModel();
        ko.applyBindings(swcvm);
		
    });
}($, window, document));