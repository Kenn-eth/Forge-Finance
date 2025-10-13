# Crowdfunding DApp Frontend

A modern, responsive frontend for the decentralized crowdfunding platform built with Next.js, TypeScript, and Tailwind CSS.

## Features

- 🔗 **Wallet Integration**: Connect with Coinbase Wallet and other Web3 wallets via RainbowKit
- 📝 **User Registration**: Complete KYC registration for both investors and businesses
- 🏦 **Smart Wallet Generation**: Automatic smart wallet creation after successful registration
- 🎨 **Modern UI**: Beautiful, responsive design with dark mode support
- ⚡ **Real-time Updates**: Live transaction status and registration updates

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Web3**: Wagmi v2 + RainbowKit
- **Blockchain**: Base Network (Ethereum L2)
- **State Management**: React Query (TanStack Query)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- A WalletConnect Project ID (get from [WalletConnect Cloud](https://cloud.walletconnect.com/))

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
```

3. Update `.env.local` with your configuration:
```env
# Wallet Connect Project ID
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id_here

# Contract Addresses (replace with actual deployed addresses)
NEXT_PUBLIC_KYC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_BUSINESS_WALLET_FACTORY_ADDRESS=0x...
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### For Users

1. **Connect Wallet**: Click the "Connect Wallet" button and select your preferred wallet (Coinbase Wallet recommended)

2. **Choose Role**: Select whether you want to register as an Investor or Business

3. **Complete Registration**: Fill out the required information form

4. **Submit**: Click "Complete Registration & Generate Smart Wallet" to submit your registration

5. **Verification**: Wait for KYC verification (handled by admin)

### For Developers

#### Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── layout.tsx      # Root layout with providers
│   ├── page.tsx        # Home page
│   └── globals.css     # Global styles
├── components/         # React components
│   ├── Hero.tsx        # Landing page hero section
│   ├── RegistrationForm.tsx # User registration form
│   └── providers.tsx   # Web3 providers wrapper
└── lib/               # Utility libraries
    ├── contracts.ts    # Contract addresses and ABIs
    ├── ipfs.ts        # IPFS utilities (mock implementation)
    └── wagmi.ts       # Wagmi configuration
```

#### Key Components

- **Hero**: Landing page for unconnected users
- **RegistrationForm**: Complete registration flow with role selection
- **Providers**: Web3 provider setup with RainbowKit

#### Contract Integration

The app integrates with the KYC Registry contract for user registration:

```typescript
// Register a user with a specific role
writeContract({
  address: CONTRACTS.KYC_REGISTRY,
  abi: KYC_REGISTRY_ABI,
  functionName: 'registerUser',
  args: [roleValue], // USER_ROLES.INVESTOR or USER_ROLES.BUSINESS
});
```

#### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` | WalletConnect project ID | Yes |
| `NEXT_PUBLIC_KYC_CONTRACT_ADDRESS` | KYC Registry contract address | Yes |
| `NEXT_PUBLIC_BUSINESS_WALLET_FACTORY_ADDRESS` | Business Wallet Factory address | Yes |

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Adding New Features

1. Create components in `src/components/`
2. Add contract interactions in `src/lib/contracts.ts`
3. Update types and interfaces as needed
4. Test with different wallet connections

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy automatically on push

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- Railway
- DigitalOcean App Platform

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, please open an issue in the GitHub repository or contact the development team.