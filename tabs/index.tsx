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

  // download image
  // TODO: download image with frame
  const downloadImage = () => {
    if (!screenshot) return

    const link = document.createElement("a")
    link.href = screenshot
    link.download = `framely-${new Date().getTime()}.png`
    link.click()
  }

  // Copy the entire framed screenshot to clipboard
  const copyToClipboard = async () => {
    if (!containerRef.current) return

    try {
      // Create a temporary canvas element
      const canvas = document.createElement("canvas")
      const context = canvas.getContext("2d")
      if (!context) throw new Error("Cannot create canvas context")

      // Get container dimensions
      const container = containerRef.current
      const { width, height } = container.getBoundingClientRect()

      // Set canvas dimensions
      canvas.width = width
      canvas.height = height

      // Draw HTML to canvas
      const svgData = new XMLSerializer().serializeToString(container)
      const img = new Image()

      // Create SVG Blob
      const svgBlob = new Blob([svgData], {
        type: "image/svg+xml;charset=utf-8"
      })
      const url = URL.createObjectURL(svgBlob)

      // Draw to canvas when image is loaded
      await new Promise((resolve) => {
        img.onload = () => {
          context.drawImage(img, 0, 0, width, height)
          resolve(null)
        }
        img.src = url
      })

      // Get image data from canvas
      const imgData = canvas.toDataURL("image/png")

      // Copy to clipboard
      const blob = await (await fetch(imgData)).blob()
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob })
      ])

      alert("Copied to clipboard!")

      // Cleanup
      URL.revokeObjectURL(url)
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
                  height="44"
                  viewBox="0 0 1024 44"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg">
                  {/* browser top bar background */}
                  <path
                    d="M0 8C0 3.58172 3.58172 0 8 0H1016C1020.42 0 1024 3.58172 1024 8V44H0V8Z"
                    fill="#F2F2F2"
                  />

                  {/* window control buttons */}
                  <circle cx="24" cy="22" r="6" fill="#FF5F56" />
                  <circle cx="46" cy="22" r="6" fill="#FFBD2E" />
                  <circle cx="68" cy="22" r="6" fill="#27C93F" />

                  {/* address bar */}
                  <rect
                    x="162"
                    y="12"
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
