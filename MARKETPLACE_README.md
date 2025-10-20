# Invoice Token Marketplace

This document describes the marketplace frontend implementation for the Forge Finance invoice token platform.

## Overview

The marketplace allows investors to discover, browse, and purchase invoice tokens created by verified businesses. It provides a user-friendly interface for token discovery with filtering, search, and sorting capabilities.

## Features

### 🏪 Marketplace Features
- **Token Discovery**: Browse all available invoice tokens
- **Advanced Filtering**: Filter by status (active, matured, fulfilled), value range
- **Search Functionality**: Search by invoice number, customer name, or services
- **Sorting Options**: Sort by newest, oldest, value (high/low), or maturity date
- **Real-time Updates**: Refresh functionality to get latest token data

### 💳 Token Card Features
- **Detailed Information**: Display invoice value, loan amount, unit value, maturity date
- **Status Indicators**: Visual status badges (Active, Matured, Fulfilled, Expired)
- **Purchase Interface**: Quantity selector with price calculation
- **Availability Tracking**: Show available supply vs total supply
- **Smart Validation**: Prevent purchases when campaign is inactive or sold out

### 🧭 Navigation & UX
- **Global Navigation**: Consistent navigation across all pages
- **Responsive Design**: Mobile-friendly interface
- **Wallet Integration**: Connect wallet status display
- **Loading States**: Proper loading indicators and error handling

## File Structure

```
frontend/src/
├── components/
│   ├── InvoiceTokenCard.tsx    # Individual token display component
│   ├── Marketplace.tsx         # Main marketplace page component
│   └── Navigation.tsx          # Global navigation component
├── app/
│   ├── marketplace/
│   │   └── page.tsx           # Marketplace route
│   ├── create/
│   │   └── page.tsx           # Invoice creation route
│   ├── dashboard/
│   │   └── page.tsx           # User dashboard route
│   ├── layout.tsx             # Root layout with navigation
│   └── page.tsx               # Home page with marketplace links
└── lib/
    └── contracts.ts           # Contract integration utilities
```

## Components

### InvoiceTokenCard
Displays individual invoice tokens with:
- Token metadata (invoice number, customer, services)
- Financial details (invoice value, loan amount, unit value)
- Status and availability information
- Purchase interface with quantity selection
- Price calculation and validation

### Marketplace
Main marketplace component featuring:
- Search and filter controls
- Token grid display
- Results summary
- Loading and empty states
- Refresh functionality

### Navigation
Global navigation component with:
- Logo and branding
- Navigation links (Home, Marketplace, Create, Dashboard)
- Wallet connection status
- Mobile-responsive menu

## Contract Integration

### Current Implementation
- Mock data for development and testing
- Contract ABI definitions in `lib/contracts.ts`
- Type definitions for invoice token data
- Utility functions for data parsing

### Required Contract Functions
The marketplace expects these contract functions:
- `idToInvoiceDetails(uint256)` - Get invoice details by ID
- `idToOwner(uint256)` - Get token owner by ID
- `nonce()` - Get total number of tokens created
- `buyInvoiceTokens(uint256, uint256)` - Purchase tokens
- `claimProfitFromMaturedInvoice(uint256, uint256)` - Claim profits

### Environment Variables
Set these environment variables:
```env
NEXT_PUBLIC_INVOICE_TOKEN_CONTRACT_ADDRESS=0x...
```

## User Flow

### For Investors
1. **Discovery**: Browse marketplace to find interesting invoice tokens
2. **Research**: View detailed token information and business details
3. **Purchase**: Select quantity and buy tokens using connected wallet
4. **Monitor**: Track investments in dashboard
5. **Claim**: Claim profits when tokens mature and are fulfilled

### For Businesses
1. **Create**: Use the create invoice page to tokenize invoices
2. **List**: Tokens automatically appear in marketplace
3. **Monitor**: Track campaign progress and token sales
4. **Fulfill**: Pay back invoice when due

## Styling & Design

- **Tailwind CSS**: Utility-first CSS framework
- **Responsive Design**: Mobile-first approach
- **Color Scheme**: Blue primary, green for success, yellow for warnings
- **Typography**: Clean, readable fonts with proper hierarchy
- **Icons**: SVG icons for status indicators and actions

## Future Enhancements

### Planned Features
- **Real-time Updates**: WebSocket integration for live data
- **Advanced Analytics**: Charts and graphs for token performance
- **Favorites**: Save tokens for later review
- **Notifications**: Alerts for maturity dates and new listings
- **Portfolio Management**: Advanced portfolio tracking and analysis

### Technical Improvements
- **Caching**: Implement data caching for better performance
- **Pagination**: Handle large numbers of tokens efficiently
- **Error Boundaries**: Better error handling and recovery
- **Testing**: Unit and integration tests
- **Accessibility**: WCAG compliance improvements

## Getting Started

1. **Install Dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Set Environment Variables**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your contract addresses
   ```

3. **Run Development Server**:
   ```bash
   npm run dev
   ```

4. **Access Marketplace**:
   - Navigate to `http://localhost:3000/marketplace`
   - Or use the "Browse Marketplace" button on the home page

## Integration Notes

- The marketplace is designed to work with the existing `InvoiceTokenVault` contract
- Mock data is currently used for development - replace with actual contract calls
- Wallet connection is handled by RainbowKit/Wagmi
- All financial calculations are done in the frontend for display purposes
- Actual transactions require proper contract integration

## Support

For questions or issues with the marketplace implementation, please refer to the main project documentation or create an issue in the repository.

