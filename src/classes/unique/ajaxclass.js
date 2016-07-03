// Isolates the async functions from the modules

function AjaxClass() {
}

AjaxClass.prototype = {
	request: function(params) {
		$.ajax(params);
	},
	getResponseHeader: function(xhr, text, jqXHR, type) {
		var value = jqXHR.getResponseHeader(type) || 0;

		// Return the value
		return value;
	}
}