const xrpl = require('xrpl');
const { derive, utils, signAndSubmit } = require("xrpl-accountlib");
const crypto = require('crypto');
//rsPUkjW4ukdwKEP6EqhRfsUN9cqqQr9rkr
const seed = 'sarMBcspiPnnda4cknTE6sz9mqh6o';
const network = "wss://xahau-test.net";

async function connectAndQuery() {
  const client = new xrpl.Client('wss://xahau-test.net');
  const account = derive.familySeed(seed, { algorithm: "secp256k1" });
  console.log(`Account: ${JSON.stringify(account)}`);

  try {
    await client.connect();
    console.log('Connected to Xahau');
    const my_wallet = xrpl.Wallet.fromSeed(seed);
    const networkInfo = await utils.txNetworkAndAccountValues(network, account);

    const prepared = {
    "TransactionType": "URITokenMint",
    "Flags": 1,
    "URI": xrpl.convertStringToHex(`ipfs://bafkreie2ajssrgbhxbv6zoxva2vts6oi5ztauwz5edxx66vtl7payiz3pe/xahaupriceoracle.json`),
    "Digest": crypto.createHash('sha512').update(JSON.stringify(`./uritoken/xahaupriceoracle.json`)).digest('hex').slice(0,64)
    , ...networkInfo.txValues,
};

    const tx = await signAndSubmit(prepared, network, account);
    console.log("Info tx:", JSON.stringify(tx, null, 2)); 
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.disconnect();
    console.log('Disconnecting from Xahau');
  }
}

connectAndQuery();
