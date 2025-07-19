const BASE_API_URL = "https://rupp-backend-vblj.onrender.com/api/rupp";
const CACHE_PREFIX = "rupp_";
const CACHE_TTL = 1000 * 60 * 60 * 24; // 1 day

async function fetchTeachers() {
    return new Promise((resolve, reject) => {
        const cacheKey = `${CACHE_PREFIX}teachers`;

        chrome.storage.local.get(cacheKey, (result) => {
            const cachedData = result[cacheKey];

            if (cachedData && (Date.now() - cachedData.timestamp < CACHE_TTL)) {
                console.log("Background: Using cached data for teachers.");
                resolve(cachedData.teachers);
            } else {
                console.log("Background: Fetching new data for teachers.");

                fetch(`${BASE_API_URL}/teachers`)
                    .then(response => response.json())
                    .then(data => {
                        chrome.storage.local.set({
                            [cacheKey]: {
                                timestamp: Date.now(),
                                teachers: data.teachers
                            }
                        }, () => {
                            console.log("Background: Data cached successfully.");
                            resolve(data.teachers);
                        });
                    })
                    .catch(err => {
                        console.error("Background: Error fetching teachers data:", err);
                        reject(err);
                    });
            }
        });
    });
}

async function fetchTeacherRating(id) {
    return new Promise((resolve, reject) => {
        const cacheKey = `${CACHE_PREFIX}teacher_${id}`;

        chrome.storage.local.get(cacheKey, (result) => {
            const cached = result[cacheKey];

            if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
                console.log(`Background: Using cached data for teacher ${id}.`);
                resolve({
                    rating: cached.rating,
                    count: cached.count,
                });
            } else {
                console.log(`Background: Fetching new data for teacher ${id}.`);
                
                fetch(`${BASE_API_URL}/teacher/${id}`)
                    .then(response => response.json())
                    .then(data => {
                        chrome.storage.local.set({
                            [cacheKey]: {
                                timestamp: Date.now(),
                                rating: data.averages,
                                count: data.ratings.length,
                            }
                        }, () => {
                            console.log(`Background: Data for teacher ${id} cached successfully.`);
                            resolve({
                                rating: data.averages,
                                count: data.ratings.length,
                            });
                        });
                    })
                    .catch(err => {
                        console.error(`Background: Error fetching rating for teacher ${id}:`, err);
                        reject(err);
                    });
            }
        });
    });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "FETCH_TEACHERS") {
        fetchTeachers()
            .then(teachers => sendResponse({ success: true, teachers }))
            .catch(err => sendResponse({ success: false, error: err.message }));
        return true; // Keep the message channel open for async response
    } else if (message.type === "FETCH_TEACHER_RATING" && message.id) {
        fetchTeacherRating(message.id)
            .then(response => sendResponse({
                success: true,
                rating: response.rating,
                count: response.count
            }))
            .catch(err => sendResponse({ success: false, error: err.message }));
        return true; // Keep the message channel open for async response
    }
})