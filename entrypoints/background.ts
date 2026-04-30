export default defineBackground(() => {
  chrome.action.onClicked.addListener(async (tab) => {
    if (!tab?.id) return

    try {
      const screenshotUrl = await chrome.tabs.captureVisibleTab()

      // try to show overlay in current page via content script
      try {
        await chrome.tabs.sendMessage(tab.id, {
          type: "SHOW_OVERLAY",
          screenshotUrl
        })
        return
      } catch (err) {
        // content script not available (restricted pages like chrome://,
        // chrome web store, etc.) — fall back to opening a new tab
        console.warn("overlay injection failed, falling back to new tab:", err)
      }

      // fallback: stash screenshot then open viewer tab
      await chrome.storage.local.set({ "framely-screenshot": screenshotUrl })
      await chrome.tabs.create({
        url: chrome.runtime.getURL("/tabs.html"),
        active: true
      })
    } catch (error) {
      console.error("screenshot failed:", error)
    }
  })
})
