function RSSFeed(url, text, id) {
	this.url = url;
	this.text = url;
	this.id = id;
}

function SimpleWebClientViewModel() {
    var vm = this;

    var urlBase = "";
    if (window.location.hostname == "giraffe-rss.herokuapp.com") {
        urlBase = "https://giraffe-rss.herokuapp.com/"
    } else {
        urlBase = 'http://' + window.location.hostname + ':3000/';
    }
	vm.feeds = ko.observableArray([]);
	vm.users = ko.observableArray([]);
	
    vm.getAllUsers = function() {
		$.ajax({
		    url: urlBase + 'user',
			dataType: "json",
			success: function (data) {
				//ko.utils.arrayForEach(data, function(item) {
					vm.users.push({
						username: data.username,
						id: data._id
					});
                    
                    //console.log(item);
				//});
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
}

(function ($, window, document) {
    $(document).ready(function () {
        window.swcvm = new SimpleWebClientViewModel();
        ko.applyBindings(swcvm);
    });
}($, window, document));

