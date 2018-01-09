document.addEventListener("click", (e) => {
    let querying = browser.tabs.query({currentWindow: true, active: true});
    switch(e.target.id) {
        case "save-to-pinboard":
            querying.then((tabs) => {
                for (let tab of tabs) {
                    let title = tab.title;
                    let desc = '';
                    let uri = tab.url;
                    browser.runtime.sendMessage({
                        'type' : 'save-to-pinboard',
                        'title' : title,
                        'desc' : desc,
                        'uri' : uri
                    });
                    break; 
                }
            });
            break;
        case "read-later":
            querying.then((tabs) => {
                for (let tab of tabs) {
                    let title = tab.title;
                    let uri = tab.url;
                    browser.runtime.sendMessage({
                        'type' : 'read-later',
                        'title' : title,
                        'uri' : uri
                    });
                    break; 
                }
            });
            break;
        case "save-tab-set":
            // TODO
            break;
        case "goto-unread-bookmarks": 
            browser.tabs.create({active: true, url: "https://pinboard.in/toread"});
            break
        case "goto-all-bookmarks": 
            browser.tabs.create({active: true, url: "https://pinboard.in/"});
            break
        case "goto-pinboard-popular": 
            browser.tabs.create({active: true, url: "https://pinboard.in/network"});
            break
        case "goto-saved-tab-sets": 
            browser.tabs.create({active: true, url: "https://pinboard.in/tabs"});
            break
    }
});