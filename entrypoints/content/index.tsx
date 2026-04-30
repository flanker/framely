import { useEffect, useState } from "react"
import ReactDOM from "react-dom/client"

import Overlay from "./Overlay"

import "./style.css"

interface ShowOverlayMessage {
  type: "SHOW_OVERLAY"
  screenshotUrl: string
}

function isShowOverlayMessage(value: unknown): value is ShowOverlayMessage {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { type?: unknown }).type === "SHOW_OVERLAY" &&
    typeof (value as { screenshotUrl?: unknown }).screenshotUrl === "string"
  )
}

function App() {
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null)

  useEffect(() => {
    const listener = (
      message: unknown,
      _sender: chrome.runtime.MessageSender,
      sendResponse: (response?: unknown) => void
    ) => {
      if (isShowOverlayMessage(message)) {
        setScreenshotUrl(message.screenshotUrl)
        sendResponse({ ok: true })
      }
    }
    chrome.runtime.onMessage.addListener(listener)
    return () => chrome.runtime.onMessage.removeListener(listener)
  }, [])

  if (!screenshotUrl) return null
  return (
    <Overlay
      screenshotUrl={screenshotUrl}
      onClose={() => setScreenshotUrl(null)}
    />
  )
}

export default defineContentScript({
  matches: ["<all_urls>"],
  cssInjectionMode: "ui",
  runAt: "document_end",

  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: "framely-overlay",
      position: "inline",
      anchor: "body",
      append: "last",
      onMount: (container) => {
        const wrapper = document.createElement("div")
        container.append(wrapper)
        const root = ReactDOM.createRoot(wrapper)
        root.render(<App />)
        return { root, wrapper }
      },
      onRemove: (elements) => {
        elements?.root.unmount()
        elements?.wrapper.remove()
      }
    })
    ui.mount()
  }
})
