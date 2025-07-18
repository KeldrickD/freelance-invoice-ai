# Freelance Invoice AI - Built on Base

A cutting-edge freelance invoice management app built on Base with AI-powered milestone generation, onchain escrow, and seamless social sharing.

## 🚀 Features

### Core Functionality
- **AI-Powered Milestones**: Generate intelligent project milestones using xAI
- **Onchain Escrow**: Secure USDC payments with automated milestone releases
- **Smart Contract Integration**: Built on Base Sepolia with gas-optimized contracts

### Base Ecosystem Integration

#### 🏷️ ENS Name Resolution
- **Forward Resolution**: Enter `.eth` or `.base.eth` names instead of raw addresses
- **Reverse Resolution**: Display human-readable names in dashboard
- **Avatar Support**: Show profile pictures for resolved ENS names
- **Cross-Chain Support**: Works with both mainnet `.eth` and Base `.base.eth` names

#### 💳 Base Pay Features
- **Gas Sponsorship**: Optimized gas limits for contract interactions
- **Seamless UX**: No complex wallet setup required
- **Base Chain Native**: Built specifically for Base ecosystem

#### 📱 MiniKit Integration
- **Coinbase Mini App**: Full integration with Coinbase App
- **Frame Support**: Save invoices as shareable Farcaster frames
- **Social Sharing**: One-click sharing to Farcaster
- **Context-Aware UI**: Different experiences for mini app vs standalone

#### 🔗 Farcaster Integration
- **Frame Creation**: Save invoices as interactive frames
- **Social Casts**: Share project milestones on Farcaster
- **Viral Growth**: Built-in social features for project discovery

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Blockchain**: Base Sepolia, Wagmi, Viem
- **AI**: xAI integration for milestone generation
- **Social**: Farcaster frames, MiniKit
- **Styling**: Tailwind CSS, Heroicons
- **Deployment**: Vercel

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- npm or yarn
- Base Sepolia testnet access

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd freelance-invoice-ai
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Start the development server:
```bash
npm run dev
```

5. Start the backend server (for AI features):
```bash
cd backend
npm install
npm start
```

## 📖 Usage

### Creating Invoices
1. Connect your wallet (supports Coinbase Wallet, MetaMask, etc.)
2. Enter project description and total amount
3. Input freelancer address (supports ENS names like `user.eth` or `user.base.eth`)
4. Generate AI-powered milestones
5. Create onchain invoice with gas sponsorship

### Managing Invoices
- View all invoices in the dashboard
- See ENS names and avatars for participants
- Complete milestones to release payments
- Share invoices as Farcaster frames

### Mini App Mode
- Automatic wallet connection in Coinbase App
- Optimized UI for mobile experience
- Direct frame creation and sharing

## 🔧 Configuration

### Environment Variables
```env
NEXT_PUBLIC_CDP_API_KEY=your_cdp_api_key
NEXT_PUBLIC_CONTRACT_ADDRESS=your_contract_address
NEXT_PUBLIC_USDC_ADDRESS=your_usdc_address
```

### Base Chain Configuration
- **Network**: Base Sepolia testnet
- **RPC**: Alchemy/Infura endpoint
- **Explorer**: https://sepolia.basescan.org

## 🎯 Base Ecosystem Benefits

### For Users
- **Zero Gas Fees**: Gas sponsorship via Base Pay
- **Human-Readable Names**: No more copying/pasting addresses
- **Social Integration**: Share and discover projects on Farcaster
- **Mobile-First**: Seamless experience in Coinbase App

### For Developers
- **Base Native**: Built specifically for Base ecosystem
- **ENS Integration**: Leverage existing identity infrastructure
- **Social Features**: Built-in viral growth mechanisms
- **Gas Optimization**: Efficient contract interactions

## 🚀 Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Contract Deployment
1. Deploy smart contract to Base Sepolia
2. Update contract address in environment variables
3. Verify contract on Basescan

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **Base Team**: For the amazing ecosystem and tools
- **Coinbase**: For MiniKit and CDP platform
- **Farcaster**: For social infrastructure
- **xAI**: For AI-powered milestone generation

---

Built with ❤️ for the Base ecosystem and Code:NYC Hackathon
