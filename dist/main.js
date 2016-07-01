// src/prototypes.js
// =================================================
// These are functions that are references throughout
// the script that perform useful tasks

// Set JSON localstorage
Storage.prototype.setObject = function(key, value) {
    this.setItem(key, JSON.stringify(value));
};

// Retrieve JSON localstorage
Storage.prototype.getObject = function(key) {
    var value = this.getItem(key);
    return value && JSON.parse(value);
};

// Get the setting from an encoded URL string
String.prototype.getSetting = function(setting, index) {
    index = index*2-1 || 1;
    var val = false;
    var regex = new RegExp("(?:\\?|&|^|,)"+setting+"=([^&|,]*)", "g");
    var split = this.split(regex);
    if (split.length > index) {
        val = split[index];
    }

    return val;
};

String.prototype.setSetting = function(setting, value) {
    var newString = this;
    var hasQuestionMark = (newString.indexOf("?") !== -1);
    if (!hasQuestionMark) {
        newString += "?";

    // Search for setting, delete it if it exists
    } else {
        var search = newString.split(setting+"=");
        if (search.length > 1) {
            search[1] = search[1].replace(/[^\&]*/, "");
            newString = search.join("");
        }
    }

    // Append the setting on the end
    var ampersand = (hasQuestionMark) ? "&" : "";
    newString += ampersand + setting + "=" + value;

    // Remove multiple ampersand
    newString = newString.replace(/&{2,}/g, "&");

    return newString;
};

// Return the indexes of records with specified value
Array.prototype.listIndexOf = function(property, value) {
    var indexes = [];

    // If the value exists
    if (typeof(value) !== "undefined") {
        value = value.toString();
        for (var i = 0; i<this.length; i++) {
            var str = (this[i][property]) ? this[i][property].toString() : "";
            if (str === value) {
                indexes.push(i);
            }
        }
    }

    return indexes;
};

// Return the records with specified value
Array.prototype.listMatches = function(property, value){
    var indexes = this.listIndexOf(property, value);
    var values = [];
    for (var i = 0; i<indexes.length; i++){
        values.push(this[indexes[i]]);
    }

    return values;
};

// Assert function
function assert(condition, message) {
    var context = "Youtube Downloader - ";
    if (!condition) {
        message = message || "Assertion failed";
        if (typeof Error !== "undefined") {
            throw new Error(context + message);
        }
        throw message; // Fallback
    }
}

// Adds useful prototyping functions for jQuery objects
$.fn.extend({
    toggleState: function(){
        if ($(this).hasClass("disabled")){
            $(this).removeClass("disabled");
        } else {
            $(this).addClass("disabled");
        }
    },
    onState: function(){
        if ($(this).hasClass("disabled")){
            $(this).html("");
            $(this).removeClass("disabled");
            $(this).append($downloadIcon).append($("<span>", {
                html:"Download",
                class:"midalign"
            }));
        }
    },
});

// src/classes/display.js
// =================================================
// Generates the display, updates the display, all
// things related to the interface can be found here

function Display() {
    // The text colour of the size once loaded
    this.SIZE_LOADED = "red";

    // The text colour of the size when waiting on audio size
    this.SIZE_WAITING = "green";

    // Sprites
    // Download icon (with cloud)
    this.$downloadIcon = $("<img>", {
        style:"margin-right:4.5px",
        class:'midalign',
        src:chrome.extension.getURL("imgs/downIconSmall.png")
    });
    // Down select arrow (for dropdown)
    this.$downArrow = $("<img>", {
        style:"margin-left:6px;",
        class:'midalign',
        src:"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAAV0lEQVQoU2NkIBEwkqiegXQNc+fOTWBkZJxPjE3///9PBNtAjCaQ4uTk5AVwJ+HTBFMMMhzFD9g0ISvG0IDuPHTFWDXANIFokJvRA4P0YCUmOJHVkGwDAPVTKkQsO0MlAAAAAElFTkSuQmCC"
    });
}

