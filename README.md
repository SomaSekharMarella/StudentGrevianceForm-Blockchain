# 🏛️ Decentralized Grievance Redressal System

A Web3-based grievance management system for academic institutions built on Ethereum blockchain. This system replaces traditional manual grievance forms with a transparent, immutable, and decentralized solution that ensures accountability and eliminates delays.

## 📋 Table of Contents

- [Problem Statement](#-problem-statement)
- [Why Web3 Over Web2?](#-why-web3-over-web2)
- [Project Overview](#-project-overview)
- [Architecture](#-architecture)
- [Features](#-features)
- [Workflow](#-workflow)
- [Smart Contract Logic](#-smart-contract-logic)
- [Technology Stack](#-technology-stack)
- [Installation & Setup](#-installation--setup)
- [Deployment](#-deployment)
- [Usage Guide](#-usage-guide)
- [Testing](#-testing)
- [Project Structure](#-project-structure)
- [Contributing](#-contributing)
- [License](#-license)

## 🎯 Problem Statement

Traditional grievance redressal systems in academic institutions face several critical issues:

1. **Opacity**: Students cannot verify if their grievances are being processed fairly
2. **Delays**: Manual processes lead to extended resolution times
3. **Manipulation**: Authorities can delete or modify grievance records
4. **Lack of Accountability**: No transparent audit trail of actions taken
5. **Single Point of Failure**: Centralized systems can be compromised or fail
6. **Trust Issues**: Students must trust institutions without verification mechanisms

## 🚀 Why Web3 Over Web2?

### **Immutability**
- **Web2**: Data stored in centralized databases can be deleted, modified, or lost
- **Web3**: Grievances are permanently stored on blockchain - **no deletion or tampering possible**

### **Transparency**
- **Web2**: Only authorized personnel can view system logs and records
- **Web3**: All transactions and state changes are publicly verifiable on blockchain explorer

### **Decentralization**
- **Web2**: Single server/database = single point of failure and manipulation
- **Web3**: Distributed network of nodes ensures no single authority controls the system

### **Trust & Verification**
- **Web2**: Students must trust the institution's database integrity
- **Web3**: Students can independently verify all actions using blockchain explorers

### **Accountability**
- **Web2**: Authorities can deny actions or claim system errors
- **Web3**: Every action is cryptographically signed and permanently recorded

### **Automation**
- **Web2**: Manual workflow management prone to errors
- **Web3**: Smart contracts automatically enforce rules and escalate when needed

### **No Single Authority Control**
- **Web2**: System administrators can manipulate data
- **Web3**: Even contract deployer cannot modify existing grievance records

## 📖 Project Overview

This system implements a **multi-level escalation workflow** for grievance handling:

```
Student → Counselor → Year Coordinator → HOD → Dean
```

Each grievance follows a structured lifecycle:
1. **Submission** - Student submits grievance
2. **Review** - Authority reviews the grievance
3. **Resolution** - Authority resolves OR escalates to next level
4. **Closure** - Final resolution (Dean only can close)

## 🏗️ Architecture

### System Components

```
┌─────────────────────────────────────────────────────┐
│                  Frontend Layer                      │
│  (HTML/CSS/JavaScript + Ethers.js + MetaMask)       │
└───────────────────┬─────────────────────────────────┘
                    │
                    │ Web3 Provider (MetaMask)
                    │
┌───────────────────▼─────────────────────────────────┐
│              Ethereum Blockchain                     │
│              (Sepolia Testnet)                       │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │      GrievanceSystem Smart Contract        │    │
│  │  • Role Management                         │    │
│  │  • Grievance CRUD Operations               │    │
│  │  • Workflow Management                     │    │
│  │  • Event Logging                           │    │
│  └────────────────────────────────────────────┘    │
│                                                      │
│  • Immutable Storage                                │
│  • Transparent Transactions                         │
│  • Decentralized Execution                          │
└─────────────────────────────────────────────────────┘
```

### Key Design Principles

1. **No Centralized Backend**: All data stored on-chain
2. **Role-Based Access Control**: Enforced at smart contract level
3. **Event-Driven Architecture**: All actions emit events for transparency
4. **Gas Optimization**: Efficient storage and function design
5. **Security First**: Multiple validation checks and access controls

## ✨ Features

### For Students
- ✅ Submit grievances with detailed descriptions
- ✅ View all submitted grievances
- ✅ Track grievance status in real-time
- ✅ View complete timeline and resolution history
- ✅ Verify all actions on blockchain explorer

### For Authorities (Counselor, Year Coordinator, HOD, Dean)
- ✅ View grievances assigned to their level
- ✅ Review grievances
- ✅ Resolve grievances with remarks
- ✅ Escalate unresolved grievances
- ✅ Close grievances (Dean only)
- ✅ View complete grievance history

### System Features
- 🔒 **Immutable Records**: No deletion or modification possible
- 👁️ **Full Transparency**: All actions publicly verifiable
- ⚡ **Automated Workflow**: Smart contracts enforce escalation rules
- 🛡️ **Access Control**: Role-based permissions at contract level
- 📊 **Event Logging**: Complete audit trail via blockchain events
- 🔍 **Searchable**: Query grievances by student or authority

## 🔄 Workflow

### Grievance Lifecycle

```
┌─────────────┐
│  SUBMITTED  │  Student submits grievance
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  IN_REVIEW  │  Authority reviews (optional)
└──────┬──────┘
       │
       ├──────────────────┐
       ▼                  ▼
┌─────────────┐    ┌─────────────┐
│  RESOLVED   │    │  ESCALATED  │  Escalate to next level
└─────────────┘    └──────┬──────┘
                          │
                          ▼
                    (Next Authority Level)
                          │
                          ▼
                    ┌─────────────┐
                    │  RESOLVED   │  or ESCALATED again
                    └─────────────┘
                          │
                          ▼
                    ┌─────────────┐
                    │   CLOSED    │  Dean closes (final)
                    └─────────────┘
```

### Escalation Hierarchy

1. **Student** submits grievance
   - Status: `SUBMITTED`
   - Assigned to: `COUNSELOR`

2. **Counselor** can:
   - Review → Status: `IN_REVIEW`
   - Resolve → Status: `RESOLVED`
   - Escalate → Status: `ESCALATED`, Level: `YEAR_COORD`

3. **Year Coordinator** can:
   - Review → Status: `IN_REVIEW`
   - Resolve → Status: `RESOLVED`
   - Escalate → Status: `ESCALATED`, Level: `HOD`

4. **HOD** can:
   - Review → Status: `IN_REVIEW`
   - Resolve → Status: `RESOLVED`
   - Escalate → Status: `ESCALATED`, Level: `DEAN`

5. **Dean** can:
   - Review → Status: `IN_REVIEW`
   - Resolve → Status: `RESOLVED`
   - Close → Status: `CLOSED` (Final state)

## 🔐 Smart Contract Logic

### Data Structures

```solidity
enum Status {
    SUBMITTED,      // 0: Initial state
    IN_REVIEW,      // 1: Being reviewed
    ESCALATED,      // 2: Escalated to next level
    RESOLVED,       // 3: Successfully resolved
    CLOSED          // 4: Closed by Dean (final)
}

enum AuthorityLevel {
    COUNSELOR,      // 0: First responder
    YEAR_COORD,     // 1: Year Coordinator
    HOD,            // 2: Head of Department
    DEAN            // 3: Dean of Academics
}

struct Grievance {
    uint256 grievanceId;
    address studentAddress;
    string description;
    AuthorityLevel currentLevel;
    Status status;
    uint256 submittedAt;
    uint256 lastUpdatedAt;
    string resolutionRemarks;
    address resolvedBy;
}
```

### Core Functions

#### Student Functions
- `submitGrievance(string description)` - Submit new grievance
  - Validates description (non-empty, max 1000 chars)
  - Assigns unique ID
  - Sets status to SUBMITTED
  - Assigns to COUNSELOR level
  - Emits `GrievanceSubmitted` event

#### Authority Functions
- `reviewGrievance(uint256 grievanceId)` - Mark as IN_REVIEW
- `resolveGrievance(uint256 grievanceId, string remarks)` - Resolve with remarks
- `escalateGrievance(uint256 grievanceId, string remarks)` - Escalate to next level
- `closeGrievance(uint256 grievanceId, string remarks)` - Close (Dean only)

#### View Functions
- `getGrievanceById(uint256 grievanceId)` - Get grievance details
- `getStudentGrievances(address student)` - Get all student's grievances
- `getAuthorityGrievances(address authority)` - Get all authority's grievances
- `hasAuthorityRole(address authority, AuthorityLevel level)` - Check role

### Access Control

```solidity
modifier onlyAuthority(AuthorityLevel level) {
    require(
        authorities[level][msg.sender],
        "Unauthorized authority"
    );
    _;
}
```

Each authority function checks:
1. Grievance exists
2. Caller has appropriate authority level
3. Grievance is in valid state for the action
4. Input parameters are valid

### Events

All state-changing operations emit events for transparency:

- `GrievanceSubmitted` - New grievance created
- `GrievanceEscalated` - Grievance escalated to next level
- `GrievanceResolved` - Grievance resolved
- `GrievanceClosed` - Grievance closed by Dean
- `AuthorityAssigned` - Authority role assigned

## 🛠️ Technology Stack

### Smart Contract Development
- **Solidity** ^0.8.20 - Smart contract language
- **Hardhat** - Development framework
- **Ethers.js** - Blockchain interaction library

### Frontend
- **HTML5** - Structure
- **CSS3** - Styling (Modern, responsive design)
- **JavaScript (ES6+)** - Logic and interactions
- **Ethers.js** - Web3 provider integration
- **MetaMask** - Wallet connection

### Blockchain
- **Ethereum** - Blockchain platform
- **Sepolia Testnet** - Test network for deployment

## 📦 Installation & Setup

### Prerequisites

- Node.js (v16+)
- npm or yarn
- MetaMask browser extension
- Sepolia testnet ETH (for gas fees)

### Installation Steps

1. **Clone the repository**
```bash
git clone <repository-url>
cd grievance-dapp
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` and add:
```
SEPOLIA_URL=https://rpc.sepolia.org
PRIVATE_KEY=your_private_key_here
ETHERSCAN_API_KEY=your_etherscan_api_key_here (optional)
```

4. **Compile contracts**
```bash
npm run compile
```

5. **Run tests**
```bash
npm run test
```

## 🚀 Deployment

### Deploy to Sepolia Testnet

1. **Get Sepolia ETH**
   - Visit [Sepolia Faucet](https://sepoliafaucet.com/)
   - Request test ETH to your wallet

2. **Deploy contract**
```bash
npm run deploy:sepolia
```

3. **Save contract address**
   - Copy the deployed contract address
   - Update `CONTRACT_ADDRESS` in `frontend/app.js`

4. **Assign authorities** (Easy Way!)
   - Open `frontend/admin.html` in your browser
   - Connect MetaMask
   - Enter wallet addresses for each role
   - Click "Assign" buttons - that's it!
   - No console commands needed! 🎉

### Running Locally

1. **Start local node**
```bash
npm run node
```

2. **Deploy to local network** (in new terminal)
```bash
npx hardhat run scripts/deploy.js --network localhost
```

3. **Update frontend contract address**

4. **Open frontend** in browser
   - Connect MetaMask to localhost:8545
   - Import test account from Hardhat

## 📱 Usage Guide

### For Students

1. **Connect Wallet**
   - Open `frontend/index.html` in browser
   - Click "Connect MetaMask"
   - Approve connection
   - Switch to Sepolia testnet if prompted

2. **Submit Grievance**
   - Go to "Submit Grievance" tab
   - Enter grievance description (max 1000 characters)
   - Click "Submit Grievance"
   - Approve transaction in MetaMask
   - Wait for confirmation

3. **View Grievances**
   - Go to "My Grievances" tab
   - View all submitted grievances
   - Click "View Details" to see full information
   - Track status and escalation history

### For Authorities

1. **Connect Wallet** (with authority role)
   - Connect using wallet address with assigned role
   - Authority tab will appear automatically

2. **View Assigned Grievances**
   - Go to "Assigned Grievances" tab
   - View grievances at your authority level

3. **Take Action**
   - Click "Take Action" on a grievance
   - Choose action:
     - **Mark as In Review**: Start reviewing
     - **Resolve**: Resolve with remarks
     - **Escalate**: Forward to next level
     - **Close**: Close grievance (Dean only)

4. **Complete Action**
   - Enter remarks (required for resolve/escalate/close)
   - Click appropriate action button
   - Approve transaction
   - Wait for confirmation

## 🧪 Testing

Run the test suite:

```bash
npm run test
```

Tests cover:
- Contract deployment
- Authority role assignment
- Grievance submission
- Review functionality
- Resolution workflow
- Escalation logic
- Access control
- View functions

## 📂 Project Structure

```
grievance-dapp/
│
├── contracts/
│   └── GrievanceSystem.sol       # Main smart contract
│
├── scripts/
│   └── deploy.js                 # Deployment script
│
├── test/
│   └── grievance.test.js         # Test suite
│
├── frontend/
│   ├── index.html                # Login/Wallet connect page
│   ├── dashboard.html            # Main dashboard
│   ├── styles.css                # Styling
│   └── app.js                    # Frontend logic
│
├── hardhat.config.js             # Hardhat configuration
├── package.json                  # Dependencies
├── .env.example                  # Environment template
├── .gitignore                    # Git ignore rules
└── README.md                     # This file
```

## 🔒 Security Considerations

### Smart Contract Security
- ✅ Access control modifiers
- ✅ Input validation
- ✅ State transition validation
- ✅ Gas optimization
- ✅ No reentrancy vulnerabilities (no external calls to untrusted contracts)
- ✅ Overflow protection (Solidity 0.8+)

### Frontend Security
- ✅ MetaMask integration (user controls keys)
- ✅ No private keys stored
- ✅ Contract address validation
- ✅ Network verification

### Best Practices
- ⚠️ **Never commit private keys**
- ⚠️ **Use testnet for development**
- ⚠️ **Audit contract before mainnet deployment**
- ⚠️ **Test thoroughly on testnet first**

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Built with [Hardhat](https://hardhat.org/)
- Powered by [Ethereum](https://ethereum.org/)
- UI inspired by modern academic design principles

## 📞 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing documentation
- Review smart contract comments

---

**Built with ❤️ for transparent and accountable academic governance**

*"In blockchain we trust, not in central authorities"*

