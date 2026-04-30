import html2canvas from "html2canvas"
import { useEffect, useRef, useState } from "react"

interface OverlayProps {
  screenshotUrl: string
  onClose: () => void
}

// Inline gradient (rgb) so html2canvas can parse it. Tailwind v4 emits
// oklch() colors which html2canvas cannot read and would render transparent.
const GRADIENT_BG = "linear-gradient(to right, #86efac, #c084fc)"

export default function Overlay({ screenshotUrl, onClose }: OverlayProps) {
  const [showFrame] = useState(true)
  const [showNotification, setShowNotification] = useState(false)
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null)
  const [areaSize, setAreaSize] = useState<{ w: number; h: number } | null>(
    null
  )
  const captureRef = useRef<HTMLDivElement>(null)
  const areaRef = useRef<HTMLDivElement>(null)

  // Padding (px) around the framed image inside the gradient box.
  const FRAME_PADDING = 32

  // Compute the largest frame size that fits within the available area
  // (after subtracting the gradient box padding) while preserving aspect.
  let frameW = 0
  let frameH = 0
  if (imgSize && areaSize) {
    const totalNaturalH = imgSize.h + (showFrame ? (imgSize.w * 36) / 1024 : 0)
    const ratio = imgSize.w / totalNaturalH // width / height
    const availW = Math.max(0, areaSize.w - FRAME_PADDING * 2)
    const availH = Math.max(0, areaSize.h - FRAME_PADDING * 2)
    const widthByHeight = availH * ratio
    frameW = Math.min(availW, widthByHeight)
    frameH = frameW / ratio
  }

  // Observe the available area inside captureRef (excluding its p-8 padding
  // is automatic because we measure the inner area element directly).
  useEffect(() => {
    const el = areaRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const cr = e.contentRect
        setAreaSize({ w: cr.width, h: cr.height })
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

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

    // Use the screenshot's natural dimensions so the exported image keeps
    // its original resolution instead of the on-screen (possibly downscaled)
    // size. Scale the gradient padding so it looks visually identical to
    // what the user sees on screen (where padding is 32px relative to the
    // displayed frame width).
    const sourceImg = source.querySelector("img")
    const naturalWidth = sourceImg?.naturalWidth ?? 0
    // Displayed frame width = clone root contentBox width = offsetWidth - 64.
    const displayedFrameWidth = Math.max(1, source.offsetWidth - 64)
    const scale = naturalWidth > 0 ? naturalWidth / displayedFrameWidth : 1
    const capturePadding = Math.round(32 * scale)
    const captureWidth =
      naturalWidth > 0 ? naturalWidth + capturePadding * 2 : source.offsetWidth

    // Override sizing on the cloned root so it lays out at full natural size.
    clone.style.width = `${captureWidth}px`
    clone.style.maxWidth = "none"
    clone.style.maxHeight = "none"
    clone.style.height = "auto"
    clone.style.flex = "none"
    clone.style.padding = `${capturePadding}px`
    // Strip the on-screen sizing we applied to the framed box (aspect-ratio,
    // width:100%, height:100%, container-query units). In the off-screen
    // wrapper the parent height is auto, so height:100% would collapse to 0
    // and the captured PNG would lose padding + gradient + image.
    clone.querySelectorAll<HTMLElement>("*").forEach((el) => {
      el.style.maxHeight = "none"
      el.style.maxWidth = "none"
      el.style.aspectRatio = ""
      el.style.containerType = ""
      // Reset width/height we set inline (don't touch elements without inline styles).
      if (el.style.width) el.style.width = "100%"
      if (el.style.height) el.style.height = "auto"
      if (el.tagName === "IMG") {
        el.style.height = "auto"
        el.style.width = "100%"
        el.style.flex = "none"
      }
    })

    const wrapper = document.createElement("div")
    wrapper.style.cssText = [
      "position: fixed",
      "top: 0",
      "left: -100000px",
      "z-index: -1",
      "pointer-events: none",
      `width: ${captureWidth}px`
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
    <div className="fixed inset-0 z-[2147483647] box-border flex flex-col items-center justify-start overflow-hidden bg-black/90 p-8 font-sans">
      <div className="relative box-border flex min-h-0 w-auto max-w-full flex-1 flex-col rounded-xl">
        <div
          ref={areaRef}
          className="flex min-h-0 max-h-full max-w-full flex-1 items-center justify-center overflow-hidden">
          <div
            ref={captureRef}
            className="flex items-center justify-center overflow-hidden rounded-lg"
            style={{
              backgroundImage: GRADIENT_BG,
              padding: `${FRAME_PADDING}px`,
              ...(frameW > 0
                ? {
                    width: `${frameW + FRAME_PADDING * 2}px`,
                    height: `${frameH + FRAME_PADDING * 2}px`
                  }
                : { visibility: "hidden" })
            }}>
            <div
              className={
                showFrame
                  ? "relative z-1 flex flex-col overflow-hidden rounded-lg bg-white"
                  : "relative z-1 flex flex-col overflow-hidden bg-white"
              }
              style={
                frameW > 0
                  ? { width: `${frameW}px`, height: `${frameH}px` }
                  : undefined
              }>
              {showFrame ? (
                <>
                  <svg
                    className="block h-auto w-full shrink-0"
                    viewBox="0 0 1024 36"
                    preserveAspectRatio="xMidYMid meet"
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
                    className="block w-full min-h-0 flex-1 bg-white"
                    onLoad={(e) => {
                      const t = e.currentTarget
                      setImgSize({ w: t.naturalWidth, h: t.naturalHeight })
                    }}
                  />
                </>
              ) : (
                <img
                  src={screenshotUrl}
                  alt="page screenshot"
                  className="block h-full w-full rounded-lg bg-white shadow-[0_10px_25px_rgba(0,0,0,0.15)]"
                  onLoad={(e) => {
                    const t = e.currentTarget
                    setImgSize({ w: t.naturalWidth, h: t.naturalHeight })
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {showNotification && (
          <div className="fixed left-1/2 top-5 z-[2147483647] -translate-x-1/2 animate-[slideDown_0.3s_ease-out] rounded bg-neutral-800 px-6 py-3 text-sm text-white shadow-[0_2px_8px_rgba(0,0,0,0.15)]">
            Copied to clipboard!
          </div>
        )}
      </div>

      <div className="mt-3 shrink-0 rounded-xl border border-white/10 bg-white/5 p-2 px-4">
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