Display.prototype = {
    update: function() {
        var _this = this;
        var sizes = qualities.sizes;

        // Main window
        var $downloadBtnInfo = $("#downloadBtnInfo");
        sizes.getSize($downloadBtnInfo.find("span:eq(0)"), function($span, size) {
            _this.updateDisplay($span, size, true);
        });

        // Drop down list
        $lis = $("#options").find("li");
        for (var i = 0; i<$lis.length; i++) {
            sizes.getSize($lis.eq(i), function($li, size) {
                _this.updateDisplay($li, size);
            });
        }
    },
    // Initialises the display
    initOptions: function(qualities, $downloadBtnInfo) {
        // Fallback for setting to top value
        var $topEl = false;
        var qualitySet = false;

        // Reset
        this.updateInfo(false);
        $options = $("<ul>", {
            id:"options",
            class:"unselectable",
            style:"display:none;position:absolute"
        });

        for (i = 0; i<qualities.items.length; i++) {
            var quality = qualities.items[i];
            var display = (quality.hidden) ? "none" : "inherit";
            $li = $("<li>", {
                html:quality.text,
                value:quality.val,
                url:quality.url,
                type:quality.type,
                label:quality.label,
                style:"display:"+display,
                dash:quality.dash,
                muted:quality.muted,
                mp3:quality.mp3,
                size:quality.size
            });

            // Tags - get them and then append them to the $li
            $tags = this.getTags($li);
            for (var j = 0; j<$tags.length; j++) {
                $li.append($tags[j]);
            }

            // Add the $li to the $options
            $options.append($li);

            // Add the first as a fallback
            if (!$topEl) $topEl = $li;

            // If it matches the set quality, assign it to the info box
            var sameQuality = (Number($li.attr("value")) === global_settings.quality);
            var sameType    = ($li.attr("type") === global_settings.type);
            if (sameQuality && sameType) {
                $topEl = $li;
            }
        }

        // Update the top panel with the top element
        this.updateInfo($topEl);

        // Prepend options if necessary
        if ($("#options").length === 0 && $options) {
            $("#downloadBtnCont").append($options);
        }
    },
    // Updates the display
    updateDisplay: function($li, size, forceNeutralFloat) {
        var sizes = qualities.sizes;

        // Attempt to obtain the size from the qualities values
        var matchedQualities = qualities.items.listMatches("val", $li.attr("value"));
        if (matchedQualities.length > 0) {
            matchedQualities[0].size = size;
        }

        var _this = this;
        var color = ($li.attr("dash") === "true") ? this.SIZE_WAITING : this.SIZE_LOADED;

        // If the SIZE tag doesn't already exist, add it
        var extraClass = (forceNeutralFloat) ? " floatNormal" : "";
        $spanSize = $li.find("span.size");

        // Add it if it doesn't exist
        if ($spanSize.length === 0) {
            $spanSize = $("<span>", {
                style:"color:"+color,
                class:"size ignoreMouse"+extraClass
            });
            $li.append($spanSize);
        }

        $spanSize.html(sizes.formatSize(size));

        // If it is of the DASH format
        if ($li.attr("dash") === "true") {
            if (global_properties.audio_size) {
                // Let the size be the sum of the size and the audio size
                size = parseInt(size) + parseInt(global_properties.audio_size);

                $li.find("span.size").html(sizes.formatSize(size));
                $li.find("span.size").css("color", this.SIZE_LOADED);
                $li.attr("size", size);

            } else {
                // Try again in 2 seconds
                setTimeout(function() {
                    _this.updateDisplay($li, size);
                }, 2000);
            }
        }
    },

    //Returns a jquery element of the download button with a certain text
    updateDownloadButton: function (text, disabled) {
        // Create the download button container
        var $container = this.checkContainer();

        // Determine if it is of the disabled class
        var disabledText = (disabled) ? " disabled" : "";

        // Create the button if it doesn't exist
        var $button = $container.find("#downloadBtn");
        if ($button.length === 0) {
            $button = $("<button>", {
                id:"downloadBtn"
            });
            $button.append(this.$downloadIcon);
            $button.append($("<span>", {
                class:"midalign"
            }));

            // Append it to the container
            $container.append($button);
        }

        // Update the properties
        $button.attr("class", disabledText);
        $button.find("span").html(text);
    },

    // Update the downloadBtnInfo (top, non drop-down)
    updateInfo: function ($li) {
        var $downloadBtnInfo = $("#downloadBtnInfo");

        // Add it if it doesn't exist
        if ($downloadBtnInfo.length === 0) {
            $downloadBtnInfo = $("<span>", {
                id:"downloadBtnInfo"
            }).append(this.$downArrow);

            // Find the container
            var $container = this.checkContainer();

            // Append it to the container
            $container.append($downloadBtnInfo);
        }

        // If an element was passed, prepend it
        if ($li) {
            $span = $downloadBtnInfo.find("span:eq(0)");
            if ($span.length === 0) {
                $span = $("<span>");

                // Prepend the new element
                $downloadBtnInfo.prepend($span);
            }

            // Set the span ATTRIBUTES
            $span.attr({
                "label":$li.attr("label"),
                "url"  :$li.attr("url"),
                "type" :$li.attr("type"),
                "dash" :$li.attr("dash"),
                "muted":$li.attr("muted"),
                "mp3"  :$li.attr("mp3"),
                "value":$li.attr("value")
            });

            var $child = $span.find("span.text");
            if ($child.length === 0) {
                $child = $("<span>", {
                    class:"text"
                });
                $span.append($child);
            }

            // Set the span HTML
            $child.html($span.attr("label"));
        }
    },

    // Fetch the container if it exists, otherwise make it
    checkContainer: function() {
        var $container = $("#downloadBtnCont");
        if ($container.length === 0) {
            $container = $("<span>", {
                id:"downloadBtnCont",
                class:"unselectable"
            });

            $("#watch7-subscription-container").append($container);
        }

        return $container;
    },
    getTags: function($li) {
        $tags = [];
        $tags.push($("<span>", {
            class:"tag ignoreMouse",
            html:$li.attr("type")
        }));

        var dash = $li.attr("dash");
        if (dash && dash !== "false") {
            $tags.push($("<span>", {
                class:"tag ignoreMouse",
                html:"DASH"
            }));
        }

        var muted = $li.attr("muted");
        if (muted && muted !== "false") {
            $tags.push($("<span>", {
                class:"tag ignoreMouse",
                html:"MUTED"
            }));
        }

        return $tags;
    }
};

