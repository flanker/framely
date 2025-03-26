import { useState } from "react"

import "./index.css"

export default function Popup() {
  const [isLoading, setIsLoading] = useState(false)

  const captureAndOpen = async () => {
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

      // create a new tab to display the screenshot
      await chrome.tabs.create(
        {
          url: chrome.runtime.getURL("tabs/index.html"),
          active: true
        },
        (newTab) => {
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
        onClick={captureAndOpen}
        disabled={isLoading}>
        {isLoading ? "Capturing..." : "Capture page"}
      </button>
    </div>
  )
}
