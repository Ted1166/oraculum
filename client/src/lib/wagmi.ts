import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { bscTestnet, bsc, sepolia } from 'wagmi/chains'

export const config = getDefaultConfig({
  appName: 'Predict & Fund',
  projectId: 'e66cf6763596939b875f4c3a89246440', // Get from https://cloud.walletconnect.com
  chains: [bscTestnet, bsc, sepolia],
  ssr: false,
})