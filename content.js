const skipNames = ['TBA', 'Concealed'];

const redditSearchUrl = (name) => {
    return `https://www.reddit.com/r/RateUPProfs/search/?q=${name.replace(/ /g, '%20')}`;
}   

const ruppSearchUrl = (id) => {
    return `https://rupp.onrender.com/view/${id}`;
}

const ruppTeacherUrl = (id) => {
    return `https://rupp-backend-vblj.onrender.com/api/rupp/teacher/${id}`;
}

const ruppRateUrl = (id) => {
    return `https://rupp.onrender.com/rate/${id}`;
}

const ruppAddUrl = 'https://rupp.onrender.com/add';

const starSpan = (title, rating) => {
    const roundedRating = Math.round(rating * 2) / 2; // Round to nearest half
    const fullStars = Math.floor(roundedRating);
    const halfStar = roundedRating % 1 !== 0 ? '⯪' : '';
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    const stars = '★'.repeat(fullStars) + halfStar + '☆'.repeat(emptyStars);

    const span = document.createElement('span');
    span.style.color = rating >= 4.5
        ? 'green'
        : rating >= 4.0
            ? 'yellowgreen'
            : rating >= 3.5
                ? 'orange'
                : rating >= 3.0
                    ? 'darkorange'
                    : 'red';
    span.innerHTML = `<br>${title} ${stars} (${Math.round(rating * 10) / 10})`;

    return span;
}

// Wrap chrome.runtime.sendMessage for async/await use
function sendMessagePromise(message) {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage(message, resolve);
    });
}

async function classSearch(teachers, preenlistmentModule = true) {
    const teacherInfo = {};

    // Update header rows' widths
    // element.width is deprecated, but CRS uses it so we will too
    const headerRow = document.querySelector('#tbl-search > thead > tr');

    // First four columns are the same for either module
    headerRow.querySelector('th:nth-child(1)').width = '3%';  // Class Code
    headerRow.querySelector('th:nth-child(2)').width = '20%'; // Class / Instructor
    headerRow.querySelector('th:nth-child(3)').width = '3%';  // Credits
    headerRow.querySelector('th:nth-child(4)').width = '15%'; // Schedule / Room

    if (preenlistmentModule) {
        headerRow.querySelector('th:nth-child(5)').width = '15%'; // Restrictions / Remarks
        headerRow.querySelector('th:nth-child(6)').width = '15%'; // Slots
        headerRow.querySelector('th:nth-child(7)').width = '9%';  // Action
    } else {
        headerRow.querySelector('th:nth-child(5)').width = '8%';  // Waitlisting Schedule
        headerRow.querySelector('th:nth-child(6)').width = '15%'; // Restriction / Remarks
        headerRow.querySelector('th:nth-child(7)').width = '9%';  // Available Slots / Total Slots | Demand
        headerRow.querySelector('th:nth-child(8)').width = '7%';  // Action
    }
    
    const headerCell = document.createElement('th');
    headerCell.innerHTML = 'RUPP Rating';
    headerCell.width = '20%'; // Set width for the new column
    headerRow.appendChild(headerCell);

    // Get all rows in the table body
    const rows = [...document.querySelectorAll('#tbl-search > tbody > tr')];
    const rowClasses = rows.map(row => row.classList[0]);

    let curr = "";

    rowClasses.forEach(async (rowClass, i) => {
        // CRS has alternating odd/even row classes, so we can skip for multiple
        // rows of the same class
        if ( rowClass == curr ) return;
        curr = rowClass;
        const currRow = rows[i];

        // The `Class / Instructor` column has the subject in `strong` tags and
        // the instructor covered in the following `br` tags
        const instRegex = /(<br>.*)?<br>(.*?)<br><br>/g;
        const instCell = currRow.querySelector('td:nth-child(2)');

        const insts = [...instCell.innerHTML.matchAll(instRegex)];

        const fetchPromises = insts.map(async (inst) => {
            const [ elem, detail, name ] = inst;

            // NOTE: v1 had a check for 'Overall' here; verify if needed
            if (name.startsWith('<')) return;

            // Replace the instructor name with a span for easier reference
            instCell.innerHTML = instCell.innerHTML.replace(elem,
                `${detail}<br><span class="instructor">${name}</span><br><br>`
            );

            // Skip names that are not relevant or are placeholders
            if (skipNames.includes(name)) return;

            // Store the teacher's info in a local object
            if (!teacherInfo[name]) {
                teacherInfo[name] = {};
            }

            // Load the RUPP information for the teacher
            const ruppTeacher = teachers.find(t => {
                const fullName = `${t.lastName}, ${t.firstName}`.toLowerCase();
                return fullName === name.toLowerCase();
            });

            if (ruppTeacher) {
                teacherInfo[name].id = ruppTeacher._id;

                const response = await sendMessagePromise({
                    type: "FETCH_TEACHER_RATING",
                    id: ruppTeacher._id
                });

                if (response && response.success) {
                    teacherInfo[name].rating = response.rating;
                    teacherInfo[name].count = response.count;
                } else {
                    teacherInfo[name].rating = null;
                    teacherInfo[name].count = null;
                }
            } else {
                teacherInfo[name].id = null;
                teacherInfo[name].rating = null;
                teacherInfo[name].count = null;
            }
        });

        // Wait for all fetch promises to resolve before proceeding otherwise
        // the ratings will not be displayed correctly
        await Promise.all(fetchPromises);

        // Create a new cell for the RUPP rating
        const ratingCell = document.createElement('td');
        ratingCell.rowSpan = instCell.rowSpan;
        ratingCell.align = 'center'; // Deprecated but this is what CRS uses

        const ratings = insts
            // Filter out any instructors that do not have RUPP data
            .filter(inst => teacherInfo[inst[2]])

            // Create the rating span for each instructor in the row
            // Normally, there is only one instructor per row, but some rows
            // may have multiple instructors (e.g. block schedules)
            .map(inst => {
                const name = inst[2];
                const { id, rating, count } = teacherInfo[name];

                if (!id) {
                    console.info(`No RUPP ID found for teacher: ${name}`);
                    const noIdSpan = document.createElement('span');
                    noIdSpan.innerHTML = `${name} not found in RUPP.
                        <br><a href="${ruppAddUrl}" target="_blank">Request to have them added</a>
                    `;
                    return noIdSpan;
                }

                const teacherUrl = ruppSearchUrl(id);

                const ratingSpan = document.createElement('span');
                
                // Create a link to the RUPP page for the teacher
                const ratingAnchor = document.createElement('a');
                ratingAnchor.href = teacherUrl;
                ratingAnchor.target = '_blank';
                ratingAnchor.textContent = name;
                ratingSpan.appendChild(ratingAnchor);

                // If no rating is available, display a message
                if (!rating || count === 0) {
                    ratingSpan.innerHTML += '<br>No ratings available';
                    console.warn(`No ratings available for teacher: ${name}`);
                    return ratingSpan;
                }

                // Create star ratings for each metric
                for (const metric of ['Pedagogy', 'Helpfulness', 'Easiness', 'Overall']) {
                    const key = `${metric.toLowerCase()}Average`;

                    if (!(key in rating)) {
                        console.warn(`Missing rating key "${key}" for teacher: ${name}`);
                        continue;
                    }

                    const starRating = starSpan(metric, rating[key]);
                    ratingSpan.appendChild(starRating);
                }

                // Add the number of ratings
                ratingSpan.innerHTML += `<br><i>(from ${count} rating${ count > 1 ? 's' : ''})</i>`;

                return ratingSpan;
            });
        
        ratingCell.innerHTML = ratings.map(r => r.getHTML()).join('<br>');
        currRow.appendChild(ratingCell);
    });

    const instSpans = [...document.querySelectorAll('.instructor')];

        instSpans.forEach(instSpan => {
            const name = instSpan.innerHTML;

            if (skipNames.includes(name)) return;

            const anchors = [];
            
            instSpan.insertAdjacentHTML("afterend", `<br>(<a href="${redditSearchUrl(name)}" target="_blank">Search in Reddit</a>)`);
        })
}

