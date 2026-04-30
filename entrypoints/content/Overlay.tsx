import html2canvas from "html2canvas"
import { useEffect, useRef, useState } from "react"

interface OverlayProps {
  screenshotUrl: string
  onClose: () => void
}

export default function Overlay({ screenshotUrl, onClose }: OverlayProps) {
  const [showFrame] = useState(true)
  const [showNotification, setShowNotification] = useState(false)
  const captureRef = useRef<HTMLDivElement>(null)

  // close on ESC
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [onClose])

  // Capture the screenshot-container with gradient background.
  // html2canvas does not traverse Shadow DOM, so we temporarily clone the
  // node into the light DOM along with the shadow root's <style> tags,
  // capture it, then remove it.
  const captureCanvas = async (): Promise<HTMLCanvasElement | null> => {
    const source = captureRef.current
    if (!source) return null

    const root = source.getRootNode()
    const styleNodes: Node[] =
      root instanceof ShadowRoot
        ? Array.from(
            root.querySelectorAll("style, link[rel='stylesheet']")
          ).map((n) => n.cloneNode(true))
        : []

    const clone = source.cloneNode(true) as HTMLDivElement
    const wrapper = document.createElement("div")
    wrapper.style.cssText = [
      "position: fixed",
      "top: 0",
      "left: -100000px",
      "z-index: -1",
      "pointer-events: none",
      `width: ${source.offsetWidth}px`
    ].join(";")
    styleNodes.forEach((s) => wrapper.appendChild(s))
    wrapper.appendChild(clone)
    document.body.appendChild(wrapper)

    try {
      const canvas = await html2canvas(clone, {
        allowTaint: true,
        useCORS: true,
        logging: false,
        scale: 2,
        backgroundColor: null
      })
      return canvas
    } finally {
      wrapper.remove()
    }
  }

  const downloadImage = async () => {
    try {
      const canvas = await captureCanvas()
      if (!canvas) return
      const imgData = canvas.toDataURL("image/png")
      const link = document.createElement("a")
      link.href = imgData
      link.download = `framely-${new Date().getTime()}.png`
      link.click()
    } catch (error) {
      console.error("Failed to download:", error)
      alert("Download failed, please try again")
    }
  }

  const copyToClipboard = async () => {
    try {
      const canvas = await captureCanvas()
      if (!canvas) return
      const imgData = canvas.toDataURL("image/png")
      const blob = await (await fetch(imgData)).blob()
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob })
      ])
      setShowNotification(true)
      setTimeout(() => setShowNotification(false), 2000)
    } catch (error) {
      console.error("Failed to copy to clipboard:", error)
      alert("Copy failed, please try right-clicking the image to copy manually")
    }
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className="framely-overlay-backdrop" onClick={handleBackdropClick}>
      <div className="framely-overlay-modal">
        <header className="header">
          <div className="title-container">
            <h1 className="title">Framely</h1>
            <span className="subtitle">Stylish Browser Frames</span>
          </div>
          <div className="actions">
            <button className="action-button" onClick={copyToClipboard}>
              Copy
            </button>
            <button className="action-button" onClick={downloadImage}>
              Download
            </button>
            <button
              className="close-button"
              onClick={onClose}
              aria-label="Close">
              ×
            </button>
          </div>
        </header>

        <div className="screenshot-container" ref={captureRef}>
          <div
            className={`browser-frame-container ${showFrame ? "" : "no-frame"}`}>
            {showFrame ? (
              <div className="browser-frame">
                <svg
                  className="browser-svg"
                  width="1024"
                  height="36"
                  viewBox="0 0 1024 36"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M0 8C0 3.58172 3.58172 0 8 0H1016C1020.42 0 1024 3.58172 1024 8V36H0V8Z"
                    fill="#F2F2F2"
                  />
                  <circle cx="24" cy="18" r="6" fill="#FF5F56" />
                  <circle cx="46" cy="18" r="6" fill="#FFBD2E" />
                  <circle cx="68" cy="18" r="6" fill="#27C93F" />
                  <rect
                    x="162"
                    y="8"
                    width="700"
                    height="20"
                    rx="10"
                    fill="white"
                  />
                </svg>
                <img
                  src={screenshotUrl}
                  alt="page screenshot"
                  className="screenshot-image"
                />
              </div>
            ) : (
              <img
                src={screenshotUrl}
                alt="page screenshot"
                className="screenshot-image-no-frame"
              />
            )}
          </div>
        </div>

        <p className="home-link-container">
          <a
            href="https://chromewebstore.google.com/detail/framely/hgmdobenglfkhkibfipobpplnmbobnbi"
            target="_blank"
            rel="noreferrer"
            className="home-link">
            Home page
          </a>
        </p>

        {showNotification && (
          <div className="notification">Copied to clipboard!</div>
        )}
      </div>
    </div>
  )
}
