# XAH Price Oracle for Xahau Network

A Node.js example that automatically updates XAH (Xahau) price data on the Xahau blockchain every minute using the SetRemarks transaction type.

## 🚀 Features

- **Real-time Price Updates**: Fetches XAH/USD price from CoinGecko API every 60 seconds
- **Blockchain Integration**: Updates price data directly on Xahau Testnet using SetRemarks
- **Robust Error Handling**: Automatic reconnection and error recovery
- **Environment Variables**: Secure configuration management with .env files
- **Production Ready**: Built for 24/7 operation with comprehensive logging

## 📋 Requirements

- Node.js 16+ 
- npm or yarn
- Xahau account with sufficient balance for transaction fees
- Valid Xahau account seed

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd xahau-price-oracle
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   ```bash
   cp .env.example .env
   ```

4. **Configure your environment variables** (see Configuration section)

## ⚙️ Configuration

Create a `.env` file in the project root with the following variables:

```env
# Xahau Configuration
SEED=sn1x8sxxxxxxxxxxxxxxxxxxxxxxxxxx
NETWORK=wss://xahau-test.net
OBJECT_ID=532CA539246F7600B89C335F2FE54DC247D883748AB1A881A4DF01E753368DD7
API_URL=https://api.coingecko.com/api/v3/simple/price?ids=xahau&vs_currencies=usd
```

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `SEED` | Your Xahau account seed phrase | ✅ Yes | - |
| `NETWORK` | Xahau network WebSocket URL | No | `wss://xahau-test.net` |
| `OBJECT_ID` | Target object ID for SetRemarks | ✅ Yes | - |
| `API_URL` | CoinGecko API endpoint | No | CoinGecko XAH/USD endpoint |

## 🚀 Usage

### Basic Usage

```bash
npm start
```

or

```bash
node xahau_price_oracle.js
```

### Using as a Module

```javascript
const XahauPriceOracle = require('./xahau_price_oracle');

const oracle = new XahauPriceOracle();
await oracle.start();
```

## 📊 Output Example

```
🚀 Starting XAH Price Oracle
🎯 Updates every 60 seconds

📋 Configuration loaded from .env:
  NETWORK: wss://xahau-test.net
  OBJECT_ID: 532CA539246F7600B89C335F2FE54DC247D883748AB1A881A4DF01E753368DD7
  API_URL: https://api.coingecko.com/api/v3/simple/price?ids=xahau&vs_currencies=usd

🟢 Connected to Xahau Testnet
📍 Account: rsPUkjW4ukdwKEP6EqhRfsUN9cqqQr9rkr
🎯 Object to update: 532CA539246F7600B89C335F2FE54DC247D883748AB1A881A4DF01E753368DD7
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 Fetching XAH price...
✅ Price updated: $0.053318 USD
📝 TX Hash: E1F8E736D59070FEA0B3FA91C608975EF5D63E47246A9BBA8CA13EF196ADEC9D
🕐 2025-06-10T15:30:45.171Z
📊 Update #1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Oracle started. Press Ctrl+C to stop.
```

## 🔍 Data Structure

The oracle updates two remarks on the specified object:

| Remark Name | Description | Example |
|-------------|-------------|---------|
| `XAH_PRICE_USD` | Current XAH price in USD | `0.053318` |
| `LAST_UPDATE` | ISO timestamp of last update | `2025-06-10T15:30:45.171Z` |

## 🛠️ Dependencies

```json
{
  "xrpl": "^3.0.0",
  "xrpl-accountlib": "^1.2.0",
  "dotenv": "^16.0.0"
}
```

## 🔐 Security

- **Never commit your `.env` file** to version control
- Add `.env` to your `.gitignore` file
- Use environment-specific `.env` files for different deployments
- Keep your seed phrase secure and never share it

## 🚦 Error Handling

The oracle includes comprehensive error handling for:

- **Network disconnections**: Automatic reconnection with backoff
- **API failures**: Retry on next cycle
- **Transaction failures**: Detailed error logging
- **Process signals**: Clean shutdown on SIGINT/SIGTERM
- **Unhandled errors**: Graceful recovery and logging

## 📈 Monitoring

The oracle provides detailed logging for monitoring:

- Connection status
- Price fetch results
- Transaction confirmations
- Error conditions
- Update statistics

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CoinGecko     │    │  XAH Price      │    │   Xahau         │
│   API           │───▶│  Oracle         │───▶│   Network       │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │  SetRemarks     │
                       │  Transaction    │
                       └─────────────────┘
```

## 🔄 Process Flow

1. **Initialize**: Load configuration and connect to Xahau network
2. **Fetch Price**: Query CoinGecko API for current XAH/USD price
3. **Update Blockchain**: Send SetRemarks transaction with price data
4. **Wait**: Sleep for 60 seconds
5. **Repeat**: Return to step 2

## 🐛 Troubleshooting

### Common Issues

**Connection errors**:
- Verify your network URL is correct
- Check your internet connection
- Ensure Xahau network is operational

**Transaction failures**:
- Verify your account has sufficient XAH balance
- Check that your seed is valid
- Ensure the object ID exists and is accessible

**API failures**:
- Verify the CoinGecko API URL is correct
- Check for API rate limits
- Ensure internet connectivity

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For questions or support:
- Open an issue on GitHub
- Check the troubleshooting section
- Review the logs for error details

## 🔗 Links

- [Xahau Network](https://xahau.network/)
- [CoinGecko API](https://www.coingecko.com/en/api)


---

**⚠️ Disclaimer**: This software is provided as-is. Use at your own risk. Always test thoroughly before deploying to production environments.