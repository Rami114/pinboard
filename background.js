// Globals
var gShowNotifications = true;
// Add-on functions
function onCreated() {
    if (browser.runtime.lastError) {
        console.log(`Error: ${browser.runtime.lastError}`);
    } else {
        console.log("Item created successfully");
    }
}

function onError(e) {
    console.error(e);
}

function readSettings(settings) {
    // Api-key checks
    let apiKey = settings.apiKey;
    if (settings.apiKey && settings.apiKey !== undefined) {
        apiCheck(apiKey);
    }
    // We will poll in the background every 5 minutes 
    browser.alarms.create("poll-api", {
        delayInMinutes: 5,
        periodInMinutes: 5
    });
    // Determines if we should show notifications
    gShowNotifications = (settings.showNotifications && typeof settings.showNotifications !== undefined) ? settings.showNotifications : false;
    browser.menus.update("pinboard-menu-notifications", {
        checked: settings.showNotifications
    });
}

function performApiPoll() {
    browser.storage.local.get().then((settings) => {
        let apiKey = settings.apiKey;
        if (settings.apiKey && settings.apiKey !== undefined) {
            apiCheck(apiKey);
        } else {
            browser.storage.local.set({
                apiStatus: "no-api-key"
            });
        }
    }, onError);
}

function apiCheck(apiKey) {
    let apiUrl = "https://api.pinboard.in/v1/user/api_token/?auth_token=" + encodeURIComponent(apiKey);
    fetch(apiUrl).then((response) => {
        if (response.ok) {
            browser.storage.local.set({
                apiStatus: "good-api-key"
            });
        } else {
            browser.storage.local.set({
                apiStatus: "bad-api-key"
            });
        }
    }).catch((error) => {
        browser.storage.local.set({
            apiStatus: "network-issue"
        });
    });
}

function handleAlarm(alarmInfo) {
    switch (alarmInfo.name) {
        case "poll-api":
            performApiPoll();
            break;
    }
}

// These two globals are to cache the last tab lookup - otherwise we ping the API consecutively
var cacheTabUrl = '';
var cacheTabXml = null;

function clearTabCache() {
    cacheTabUrl = '';
    cacheTabXml = null;
}

// Our icons for the address bad
const defaultIcon = "icons/pin.svg";
const tickIcon = "icons/pin-ticked.svg";

function checkTabUrl(tab, settings) {
    let apiKey = settings.apiKey;
    let apiStatus = settings.apiStatus;
    if (apiStatus == "good-api-key") {
        let checkUrl = 'https://api.pinboard.in/v1/posts/get?auth_token=' + encodeURIComponent(apiKey) + '&url=' + encodeURIComponent(tab.url);
        if(checkUrl !== cacheTabUrl) {
            fetch(checkUrl)
                .then(response => response.text())
                .then(str => (new window.DOMParser()).parseFromString(str, "text/xml"))
                .then((xml) => { 
                    cacheTabXml = xml; 
                    cacheTabUrl = checkUrl;
                    let posts = cacheTabXml.getElementsByTagName("post");
                    if (posts.length > 0) {
                        // We've seen this, change the icon 
                        browser.pageAction.setIcon({tabId: tab.id, path: tickIcon});
                    } else {
                        browser.pageAction.setIcon({tabId: tab.id, path: defaultIcon});
                    }
                });
        }     
    } else {
        browser.pageAction.setIcon({tabId: tab.id, path: defaultIcon});
    }
}

// Pinboard functions

function bookmark(uri, desc, title) {
    const dest = 'https://pinboard.in/add?showtags=yes&url=' + encodeURIComponent(uri) + '&description=' + encodeURIComponent(desc) + '&title=' + encodeURIComponent(title);
    browser.windows.create({
        type: "popup",
        height: 350,
        width: 725,
        url: dest
    });
    clearTabCache();
}

