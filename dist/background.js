chrome.runtime.onMessage.addListener(function(request, sender, callback) {
    if (request.method === "download") {
    	console.log("name:", request.filename);
    	chrome.downloads.download({
    		filename: request.filename,
    		url: request.url
    	});
    }
});