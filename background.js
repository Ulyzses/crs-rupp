chrome.action.disable();

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.status == "complete") {
        const url = tab.url;
        const urlRegex = /https:\/\/crs.upd.edu.ph\/\w+\/class_search/;

        if (url.match(urlRegex) ) {
            chrome.action.enable(tabId);
        } else {
            chrome.action.disable(tabId);
        }
    }
});