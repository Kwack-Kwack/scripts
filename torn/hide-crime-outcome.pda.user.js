// ==UserScript==
// @name         Hide Crime Outcome
// @namespace    dev.kwack.torn.hide-crime-results
// @version      2.0.2
// @description  Hides the crime outcome panel for quick clicking. Quick and dirty script
// @author       Kwack [2190604]
// @match        https://www.torn.com/loader.php?sid=crimes*
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at 		 document-end
// ==/UserScript==

// I hope you like spaghetti 🍝
// Special shoutout to SpectraL1 [3118077] for both the script idea and the minimal mode

(() => {
	const SVG_SETTINGS = `<svg xmlns="http://www.w3.org/2000/svg" class="default___XXAGt " filter="" fill="#777" stroke="transparent" stroke-width="0" width="15" height="15" viewBox="0 0 23 23"><path d="M24 13.616v-3.232c-1.651-.587-2.694-.752-3.219-2.019v-.001c-.527-1.271.1-2.134.847-3.707l-2.285-2.285c-1.561.742-2.433 1.375-3.707.847h-.001c-1.269-.526-1.435-1.576-2.019-3.219h-3.232c-.582 1.635-.749 2.692-2.019 3.219h-.001c-1.271.528-2.132-.098-3.707-.847l-2.285 2.285c.745 1.568 1.375 2.434.847 3.707-.527 1.271-1.584 1.438-3.219 2.02v3.232c1.632.58 2.692.749 3.219 2.019.53 1.282-.114 2.166-.847 3.707l2.285 2.286c1.562-.743 2.434-1.375 3.707-.847h.001c1.27.526 1.436 1.579 2.019 3.219h3.232c.582-1.636.75-2.69 2.027-3.222h.001c1.262-.524 2.12.101 3.698.851l2.285-2.286c-.744-1.563-1.375-2.433-.848-3.706.527-1.271 1.588-1.44 3.221-2.021zm-12 2.384c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4z"></path></svg>`;
	const SVG_ARROW = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="44" viewBox="0 0 18 44"><path d="M0,44,15,22h3L3,44ZM15,22,0,0H3L18,22Z"></path></svg>`;
	const MODES = [
		{
			name: "Disabled",
			img: "https://i.imgur.com/HjkJgh0.gif",
			description: "Disables the script, showing the full crime outcome as normal.",
		},
		{
			name: "Hidden",
			img: "https://i.imgur.com/5R9aE46.gif",
			description: "Hides the crime outcome content completely, ideal for quickly spamming crimes.",
		},
		{
			name: "Minimal",
			img: "https://i.imgur.com/NVxfsNV.gif",
			description: "Hides only the story text, but keeps the important information",
		},
		// More coming soon...
	];

	const mutationCallback = () => {
		const header = $("div.crimes-app > div[class*=appHeader_]");
		if (header && !header?.find?.("a#kw--crimes-settings-btn")[0]) addSettingsIcon(header);

		if (!$("#kw--crimes-settings")[0]) addSettingsElement();
		// debugger;
	};
	new MutationObserver(mutationCallback).observe($("div#react-root")[0], { childList: true, subtree: true });

	/** @param {JQuery<HTMLDivElement>} header */
	const addSettingsIcon = (header) => {
		if (!header || !(header instanceof $)) return;
		const existing = header.find("a");
		header
			.children()
			.first()
			.after(
				$("<a/>", { class: existing.attr("class"), id: "kw--crimes-settings-btn" })
					.append(SVG_SETTINGS)
					.append(new Text("Hide Outcome"))
					.on("click", () => $("#kw--crimes-settings").removeClass("kw-hide"))
			);
	};

	const addSettingsElement = () => {
		let modeIndex = getSetting("mode") ?? 0;
		setMode(modeIndex); // Will trigger the class change

		const changeModeIndex = (increase) => {
			if (increase) {
				modeIndex === MODES.length - 1 ? (modeIndex = 0) : modeIndex++;
			} else {
				modeIndex === 0 ? (modeIndex = MODES.length - 1) : modeIndex--;
			}

			$("#kw--crimes-slider").css("transform", `translateX(-${modeIndex * 100}%)`);
		};
		$("body").append(
			$("<div/>", { id: "kw--crimes-settings", class: "kw-hide" })
				.append(
					$("<div/>")
						.append(
							$("<h1/>", { text: "Hide Crime Outcome" }),
							$("<div/>", { id: "kw--crimes-slider", style: `transform: translateX(-${modeIndex * 100}%)` }).append(
								...MODES.map((mode) => generateSliderPage(mode, changeModeIndex))
							),
							$("<button/>", { id: "kw--crimes-settings-save" })
								.append("Save")
								.on("click", () => {
									$("#kw--crimes-settings").addClass("kw-hide");
									setMode(modeIndex);
								})
						)
						.on("click", (e) => e.stopPropagation())
				)
				.on("click", () => $("#kw--crimes-settings").addClass("kw-hide"))
		);
	};

	const getSetting = (key) => GM_getValue(`kw.hide-outcome.settings.${key}`) ?? 0;
	const setSetting = (key, value) => GM_setValue(`kw.hide-outcome.settings.${key}`, value);

	const setMode = (modeIndex) => {
		setSetting("mode", modeIndex);
		$("body").data("kw--crimes-mode", modeIndex);
		$("body").removeClass((_, c) =>
			c
				.split(" ")
				.filter((c) => c.startsWith("kw--crimes-mode-"))
				.join(" ")
		);
		$("body").addClass("kw--crimes-mode-" + MODES[modeIndex].name.toLowerCase());
	};

	const generateSliderPage = ({ img, name }, changeModeIndex) =>
		$(`<div/>`, { class: "kw--crimes-slider-page" }).append(
			$("<button/>", { style: "transform: scaleX(-1)" })
				.on("click", () => changeModeIndex(true))
				.append($(SVG_ARROW)),
			$("<div/>").append($("<h2/>", { text: name }), $("<img/>", { src: img, alt: name })),
			$("<button/>")
				.on("click", () => changeModeIndex(false))
				.append($(SVG_ARROW))
		);

	const addStyle = () =>
		GM_addStyle(`
		#kw--crimes-settings {
			position: fixed;
			top: 0;
			right: 0;
			left: 0;
			bottom: 0;
			z-index: 99998;
			background: rgba(0, 0, 0, 0.3);
		}

		/* All buttons except the arrow buttons */
		#kw--crimes-settings button {
			color: var(--btn-color);
			background: var(--btn-background);
			cursor: pointer;
			padding: 0.5em;
		}

		#kw--crimes-settings button:hover {
			color: var(--btn-hover-color);
			background: var(--btn-hover-background);
		}

		#kw--crimes-settings > div {
			margin: 14vh auto 0;
			width: 100%;
			max-width: 600px;
			background: var(--chat-box-bg);
			z-index: 99999;
			display: flex;
			flex-direction: column;
			gap: 1rem;
			border-radius: 1rem;
			overflow: clip;
		}

		/* Reset weird TORN css */
		#kw--crimes-settings h1, #kw--crimes-settings h2 {
			margin: 0;
			padding: 0.5em;
			text-align: center;
		}

		#kw--crimes-settings h1 {
			font-size: 2rem;
			border-bottom: 3px solid var(--panel-border-bottom-color);
		}

		#kw--crimes-settings #kw--crimes-slider {
			margin: 0;
			width: 100%;
			display: flex;
			/* overflow-x: clip; */
		}

		#kw--crimes-settings #kw--crimes-slider > div.kw--crimes-slider-page {
			width: 100%;
			flex-shrink: 0;
			display: flex;
			justify-content: space-between;
			gap: 1rem;
		}

		#kw--crimes-settings #kw--crimes-slider > div.kw--crimes-slider-page > button {
			background: transparent;
			
		}

		#kw--crimes-settings #kw--crimes-slider img {
			width: 100%;
			height: auto;
		}

		#kw--crimes-settings #kw--crimes-settings-save {
			width: 100%;
			padding: 1em;
		}

		.kw-hide {
			display: none !important;
		}

		/* Outcome CSS */
		body.kw--crimes-mode-hidden [class*=outcomePanel_] {
			display: none;
		}

		body.kw--crimes-mode-minimal [class*=outcomePanel_] [class*=story_] {
			display: none;
			--icon-color: yellow;
		}
	`);
	mutationCallback();
	addStyle();
})();
