// ==UserScript==
// @name         Forum Hide
// @namespace    dev.kwack.torn.forum-hide
// @version      1.0.0
// @description  Hides content from the forums, very quick and dirty
// @author       Kwack [2190604]
// @match        https://www.torn.com/forums.php
// @grant		 GM_registerMenuCommand
// @grant        GM_addStyle
// @run-at 		 document-end
// ==/UserScript==

GM_addStyle(`
	body.kw-forum-hide-images .post-container img {
		display: none !important;
	}
`)

if (typeof GM_registerMenuCommand === "function") {
	GM_registerMenuCommand("Toggle images", () => {
		document.body.classList.toggle("kw-forum-hide-images")
	});
}