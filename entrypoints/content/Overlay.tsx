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

  return (
    <div className="fixed inset-0 z-[2147483647] box-border flex items-start justify-center overflow-auto bg-black/90 p-6 font-sans">
      <div className="relative  box-border w-auto rounded-xl bg-white shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
        <div
          className="flex items-center justify-center overflow-auto max-w-full rounded-lg bg-linear-to-r from-green-300 to-purple-400 p-8"
          ref={captureRef}>
          <div
            className={
              showFrame
                ? "relative z-1 mx-auto flex w-5xl max-w-full flex-col overflow-hidden rounded-lg bg-white shadow-[0_10px_25px_rgba(0,0,0,0.15)]"
                : "relative z-1 mx-auto flex w-5xl max-w-full flex-col overflow-hidden bg-white"
            }>
            {showFrame ? (
              <div className="flex flex-col">
                <svg
                  className="shrink-0"
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
                  className="block h-auto w-full bg-white"
                />
              </div>
            ) : (
              <img
                src={screenshotUrl}
                alt="page screenshot"
                className="block h-auto max-w-full rounded-lg bg-white shadow-[0_10px_25px_rgba(0,0,0,0.15)]"
              />
            )}
          </div>
        </div>

        {showNotification && (
          <div className="fixed left-1/2 top-5 z-[2147483647] -translate-x-1/2 animate-[slideDown_0.3s_ease-out] rounded bg-neutral-800 px-6 py-3 text-sm text-white shadow-[0_2px_8px_rgba(0,0,0,0.15)]">
            Copied to clipboard!
          </div>
        )}
      </div>

      <div className="absolute bottom-0 border-l border-t border-r rounded-t-xl border-white/10 bg-white/5 p-2 px-4">
        <div className="flex items-center justify-between gap-4">
          {/* <div className="flex flex-col items-start">
            <a
              href="https://chromewebstore.google.com/detail/framely/hgmdobenglfkhkibfipobpplnmbobnbi"
              target="_blank"
              rel="noreferrer"
              className=" text-sm text-white  ">
              Framely
            </a>
          </div> */}
          <div className="flex items-center gap-3">
            <button
              className="cursor-pointer rounded border-none bg-white/5 px-4 h-8 text-sm text-white hover:bg-white/10"
              onClick={copyToClipboard}>
              Copy
            </button>
            <button
              className="cursor-pointer rounded border-none bg-white/5 px-4 h-8 text-sm text-white hover:bg-white/10"
              onClick={downloadImage}>
              Download
            </button>
            <button
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded text-lg leading-none text-gray-500 hover:bg-white/10 hover:text-white"
              onClick={onClose}
              aria-label="Close">
              ×
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
