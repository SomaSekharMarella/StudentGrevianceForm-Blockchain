# 🎓 Blockchain-Based Grievance Redressal System

**A Web3 solution for transparent student grievance management in academic institutions**

---

## The Problem We're Solving

As students, we've all been there. You submit a grievance about something important - maybe a grading issue, a facility problem, or an administrative concern. Days turn into weeks, weeks into months, and you're left wondering: "Did anyone even read my complaint? Is it being processed? Or did it just disappear into a black hole?"

Traditional grievance systems have some serious flaws:

- **You can't track what happens** - Once you submit, it's out of your hands. No way to see if it's being reviewed, who's handling it, or when you'll get a response.

- **Things can get "lost"** - Whether it's an honest mistake or something more concerning, grievances can disappear from the system with no trace.

- **No accountability** - If your complaint isn't addressed, there's no way to prove it was ever submitted or who was responsible for handling it.

- **Delays are common** - Without transparency, there's no pressure on authorities to act quickly. Your grievance can sit in someone's inbox for weeks.

- **You have to trust blindly** - You submit your complaint and hope the system works. There's no way to verify that your grievance is being handled fairly.

## Why Blockchain? Why Web3?

This is where blockchain technology comes in. We're not using Web3 just because it's cool - we're using it because it solves real problems that traditional systems can't.

### Immutability = No More "Lost" Complaints

Once your grievance is submitted to the blockchain, it's there forever. It can't be deleted, modified, or "accidentally" lost. This is huge for students who've had their complaints disappear in traditional systems.

### Complete Transparency

Every action taken on your grievance is recorded on the blockchain and publicly verifiable. You can see:
- When your complaint was submitted
- Who reviewed it and when
- What actions were taken
- When it was resolved or escalated
- All remarks and comments from authorities

You don't have to take anyone's word for it - you can verify everything yourself using a blockchain explorer.

### Built-in Accountability

Since every action is cryptographically signed and permanently recorded, there's no way for authorities to deny taking action (or not taking action). This creates natural accountability - everyone knows their actions are being tracked.

### Automated Workflow

The smart contract automatically enforces the escalation workflow. If a counselor doesn't respond, the system can escalate to the year coordinator. If they don't respond, it goes to the HOD, and so on. No manual intervention needed, no way to "forget" to escalate.

### Decentralization = No Single Point of Failure

Unlike a traditional system that relies on a single server or database, blockchain data is distributed across thousands of nodes. Even if one part of the system goes down, your data is safe and accessible.

### Trust Through Verification, Not Blind Faith

You don't have to trust that the system works - you can verify it yourself. Every transaction is public, every action is traceable, and every grievance has a complete audit trail.

## What We Built

We've created a complete grievance redressal system that runs entirely on the Ethereum blockchain. Here's how it works:

### The Workflow

When a student submits a grievance, it follows a clear escalation path:

1. **Student submits** → Grievance is created and assigned to a Counselor
2. **Counselor reviews** → Can resolve it (if it's a simple issue) or escalate to Year Coordinator
3. **Year Coordinator** → Can resolve or escalate to HOD (Head of Department)
4. **HOD** → Can resolve or escalate to Dean
5. **Dean** → Final authority who can resolve or close the grievance

At each level, the authority can:
- Review the grievance
- Add remarks
- Resolve it (if they can handle it)
- Escalate it (if it needs higher authority)

### Key Features

**For Students:**
- Submit grievances with detailed descriptions
- View all your submitted grievances
- Track the status in real-time
- See complete timeline of all actions taken
- View all remarks from authorities at every level
- Verify everything on blockchain explorer

**For Authorities:**
- View grievances assigned to your level
- Review and take action on grievances
- Resolve with remarks or escalate to next level
- See complete history of all grievances you've handled

**System Features:**
- **Immutable records** - Once submitted, grievances cannot be deleted or modified
- **Full transparency** - All actions are publicly verifiable
- **Automated workflow** - Smart contracts enforce escalation rules
- **Role-based access** - Only authorized personnel can take actions
- **Complete audit trail** - Every action is logged on blockchain

## How It Works Technically

### Smart Contract (The Backend)

We built a Solidity smart contract that handles everything:
- Role management (Student, Counselor, Year Coordinator, HOD, Dean, Admin)
- Grievance submission and storage
- Workflow management and escalation
- Access control (only authorized roles can take actions)
- Event logging (for transparency and tracking)

The contract is deployed on Ethereum's Sepolia testnet, which means:
- It's publicly accessible
- All transactions are verifiable
- It uses test ETH (free for development)
- It's a real blockchain (not a simulation)

### Frontend (The User Interface)

We built a clean, modern web interface that:
- Connects to your MetaMask wallet
- Lets you interact with the smart contract
- Shows your grievances in an easy-to-understand format
- Displays complete timelines and history
- Works entirely in your browser (no backend server needed)

### The Magic: Everything is On-Chain

Unlike traditional web apps that store data in databases, our system stores everything on the blockchain:
- Grievance descriptions
- Status changes
- Authority remarks
- Timestamps
- Who did what and when

This means:
- No central server to hack or manipulate
- No database that can be corrupted
- No way to "lose" data
- Complete transparency and verifiability

## Technology Stack

**Smart Contracts:**
- Solidity (for writing the contract)
- Hardhat (for development and deployment)
- Ethereum Sepolia Testnet (for deployment)

**Frontend:**
- HTML, CSS, JavaScript (vanilla, no frameworks needed)
- Ethers.js (for blockchain interaction)
- MetaMask (for wallet connection)

**Why this stack?**
- Simple and straightforward - no complex frameworks
- Easy to understand and modify
- Works entirely in the browser
- No backend server required

## Real-World Impact

This system solves real problems that students face:

1. **Lost Complaints** - Can't happen anymore. Once on blockchain, it's permanent.

2. **Lack of Transparency** - Students can now see exactly what's happening with their grievance at every step.

3. **Delayed Responses** - The automated escalation system ensures grievances don't get stuck at one level.

4. **No Accountability** - Every action is recorded and verifiable, creating natural accountability.

5. **Trust Issues** - Students don't have to trust blindly - they can verify everything themselves.

## Why This Matters for IIT Hyderabad

As students at IIT Hyderabad, we understand the importance of having a fair, transparent system for addressing concerns. This project demonstrates how blockchain technology can be used to solve real-world problems in academic institutions.

The system is:
- **Practical** - Solves actual problems students face
- **Transparent** - Builds trust through verifiability
- **Accountable** - Ensures authorities are responsible for their actions
- **Efficient** - Automated workflow reduces delays
- **Secure** - Blockchain ensures data integrity

## Project Structure

```
grievance-dapp/
├── contracts/
│   └── GrievanceSystemSecure.sol    # Main smart contract
├── scripts/
│   └── deploySecure.js               # Deployment script
├── test/
│   └── grievanceSecure.test.js      # Test suite
├── frontend/
│   ├── dashboard.html                # Main application (single page)
│   ├── admin.html                    # Admin panel for role assignment
│   ├── config.js                     # Contract address configuration
│   ├── app.js                        # Frontend logic
│   └── styles.css                    # Styling
├── hardhat.config.js                 # Hardhat configuration
└── package.json                      # Dependencies
```

## Getting Started

Want to try it out? Check out the [QUICKSTART.md](QUICKSTART.md) file for step-by-step instructions on setting up and running the project locally.

## The Future

This is just the beginning. Potential enhancements include:
- Mobile app for easier access
- Email/SMS notifications when grievances are updated
- Analytics dashboard for administrators
- Integration with existing college systems
- Support for file attachments
- Multi-language support

## Built For IIT Hyderabad Hackathon

This project was developed for the Web3 Campus Hackathon at IIT Hyderabad, focusing on solving real student problems using blockchain technology.

**Our Goal:** To demonstrate that blockchain isn't just about cryptocurrencies - it's a powerful tool for building transparent, accountable, and trustworthy systems that can solve real-world problems in academic institutions.

---

**Built with ❤️ by students, for students**

*"Transparency shouldn't be optional - it should be built into the system"*
