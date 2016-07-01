chrome.runtime.onMessage.addListener(function(request, sender, callback) {
    if (request.method === "download") {
    	chrome.downloads.download({
    		filename: request.filename,
    		url: request.url
    	});
    }
});