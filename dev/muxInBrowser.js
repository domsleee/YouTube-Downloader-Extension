var $video = $("video");
var vidQual = qualities.items.listMatches("val", 48000)[0];
var audQual = qualities.items.listMatches("val", 5)[0];
var $vid   = $("source", {
	src: vidQual.src,
	type: "video/mp4"
});
var $aud   = $("source", {
	src: audQual.src,
	type: "audio/mp4"
});

$video.append($vid).append($aud);
$video.attr("id", "pie");
$video.css("z-index", 500);
$("body").append($video);
$("#pie").attr("url", $("#pie").attr("src"));

var url = $("#pie").attr("url");

console.log(url);
var xhr = new XMLHttpRequest();
xhr.open('GET', url, true);
xhr.responseType = 'blob';
xhr.onload = function(e) {
  if (this.status == 200) {
    var myBlob = this.response;
    console.log("WE DID IT");
    console.log(myBlob);
    // myBlob is now the blob that the object URL pointed to.
  }
};
xhr.send();