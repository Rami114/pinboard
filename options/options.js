const apiKeyInput = document.querySelector("#api-key");

// Helper functions
function storeApiKey() {
    browser.storage.local.set({
        apiKey: apiKeyInput.value 
    });
    // Will trigger an immediate poll
    browser.runtime.sendMessage({'type': 'api-key-saved'});
}

function updateUI(restoredSettings) {
    apiKeyInput.value = restoredSettings.apiKey || "";
}

function onError(e) {
    console.error(e);
}

// Add hooks to read/write api key as needed
browser.storage.local.get().then(updateUI, onError);
apiKeyInput.addEventListener("blur", storeApiKey);

