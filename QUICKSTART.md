# 🚀 Quick Start Guide

Get the Grievance Redressal System running on your local machine in just a few steps!

## Prerequisites

Before you start, make sure you have:

- ✅ **Node.js** installed (version 16 or higher)
  - Check: `node --version`
  - Download: [nodejs.org](https://nodejs.org/)

- ✅ **MetaMask** browser extension installed
  - Download: [metamask.io](https://metamask.io/)
  - Create a wallet if you don't have one

- ✅ **Sepolia Testnet ETH** (for gas fees)
  - Get free test ETH from: [sepoliafaucet.com](https://sepoliafaucet.com/)
  - You'll need this to deploy the contract and make transactions

## Step 1: Clone and Install

First, get the project on your machine:

```bash
# If you have the project folder, navigate to it
cd Greviance

# Install all dependencies
npm install
```

This will install Hardhat and all other required packages.

## Step 2: Set Up Environment Variables

Create a `.env` file in the project root:

```bash
# Create the .env file (you can use any text editor)
```

Add these lines to your `.env` file:

```
SEPOLIA_URL=https://rpc.sepolia.org
PRIVATE_KEY=your_private_key_here
```

**How to get your private key from MetaMask:**
1. Open MetaMask extension
2. Click the account icon (top right)
3. Go to "Account Details"
4. Click "Export Private Key"
5. Enter your password
6. Copy the private key (keep it secret!)
7. Paste it in the `.env` file after `PRIVATE_KEY=`

**⚠️ Important:** Never share your private key or commit it to GitHub!

## Step 3: Compile the Smart Contract

Compile the Solidity contract to make sure everything is set up correctly:

```bash
npm run compile
```

You should see output like:
```
Compiled 1 Solidity file successfully
```

If you see errors, make sure you've installed all dependencies correctly.

## Step 4: Run Tests (Optional but Recommended)

Test that everything works:

```bash
npm run test
```

This runs the test suite to verify the smart contract functions correctly. All tests should pass.

## Step 5: Deploy to Sepolia Testnet

Deploy the contract to Sepolia testnet:

```bash
npx hardhat run scripts/deploySecure.js --network sepolia
```

**⚠️ IMPORTANT:** Copy the contract address from the output!

You'll see something like:
```
✅ GrievanceSystemSecure deployed to: 0x1234567890abcdef1234567890abcdef12345678
```

**Save this address - you'll need it in the next step!**

## Step 6: Update Contract Address in Frontend

The frontend needs to know where your contract is deployed. Update it in one place:

**File: `frontend/config.js`**

Open `frontend/config.js` and update the contract address:

```javascript
const CONTRACT_ADDRESS = "0x1234567890abcdef1234567890abcdef12345678"; // Replace with your deployed address
```

Replace `0x1234567890abcdef1234567890abcdef12345678` with the address you got from Step 5.

**That's it!** The frontend automatically uses this address from `config.js`.

## Step 7: Assign Authority Roles

Before you can test the system, you need to assign roles to wallet addresses.

### Easy Way: Use the Admin Panel

1. **Open `frontend/admin.html` in your browser**
   - You can double-click the file or use a local server
   - If using a server: `python -m http.server 5500` (in the frontend folder)

2. **Connect MetaMask**
   - Click "Connect MetaMask" button
   - Approve the connection
   - Make sure you're on Sepolia testnet

3. **Assign Roles**
   - Enter wallet addresses for each role:
     - **Counselor**: Enter an address, click "Assign Counselor Role"
     - **Year Coordinator**: Enter an address, click "Assign Year Coordinator Role"
     - **HOD**: Enter an address, click "Assign HOD Role"
     - **Dean**: Enter an address, click "Assign Dean Role"
   - Approve each transaction in MetaMask
   - Wait for confirmation (you'll see a success message)

**💡 Tip:** For testing, you can use the same address for multiple roles, or use different MetaMask accounts.

## Step 8: Open the Application

1. **Open `frontend/dashboard.html` in your browser**
   - This is the main application

2. **Connect Your Wallet**
   - Click "Connect MetaMask"
   - Approve the connection
   - Make sure you're on Sepolia testnet

3. **Start Using!**
   - If you're a student: Submit grievances and view them
   - If you're an authority: View assigned grievances and take actions

## Testing the System

### Test as a Student:

1. Connect a wallet (any address that doesn't have an authority role)
2. You'll see "Submit Grievance" and "My Grievances" tabs
3. Go to "Submit Grievance" tab
4. Write a grievance description (max 1000 characters)
5. Click "Submit Grievance"
6. Approve the transaction in MetaMask
7. Wait for confirmation
8. Go to "My Grievances" tab to see your submission
9. Click "View Details" to see the complete timeline

### Test as an Authority:

1. Connect a wallet that has an authority role (assigned in Step 7)
2. You'll see "Assigned Grievances" tab
3. View grievances assigned to your level
4. Click "Take Action" on a grievance
5. Choose an action:
   - **Resolve**: Enter remarks, click "Resolve"
   - **Escalate**: Enter remarks, click "Escalate"
6. Approve the transaction in MetaMask
7. Wait for confirmation
8. The grievance status will update automatically

## Troubleshooting

### "Contract address not set" error:
- ✅ Make sure you updated `CONTRACT_ADDRESS` in `frontend/config.js`
- ✅ Check that the address starts with `0x` and is 42 characters long
- ✅ Refresh the browser page after updating the file

### "Insufficient funds" error:
- ✅ Get more Sepolia ETH from [sepoliafaucet.com](https://sepoliafaucet.com/)
- ✅ Check MetaMask - make sure you're on Sepolia testnet (not Mainnet)
- ✅ Each transaction needs a small amount of ETH for gas fees

### "Unauthorized" error:
- ✅ Make sure your wallet address has the required role
- ✅ Use `admin.html` to verify role assignment
- ✅ Make sure you assigned roles AFTER deploying the contract

### Can't connect MetaMask:
- ✅ Make sure MetaMask extension is installed and unlocked
- ✅ Refresh the browser page
- ✅ Try a different browser (Chrome, Firefox, or Brave work best)
- ✅ Check if MetaMask is detecting the page (look for the MetaMask icon)

### Transaction fails:
- ✅ Check you're on Sepolia testnet (not Mainnet)
- ✅ Verify the contract is deployed (check deployment output)
- ✅ Make sure contract address in `config.js` is correct
- ✅ Try increasing gas limit in MetaMask

### "Network not found" error:
- ✅ Make sure you're connected to Sepolia testnet in MetaMask
- ✅ If Sepolia isn't in your MetaMask, add it:
  - Network Name: Sepolia
  - RPC URL: https://rpc.sepolia.org
  - Chain ID: 11155111
  - Currency Symbol: ETH

## Running Locally (Alternative to Sepolia)

If you want to test without using Sepolia testnet:

1. **Start local Hardhat node:**
   ```bash
   npm run node
   ```
   Keep this terminal open - it's running a local blockchain.

2. **Deploy to local network** (in a new terminal):
   ```bash
   npx hardhat run scripts/deploySecure.js --network localhost
   ```
   
   Copy the contract address from the output and update `frontend/config.js`

3. **Update contract address** in `frontend/config.js` with the local deployment address.

4. **Connect MetaMask to localhost:**
   - In MetaMask, add network:
     - Network Name: Localhost 8545
     - RPC URL: http://127.0.0.1:8545
     - Chain ID: 31337
     - Currency Symbol: ETH

5. **Import test account** (for testing):
   - When you run `npm run node`, Hardhat shows test accounts with private keys
   - Import one of these accounts into MetaMask for testing

## Common Workflow

Here's the typical flow when setting up:

1. ✅ Install dependencies (`npm install`)
2. ✅ Set up `.env` file with your private key
3. ✅ Compile contracts (`npm run compile`)
4. ✅ Deploy to Sepolia (`npm run deploy:sepolia`)
5. ✅ Update `frontend/config.js` with contract address
6. ✅ Assign roles using `admin.html`
7. ✅ Open `dashboard.html` and start using!

## What's Next?

- Read the full [README.md](README.md) for detailed project documentation
- Explore the smart contract code in `contracts/GrievanceSystemSecure.sol`
- Customize the frontend styling in `frontend/styles.css`
- Add your own features and improvements!

## Need Help?

If you run into issues:
- Check the troubleshooting section above
- Review the error messages in the browser console (F12)
- Make sure all prerequisites are installed
- Verify your `.env` file is set up correctly
- Ensure you have Sepolia ETH for transactions

---

**Happy building! 🚀**

*Remember: This is a testnet deployment. For production use, you'd need to deploy to Ethereum mainnet and conduct proper security audits.*
