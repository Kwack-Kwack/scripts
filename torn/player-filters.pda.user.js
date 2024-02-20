// ==UserScript==
// @name         Player Filters
// @namespace    dev.kwack.torn.player-filters
// @version      0.0.2
// @description  Adds player filters to various userlists in Torn City
// @author       Kwack [2190604]
// @match        https://www.torn.com/*
// @icon
// @grant        none
// ==/UserScript==

// THIS SCRIPT IS STILL BEING TESTED, do NOT expect all to work perfectly.
// If you find any issues, please report them to me on Torn or Discord.

(() => {
	const STATUS_ENUM = {
		OKAY: "OKAY",
		HOSPITAL: "HOSPITAL",
		JAIL: "JAIL",
		FALLEN: "FALLEN",
		FEDERAL: "FEDERAL",
		TRAVELING: "TRAVELING",
		ABROAD: "ABROAD",
		UNKNOWN: "UNKNOWN",
	};

	const ONLINE_STATUS_ENUM = {
		ONLINE: "ONLINE",
		OFFLINE: "OFFLINE",
		IDLE: "IDLE",
		UNKNOWN: "UNKNOWN",
	};

	const FILTERS = [
		{
			check: () =>
				document.location.pathname === "/blacklist.php" || document.location.pathname === "/friendlist.php",
			table: () => $("div.content-wrapper > div.blacklist > ul.user-info-blacklist-wrap")[0],
			insertFilters: (f) => f.insertBefore($("div.content-wrapper > div.blacklist > hr")),
			rows: (t) => t.children,
			filters: {
				name: {
					type: "text",
					fn: (r) => r.find("a.user.name span.honor-text:not(.honor-text-svg)").text(),
				},
				id: {
					type: "text",
					fn: (r) =>
						r
							.find("a.user.name")
							.attr("href")
							.match(/\?XID=([\d]+)/)[1],
				},
				level: {
					type: "min-max",
					min: 1,
					max: 100,
					fn: (r) => r.find(".level")[0].lastChild.textContent.trim(),
				},
				status: {
					type: "select",
					options: STATUS_ENUM,
					fn: (r) =>
						STATUS_ENUM[r.find("div.status > span:last-child").text().trim().toUpperCase()] ??
						STATUS_ENUM.UNKNOWN,
				},
				online: {
					type: "select",
					options: ONLINE_STATUS_ENUM,
					fn: (r) =>
						ONLINE_STATUS_ENUM[
							r
								.find("ul#iconTray > .iconShow")
								.attr("title")
								.match(/<b>([\w]+)<\/b>/)[1]
								.toUpperCase()
						] ?? ONLINE_STATUS_ENUM.UNKNOWN,
				},
			},
		},
		{
			check: () => document.location.pathname === "/index.php" && $(document.body).data("abroad"),
			table: () => $("div.content-wrapper > div.travel-people > ul.users-list")[0],
			rows: (t) => t.children,
			insertFilters: (f) => f.insertAfter($("div.content-wrapper > div.info-msg-cont").last()),
			filters: {
				name: {
					type: "text",
					fn: (r) => r.find("a.user.name span.honor-text:not(.honor-text-svg)").text(),
				},
				id: {
					type: "text",
					fn: (r) =>
						r
							.find("a.user.name")
							.attr("href")
							.match(/\?XID=([\d]+)/)[1],
				},
				level: {
					type: "min-max",
					min: 1,
					max: 100,
					fn: (r) => r.find(".level")[0].lastChild.textContent.trim(),
				},
				status: {
					type: "select",
					options: Object.entries(STATUS_ENUM)
						.filter(([k]) => k !== "ABROAD" && k !== "TRAVELING" && k !== "JAIL")
						.reduce((a, [k, v]) => ((a[k] = v), a), {}),
					fn: (r) =>
						STATUS_ENUM[r.find("span.status > span:last-child").text().trim().toUpperCase()] ??
						STATUS_ENUM.UNKNOWN,
				},
				online: {
					type: "select",
					options: ONLINE_STATUS_ENUM,
					fn: (r) =>
						ONLINE_STATUS_ENUM[
							r
								.find("ul#iconTray > .iconShow")
								.attr("title")
								.match(/<b>([\w]+)<\/b>/)[1]
								.toUpperCase()
						] ?? ONLINE_STATUS_ENUM.UNKNOWN,
				},
			},
		},
	];

	function init() {
		// Finds first filter where check is valid
		const filter = FILTERS.find((f) => f.check());
		if (!filter) return; // No filter found
		let f = createFilter(filter);
		new MutationObserver(() => {
			if (document.contains(f[0])) return;
			if (!filter.table()) return;
			showAllRows(filter);
			f = createFilter(filter);
		}).observe(document.body, { childList: true, subtree: true });
		injectStyle();
	}

	function createFilter(filterOptions) {
		const filters = $("<div/>", {
			id: "kw--filter-container",
			style:
				"display: flex;justify-content: space-between;background: linear-gradient(to bottom, #ff149311, #ff149344);" +
				"padding: 10px;border-radius: 10px; margin: 10px 0;flex-wrap: wrap;gap: 10px;",
		});
		Object.entries(filterOptions.filters).forEach(([name, { type, min, max, options, fn }]) => {
			const filter = $("<div/>", {
				class: "kw--filter",
				style: "display: flex; flex-direction: column; gap: 0.25rem;",
			}).appendTo(filters);
			filter.append(
				$("<label/>", {
					text: name + ":",
					style: "font-weight: bolder; font-size: 0.9rem",
				})
			);
			switch (type) {
				case "text":
					filter.append(
						$("<input/>", {
							type: "text",
							class: "kw--filter-text kw--filter-row",
						})
							.data("filter", { name, type, fn })
							.on("input", () => handleFilterChange(filterOptions))
					);
					break;
				case "min-max":
					filter.append(
						$("<input/>", {
							type: "number",
							class: "kw--filter-min kw--filter-row",
							min,
							max,
							style: "min-width: 50px;",
						})
							.attr("placeholder", "min")
							.data("filter", { name, type, is: "min", fn })
							.on("input", () => handleFilterChange(filterOptions))
					);
					filter.append(
						$("<input/>", {
							type: "number",
							class: "kw--filter-max kw--filter-row",
							min,
							max,
							style: "min-width: 50px;",
						})
							.attr("placeholder", "max")
							.data("filter", { name, type, is: "max", fn })
							.on("input", () => handleFilterChange(filterOptions))
					);
					break;
				case "select":
					const select = $("<select/>", {
						class: "kw--filter-select kw--filter-row",
					})
						.data("filter", { name, type, fn })
						.on("change", () => handleFilterChange(filterOptions))
						.append(
							$("<option/>", {
								value: "",
								text: "ANY",
							})
						)
						.appendTo(filter);
					Object.entries(options)
						.filter(([key, value]) => key !== "UNKNOWN" || value !== "UNKNOWN")
						.forEach(([key, value]) => {
							select.append(
								$("<option/>", {
									value: key,
									text: value,
								})
							);
						});
					break;
			}
		});
		filterOptions.insertFilters(filters);
		return filters;
	}

	function handleFilterChange(filterOptions) {
		const table = filterOptions.table();
		if (!table) return console.error("[kw--player-filters]: Table could not be found");
		const rows = filterOptions.rows(table);
		const filters = $(".kw--filter-row")
			.toArray()
			.map((f) => ({ f: $(f).data("filter"), e: $(f) }));
		[...rows].forEach((r) => {
			const row = $(r);
			const data = filters.map(({ f, e }) => {
				const value = f.fn(row);
				const filterVal = e.val();
				if (!filterVal || !value) return true;
				try {
					switch (f.type) {
						case "text":
							return value.toLowerCase().includes(filterVal.toLowerCase());
						case "min-max":
							if (f.is === "min") return parseInt(value) >= parseInt(filterVal);
							if (f.is === "max") return parseInt(value) <= parseInt(filterVal);
							return true;
						case "select":
							return value === filterVal;
					}
				} catch (e) {
					console.error(e);
					console.debug({ f, row, value });
					return true;
				}
			});
			if (data.every((d) => d)) row.show();
			else row.hide();
		});
	}

	function showAllRows(pageData) {
		const table = pageData.table();
		if (!table) return console.error("[kw--player-filters]: Table could not be found");
		const rows = pageData.rows(table);
		[...rows].forEach((r) => $(r).show());
	}

	init();

	function injectStyle() {
		const style = `
			#kw--filter-container input {
				border: 1px solid var(--input-border-color, #ccc);
				border-radius: 5px;
				font-family: Arial, serif;
				color: var(--input-color, #000);
				background: var(--input-background-color, #fff);
				padding: 9px 10px;
			}

			#kw--filter-container select {
				height: 34px;
				line-height: 34px;
				color: #444;
				border: 1px solid var(--default-panel-divider-inner-side-color, #fff);
				border-radius: 5px;
				background: linear-gradient(to bottom, #e4e4e4, #f2f2f2);
			}

			body.dark-mode #kw--filter-container select {
				color: #ddd;
				background: #000;
				border-color: #444;
			}
			`;
		if (typeof GM_addStyle !== "undefined") return GM_addStyle(style);
		$(document.head).append($("<style/>", { text: style }));
	}
})();