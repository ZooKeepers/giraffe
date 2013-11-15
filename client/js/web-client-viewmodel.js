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
	
	vm.currentFeed = ko.observable('Giraffe RSS');
	vm.user = ko.observable({ username: 'Login'	});
	
	vm.feeds = ko.observableArray([]);
	vm.displayedItems = ko.observableArray([]);
	
	vm.loginUsername = ko.observable();
	vm.loginPassword = ko.observable();
	
    vm.curPass = ko.observable();
    vm.newPass = ko.observable();
    vm.reNewPass = ko.observable();
    
	vm.navbarTab = ko.observable(true);
	vm.newFeedInput = ko.observable();
	
	vm.bookmarkedArray = ko.observableArray([]);
	
	vm.themes = ko.observableArray([
		"zebra-theme.png",
		"giraffe-theme.png",
		"poke-theme.png",
		"cheetah-theme.png"
	]);
	
	vm.changeBackground = function (img) {
	
		$('#body').css('background-image', "url('./img/" + img + "')");
		
		/*
		var loc = "'./img/" + img + "'";
		document.body.style.backgroundImage="url(" + loc + ")";
		var t = 10;
		*/
	};
	
	//bug: input not cleared on acceptance
	vm.addFeed = function () {
		var json = {
					addFeeds: [{ url: vm.newFeedInput() }]
				};
				
		$.ajax({
		    url: urlBase + 'user/' + vm.user().username,
			dataType: "json",
			type: 'PUT',
			cache: false,
			data: json,
            success: function (data) {
                $.ajax({
                    url: urlBase + 'user',
                    dataType: "json",
                    success: function (data) {
                        if(data.error) {
                            vm.user({
                                username: 'Login',
                                error: true
                            });
                            return;
                        }
                        vm.user({
                            username: data.username,
                            feeds: data.feeds,
                            id: data._id
                        });
                        
                        setTimeout(function() {
                            vm.feeds([]);
                            getFeedData();
                        },5000);                        
                    }
                });                
                
			}
		});
                
		vm.newFeedInput('');
	};
	
	vm.removeFeed = function (data) {
	
		var json = {
					removeFeeds: [{ url: data.feed }]
				};
				
		$.ajax({
		    url: urlBase + 'user/' + vm.user().username,
			dataType: "json",
			type: 'PUT',
			cache: false,
			data: json,
            success: function (data) {
                vm.feeds([]);
                getUserInfo();
			}
		});
		
	};
	
	
	vm.activeContentTab = function() {
		vm.navbarTab(false);
		$('#FeedsTab').removeAttr("class");
		$('#ContentTab').addClass('active');
	};
	
	vm.activeFeedsTab = function() {
		vm.navbarTab(true);
		$('#FeedsTab').addClass('active');
		$('#ContentTab').removeAttr('class');
	};
	
	vm.titleTagLine = ko.computed(
		function() {
			if(vm.user().username == 'Login')
				return 'Login in below';
			
			return '64 unread articles // ';
	});
	
	vm.titleDisplayLine = ko.computed(function() {
		if(vm.user().username == 'Login')
			return 'Giraffe RSS';
		
		return vm.currentFeed();
	});
	
	function getUserInfo() {
		$.ajax({
		    url: urlBase + 'user',
			dataType: "json",
			success: function (data) {
				if(data.error) {
					vm.user({
						username: 'Login',
						error: true
					});
					return;
				}
				vm.user({
					username: data.username,
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
	
	// Attempt to log a user in
	vm.attemptLogin = function () {
		
		$.ajax({
		    url: urlBase + 'login',
			dataType: "application/x-www-form-urlencoded",
			type: 'POST',
			cache: false,
			data: 'username=' + vm.loginUsername() + '&password=' + vm.loginPassword()
		});
		
		getUserInfo();
		
		//Need way to alert failed login
		vm.loginUsername('');
		vm.loginPassword('');
	}
	
	vm.registerAccount = function() {
		
		var data = $.ajax({
		    url: urlBase + 'user',
			dataType: "application/x-www-form-urlencoded",
			type: 'POST',
			cache: false,
			data: 'username=' + vm.loginUsername() + '&password=' + vm.loginPassword(),
		});
		
		if(vm.loginUsername() != '' 
			&& vm.loginPassword() != '' 
			&& typeof vm.loginPassword() != 'undefined' 
			&& typeof vm.loginUsername() != 'undefined')
			
			alert('User account ' + vm.loginUsername() + ' created.\nYou may now login.');
		else
			alert('Username or password was not sufficient.');
			
		vm.loginUsername('');
		vm.loginPassword('');
	}
	
	// Logs out the current user
	vm.logout = function () {
		vm.user({
			username: 'Login'
		});
		
		vm.displayedItems([]);
		vm.feeds([]);
		vm.loginUsername('');
		vm.loginPassword('');
		
		$.ajax({
		    url: urlBase + 'logout',
			dataType: "json",
			success: function (data) {
				if(data.error)
					alert(data.error);
			}
		});
	}
	
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
		vm.bookmarkedArray([]);
		getAllItems();
		/*ko.utils.arrayForEach(vm.feeds(), function(feed) {
			getFeedItems(feed);
		});*/
	};
	
	// Get information about the current feeds
	// -- Also pulls the items of that feed
	function getFeedData() {
		vm.currentFeed('All Feeds');
		
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
	
	vm.markAsRead = function(data, event) {
		var element = event.target.parentElement.parentElement;
		
		element.style.backgroundColor = 'rgba(255, 255, 255, 1)';
		
		data.read = 'read-artcile';
		var json = {
						addRead: [{ _id: data.id }]
					};
		$.ajax({
		    url: urlBase + 'articles',
			dataType: "application/json",
			type: 'PUT',
			cache: false,
			data: json
		});
	};
	
	vm.showBookmarked = function(){
		vm.currentFeed('Bookmarked');
		
		vm.displayedItems(vm.bookmarkedArray());
	}
	
	vm.markAsFav = function(data, event) {
		var element = event.target;
		
		if (data.favorite == 'fav-icon') {
			data.favorite = '';
			$(element).addClass('norm-icon');
			$(element).removeClass('fav-icon');
			
			var id = data.id;
			vm.bookmarkedArray.remove(function(data) { return id == data.id } );
			
			var json = { removeStarred: [{ _id: data.id }] };
			$.ajax({
				url: urlBase + 'articles',
				dataType: "application/json",
				type: 'PUT',
				cache: false,
				data: json
			});
		}
		else {
			data.favorite = 'fav-icon';
			$(element).removeClass('norm-icon');
			$(element).addClass('fav-icon');
			
			vm.bookmarkedArray.push(data);
			
			var json = { addStarred: [{ _id: data.id }] };
			$.ajax({
				url: urlBase + 'articles',
				dataType: "application/json",
				type: 'PUT',
				cache: false,
				data: json
			});
		}
	};
	
	// Pull the items from a specific feed
	function getFeedItems(feed) {
		$.ajax({
		    url: urlBase + 'articles/' + encodeURIComponent(feed.feed),
			dataType: "json",
			success: function (data) {
                
				ko.utils.arrayForEach(data, function(item) {
					vm.displayedItems.push({
                        link: item.link,
						feed: feed.title,
						description: item.description,
						title: item.title,
						timestamp: item.pubDate,
						author: item.author,
						id: item._id,
						read: item.readBy ?  'read-article':'' ,
						favorite: item.starredBy ?  'fav-icon':'norm-icon'
					});
					
					if(vm.displayedItems()[vm.displayedItems().length-1].favorite == 'fav-icon')
						vm.bookmarkedArray.push(vm.displayedItems()[vm.displayedItems().length-1]);
				});
			}
		});
	}
    //get item from all feeds
    function getAllItems() {
		$.ajax({
		    url: urlBase + 'articles',
			dataType: "json",
			success: function (data) {
				
				ko.utils.arrayForEach(data, function(item) {
					vm.displayedItems.push({
						feed: item.feed,
						description: item.description,
						title: item.title,
						timestamp: item.pubDate,
						author: item.author,
						id: item._id,
						read: item.readBy ?   '':'read-article',
						favorite: item.starredBy ?  'norm-icon':'fav-icon'
					});
					
					if(vm.displayedItems()[vm.displayedItems().length-1].favorite == 'fav-icon')
						vm.bookmarkedArray.push(vm.displayedItems()[vm.displayedItems().length-1]);
				});
			}
		});
	}
	
    vm.changePassword = function (data, event) {
    
        if (vm.newPass() == vm.reNewPass()) { 
            var json = {
                            curPassword: vm.curPass(),
                            newPassword: vm.newPass()
                        };
                        
            $.ajax({
                url: urlBase + 'user/' + vm.user().username,
                dataType: "json",
                type: 'PUT',
                cache: false,
                data: json,
				error: function (data) {
					console.log('test');
				}
            });
        }
        
        vm.curPass('');
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

	getUserInfo();
}

(function ($, window, document) {
    $(document).ready(function () {

        window.swcvm = new SimpleWebClientViewModel();
        ko.applyBindings(swcvm);
		$('#link-a').tooltip({
			placement: 'left'
		});
		$('#settings-a').tooltip({
			placement: 'top'
		});
		$('#refresh-a').tooltip({
			placement: 'right'
		});
		
    });
    
    $('#myTab a[href="#login"]').click(function (e) {
      e.preventDefault();
      $(this).tab('show');
    });
    
    $('#myTab a[href="#register"]').click(function (e) {
      e.preventDefault();
      $(this).tab('show');
    })
}($, window, document));

