import { useEffect, useState } from "react"

import "./index.css"

export default function Screenshot() {
  const [screenshot, setScreenshot] = useState<string | null>(null)

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
  const downloadImage = () => {
    if (!screenshot) return

    const link = document.createElement("a")
    link.href = screenshot
    link.download = `framely-${new Date().getTime()}.png`
    link.click()
  }

  return (
    <div className="screenshot-page">
      <header className="header">
        <h1 className="title">Framely</h1>
        <button className="download-button" onClick={downloadImage}>
          Download image
        </button>
      </header>

      <div className="screenshot-container">
        {screenshot ? (
          <img
            src={screenshot}
            alt="page screenshot"
            className="screenshot-image"
          />
        ) : (
          <div className="loading-message">loading screenshot...</div>
        )}
      </div>
    </div>
  )
}
