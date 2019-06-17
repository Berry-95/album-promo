HTMLCollection.prototype.forEach = Array.prototype.forEach; // Allows use of forEach on HTMLCollections

var prevWidth; // Used to check when a phone is rotated from landscape to portrait
var curPlaying = 0; // Current song queued by playAll audio element
/** List of songs, with file names and their respective booklet page **/
var songs = [
	{ name: "Track01", page : 2 },
	{ name: "Track02", page : 3 },
	{ name: "Track03", page : 3 },
	{ name: "Track04", page : 4 },
	{ name: "Track05", page : 6 },
	{ name: "Track06", page : 6 },
	{ name: "Track07", page : 7 },
	{ name: "Track08", page : 7 },
	{ name: "Track09", page : 8 },
	{ name: "Track10", page : 10 },
	{ name: "Track11", page : 11 },
	{ name: "Track12", page : 11 },
	{ name: "Track13", page : 13 },
	{ name: "Track14", page : 14 },
	{ name: "Track15", page : 15 }
];

var isMobile //True when initial viewport is less than 768px wide

function loadApp() {
	// Flipbook
	var flipbook = $('.flipbook');

	// Check if the CSS was already loaded
	if (flipbook.width()==0 || flipbook.height()==0) {
		setTimeout(loadApp, 10);
		return;
	}

	var clientWidth = document.body.clientWidth;
	isMobile = (clientWidth < 768);
	var isTouch = isTouchDevice();
	var isSafari = (window.safari !== undefined);
	prevWidth = clientWidth;
	
	// Playall audio magic
	var playAll = document.getElementById('playAll');
	// On song end, play next song
	playAll.addEventListener('ended', function() { nextSong(playAll); });
	// On play turn to page, pause all other audio and update label
	playAll.addEventListener('play', function() {
			turnToSongPage(curPlaying);
			pauseAllOtherPlayback(playAll);
			updateSongTitle(true);
		});
	// On pause update label
	playAll.addEventListener('pause', function() {
			updateSongTitle(false);
		});

	// Create the flipbook
	flipbook.turn({
			// Elevation
			elevation: 50,
			// Enable hardware acceleration when using touch device or safari
			acceleration: isTouch || isSafari,
			// Enable gradients when not using touch device or safari
			gradients: !isTouch && !isSafari,
			// Auto center
			autoCenter: true,
			// Set Duration to 0 if using touch device or safari
			duration: (isTouch || isSafari) ? 0 : 600,
			//Display 2 pages
			display: 'double'
	});
	
	// Remove zoom icon on touch devices as panning only seems to work on desktop
	if (isTouch) {
		$('#zoom').remove();
	}

	// Update page numbers on page turn
	flipbook.bind("turning", function(event, page, view) {
		if (view[0] > 0 && view[1] > 0) {
			$(".page-num").html(view[0] + "-" + view[1] + " / " + flipbook.turn("pages"));
		} else {
			$(".page-num").html(page + " / " + flipbook.turn("pages"));
		}
	});

	// Resize flipbook on window resize
	$(window).resize(function() {
		resizeFlipbook();
	});
	
	// Remove loading icon
	$('#loading').remove();

	// Display and size booklet (responsive)
	$('.flipbook-viewport').removeClass("d-none");
	resizeFlipbook();

	$('.flipbook-viewport').zoom({
		flipbook: flipbook
	});
	
	// Disable effects if on mobile
	flipbook.turn("disable", isMobile);

	// Enable swiping between pages
	$('.flipbook-viewport').bind("zoom.swipeLeft", function(e) {
		flipbook.turn("disable", false);
		$('.flipbook').turn("next");
		flipbook.turn("disable", isMobile);
	});
	$('.flipbook-viewport').bind("zoom.swipeRight", function(e) {
		flipbook.turn("disable", false);
		$('.flipbook').turn("previous");
		flipbook.turn("disable", isMobile);
	});

	// $('.flipbook-viewport').bind("zoom.tap", function(e) { zoomFlipbook(e, false); });
	$('#zoom').click(function(e) { zoomFlipbook({x: 0, y:0}, false) });

	/** Navbar buttons **/
	$(".first").click(function(e) {
		e.preventDefault();
		flipbook.turn("disable", false);
		flipbook.turn("page", 1);
		flipbook.turn("disable", (isMobile || $('.flipbook-viewport').zoom("value") != 1));
	});

	$(".prev").click(function(e) {
		e.preventDefault();
		flipbook.turn("disable", false);
		flipbook.turn("previous");
		flipbook.turn("disable", (isMobile || $('.flipbook-viewport').zoom("value") != 1));
	});

	$(".next").click(function(e) {
		e.preventDefault();
		flipbook.turn("disable", false);
		flipbook.turn("next");
		flipbook.turn("disable", (isMobile || $('.flipbook-viewport').zoom("value") != 1));
	});

	$(".last").click(function(e) {
		e.preventDefault();
		flipbook.turn("disable", false);
		flipbook.turn("page", flipbook.turn("pages"));
		flipbook.turn("disable", (isMobile || $('.flipbook-viewport').zoom("value") != 1));
	});

	$("#close").click(function(e) {
		e.preventDefault();
		hideBooklet();
	});

}

