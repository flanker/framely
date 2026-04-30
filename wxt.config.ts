import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "wxt"

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  vite: () => ({
    plugins: [tailwindcss()]
  }),
  manifest: {
    name: "Framely: Stylish Browser Frames",
    description:
      "Framely: Transform screenshots into professional mockups with browser frames. Perfect for product demos and social sharing.",
    host_permissions: ["<all_urls>"],
    permissions: ["activeTab", "storage"],
    action: {
      default_title: "Capture screenshot with Framely"
    },
    homepage_url: "https://framelyapp.com"
  }
})
