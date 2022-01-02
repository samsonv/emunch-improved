
var readyStateCheckInterval = setInterval(function () {
  if (document.readyState === "complete") {
    clearInterval(readyStateCheckInterval);
    var resultNodes = document.getElementsByClassName('list_results');
    if (resultNodes.length === 0){
      return;
    }
    
    var myNode = resultNodes[0];


    var senders = [
      { className: "receiver" },
      { className: "sender" },
      { className: "omtale" },
    ]

    var dates = Array.from(resultNodes).map((n, i) => parseLetter(n, senders[i]));

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

function parseLetter(container, person) {
  const fromToRegex = /fra (?<sender>\w+(\s?\w+)*?) til (?<receiver>\w+(\s?\w+)*?$)/;
  const mentionsRegex = /(?<sender>\w+(\s?\w+)*?) er omtalt i følgende tekster/;
  const fromToMatches = fromToRegex.exec(container.firstChild.innerHTML);
  const mentionsMatches = mentionsRegex.exec(container.firstChild.innerHTML);

  const fromTo = !!fromToMatches?.groups?.sender && !!fromToMatches?.groups?.receiver ?
    `Fra ${fromToMatches.groups.sender} til ${fromToMatches.groups.receiver}` :
    !!mentionsMatches?.groups?.sender ? `${mentionsMatches.groups.sender} er omtalt i følgende tekster` : null

  var letters = Array.from(container.getElementsByClassName('list_item'));
  container.classList.add("imessage");
  container.classList.remove("list_results");

  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  return letters.map((letter) => {
    letter.classList.add(fromTo != null ? person.className : 'anyone');
    letter.classList.remove("list_item");
    letter.classList.remove("even");
    letter.classList.remove("odd");

    const letterContent = letter.textContent;

    letter.children && [...letter.children].map(c => c.removeAttribute('style'));

    const fullDateMatch = letterContent.match(/Datert[\s\n\r]*(?<day>\d{1,2})\.(?<month>\d{1,2})\.\[?(?<year>\d{4})\]?./);
    const onlyYearMatch = !fullDateMatch && letterContent.match(/Datert[\s\n\r]*(?<year>\d{4})(\-\d{4})?\.?/);
    const monthAndYearMatch = !fullDateMatch && !onlyYearMatch && letterContent.match(/Datert[\s\n\r]*(?<month>\d{1,2})\.\[?(?<year>\d{4})\]?./);
    const fuzzyMatch = !fullDateMatch && !onlyYearMatch && !monthAndYearMatch && letterContent.match(/Datert[\s\n\r]*.*\?.*\n/) && letterContent.match(/Datert[\s\n\r]*(?<day>.*?)\.(?<month>.*?)\.(?<year>.*?)\./)

    let parsedDate = null;
    let isFuzzy = false;

    if (!!fullDateMatch) {
      const year = fullDateMatch.groups.year;
      const month = fullDateMatch.groups.month - 1;
      const day = fullDateMatch.groups.day;
      parsedDate = new Date(year, month, day);
    }

    if (!!onlyYearMatch) {
      const year = onlyYearMatch.groups.year;
      parsedDate = new Date(year, 0, 1);
      isFuzzy = true;
    }

    if (!!monthAndYearMatch) {
      parsedDate = new Date(monthAndYearMatch.groups.year, (monthAndYearMatch.groups.month - 1), 1);
      isFuzzy = true;
    }

    if (!!fuzzyMatch) {
      console.debug('fuzzyMatch', fuzzyMatch.groups)
      const day = Number.isInteger(+fuzzyMatch.groups.day) ? fuzzyMatch.groups.day : 1;
      const month = Number.isInteger(+fuzzyMatch.groups.month) ? fuzzyMatch.groups.month : 1;
      const parsedYear = fuzzyMatch.groups.year
        .replace(/18(\[\?\?\])/, "1895")
        .replace(/19(\[\?\?\])/, "1905")
        .replace(/\[\?\?\]([5-9]\d)/, "18$1")
        .replace(/\[\?\?\]([0-4]\d)/, "19$1");
      const year = Number.isInteger(+fuzzyMatch.groups.year) ? fuzzyMatch.groups.year :
        Number.isInteger(+parsedYear) ? parsedYear : 1900;

      parsedDate = new Date(year, month - 1, day);
      isFuzzy = true;
      console.debug('fuzzyMatch parsed to: ', parsedDate.toLocaleDateString('no'));
    }


    letter.title = `${fromTo ?? ''} (${parsedDate && parsedDate.toLocaleDateString('no')})${isFuzzy ? ' (kanskje)' : ''}`;

    if (isFuzzy) {
      letter.classList.add('fuzzy');
    }

    return {
      "date": parsedDate,
      "content": letter
    }
  })
}