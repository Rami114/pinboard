// Globals
var gShowNotifications = true;

// Functions

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

function updateNotificationSetting(setting) {
    gShowNotifications = setting.showNotifications;
    browser.menus.update("pinboard-menu-notifications", { checked: setting.showNotifications });
}

function bookmark(uri, desc, title) {
    const dest = 'https://pinboard.in/add?showtags=yes&url='+encodeURIComponent(uri)+'&description='+encodeURIComponent(desc)+'&title='+encodeURIComponent(title);
    browser.windows.create({
    	type: "popup",
    	height: 350,
        width: 725,
    	url: dest
    });
}

function readLater(uri, title) {
    const dest = 'https://pinboard.in/add?later=yes&noui=yes&jump=close&url='+encodeURIComponent(uri)+'&title='+encodeURIComponent(title);
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
        browser.windows.update(windowInfo.id, {focused: true});
    });
    if(gShowNotifications) {
        browser.notifications.create({
            type: "basic",
            message: "Saved to read later",
            title: "Pinboard",
            iconUrl: browser.extension.getURL("icons/pinboard-32.png")
        });
    }
}

// Actual menus

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
            browser.storage.local.set({showNotifications: info.checked});
            break;
        case "pinboard-menu-github":
            browser.tabs.create({active: true, url: "https://github.com/Rami114/pinboard"});
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
    }
});

// Fires on startup
browser.storage.local.get().then(updateNotificationSetting, onError);

