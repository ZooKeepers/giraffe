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
	
    vm.newPass = ko.observable();
    vm.reNewPass = ko.observable();
    
    vm.getAllUsers = function() {
    console.log('test');
		$.ajax({
		    url: urlBase + 'users',
			dataType: "json",
			success: function (data) {
                console.log(data);
				ko.utils.arrayForEach(data, function(item) {
                    console.log(item);
					vm.users.push({
						username: item.username,
						id: item._id,
                        feedNo: item.feeds.length
					});
				});
			}
		});
    }
    $(document).ready(vm.getAllUsers);
    
    vm.deleteUser = function(username) {
        console.log(username);
		$.ajax({
		    url: urlBase + 'user/' + username,
            type: 'DELETE',
			dataType: "json",
			success: function (data) {
				if(data.error)
					alert(data.error);
			}
		});    }
    
    vm.resetPassword = function(username) {
        if (vm.newPass() == vm.reNewPass()) { 
            var json = {
                            resetPassword: vm.newPass()
                        };
                        
            $.ajax({
                url: urlBase + 'user/' + username,
                dataType: "json",
                type: 'PUT',
                cache: false,
                data: json
            });
        }
        
        vm.newPass('');
        vm.reNewPass('');
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