async function setAnswer(teachers) {
    // The SET Answering page has two tables, one of which has the class `form`
    // and the other is the one we want to process
    const table = document.querySelector('table:not(.form)');

    console.log(table);

    const rows = [...table.querySelectorAll('tbody > tr')];

    // In a single class row, there can be multiple instructors which live in
    // different rows which are affected by the `rowspan` so we need to keep
    // track how many rows are remaining to be processed for each class
    let rowsRemaining = 0;
    for (const row of rows) {
        let instCell;
        let actionCell;
        
        if (rowsRemaining === 0) { // New class row
            const classCodeCell = row.querySelector('td');

            if (!classCodeCell) continue; // Skip if no class code cell
            rowsRemaining = Number(classCodeCell.rowSpan);

            instCell = row.querySelector('td:nth-child(4)');
            actionCell = row.querySelector('td:nth-child(5)');
        } else {
            instCell = row.querySelector('td:nth-child(1)');
            actionCell = row.querySelector('td:nth-child(2)');
        }

        --rowsRemaining;

        // The `Instructor(s)` column has the name and sometimes "(Required)"
        const instRegex = /(.*?)(?= \(.*\))|^(.*)/;
        const instName = instCell.innerHTML.match(instRegex)[1];
        
        const ruppTeacher = teachers.find(t => {
            const fullName = `${t.lastName}, ${t.firstName}`.toLowerCase();
            return fullName === instName.toLowerCase();
        });

        let link;
        let actionText;

        if (ruppTeacher) {
            const teacherId = ruppTeacher._id;
            link = ruppRateUrl(teacherId);
            actionText = 'Rate on RUPP';
        } else  {
            link = ruppAddUrl;
            actionText = 'Request to add on RUPP';
        }

        actionCell.appendChild(document.createElement('br'));

        const rateLink = document.createElement('a');

        rateLink.href = link;
        rateLink.target = '_blank';
        rateLink.textContent = actionText;

        actionCell.appendChild(rateLink);
    }
}

chrome.runtime.sendMessage({ type: "FETCH_TEACHERS" }, (response) => {
    if (!response || !response.success) {
        console.error("Failed to fetch teachers data:", response ? response.error : "No response");
        return;
    }

    const teachers = response.teachers;

    const url = window.location.href;

    if (url.includes('/class_search/')) {
        console.log("Content: Class Search");

        const preenlistmentModule = url.includes('/preenlistment/');

        classSearch(teachers, preenlistmentModule);
    } else if (url.includes('/set_answer')) {
        console.log("Content: SET Answering");
        setAnswer(teachers);
    } else {
        console.warn("Content: Unsupported page for RUPP integration.");
    }
});
