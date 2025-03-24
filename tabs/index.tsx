import html2canvas from "html2canvas"
import { useEffect, useRef, useState } from "react"

import "./index.css"

export default function Screenshot() {
  const [screenshot, setScreenshot] = useState<string | null>(null)
  const [showFrame, setShowFrame] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // get screenshot data from localStorage
    const screenshotData = localStorage.getItem("framely-screenshot")
    if (screenshotData) {
      setScreenshot(screenshotData)
      // clear localStorage data
      localStorage.removeItem("framely-screenshot")
    }
  }, [])

  // download image with frame if enabled
  const downloadImage = async () => {
    if (!screenshot) return

    if (showFrame && containerRef.current) {
      try {
        // Use html2canvas to capture the container with frame
        const canvas = await html2canvas(containerRef.current, {
          allowTaint: true,
          useCORS: true,
          logging: false,
          scale: 2 // Higher quality
        })

        // Get image data from canvas
        const imgData = canvas.toDataURL("image/png")

        // Download the image with frame
        const link = document.createElement("a")
        link.href = imgData
        link.download = `framely-${new Date().getTime()}.png`
        link.click()
      } catch (error) {
        console.error("Failed to download with frame:", error)
        // Fallback to downloading just the screenshot
        const link = document.createElement("a")
        link.href = screenshot
        link.download = `framely-${new Date().getTime()}.png`
        link.click()
      }
    } else {
      // Download just the screenshot without frame
      const link = document.createElement("a")
      link.href = screenshot
      link.download = `framely-${new Date().getTime()}.png`
      link.click()
    }
  }

  // Copy the entire framed screenshot to clipboard
  const copyToClipboard = async () => {
    if (!containerRef.current) return

    try {
      // Use html2canvas to capture the container
      const canvas = await html2canvas(containerRef.current, {
        allowTaint: true,
        useCORS: true,
        logging: false,
        scale: 2 // Higher quality
      })

      // Get image data from canvas
      const imgData = canvas.toDataURL("image/png")

      // Copy to clipboard
      const blob = await (await fetch(imgData)).blob()
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob })
      ])

      alert("Copied to clipboard!")
    } catch (error) {
      console.error("Failed to copy to clipboard:", error)
      alert("Copy failed, please try right-clicking the image to copy manually")
    }
  }

  // toggle frame visibility
  const toggleFrame = () => {
    setShowFrame(!showFrame)
  }

  return (
    <div className="screenshot-page">
      <header className="header">
        <h1 className="title">Framely</h1>
        <div className="actions">
          <label className="frame-toggle">
            <input type="checkbox" checked={showFrame} onChange={toggleFrame} />
            show browser frame
          </label>
          <button className="action-button" onClick={copyToClipboard}>
            copy image
          </button>
          <button className="action-button" onClick={downloadImage}>
            download image
          </button>
        </div>
      </header>

      <div className="screenshot-container">
        {screenshot ? (
          <div
            ref={containerRef}
            className={`browser-frame-container ${showFrame ? "" : "no-frame"}`}>
            {showFrame && (
              <div className="browser-frame">
                <svg
                  className="browser-svg"
                  width="1024"
                  height="36"
                  viewBox="0 0 1024 36"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg">
                  {/* browser top bar background */}
                  <path
                    d="M0 8C0 3.58172 3.58172 0 8 0H1016C1020.42 0 1024 3.58172 1024 8V36H0V8Z"
                    fill="#F2F2F2"
                  />

                  {/* window control buttons */}
                  <circle cx="24" cy="18" r="6" fill="#FF5F56" />
                  <circle cx="46" cy="18" r="6" fill="#FFBD2E" />
                  <circle cx="68" cy="18" r="6" fill="#27C93F" />

                  {/* address bar */}
                  <rect
                    x="162"
                    y="8"
                    width="700"
                    height="20"
                    rx="10"
                    fill="white"
                  />
                </svg>

                {/* screenshot content */}
                <img
                  src={screenshot}
                  alt="page screenshot"
                  className="screenshot-image"
                />
              </div>
            )}

            {!showFrame && (
              <img
                src={screenshot}
                alt="page screenshot"
                className="screenshot-image-no-frame"
              />
            )}
          </div>
        ) : (
          <div className="loading-message">loading screenshot...</div>
        )}
      </div>
    </div>
  )
}
