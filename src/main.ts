import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'
import { PixelPlugin, type PixelPluginConfig } from '@mekari/pixel3'
import { VueQueryPlugin } from '@tanstack/vue-query'

import "./pixel.css"

const app = createApp(App)

app.use(router)
app.use(PixelPlugin, {
  pixelTheme: true
} as PixelPluginConfig)
app.use(VueQueryPlugin)

app.mount('#app')