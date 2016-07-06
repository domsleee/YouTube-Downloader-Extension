if ($(".ytp-popup").length < 2) {
	$("body").append($("<div>", {
		class:"ytp-popup ytp-contextmenu",
		style:"width:255px; height:277px; left:584px; top:268px; display:none",
		html:'<div class="ytp-panel" style="width: 255px; height: 277px;"><div class="ytp-panel-menu" role="menu" style="height: 277px;"><div class="ytp-menuitem" aria-haspopup="false" role="menuitem" tabindex="0"><div class="ytp-menuitem-label">Copy video URL</div><div class="ytp-menuitem-content"></div></div><div class="ytp-menuitem" aria-haspopup="false" role="menuitem" tabindex="0"><div class="ytp-menuitem-label">Copy video URL at current time</div><div class="ytp-menuitem-content"></div></div><div class="ytp-menuitem" aria-haspopup="false" role="menuitem" tabindex="0"><div class="ytp-menuitem-label">Copy embed code</div><div class="ytp-menuitem-content"></div></div><div class="ytp-menuitem" role="menuitemcheckbox" aria-checked="false" tabindex="0"><div class="ytp-menuitem-label">Loop</div><div class="ytp-menuitem-content"><div class="ytp-menuitem-toggle-checkbox"></div></div></div><a class="ytp-menuitem" target="_blank" role="menuitem" href="https://support.google.com/youtube/?p=report_playback"><div class="ytp-menuitem-label">Report playback issue</div><div class="ytp-menuitem-content"></div></a><div class="ytp-menuitem" aria-haspopup="false" role="menuitem" tabindex="0"><div class="ytp-menuitem-label">Copy debug info</div><div class="ytp-menuitem-content"></div></div><div class="ytp-menuitem" role="menuitem" tabindex="0"><div class="ytp-menuitem-label">Stats for nerds</div><div class="ytp-menuitem-content"></div></div><a class="ytp-menuitem" href="//www.youtube.com/html5" target="_blank" role="menuitem"><div class="ytp-menuitem-label">About the HTML5 player</div><div class="ytp-menuitem-content"></div></a></div><input class="ytp-html5-clipboard"></div>'
	}));
}

var $div = $("<div>", {
	class:"ytp-menuitem potato",
	role:"menuitem"
});
$div.attr("aria-haspopup", true);
$div.append($("<div>", {
	class:"ytp-menuitem-label",
	html:"Download"
})).append($("<div>", {
	class:"ytp-menuitem-content"
}));

// Note the - is NOT -
console.log("PREPENDED");
console.log($(".ytp-panel-menu").length);
$(".ytp-panel-menu:last").prepend($div);
setInterval(function() {
	console.log($(".ytp-panel-menu").length);
}, 1000);