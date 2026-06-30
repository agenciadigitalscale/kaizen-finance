import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'br.com.kaizen.finance',
  appName: 'Kaizen Finance',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  android: {
    backgroundColor: '#060A0E',
  },
  ios: {
    backgroundColor: '#060A0E',
  },
}

export default config
