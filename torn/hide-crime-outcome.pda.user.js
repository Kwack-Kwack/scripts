// ==UserScript==
// @name         Hide Crime Outcome
// @namespace    dev.kwack.torn.hide-crime-results
// @version      0.0.3
// @description  Hides the crime outcome panel for quick clicking. Quick and dirty script
// @author       Kwack [2190604]
// @match        https://www.torn.com/loader.php?sid=crimes*
// @grant        GM_addStyle
// @run-at 		 document-end
// ==/UserScript==

(() => {
	GM_addStyle(`
		[class*=outcomePanel_] {
    		display: none;
		}
`);
})();
