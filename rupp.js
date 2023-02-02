const allButton = document.querySelector('#rupp-all');

allButton.onclick = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: ruppAll,
            args: [professors]
        });
    });
}

function ruppAll(professors) {
    const table = document.querySelector('#tbl-search');
    const body = table.querySelector('tbody');
    const rows = [...body.querySelectorAll('tr')];
    const rowClasses = rows.map(row => row.classList[0]);
    
    let curr = "";

    rowClasses.forEach(async (rowClass, i) => {
        if ( rowClass == curr ) return;
        curr = rowClass;

        const plainRegex = /<br>(.*?)<br><br>/g;
        const spanRegex = /<br><span class="(.*)">(.*)<\/span><br><br>/;

        const instructorCell = rows[i].querySelector('td:nth-child(2)');
        const instructors = [...instructorCell.innerHTML.matchAll(plainRegex)];

        instructors.forEach(inst => {
            const instructor = inst[1];

            if (instructor.startsWith('<span') || instructor.startsWith('Overall')) return;
        
            instructorCell.innerHTML = instructorCell.innerHTML.replace(instructor, `<span class="instructor">${instructor}</span>`);
        })
    })

    const instructorSpans = [...document.querySelectorAll('.instructor')].map(elem => {
        if (elem.innerHTML.includes("<br>")) {
            const parent = elem.parentElement;
            const [ pre, name ] = elem.innerHTML.split("<br>");

            elem.insertAdjacentHTML("afterend", `${pre}<br><span class="instructor">${name}</span>`);
            parent.removeChild(elem);

            return parent.querySelector('.instructor');
        } else {
            return elem;
        }
    });

    console.log(instructorSpans);
    
    instructorSpans.forEach(instSpan => {
        const name = instSpan.innerHTML;

        if (name === 'TBA' || name === 'Concealed') {
            instSpan.classList.add('unknown');
            instSpan.style.backgroundColor = "rgba(0, 0, 255, 0.1)";
            return;
        }
        
        const searchName = name.toLowerCase();
        const searchResults = professors.filter(p => {
            firstName = p.firstName.toLowerCase();
            lastName = p.lastName.toLowerCase();
    
            return firstName.includes(searchName) ||
                lastName.includes(searchName) ||
                (firstName + " " + lastName).includes(searchName) ||
                (lastName + ", " + firstName).includes(searchName) ||
                (lastName + " " + firstName).includes(searchName);
        });

        if (searchResults.length == 0) {
            instSpan.classList.add('not-found');
            instSpan.style.backgroundColor = "rgba(0, 0, 0, 0.1)";
        } else {
            const inst = searchResults[0];

            const helpfulness = inst.rating.helpfulness.toFixed(2);
            const pedagogy = inst.rating.pedagogy.toFixed(2);
            const easiness = inst.rating.easiness.toFixed(2);
            const overall = inst.rating.overall.toFixed(2);

            instSpan.classList.add('found');
            instSpan.style.backgroundColor = `rgba(${255 * (1 - (overall - 1)/4)}, ${255 * ((overall - 1)/4)}, 0, 0.5)`
            instSpan.insertAdjacentHTML("afterend", `
                <br>Helpfulness: ${helpfulness}
                <br>Pedagogy: ${pedagogy}
                <br>Easiness: ${easiness}
                <br>Overall: ${overall}`);
        }

        instSpan.insertAdjacentHTML("afterend", `<br><a href="https://www.reddit.com/r/RateUPProfs/search/?q=${name.replace(/ /g, '%20')}" target="_blank">Search Reddit</a>`);
    });
}