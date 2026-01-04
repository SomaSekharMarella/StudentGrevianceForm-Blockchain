# 🚀 Quick Start Guide

Get your Grievance Redressal System up and running in minutes!

## Prerequisites Check

- ✅ Node.js installed (v16+)
- ✅ MetaMask browser extension
- ✅ Sepolia testnet ETH (get from [faucet](https://sepoliafaucet.com/))

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create `.env` file:

```bash
SEPOLIA_URL=https://rpc.sepolia.org
PRIVATE_KEY=your_private_key_here
```

**💡 Tip:** Get your private key from MetaMask:
1. Open MetaMask
2. Click account icon (top right)
3. Account Details → Export Private Key
4. Copy the key (keep it secret!)

### 3. Compile Contracts

```bash
npm run compile
```

### 4. Run Tests (Optional but Recommended)

```bash
npm run test
```

### 5. Deploy to Sepolia

```bash
npm run deploy:sepolia
```

**⚠️ IMPORTANT:** Copy the deployed contract address from the output!

Example output:
```
✅ GrievanceSystem deployed to: 0x1234567890abcdef1234567890abcdef12345678
```

### 6. Update Frontend Files

You need to update the contract address in **2 files**:

#### File 1: `frontend/app.js`
Open `frontend/app.js` and find this line (around line 4):
```javascript
const CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000";
```
Replace with your deployed address:
```javascript
const CONTRACT_ADDRESS = "0x1234567890abcdef1234567890abcdef12345678"; // Your address
```

#### File 2: `frontend/admin.js`
Open `frontend/admin.js` and do the same:
```javascript
const CONTRACT_ADDRESS = "0x1234567890abcdef1234567890abcdef12345678"; // Your address
```

### 7. Assign Authority Roles (EASY WAY! 🎉)

**No more complex console commands!** Use the simple web interface:

1. Open `frontend/admin.html` in your browser
2. Click "Connect MetaMask"
3. Switch to Sepolia testnet if prompted
4. Enter wallet addresses for each role:
   - **Counselor**: Enter address, click "Assign Counselor Role"
   - **Year Coordinator**: Enter address, click "Assign Year Coordinator Role"
   - **HOD**: Enter address, click "Assign HOD Role"
   - **Dean**: Enter address, click "Assign Dean Role"
5. Wait for transaction confirmation (green checkmark)
6. Use "Verify Role Assignment" to double-check

**💡 Tips:**
- You can use the same address for multiple roles (for testing)
- Copy addresses from MetaMask (click account name to copy)
- Addresses must start with `0x` and be 42 characters long

### 8. Open Frontend and Use!

1. Open `frontend/index.html` in your browser
2. Click "Connect MetaMask"
3. Switch to Sepolia testnet
4. Click "Proceed to Dashboard"
5. Start using the system!

## Testing the System

### As a Student:
1. Connect wallet (any address)
2. Go to "Submit Grievance" tab
3. Write your grievance (max 1000 characters)
4. Click "Submit Grievance"
5. Approve transaction in MetaMask
6. Go to "My Grievances" tab to see your submission

### As an Authority:
1. Connect wallet (must have assigned role from admin panel)
2. Go to "Assigned Grievances" tab
3. Click "Take Action" on a grievance
4. Choose action:
   - **Resolve**: Enter remarks, click "Resolve"
   - **Escalate**: Enter remarks, click "Escalate"
   - **Close**: (Dean only) Enter remarks, click "Close"
5. Approve transaction in MetaMask
6. Wait for confirmation

## Troubleshooting

### "Contract not deployed" error:
- ✅ Make sure you updated CONTRACT_ADDRESS in both `app.js` and `admin.js`
- ✅ Ensure address is correct (starts with 0x, 42 characters)
- ✅ Check that you copied the full address from deployment output

### "Unauthorized" error:
- ✅ Check if your address has the required authority role
- ✅ Use admin.html to verify role assignment
- ✅ Make sure you assigned the role AFTER deploying the contract

### "Insufficient funds" error:
- ✅ Get more Sepolia ETH from [faucet](https://sepoliafaucet.com/)
- ✅ Check MetaMask balance (should show Sepolia ETH, not Mainnet ETH)
- ✅ Each transaction needs a small amount of ETH for gas fees

### Transaction fails:
- ✅ Check network (must be Sepolia testnet, not Mainnet)
- ✅ Verify contract is deployed (check deployment output)
- ✅ Try increasing gas limit in MetaMask
- ✅ Make sure contract address is correct

### Can't connect MetaMask:
- ✅ Make sure MetaMask extension is installed
- ✅ Refresh the page
- ✅ Try a different browser (Chrome, Firefox, Brave)
- ✅ Check if MetaMask is unlocked

### Admin panel shows "Contract address not set":
- ✅ Update CONTRACT_ADDRESS in `frontend/admin.js`
- ✅ Make sure you saved the file after editing
- ✅ Refresh the browser page

## Common Workflow

1. **Deploy contract** → Get contract address
2. **Update addresses** → In app.js and admin.js
3. **Assign roles** → Use admin.html (super easy!)
4. **Test as student** → Submit a grievance
5. **Test as authority** → Connect with authority wallet, resolve/escalate

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Review smart contract code in `contracts/GrievanceSystem.sol`
- Customize frontend styling in `frontend/styles.css`
- Add more features as needed!

## Summary

✅ **Deploy once** → Get contract address  
✅ **Update 2 files** → app.js and admin.js  
✅ **Assign roles via web UI** → admin.html (no console needed!)  
✅ **Start using** → index.html  

**No more complex console commands! Everything is simple and visual!** 🎉

Happy building! 🚀
