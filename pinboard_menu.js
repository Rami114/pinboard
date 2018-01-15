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

// Api functions
function onError(e) {
    console.error(e);
}

// We rely on the status from storage, 
function checkApi(settings) {
    let apiStatus = (settings.apiStatus && typeof settings.apiStatus !== undefined) ? settings.apiStatus : "no-api-key";
    console.log(apiStatus);
    let noApiKey = document.getElementById("no-api-key");
	let goodApiKey = document.getElementById("good-api-key");
	let apiError = document.getElementById("api-error");
	let badApiKey = document.getElementById("bad-api-key");
    switch(apiStatus) {
    	case "no-api-key":
    		noApiKey.classList.remove("hidden");
    		goodApiKey.classList.add("hidden");
    		apiError.classList.add("hidden");
    		badApiKey.classList.add("hidden");
    		break;
    	case "bad-api-key":
    		noApiKey.classList.add("hidden");
    		goodApiKey.classList.add("hidden");
    		apiError.classList.add("hidden");
    		badApiKey.classList.remove("hidden");
    		break;
    	case "network-issue":
    		noApiKey.classList.add("hidden");
    		goodApiKey.classList.add("hidden");
    		apiError.classList.remove("hidden");
    		badApiKey.classList.add("hidden");
    		break
    	case "good-api-key":
    		noApiKey.classList.add("hidden");
    		goodApiKey.classList.remove("hidden");
    		apiError.classList.add("hidden");
    		badApiKey.classList.add("hidden");
    		break;
    }
}


browser.storage.local.get().then(checkApi, onError);
