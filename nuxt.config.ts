// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  compatibilityDate: '2024-07-01',
  nitro: {
    preset: 'node-server'
  },
  modules: [],
  css: [
    'bootstrap/dist/css/bootstrap.min.css',
  ],
  devtools: { enabled: true },
  future: { compatibilityVersion: 4 },
  app: {
    head: {
      link: [],
      script: [],
    },
  }
})


