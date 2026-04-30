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
    <div className="w-[300px] p-4 font-sans">
      <h1 className="m-0 mb-2 text-xl font-bold text-blue-600">Framely</h1>
      <p className="m-0 mb-4 text-sm text-gray-500">
        Click the button below to capture the current page
      </p>
      <button
        className="w-full rounded bg-blue-600 px-2.5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
        onClick={captureAndShow}
        disabled={isLoading}>
        {isLoading ? "Capturing..." : "Capture page"}
      </button>
    </div>
  )
}