// src/classes/download.js
// =================================================
// Functions that are used to download the video and audio
// files

function Download() {
    // Construct
}

Download.prototype = {
    // Download the file
    getVid: function($span, title) {
        var type = $span.attr("type");
        var dash = ($span.attr("dash") === "true") ? true : false;

        var title = title || this.getTitle($span.attr("label"));
        var name = title;
        var url = $span.attr("url").setSetting("title", encodeURIComponent(title));

        // Save to disk
        this.saveToDisk(url, name+"."+type);

        // If it requires audio, download it
        if (dash) {
            this.handleAudio(name);
        }

        // Re-enable the button after 0.5 seconds
        setTimeout(function() {
            display.updateDownloadButton("Download");
        }, 500);
    },
    getTitle: function(label) {
        var label = (label) ? label : "";
        var str = $("title").html().split(" - YouTube")[0].replace(/"|'|\?|:|\%/g, "").replace(/\*/g, '-');
        if (global_settings.label) str = str+" "+label.toString();
        str = str.replace(/\:|\?|\|/g, "");
        return str;
    },
    // Download audio if required
    handleAudio: function(name) {
        // Download the audio file
        this.getVid($("#options").find("li[type=m4a]"), name+" Audio");

        // Download the script

        /*
        var os = GetOs();
        var text = MakeScript(settings.title, type, "m4a", "mp4", os);
        settings.type = os.scriptType;
        if (os.os === 'win'){
            SaveToDisk(URL.createObjectURL(text), settings);
        } else {
            SaveToDisk("https://github.com/Domination9987/YouTube-Downloader/raw/master/muxer/Muxer.zip", settings);
        }*/
    },
    getOs: function() {
        var os = (navigator.appVersion.indexOf("Win") !== -1) ? "win" : "mac";
        var scriptType = (os === "win") ? "bat" : "command";
        return {os:os, scriptType:scriptType};
    },
    saveToDisk: function(url, name) {
        console.log("Trying to download:", url);
        chrome.runtime.sendMessage({
            method: "download",
            url: url,
            filename: name
        });
    },

    // Saves using the old method
    // NOTE: Does not work for audio or DASH formats
    //       will download as "videoplayback"
    fallbackSave: function(url) {
        var save = document.createElement('a');
        save.target = "_blank";
        save.download = true;
        console.log(decodeURIComponent(url));
        save.href = url;
        (document.body || document.documentElement).appendChild(save);
        save.onclick = function() {
            (document.body || document.documentElement).removeChild(save);
        };
        save.click();
    }
}

// src/classes/qualities.js
// =================================================
// This class handles the qualities that can be downloaded
// This class also manages the the display of qualities (both
// the top quality and the list of qualities)

function Qualities() {
	this.items = [];
	this.sizes = new GetSizes();

	this.itags = {
		5: {
			type:"flv"
		},
		17: {
			resolution:144,
			type:"3gpp"
		},
		18: {
			resolution:360,
			type:"mp4"
		},
		22: {
			resolution:720,
			type:"mp4"
		},
		36: {
			resolution:180,
			type:"3gpp"
		},
		43: {
			resolution:360,
			type:"webm"
		},
		133: {
			resolution:240,
			type:"mp4",
			muted:true
		},
		134: {
			resolution:360,
			type:"mp4",
			muted:true
		},
		135: {
			resolution:480,
			type:"mp4",
			muted:true
		},
		136: {
			resolution:720,
			type:"mp4",
			muted:true
		},
		137: {
			resolution:1080,
			type:"mp4",
			dash:true
		},
		140: {
			audio:true,
			type:"mp4"
		},
		160: {
			resolution:144,
			type:"mp4",
			muted:true
		},
		171: {
			audio:true,
			type:"webm",
		},
		242: {
			resolution:240,
			type:"webm",
			muted:true
		},
		243: {
			resolution:360,
			type:"webm",
			muted:true
		},
		244: {
			resolution:480,
			type:"webm",
			dash:true
		},
		247: {
			resolution:720,
			type:"webm",
			muted:true
		},
		248: {
			resolution:1080,
			type:"webm",
			muted:true
		},
		249: {
			audio:true,
			type:"webm",
		},
		250: {
			audio:true,
			type:"webm",
		},
		251: {
			audio:true,
			type:"webm",
		},
		278: {
			resolution:140,
			type:"webm",
			muted:true
		},
		298: {
			resolution:720,
			fps:60,
			type:"mp4",
			dash:true
		},
		299: {
			resolution:1080,
			fps:60,
			type:"mp4",
			dash:true
		},
		302: {
			resolution:720,
			fps:60,
			type:"webm",
			muted:true
		},
		303: {
			resolution:1080,
			fps:60,
			type:"webm",
			muted:true
		}
	}
}

Qualities.prototype = {
	reset: function() {
		this.items = [];
	},
	initialise: function() {
		this.reset();
		var ytplayer  = window.ytplayer;
		var potential = ytplayer.config.args.adaptive_fmts + ytplayer.config.args.url_encoded_fmt_stream_map;

		var i = 1;
		var url = decodeURIComponent(potential.getSetting("url", i));
		while (url !== "false") {
			url = url.split(",")[0];
			var oldURL = url;
			var s = url.getSetting("s") || potential.getSetting("s", i);
			url = signature.decryptSignature(url, s);
			var type = decodeURIComponent(url.getSetting("mime"));
			var clen = url.getSetting("clen") || potential.getSetting("clen", i);
			var itag = parseInt(url.getSetting("itag"), 10);
			var size = false;

			// Get data from the ITAG identifier
			var tag = this.itags[itag] || {};

			// Get the value from the tag
			var val = this.getVal(tag);

			// Get the label from the tag
			var label = this.getLabel(tag);

			// If we have content-length, we can find size IMMEDIATELY
			if (clen !== "false") {
				size = parseInt(clen);
			}

			// Get the type from the tag
			assert(type.split("/").length > 1, "Incorrect type: "+type);
			var newType = type.split("/")[1].split(",")[0];
			if (newType !== tag.type) {
				console.log("Error with "+itag+", "+newType+"!="+tag.type);
				console.log(decodeURIComponent(url));
			}

			// Fix the types
			if (newType === "mp4" && tag.audio) {
				tag.type = "m4a";
			}
			if (newType === "mp4" && tag.dash) {
				tag.type = "m4v";
			}

			// Append to qualities (if it shouldn't be ignored)
			var item = {
				itag:itag,
				url:url,
				size:size,
				type:tag.type,
				dash:tag.dash || false,
				muted:tag.muted || false,
				label:label,
				text:label,
				audio:tag.url || false,
				val:val,
			};
			if (this.checkValid(item)) {
				this.items.push(item);
			}

			// If it is the audio url - find the size and update
			if (tag.type === "m4a" && tag.audio) {
				var $li = $("<li>", {
					url:url,
					value:val,
				});

				this.sizes.getSize($li, function($li, size) {
					global_properties.audio_size = size;
				});
			}

			// Move on to the next item
			i++;
			url = decodeURIComponent(potential.getSetting("url", i));
		}
	},
	getLabel: function(tag) {
		var label = false;
		tag = tag || {};
		if (tag.resolution) {
			label = tag.resolution.toString()+"p";
			if (tag.fps) {
				label += tag.fps.toString();
			}
		} else if (tag.audio) {
			label = "Audio";
		}

		return label;
	},
	getVal: function(tag) {
		// Base value is the resolution OR 0
		var val = tag.resolution || 0;

		// Multiply if it has an fps tag (high frame rate)
		if (tag.fps >= 30) {
			val *= 100;
		}

		// Multiply if it is mp4
		if (tag.type === "mp4") {
			val *= 100;
		}

		// Make it negative if it's audio
		if (tag.audio) {
			val -= 5;
			val *= -1;
		}

		return val;
	},

	sortItems: function() {
		var _this = this;
		this.items.sort(_this.sortDescending);
	},
	sortDescending: function(a, b) {
		if (isNaN(a.val)) a.val = 0;
		if (isNaN(b.val)) b.val = 0;
		return Number(b.val) - Number(a.val);
	},

	// Check if the item should be ignored or not
	checkValid: function(item) {
		var valid = true;

		// If it is muted and we are ignoring muted
		if (global_settings.ignoreMuted && item.muted) {
			valid = false;
		}

		// If it matches a blacklisted type
		if (global_settings.ignoreTypes.indexOf(item.type) !== -1) {
			valid = false;
		}

		// If it matches a blacklisted value
		if (global_settings.ignoreVals.indexOf(item.val) !== -1) {
			valid = false;
		}

		return valid;
	}
};

// src/classes/qualities/getSizes.js
// =================================================
// Obtains the sizes of each of the urls, adding
// the "size" attribute to each li element, and setting
// the size in kb/mb/gb etc on each element

function GetSizes() {
    this.SIZE_DP = 1;
    // No inherit properties
}

GetSizes.prototype = {
    getSize: function($li, callback) {
        var url = $li.attr("url");

        // Attempt to obtain the size from the qualities values
        var matchedQualities = qualities.items.listMatches("val", $li.attr("value"));
        var size = (matchedQualities.length > 0) ? matchedQualities[0].size : false;

        if (size) {
            callback($li, size);
        } else {
            // We must make a cross-domain request to determine the size from the return headers...
            $.ajax({
                type:"HEAD",
                async:true,
                url:url,
                success:function(xhr, text, jqXHR) {
                    var clen = jqXHR.getResponseHeader("Content-Length") || 0;
                    callback($li, clen);
                },
                error:function(xhr) {
                    throw new Error("There as been a problem requesting the size");
                }
            });
        }
    },

    // Takes the input in bytes, and returns a formatted string
    formatSize: function(size) {
        size = parseInt(size, 10);
        var sizes = {
            GB:Math.pow(1024,3),
            MB:Math.pow(1024,2),
            KB:Math.pow(1024,1),
        };

        // Default of 0MB
        var returnSize = "0MB";

        for (sizeFormat in sizes){
            if (sizes.hasOwnProperty(sizeFormat)) {
                var minSize = sizes[sizeFormat];
                if (size > minSize) {
                    returnSize = (size/minSize).toFixed(this.SIZE_DP) + sizeFormat;
                    break;
                }
            }
        }

        // Return the string of return size
        return returnSize;
    }
}

// src/classes/signature.js
// =================================================
// Gets the signature code from YouTube in order
// to be able to correctly decrypt direct urls
// USES: ytplayer.config.assets.js

function Signature() {
    // constructor
}

Signature.prototype = {
    fetchSignatureScript: function(callback) {
        var ytplayer  = window.ytplayer;
        var scriptURL = this.getScriptURL(ytplayer.config.assets.js);

        // If it's only positive, it's wrong
        if (!/,0,|^0,|,0$|\-/.test(global_settings.signature_decrypt)) {
            global_settings.signature_decrypt = null;
        }
        console.log(scriptURL);

        var _this = this;
        $.ajax({
            method:"GET",
            url:scriptURL,
            success:function(response) {
                _this.findSignatureCode(response);
                callback();
            },
            error:function(response) {
                assert(false, "Error obtaining signature script");
            }
        });
    },
    getScriptURL: function(scriptURL) {
        var split = scriptURL.split("//");
        if (split[0] === "") {
            split.shift();
            scriptURL = window.location.href.split(":")[0] + "://" + split.join("//");
        }

        return scriptURL;
    },
    isInteger: function(n) {
        return (typeof n==='number' && n%1==0);
    },
    findSignatureCode: function(sourceCode) {
        // Signature function name
        var sigCodes = [
            this.regMatch(sourceCode, /\.set\s*\("signature"\s*,\s*([a-zA-Z0-9_$][\w$]*)\(/),
            this.regMatch(sourceCode, /\.sig\s*\|\|\s*([a-zA-Z0-9_$][\w$]*)\(/),
            this.regMatch(sourceCode, /\.signature\s*=\s*([a-zA-Z_$][\w$]*)\([a-zA-Z_$][\w$]*\)/)
        ];

        var sigFuncName = this.getFirstValid(sigCodes);
        var binary = [];
        binary.push(sourceCode);
        //SaveToDisk(URL.createObjectURL(new Blob(binary, {type: "application/js"})), {title:"hi", type:".js"});
        assert(sigFuncName !== null, "Signature function name not found!");


        // Regcode (1,2) - used for functionCode
        var regCodes = [
            this.regMatch(sourceCode, sigFuncName + '\\s*=\\s*function' +
            '\\s*\\([\\w$]*\\)\\s*{[\\w$]*=[\\w$]*\\.split\\(""\\);\n*(.+);return [\\w$]*\\.join'),
            this.regMatch(sourceCode, 'function \\s*' + sigFuncName +
            '\\s*\\([\\w$]*\\)\\s*{[\\w$]*=[\\w$]*\\.split\\(""\\);\n*(.+);return [\\w$]*\\.join')
        ];

        var funcCode = this.getFirstValid(regCodes);

        // Slice function name
        var sliceFuncName = this.regMatch(sourceCode, /([\w$]*)\s*:\s*function\s*\(\s*[\w$]*\s*,\s*[\w$]*\s*\)\s*{\s*(?:return\s*)?[\w$]*\.(?:slice|splice)\(.+\)\s*}/);

        // Reverse function name
        var reverseFuncName = this.regMatch(sourceCode, /([\w$]*)\s*:\s*function\s*\(\s*[\w$]*\s*\)\s*{\s*(?:return\s*)?[\w$]*\.reverse\s*\(\s*\)\s*}/);

        // Possible methods
        var methods = {
            slice:   '\\.(?:'+'slice'+(sliceFuncName?'|'+sliceFuncName:'')+
                     ')\\s*\\(\\s*(?:[a-zA-Z_$][\\w$]*\\s*,)?\\s*([0-9]+)\\s*\\)',
            reverse: '\\.(?:'+'reverse'+(reverseFuncName?'|'+reverseFuncName:'')+
                     ')\\s*\\([^\\)]*\\)',
            swap:    '[\\w$]+\\s*\\(\\s*[\\w$]+\\s*,\\s*([0-9]+)\\s*\\)',
            inline:  '[\\w$]+\\[0\\]\\s*=\\s*[\\w$]+\\[([0-9]+)\\s*%\\s*[\\w$]+\\.length\\]'
        };

        var decodeArray = [];
        var codeLines = funcCode.split(';');
        for (var i = 0; i<codeLines.length; i++) {
            var codeLine = codeLines[i].trim();

            if (codeLine.length > 0) {
                var arrSlice   = codeLine.match(methods.slice);
                var arrReverse = codeLine.match(methods.reverse);

                // Use slice method
                if (arrSlice && arrSlice.length >= 2) {
                    var slice = parseInt(arrSlice[1], 10);
                    assert(this.isInteger(slice), "Not integer");
                    decodeArray.push(-slice);

                // Reverse
                } else if (arrReverse && arrReverse.length >= 1) {
                    decodeArray.push(0);

                // Inline swap
                } else if (codeLine.indexOf('[0]') >= 0) { // inline swap
                    var nextLine = codeLines[i+1].trim();
                    var hasLength = (nextLine.indexOf(".length") >= 0);
                    var hasZero =   (nextLine.indexOf("[0]") >= 0);

                    if (nextLine && hasLength && hasZero) {
                        var inline = this.regMatch(nextLine, methods.inline);
                        inline = parseInt(inline, 10);
                        decodeArray.push(inline);
                        i += 2;
                    }

                // Swap
                } else if (codeLine.indexOf(',') >= 0) {
                    var swap = this.regMatch(codeLine, methods.swap);
                    swap = parseInt(swap, 10);
                    assert(this.isInteger(swap) && swap > 0)
                    decodeArray.push(swap);
                }
            }
        }

        // Make sure it is a valid signature
        assert(this.isValidSignatureCode(decodeArray));

        global_settings.signature_decrypt = decodeArray;
        UpdateGlobalSettings();
    },
    isValidSignatureCode: function(arr) {
        var valid = false;
        var length = arr.length;
        if (length > 1) {
            valid = true;

            // Ensure that every value is an INTEGER
            for (var i = 0; i<length; i++) {
                if (!this.isInteger(parseInt(arr[i],10))) {
                    valid = false;
                }
            }
        }

        return valid;
    },
    regMatch: function(string, regex) {
        if (typeof(regex) === "string") {
            regex = new RegExp(regex);
        }

        var result = regex.exec(string);
        if (result) {
            result = result[1];
        }

        return result;
    },
    getFirstValid: function(arr) {
        var val = null;
        for (var i = 0; i<arr.length; i++) {
            if (arr[i]) {
                val = arr[i];
                break;
            }
        }

        return val;
    },
    decryptSignature: function(url, s) {
        function swap(a, b) {
            var c = a[0];
            a[0] = a[b%a.length];
            a[b] = c;
            return a
        };
        function decode(sig, arr) { // encoded decryption
            var sigA = sig.split("");
            for (var i = 0; i<arr.length; i++) {
                var act = arr[i];
                sigA = (act>0)?swap(sigA, act):((act==0)?sigA.reverse():sigA.slice(-act));
            }

            var result = sigA.join("");
            return result;
        }

        url = decodeURIComponent(url);
        var sig = url.getSetting("signature") || url.getSetting("sig");

        // Decryption is only required if signature is non-existant AND
        // there is an encrypted property (s)
        if (!sig) {
            assert(s !== "false" || !s, "S attribute not found!");
            sig = decode(s, global_settings.signature_decrypt);
            url = url.setSetting("signature", sig);
        }

        url = url.setSetting("ratebypass", "yes");
        assert(url.getSetting("signature"), "URL does not have signature!");

        return url;
    }
};

// src/classes/unsafe.js
// =================================================
function Unsafe() {
	this.id = 0;
}

Unsafe.prototype = {
	getVariable: function(name, callback) {
		var script = "(function() {"+
			"setTimeout(function(){"+
				"var event = document.createEvent(\"CustomEvent\");"+
				"var val = (typeof "+name+" !== 'undefined') ? "+name+" : false;"+
				"event.initCustomEvent(\""+name+"\", true, true, {\"passback\":JSON.stringify(val)});"+
				"window.dispatchEvent(event);"+
			"},100);"+
		"})()";

		// Inject the script
		this.injectScript(script, name, function(obj) {
			var passback = obj.detail.passback || {};
			callback(JSON.parse(passback));
		});
	},	

	injectScript: function(script, name, callback) {
		//Listen for the script return
		var myFunc = function(e) {
			window.removeEventListener(name, myFunc);
			callback(e);
		};
		window.addEventListener(name, myFunc);
		this.id++;

		//Inject the script
		var s = document.createElement("script");
		s.innerText = script;
		(document.head||document.documentElement).appendChild(s);
		s.parentNode.removeChild(s);
	}
};

// src/main.js
// =================================================
//Variables
var global_settings = localStorage.getObject('global_settings') || {};
var default_setings = {         // Default settings
    quality:7200000,            // Quality selected (720p60)
    ignoreMuted:true,           // Ignore muted
    ignoreTypes:["webm"],       // Ignore webm types (muxing doesn't work atm)
    ignoreVals:[18, 22],        // Ignore values
    label:true,                 // Have quality label on download
    signature_decrypt:false     // Obtained signature pattern
};
var global_properties = {
    audio_size:false,
};

// Ensures that all global_settings are set... if not, refer to default_settings
SetupGlobalSettings();

// Objects
var signature = new Signature();
var display = new Display();
var qualities = new Qualities();
var download = new Download();
var unsafe = new Unsafe();

// Run the script ONLY if it's on the top
if (window.top === window) {
    AddEvents();
    Program();
}

// This function is run on every new page load....
function Program() {
    // Make sure it is of the correct URL
    var url = window.location.href;
    if (url.indexOf("watch") === -1) return;

    unsafe.getVariable("ytplayer", function(ytplayer) {
        // If the old thing is still there, wait a while
        ytplayer = ytplayer || {};
        if ($("#downloadBtn").length > 0 ) {
            setTimeout(Program, 2000);
            return;
        }

        // If the ytplayer variable hasn't loaded, wait a while
        window.ytplayer = ytplayer;
        if (!ytplayer || !ytplayer.config) {
            var time = window.time || 1;
            console.log("set timeout for the "+time+" time");
            window.time = time + 1
            setTimeout(Program, 500);
            return;
        }

        // Verify that the potential is LOADED, by comparing the
        // number of SIGNATURES to the number of URLs
        var potential = ytplayer.config.args.adaptive_fmts + ytplayer.config.args.url_encoded_fmt_stream_map || "";
        var urlLen = potential.split("url=").length;
        var sigLen = decodeURIComponent(potential).split(/(?:(?:&|,|\?|^)s|signature|sig)=/).length;
        if (sigLen < urlLen && sigLen > 0) {
            console.log("Signatures:", sigLen, ", URLs:", urlLen);
            setTimeout(Program, 2000);
            return;
        }

        // Get the signature (required for decrypting)
        signature.fetchSignatureScript(function() {
            // Reset global properties
            global_properties = {
                audio_size:false,
            };
            qualities.initialise();
            qualities.sortItems();

            // Update the download button, set it to be ENABLED
            // with text "Download"
            display.updateDownloadButton("Download");

            // Initialise the options & add it to the frame
            display.initOptions(qualities, $("#downloadBtnInfo"));

            // Update the display (fetch sizes as well)
            display.update();
        });
    });
}

// Adds events to the window
function AddEvents() {
    var _this = this;

    // Call the function on page change
    this.lastURL = window.location.href;
    setInterval(function() {
        var newURL = window.location.href;
        if (newURL !== _this.lastURL) {
            _this.lastURL = newURL;
            $(window).ready(function() {
                Program();
            });
        }
    }, 200);

    $(document).on("click", "#downloadBtn", function() {
        // Ensure that the button is ENABLED
        if (!$(this).hasClass("disabled")) {
            var $span = $("#downloadBtnInfo span:eq(0)");
            $(this).toggleState();
            download.getVid($span);
        }
    });

    // Toggle options on info click
    $(document).on("click", "#downloadBtnInfo", function() {
        $("#options").toggle();
    });

    // Show options on options click
    $(document).on("click", "#options li", function() {
        // Close the options
        $("#options").toggle();

        // Update the relevant settings
        global_settings.quality = Number($(this).attr("value"));
        global_settings.type    = $(this).attr("type");
        UpdateGlobalSettings();

        // Update the info
        display.updateInfo($(this));

        // Update the display
        display.update();
    });

    // Hide options on document click
    $(document).click(function(e) {
        // If it matches the info or is a child of the top info, ignore
        $el = $(e.target);
        $parent = $(e.target).parent();

        var str = $el.attr("id") + $parent.attr("id") + $parent.parent().attr("id");
        str = str || "";
        if (str.split("downloadBtnInfo").length > 1) {
            return;
        }

        // Hide the options
        $("#options").hide();
    });
}

// Global settings handling
function SetupGlobalSettings() {
    for (var key in default_setings) {
        if (default_setings.hasOwnProperty(key)) {
            if (global_settings[key] === undefined) {
                global_settings[key] = default_setings[key];
            }
        }
    }
    UpdateGlobalSettings();
}

function UpdateGlobalSettings(){
    localStorage.setObject('global_settings', global_settings);
}