function resizeFlipbook() {
	var viewport = $(".flipbook-viewport");
	var flipbook = $(".flipbook");
	var page = $(".page");

	var width = viewport.width();
	var height = Math.round(width/2);
	var padded = viewport.height();

	if (height > padded) {
		height = padded;
		width = height*2;
	}

	flipbook.css('width', width + 'px');
	flipbook.css('height', height + 'px');
	flipbook.css('left', -width / 2 + 'px');
	flipbook.css('top', -height / 2 + 'px');

	page.css('width', width / 2 + 'px');
	page.css('height', height + 'px');

	flipbook.turn("size", width, height);
	flipbook.turn("resize");

	// If phone rotated landscape to portrait re-enable flipbook-viewport
	var clientWidth = document.body.clientWidth;
	if (clientWidth <= 576 && prevWidth - clientWidth > 0) {
		showBooklet();
	}
	prevWidth = clientWidth;
}

function zoomFlipbook(e, forceZoomOut) {
	 if (!forceZoomOut && $('.flipbook-viewport').zoom('value')==1) {
		$(".flipbook").turn("disable", true);
		$('.flipbook-viewport').zoom('zoomIn', e);
		$('#zoom-icon').removeClass("fa-search-plus");
		$('#zoom-icon').addClass("fa-search-minus");
	} else {
		$(".flipbook").turn("disable", false);
		$('.flipbook-viewport').zoom('zoomOut');
		$('#zoom-icon').removeClass("fa-search-minus");
		$('#zoom-icon').addClass("fa-search-plus");
	}
}

function nextSong(audio) {
	var urls = audio.getElementsByTagName('source')[0];
	if(urls.src.indexOf(songs[songs.length-1].name) == -1) {
		urls.src = urls.src.replace(songs[curPlaying].name, songs[++curPlaying].name);
		console.log(songs[curPlaying].name);
		audio.load();
		audio.play();
	} else {
		urls.src = urls.src.replace(songs[curPlaying].name, songs[0].name);
		curPlaying = 0;
		console.log(songs[curPlaying].name);
		audio.load();
	}
}

function updateSongTitle(playing) {
	$('#playing-label').html("<p>" + (playing ? "Playing: " : "Paused: ") + songs[curPlaying].name + "</p>");
}

function pauseAllOtherPlayback(exception) {
	document.getElementsByTagName('audio').forEach(function (el) {
		if(el != exception) {
			el.pause();
		}
	});
}

function turnToSongPage(songNum) {
	zoomFlipbook({x:0,y:0}, true);
	$('.flipbook').turn("disable", false);
	$('.flipbook').turn("page", songs[songNum].page);
	$('.flipbook').turn("disable", isMobile);
}

function hideBooklet() {
	var flipbook = document.getElementById("flipbook-col");
	flipbook.setAttribute("style", "display:none !important;");
	var rotate = document.getElementById("rotate-prompt");
	rotate.setAttribute("style", "display:block !important;");
}

function showBooklet() {
	var flipbook = document.getElementById("flipbook-col");
	if(flipbook.style.length > 0) {
		flipbook.setAttribute("style", "");
		var rotate = document.getElementById("rotate-prompt");
		if(rotate.style.length > 0) {
			rotate.setAttribute("style", "");
		}
	}
}

function isTouchDevice() {
	// Explicit check for mobile or tablet browser user agents
	return (navigator.userAgent.match(/Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile|MobileSafari|Mobile/i));

	/* Removed due to false flag by desktop chrome browser
	var prefixes = ' -webkit- -moz- -o- -ms- '.split(' ');
	var mq = function(query) {
		return window.matchMedia(query).matches;
	}

	if (('ontouchstart' in window) || window.TouchEvent || window.DocumentTouch && document instanceof DocumentTouch) {
	return true;
	}

	var query = ['(', prefixes.join('touch-enabled),('), 'heartz', ')'].join('');
	return mq(query);
	*/
}

// Load the turn.js HTML4 version if there's not CSS transform
yepnope({
	test : Modernizr.csstransforms,
	yep: ['lib/turn.js'],
	nope: ['lib/turn.html4.min.js'],
	both: ['lib/zoom.min.js'],
	complete: loadApp
}); 