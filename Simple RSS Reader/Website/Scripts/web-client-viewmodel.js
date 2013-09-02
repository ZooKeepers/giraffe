
function SimpleWebClientViewModel() {
    
}

(function ($, window, document) {
    $(document).ready(function () {

        window.swcvm = new SimpleWebClientViewModel();
        ko.applyBindings(swcvm);
		
    });
}($, window, document));