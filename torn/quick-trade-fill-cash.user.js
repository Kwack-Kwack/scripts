// ==UserScript==
// @name         Quick-Trade-Fill-Cash
// @namespace    dev.kwack.torn.qtfc
// @version      0.0.1
// @description  Instantly fills trade with your cash on hand. You're responsible for the consequences if it fails. Quick and dirty script.
// @author       Kwack [2190604]
// @match        https://www.torn.com/trade.php*
// @run-at 		 document-end
// ==/UserScript==

const kw_qtfc_callback = async () => {
	if (!document.location.hash.includes("step=addmoney"))
		return console.log("kw--qtfc: Exiting due to incorrect page");
	const addMoneyToTradeRequest = (rfcv, id, amount) =>
		fetch(`https://www.torn.com/trade.php?rfcv=${rfcv}`, {
			method: "POST",
			body: new URLSearchParams([
				["step", "view"],
				["ID", id],
				["inserter", Math.round(Math.random() * 1000000000)],
				["ajax", true],
				["amount", amount],
				["sub_step", "addmoney2"],
			]).toString(),
			headers: {
				"X-Requested-With": "XMLHttpRequest",
				"content-type": "application/x-www-form-urlencoded; charset=UTF-8",
			},
		});
	const addButton = () =>
		$("button#kw--qtfc-fill-cash").length ||
		$("<button>")
			.attr("id", "kw--qtfc-fill-cash")
			.text("Prepare for balance change")
			.css("padding", "1rem 2rem")
			.css("height", "auto")
			.css("font-size", "1.5rem")
			.css("margin", "1rem 0")
			.addClass("torn-btn")
			.on("click", buttonCallback)
			.insertAfter("div.add-money form");

	const buttonCallback = async () => {
		const balanceElement = $("div#trade-container span.money-value");
		$("#kw--qtfc-fill-cash")
			.prop("disabled", true)
			.text(`Waiting for balance change from \$${balanceElement.text()}, please wait...`);
		const currentBalance = balanceElement.text();
		const newBalance = await readyPromise(balanceElement, currentBalance);
		if (isNaN(newBalance)) {
			$("#kw--qtfc-fill-cash").text("Error: Balance not found, try the old fashioned way");
			return;
		}
		$("#kw--qtfc-fill-cash")
			.text(`ADD ${newBalance} TO TRADE`)
			.removeProp("disabled")
			.on("click", () =>
				addMoneyToTradeRequest(getRfcv(), getId(), newBalance).then((r) =>
					r.ok ? alert(`Added $${newBalance} to trade`) : alert("Error: " + r.status)
				)
			);
	};

	const readyPromise = (balanceElement, currentBalance) =>
		new Promise((resolve) => {
			const observer = new MutationObserver(() => {
				if (balanceElement.text() !== currentBalance) {
					observer.disconnect();
					resolve(balanceElement.text().replaceAll(",", ""));
				}
			});
			observer.observe(balanceElement[0], { childList: true });
		});

	const getRfcv = () => {
		const cookies = document.cookie.split("; ");
		const rfcv = cookies.find((cookie) => cookie.startsWith("rfc_v="));
		return rfcv ? rfcv.split("=")[1] : null;
	};
	const getId = () => {
		const params = new URLSearchParams(document.location.hash.slice(1));
		return params.get("ID");
	};

	const mut = new MutationObserver(() => {
		if ($?.("div.add-money form").length) {
			addButton();
			mut.disconnect();
		}
	});
	mut.observe(document.body, { childList: true, subtree: true });
};

window.addEventListener("hashchange", kw_qtfc_callback);
kw_qtfc_callback();
