import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { authStarten } from './auth/okta'

await authStarten()

const app = createApp(App)

app.use(router)

app.mount('#app')
