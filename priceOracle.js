const xrpl = require('xrpl');
const { derive, utils, signAndSubmit } = require("xrpl-accountlib");
const https = require('https');
require('dotenv').config();

// Configuration from environment variables
const seed = process.env.SEED;
const network = process.env.NETWORK || "wss://xahau-test.net";
const OBJECT_ID = process.env.OBJECT_ID;
const COINGECKO_API = process.env.API_URL || "https://api.coingecko.com/api/v3/simple/price?ids=xahau&vs_currencies=usd";

class XahauPriceOracle {
    constructor() {
        this.client = null;
        this.account = null;
        this.isRunning = false;
        this.lastPrice = null;
        this.updateCount = 0;
    }

    // Fetch XAH price from CoinGecko API
    async fetchXAHPrice() {
        return new Promise((resolve, reject) => {
            https.get(COINGECKO_API, (res) => {
                if (res.statusCode !== 200) {
                    reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
                    return;
                }

                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const json = JSON.parse(data);
                        const price = json.xahau?.usd;
                        if (price) {
                            resolve(price);
                        } else {
                            reject(new Error('XAH price not found in response'));
                        }
                    } catch (error) {
                        reject(new Error(`Error parsing JSON: ${error.message}`));
                    }
                });
            }).on('error', reject);
        });
    }

    // Connect to Xahau with error handling
    async connect() {
        try {
            this.client = new xrpl.Client(network);
            this.account = derive.familySeed(seed, { algorithm: "secp256k1" });
            
            // Add error event listeners
            this.client.on('error', (error) => {
                console.error('🔥 Client error:', error.message);
                this.handleConnectionError();
            });

            this.client.on('disconnected', () => {
                console.log('🔌 Client disconnected');
                if (this.isRunning) {
                    this.handleConnectionError();
                }
            });

            this.client.on('reconnect', () => {
                console.log('🔄 Client reconnecting...');
            });

            this.client.on('connected', () => {
                console.log('🟢 Client connected successfully');
            });
            
            await this.client.connect();
            console.log('🟢 Connected to Xahau Testnet');
            console.log(`📍 Account: ${this.account.address}`);
            console.log(`🎯 Object to update: ${OBJECT_ID}`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            
            return true;
        } catch (error) {
            console.error('❌ Error connecting:', error.message);
            return false;
        }
    }

    // Handle connection errors with retry logic
    async handleConnectionError() {
        if (!this.isRunning) return;
        
        console.log('⚠️ Connection issue detected, attempting to reconnect...');
        
        try {
            if (this.client && !this.client.isConnected()) {
                await this.client.disconnect();
                await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
                await this.client.connect();
                console.log('✅ Reconnected successfully');
            }
        } catch (error) {
            console.error('❌ Reconnection failed:', error.message);
            console.log('🔄 Will retry on next update cycle...');
        }
    }

    // Disconnect safely
    async disconnect() {
        try {
            if (this.client && this.client.isConnected()) {
                // Remove listeners to prevent further error events
                this.client.removeAllListeners();
                await this.client.disconnect();
                console.log('🔴 Disconnected from Xahau');
            }
        } catch (error) {
            console.error('⚠️ Error during disconnect:', error.message);
        }
    }

    // Update remark with price
    async updatePriceRemark(price) {
        try {
            const networkInfo = await utils.txNetworkAndAccountValues(network, this.account);
            const timestamp = new Date().toISOString();

            const prepared = {
                "TransactionType": "SetRemarks",
                "ObjectID": OBJECT_ID,
                "Remarks": [
                    {
                        "Remark": {
                            "RemarkName": Buffer.from("XAH_PRICE_USD", 'utf8').toString('hex').toUpperCase(),
                            "RemarkValue": Buffer.from(price.toString(), 'utf8').toString('hex').toUpperCase(),
                            "Flags": 0 // Mutable
                        }
                    },
                    {
                        "Remark": {
                            "RemarkName": Buffer.from("LAST_UPDATE", 'utf8').toString('hex').toUpperCase(),
                            "RemarkValue": Buffer.from(timestamp, 'utf8').toString('hex').toUpperCase(),
                            "Flags": 0 // Mutable
                        }
                    }
                ],
                ...networkInfo.txValues,
            };

            const tx = await signAndSubmit(prepared, network, this.account);
            
            // Check if transaction was successful
            if (tx && tx.response && tx.response.engine_result === "tesSUCCESS") {
                this.updateCount++;
                this.lastPrice = price;
                console.log(`✅ Price updated: ${price} USD`);
                console.log(`📝 TX Hash: ${tx.response.tx_json.hash}`);
                console.log(`🕐 ${timestamp}`);
                console.log(`📊 Update #${this.updateCount}`);
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                return true;
            } else {
                console.error('❌ Error: Transaction failed');
                console.error('Engine result:', tx?.response?.engine_result || 'Unknown');
                console.error('Error message:', tx?.response?.engine_result_message || 'No message');
                return false;
            }

        } catch (error) {
            console.error('❌ Error updating remark:', error.message);
            return false;
        }
    }

    // Main update process
    async updatePrice() {
        try {
            console.log('🔍 Fetching XAH price...');
            const price = await this.fetchXAHPrice();
            
            // Always update (remove price change condition)
            const success = await this.updatePriceRemark(price);
            if (!success) {
                console.log('⚠️ Will retry on next cycle...');
            }

        } catch (error) {
            console.error('❌ Error fetching price:', error.message);
            console.log('⚠️ Will retry on next cycle...');
        }
    }

    // Start the oracle
    async start() {
        console.log('🚀 Starting XAH Price Oracle');
        console.log('🎯 Updates every 60 seconds');
        console.log('');

        if (!await this.connect()) {
            console.error('💥 Could not connect. Aborting...');
            return;
        }

        this.isRunning = true;

        // First immediate update
        await this.updatePrice();

        // Set 1-minute interval
        const interval = setInterval(async () => {
            if (!this.isRunning) {
                clearInterval(interval);
                return;
            }
            await this.updatePrice();
        }, 60000); // 60 seconds

        // Handle signals for clean shutdown
        process.on('SIGINT', async () => {
            console.log('\n⏹️ Stopping oracle...');
            this.isRunning = false;
            clearInterval(interval);
            await this.disconnect();
            process.exit(0);
        });

        process.on('SIGTERM', async () => {
            console.log('\n⏹️ Received SIGTERM, stopping oracle...');
            this.isRunning = false;
            clearInterval(interval);
            await this.disconnect();
            process.exit(0);
        });

        // Handle uncaught errors
        process.on('uncaughtException', async (error) => {
            console.error('💥 Uncaught Exception:', error.message);
            this.isRunning = false;
            clearInterval(interval);
            await this.disconnect();
            process.exit(1);
        });

        process.on('unhandledRejection', async (reason, promise) => {
            console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
            this.isRunning = false;
            clearInterval(interval);
            await this.disconnect();
            process.exit(1);
        });

        console.log('✅ Oracle started. Press Ctrl+C to stop.');
    }

    // Get statistics
    getStats() {
        return {
            isRunning: this.isRunning,
            updateCount: this.updateCount,
            lastPrice: this.lastPrice,
            objectId: OBJECT_ID
        };
    }
}

// Direct usage function
async function startOracle() {
    const oracle = new XahauPriceOracle();
    await oracle.start();
}

// Export for module usage
module.exports = XahauPriceOracle;

// Execute if called directly
if (require.main === module) {
    // Validate environment variables
    if (!seed) {
        console.error('❌ Error: SEED environment variable is required');
        console.log('💡 Add SEED=your_seed_here to your .env file');
        process.exit(1);
    }
    
    if (!OBJECT_ID) {
        console.error('❌ Error: OBJECT_ID environment variable is required');
        console.log('💡 Add OBJECT_ID=your_object_id_here to your .env file');
        process.exit(1);
    }

    console.log('📋 Configuration loaded from .env:');
    console.log(`  NETWORK: ${network}`);
    console.log(`  OBJECT_ID: ${OBJECT_ID}`);
    console.log(`  API_URL: ${COINGECKO_API}`);
    console.log('');

    startOracle().catch(console.error);
}