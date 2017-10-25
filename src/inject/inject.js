chrome.extension.sendMessage({}, function (response) {
	var readyStateCheckInterval = setInterval(function () {
		if (document.readyState === "complete") {
			clearInterval(readyStateCheckInterval);
			var resultNodes = document.getElementsByClassName('list_results');
			var myNode = resultNodes[0];

			var styles = [
				"background-color: #d9e2e2;",
				"background-color: #d5edfb;",
				"background-color: #e6f5dd;",
				"background-color: #fbebbd;",
			]

			var dates = Array.from(resultNodes).map((n, i) => {
				return sortList(n, styles[i]);
			});

			var merged = [].concat.apply([], dates);

			console.log("merged " + merged.length + " letters");

			sortedDates = merged.filter((l) => { return l.date != null });
			nonSortedDates = merged.filter((l) => { return !l.date || isNaN(l.date.getTime()) });
	
			sortedDates.sort(function (a, b) {
				return a.date.getTime() - b.date.getTime()
			})
	
			var sortedHeader = document.createElement("div");
			sortedHeader.innerHTML = "<h3>Sorterte: " + sortedDates.length + " <a href='#unsorted'>usorterte: " + nonSortedDates.length + ")</a></h3>";
			myNode.appendChild(sortedHeader);
			sortedDates.forEach((l) => {
				myNode.appendChild(l.content);
			});
	
			var unsortedHeader = document.createElement("div");
			unsortedHeader.innerHTML = "<h3>Usorterte (" + nonSortedDates.length + ")</h3>";
			unsortedHeader.id = "unsorted";
			myNode.appendChild(unsortedHeader);
			
			nonSortedDates.forEach((l) => {
				myNode.appendChild(l.content);
			});
		}
	}, 10);

	function sortList(myNode, style) {
		var letters = Array.from(myNode.getElementsByClassName('list_item'));

		while (myNode.firstChild) {
			myNode.removeChild(myNode.firstChild);
		}

		var dateFindRegex = /Datert\s*((\d{2}\.\d{2}\.\d{4})|(\d{4}))/;
		return letters.map((letter) => {
			var match = letter.getElementsByClassName('right').length > 0 ? 
				letter.getElementsByClassName('right')[0].innerHTML.match(dateFindRegex)
				: letter.innerHTML.match(dateFindRegex);
			var parsedDate = null;
			letter.setAttribute("style", style);
			if (match){
				if (match[2]){
					parsedDate = new Date(match[2].substr(6) + '-' + match[2].substr(3, 2) + '-' + match[2].substr(0, 2))
				}
				if (match[3]){
					parsedDate = new Date(match[3]);
				}
			}
			
			return {
				"date": parsedDate,
				"content": letter
			}
		})
	}
});