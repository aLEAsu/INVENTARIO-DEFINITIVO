import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Solo los subconjuntos latin/latin-ext (cubren espanol: ñ, acentos, ¿¡) —
// se omiten cyrillic/greek/vietnamese para no inflar el precache de la PWA.
// IBM Plex Mono es la voz de pantalla (titulos, nav, datos); IBM Plex Sans
// solo para parrafos largos — misma familia tipografica, dos registros.
import '@fontsource/ibm-plex-mono/latin-400.css'
import '@fontsource/ibm-plex-mono/latin-500.css'
import '@fontsource/ibm-plex-mono/latin-600.css'
import '@fontsource/ibm-plex-mono/latin-ext-400.css'
import '@fontsource/ibm-plex-mono/latin-ext-500.css'
import '@fontsource/ibm-plex-mono/latin-ext-600.css'
import '@fontsource/ibm-plex-sans/latin-400.css'
import '@fontsource/ibm-plex-sans/latin-500.css'
import '@fontsource/ibm-plex-sans/latin-600.css'
import '@fontsource/ibm-plex-sans/latin-ext-400.css'
import '@fontsource/ibm-plex-sans/latin-ext-500.css'
import '@fontsource/ibm-plex-sans/latin-ext-600.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
