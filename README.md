# 🚀 Freelance Invoice AI on Base

**AI-powered freelance invoice generation with Smart Wallet technology on Base**

A revolutionary dApp that automates freelance payments using AI milestone generation, Smart Wallet batching, gasless transactions, and MiniKit integration for viral distribution across Coinbase Wallet and Farcaster.

## ✨ Features

### 🤖 AI-Powered Milestone Generation
- **OpenAI GPT-4tegration**: Automatically generates logical project milestones
- **Smart Amount Distribution**: AI calculates optimal milestone amounts based on project scope
- **Customizable Workflows**: Supports various freelance project types

### 💰 Smart Wallet Technology
- **Coinbase Smart Wallet**: Passkey-based, account abstraction wallets
- **Transaction Batching**: Combine USDC approval + invoice creation in one transaction
- **Gasless Transactions**: Milestone completion without gas fees via paymaster
- **Dynamic Integration**: Seamless Smart Wallet onboarding

### 📱 MiniKit Integration
- **Frame Discovery**: App appears in Coinbase Wallet's discover section
- **Farcaster Sharing**: One-click sharing with embedded dashboard links
- **Viral Distribution**: Save invoices as frames, share on social feeds
- **Notification System**: Milestone completions trigger wallet notifications

### 🔗 Multi-Wallet Support
- **Coinbase Wallet**: Native integration with enhanced UX
- **RainbowKit**: Polished wallet connection modal
- **Base Sepolia**: Testnet deployment with USDC support

### 🤖 AI Agent Integration
- **AgentKit Backend**: Autonomous milestone completion
- **Auto-Processing**: AI agents can complete milestones automatically
- **Notification System**: Real-time updates on milestone status

## 🏗️ Architecture

```
Frontend (Next.js 15 + TypeScript)
├── MiniKit Integration (Frame discovery & social sharing)
├── Smart Wallet (Dynamic + Coinbase)
├── RainbowKit (Wallet connection UI)
└── Wagmi (Ethereum interactions)

Backend (Node.js + Express)
├── OpenAI GPT-4o (Milestone generation)
├── AgentKit (Autonomous agents)
└── Notification API (MiniKit integration)

Smart Contracts (Solidity)
├── InvoiceAgent (Invoice & milestone management)
├── USDC Integration (Payment processing)
└── Base Sepolia Deployment
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Coinbase Wallet or MetaMask
- Base Sepolia testnet USDC

### 1. Clone Repository
```bash
git clone https://github.com/KeldrickD/freelance-invoice-ai.git
cd freelance-invoice-ai
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory:

```env
# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key

# CDP API Key for MiniKit
NEXT_PUBLIC_CDP_API_KEY=your_cdp_api_key

# WalletConnect Project ID
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id

# Dynamic Environment ID
NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID=your_dynamic_environment_id

# App Metadata for Frame Discovery
NEXT_PUBLIC_APP_NAME=Freelance Invoice AI"
NEXT_PUBLIC_APP_DESCRIPTION="AI-powered freelance invoice generation with Smart Wallet technology on Base"
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_APP_ICON=https://your-domain.com/icon.png
NEXT_PUBLIC_SPLASH_IMAGE=https://your-domain.com/splash.png
NEXT_PUBLIC_APP_HERO_IMAGE=https://your-domain.com/hero.png
NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR=#052ff

# Optional: Alchemy API Key for better RPC
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_api_key

# Optional: OpenFort API Key for gasless transactions
NEXT_PUBLIC_OPENFORT_API_KEY=your_openfort_api_key
```

### 4. Start Backend Server
```bash
cd backend
npm install
node server.js
```

### 5Start Frontend
```bash
npm run dev
```

Visit `http://localhost:300 to use the app!

## 🎯 How It Works

### 1. **Connect Wallet**
- Choose between Coinbase Wallet or Smart Wallet
- App detects if running in Coinbase Wallet frame

###2enerate Milestones**
- Enter project description and total USDC amount
- AI generates logical milestones with optimal amount distribution
- Review and customize if needed

### 3. **Create Invoice**
- Approve USDC spending for the contract
- Create onchain invoice (escrows USDC)
- Smart Wallet users get batched transactions

###4omplete Milestones**
- Manually complete milestones or use AI auto-completion
- Smart Wallet users get gasless milestone completion
- Payments are automatically released to freelancer

### 5. **Share & Discover**
- Save invoice as frame in wallet
- Share on Farcaster with embedded dashboard
- App appears in Coinbase Wallet discover section

## 🔧 Smart Contracts

### InvoiceAgent Contract
- **Address**: `0xe22fa829343049B5AD351423b7F743` (Base Sepolia)
- **Features**: Invoice creation, milestone management, USDC escrow
- **Fee**: 2% on total invoice amount

### Key Functions
```solidity
createInvoice(address _freelancer, uint256 _totalAmount, string] _milestoneNames, uint256[] _milestoneAmounts, string _projectDescription)
completeMilestone(uint256invoiceId, uint256 _milestoneIndex)
getInvoice(uint256 _invoiceId)
```

## 📱 MiniKit Features

### Frame Discovery
- **Farcaster Manifest**: `/.well-known/farcaster.json`
- **OpenGraph Metadata**: Frame-ready social sharing
- **Notification API**: `/api/notification` for milestone updates

### Social Integration
- **Save as Frame**: Store invoices in users wallet
- **Farcaster Sharing**: One-click social sharing
- **Basescan Integration**: Direct blockchain explorer links

## 🎨 UI/UX Features

### Modern Design
- **Gradient Backgrounds**: Professional visual appeal
- **Responsive Layout**: Works on desktop and mobile
- **Loading States**: Smooth user experience
- **Toast Notifications**: Real-time feedback

### Smart Wallet Detection
- **Frame Context**: Detects when running in Coinbase Wallet
- **Wallet Type Display**: Shows Smart Wallet vs Regular Wallet
- **Feature Indicators**: Highlights available capabilities

## 🚀 Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2ironment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables for Production
```env
NEXT_PUBLIC_APP_URL=https://your-vercel-domain.vercel.app
NEXT_PUBLIC_CDP_API_KEY=your_cdp_api_key
OPENAI_API_KEY=your_openai_api_key
```

## 🔒 Security

### Smart Contract Security
- **OpenZeppelin**: Battle-tested contract libraries
- **Access Control**: Proper permission management
- **Reentrancy Protection**: Secure payment processing

### Frontend Security
- **Environment Variables**: Sensitive data protected
- **Input Validation**: Client and server-side validation
- **Error Handling**: Graceful error management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature`)
4.Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Coinbase Developer Platform**: MiniKit and CDP SDK
- **Base Network**: Layer 2 scaling solution
- **OpenAI**: GPT-4o for milestone generation
- **Dynamic**: Smart Wallet infrastructure
- **RainbowKit**: Wallet connection UI
- **Wagmi**: Ethereum React hooks

## 📞 Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/KeldrickD/freelance-invoice-ai/issues)
- **Documentation**: Check the code comments for detailed explanations
- **Community**: Join the Base ecosystem Discord

---

**Built with ❤️ for the Coinbase Developer Platform Hackathon**

*Transform your freelance workflow with AI-powered, wallet-native invoice management on Base!*