function readLater(uri, title) {
    const dest = 'https://pinboard.in/add?later=yes&noui=yes&jump=close&url=' + encodeURIComponent(uri) + '&title=' + encodeURIComponent(title);
    // We want a window far, far away
    // Ugly method to refocus our current window
    // Does not gracefully handle when you're not already logged in :(
    let getting = browser.windows.getCurrent();
    getting.then((windowInfo) => {
        // Popup
        browser.windows.create({
            allowScriptsToClose: true,
            //focused: false, // Unsupported by FF?! Sigh.
            height: 100,
            width: 100,
            type: "popup",
            url: dest
        });
        // Refocus
        browser.windows.update(windowInfo.id, {
            focused: true
        });
    });
    if (gShowNotifications) {
        browser.notifications.create({
            type: "basic",
            message: "Saved to read later",
            title: "Pinboard",
            iconUrl: browser.extension.getURL("icons/pinboard-32.png")
        });
    }
    clearTabCache();
}
// Creatte the contextual menus (tools and right-click)
browser.menus.create({
    id: "pinboard-menu-notifications",
    title: "Show notifications",
    type: "checkbox",
    checked: gShowNotifications,
    contexts: ["tools_menu"]
}, onCreated);
// This is primarily to force a sub-menu, but why not link to the source v0v
browser.menus.create({
    id: "pinboard-menu-github",
    title: "View on Github",
    type: "normal",
    contexts: ["tools_menu"]
}, onCreated);
browser.menus.create({
    id: "link-save-to-pinboard",
    title: "Save to Pinboard",
    type: "normal",
    icons: {
        "16": "icons/bookmark-16.png",
        "32": "icons/bookmark-32.png"
    },
    contexts: ["link"]
}, onCreated);
browser.menus.create({
    id: "link-read-later",
    title: "Read later",
    type: "normal",
    icons: {
        "16": "icons/readlater-16.png",
        "32": "icons/readlater-32.png"
    },
    contexts: ["link"]
}, onCreated);

// Event listeners

browser.menus.onClicked.addListener((info, tab) => {
    switch (info.menuItemId) {
        case "pinboard-menu-notifications":
            gShowNotifications = info.checked;
            browser.storage.local.set({
                showNotifications: info.checked
            });
            break;
        case "pinboard-menu-github":
            browser.tabs.create({
                active: true,
                url: "https://github.com/Rami114/pinboard"
            });
            break;
        case "link-save-to-pinboard":
            let desc = (info.selectionText && typeof info.selectionText !== undefined) ? info.selectionText : '';
            bookmark(info.linkUrl, desc, info.linkText);
            break;
        case "link-read-later":
            readLater(info.linkUrl, info.linkText);
            break;
    }
});
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (!tab.url.match(/^about:/)) {
        browser.pageAction.show(tab.id);
        browser.storage.local.get().then((settings) => {checkTabUrl(tab, settings)}, onError);
    }
});

browser.runtime.onMessage.addListener((message) => {
    switch (message.type) {
        case "save-to-pinboard":
            bookmark(message.uri, message.desc, message.title);
            break;
        case "read-later":
            readLater(message.uri, message.title);
            break;
        case "api-key-saved":
            performApiPoll();
            break;
    }
});

browser.commands.onCommand.addListener(function(command) {
  switch (command) {
        case "command-save-to-pinboard":
	        let querying = browser.tabs.query({currentWindow: true, active: true});
            querying.then((tabs) => {
                for (let tab of tabs) {
                    let title = tab.title;
                    let desc = '';
                    let uri = tab.url;
                    bookmark(uri, desc, title);
                    break;
                }
            });
            break;
        case "command-all-bookmarks":
            browser.tabs.create({active: true, url: "https://pinboard.in/"});
            break;
  }
});

// Fires on startup
browser.storage.local.get().then(readSettings, onError);
// Add alarm listener for api checks
browser.alarms.onAlarm.addListener(handleAlarm);
