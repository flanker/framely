import { useState } from "react"

import "./style.css"

export default function App() {
  const [isLoading, setIsLoading] = useState(false)

  const captureAndShow = async () => {
    setIsLoading(true)
    try {
      // get current active tab
      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true
      })
      const activeTab = tabs[0]

      if (!activeTab?.id) {
        throw new Error("failed to get current tab")
      }

      // capture visible area screenshot
      const screenshotUrl = await chrome.tabs.captureVisibleTab()

      // try to show overlay in current page via content script
      try {
        await chrome.tabs.sendMessage(activeTab.id, {
          type: "SHOW_OVERLAY",
          screenshotUrl
        })
        window.close()
        return
      } catch (err) {
        // content script not available (restricted pages like chrome://,
        // chrome web store, etc.) — fall back to opening a new tab
        console.warn("overlay injection failed, falling back to new tab:", err)
      }

      // fallback: open a new tab to display the screenshot
      await chrome.tabs.create(
        {
          url: chrome.runtime.getURL("/tabs.html"),
          active: true
        },
        () => {
          // use localStorage to pass the screenshot data
          localStorage.setItem("framely-screenshot", screenshotUrl)
        }
      )

      window.close()
    } catch (error) {
      console.error("screenshot failed:", error)
      setIsLoading(false)
    }
  }

  return (
    <div className="popup-container">
      <h1 className="title">Framely</h1>
      <p className="description">
        Click the button below to capture the current page
      </p>
      <button
        className="capture-button"
        onClick={captureAndShow}
        disabled={isLoading}>
        {isLoading ? "Capturing..." : "Capture page"}
      </button>
    </div>
  )
}
