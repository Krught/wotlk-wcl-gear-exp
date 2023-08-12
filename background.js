chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "openNewTab") {
    const url = request.url;
    const additionalVariable = request.additionalVariable;

    // Open a new tab and navigate to the specified URL
    chrome.tabs.create({ url: url }, function(tab) {

      // Listen for tab updates
      chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, updatedTab) {
        if (tabId === tab.id && changeInfo.status === "complete") {
          // Tab has fully loaded, send the data to the content script
          chrome.tabs.sendMessage(tab.id, { action: "setData", additionalVariable: request.additionalVariable });

          // Remove the listener to avoid duplicates
          chrome.tabs.onUpdated.removeListener(this);
        }
      });
    });
  }
});
