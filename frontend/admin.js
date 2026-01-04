// ============ CONFIGURATION ============
// Contract address is loaded from config.js
// ⚠️ To update contract address, edit frontend/config.js only

// Contract ABI - For GrievanceSystemSecure contract
const CONTRACT_ABI = [
  "function assignRole(address _user, uint8 _role) external",
  "function revokeRole(address _user) external",
  "function getUserRole(address _user) external view returns (uint8)",
  "function admin() external view returns (address)",
  "event RoleAssigned(address indexed user, uint8 role, address indexed assignedBy, uint256 timestamp)"
];

// Global variables
let provider;
let signer;
let contract;
let userAddress;

// Role enum mapping (matches GrievanceSystemSecure.sol)
const ROLE_NAMES = {
  0: "Student",
  1: "Counselor",
  2: "Year Coordinator",
  3: "HOD",
  4: "Dean",
  5: "Admin"
};

// Role enum values (for secure contract)
const ROLE = {
  STUDENT: 0,
  COUNSELOR: 1,
  YEAR_COORDINATOR: 2,
  HOD: 3,
  DEAN: 4,
  ADMIN: 5
};

// ============ INITIALIZATION ============

// Wait for ethers.js to load before initializing (with fallback CDN support)
function waitForEthers(callback, maxAttempts = 50) {
  if (typeof ethers !== 'undefined') {
    callback();
  } else if (maxAttempts > 0) {
    setTimeout(() => waitForEthers(callback, maxAttempts - 1), 100);
  } else {
    // Try loading fallback CDN
    console.log('Trying to load Ethers.js from fallback CDN...');
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.umd.min.js';
    script.onload = () => {
      console.log('Fallback CDN loaded successfully');
      waitForEthers(callback, 10); // Try again with shorter timeout
    };
    script.onerror = () => {
      // Try third CDN
      const script2 = document.createElement('script');
      script2.src = 'https://unpkg.com/ethers@5.7.2/dist/ethers.umd.min.js';
      script2.onload = () => {
        console.log('Third CDN loaded successfully');
        waitForEthers(callback, 10);
      };
      script2.onerror = () => {
        console.error('All CDNs failed to load Ethers.js');
        alert('Error: Ethers.js library failed to load from all CDNs!\n\nPlease:\n1. Check your internet connection\n2. Refresh the page\n3. Try using a different browser\n4. Check if CDN sites are blocked');
      };
      document.head.appendChild(script2);
    };
    document.head.appendChild(script);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  waitForEthers(() => {
    initAdmin();
  });
});

function initAdmin() {
  const connectBtn = document.getElementById('connect-btn');
  if (connectBtn) {
    connectBtn.addEventListener('click', connectWallet);
  }

  const verifyBtn = document.getElementById('verify-btn');
  if (verifyBtn) {
    verifyBtn.addEventListener('click', verifyRoles);
  }

  // Setup assign buttons
  document.querySelectorAll('.btn-assign').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const level = parseInt(e.target.dataset.level);
      const roleName = e.target.dataset.role;
      handleAssignRole(level, roleName, e.target);
    });
  });

  // Check for MetaMask on load
  if (typeof window.ethereum === 'undefined') {
    showMetaMaskWarning();
  }
}

function showMetaMaskWarning() {
  const connectBtn = document.getElementById('connect-btn');
  const warningDiv = document.getElementById('metamask-warning');
  
  if (connectBtn) {
    connectBtn.disabled = true;
    connectBtn.textContent = '⚠️ MetaMask Not Detected';
    connectBtn.style.opacity = '0.6';
    connectBtn.style.cursor = 'not-allowed';
  }
  
  if (warningDiv) {
    warningDiv.style.display = 'block';
    warningDiv.className = 'status-message error';
    warningDiv.innerHTML = `
      <strong>⚠️ MetaMask Not Found!</strong><br><br>
      <p><strong>Please install MetaMask to continue:</strong></p>
      <ol style="text-align: left; margin: 10px 20px; padding-left: 20px;">
        <li>Visit <a href="https://metamask.io/download" target="_blank" style="color: #2563eb; text-decoration: underline; font-weight: bold;">metamask.io/download</a></li>
        <li>Install the extension for your browser (Chrome, Firefox, Brave, or Edge)</li>
        <li>Create a new wallet or import an existing one</li>
        <li>Unlock MetaMask (enter your password)</li>
        <li>Switch to Sepolia Testnet in MetaMask</li>
        <li><strong style="color: #ef4444;">Refresh this page</strong> after installing</li>
      </ol>
      <p style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #fee2e2;">
        <strong>Common Issues:</strong><br>
        • Make sure MetaMask extension is <strong>enabled</strong> in your browser<br>
        • Make sure MetaMask is <strong>unlocked</strong> (not locked/sleeping)<br>
        • Try refreshing the page after installing<br>
        • Try restarting your browser
      </p>
    `;
  }
}

async function connectWallet() {
  try {
    // Check for MetaMask
    if (typeof window.ethereum === 'undefined') {
      showMetaMaskWarning();
      alert('MetaMask is not installed! Please install MetaMask to continue.');
      return;
    }

    // Request account access
    provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    
    signer = provider.getSigner();
    userAddress = await signer.getAddress();
    
    // Check if contract address is set (should not be the placeholder)
    const contractAddressEl = document.getElementById('contract-address');
    if (typeof CONTRACT_ADDRESS === 'undefined' || CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") {
      if (contractAddressEl) {
        contractAddressEl.textContent = "Not set - Please update CONTRACT_ADDRESS in config.js";
        contractAddressEl.style.color = "#ef4444";
      }
      showError("⚠️ Please update CONTRACT_ADDRESS in config.js with your deployed contract address!");
    } else {
      if (contractAddressEl) {
        contractAddressEl.textContent = 
          `${CONTRACT_ADDRESS.substring(0, 6)}...${CONTRACT_ADDRESS.substring(38)}`;
      }
    }
    
    // Check network - Get chainId directly from MetaMask for more reliable detection
    let chainId;
    try {
      // First try to get from MetaMask directly (most reliable)
      chainId = await window.ethereum.request({ method: 'eth_chainId' });
      console.log('ChainId from MetaMask:', chainId);
    } catch (e) {
      // Fallback to provider.getNetwork()
      const network = await provider.getNetwork();
      chainId = '0x' + network.chainId.toString(16);
      console.log('ChainId from provider:', chainId);
    }
    
    // Sepolia chainId: 0xaa36a7 (11155111 in decimal)
    const sepoliaChainId = '0xaa36a7';
    const sepoliaChainIdDecimal = 11155111;
    
    // Convert chainId to number for comparison
    const chainIdNumber = parseInt(chainId, 16);
    console.log('Current chainId (decimal):', chainIdNumber);
    console.log('Sepolia chainId (decimal):', sepoliaChainIdDecimal);
    
    if (chainId !== sepoliaChainId && chainIdNumber !== sepoliaChainIdDecimal) {
      console.log('Not on Sepolia, current chainId:', chainId);
      const switchConfirm = confirm('Please switch to Sepolia Testnet! Click OK to switch automatically.');
      if (switchConfirm) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: sepoliaChainId }], // Sepolia
          });
          console.log('Network switched successfully, reloading...');
          // Reload after switching network
          setTimeout(() => location.reload(), 1000);
          return;
        } catch (switchError) {
          console.error('Switch error:', switchError);
          if (switchError.code === 4902) {
            // Network doesn't exist, try adding it
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: sepoliaChainId,
                  chainName: 'Sepolia',
                  rpcUrls: ['https://rpc.sepolia.org'],
                  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                  blockExplorerUrls: ['https://sepolia.etherscan.io']
                }]
              });
              console.log('Network added successfully, reloading...');
              setTimeout(() => location.reload(), 1000);
              return;
            } catch (addError) {
              console.error('Add network error:', addError);
              alert('Please manually add Sepolia Testnet in MetaMask\n\nError: ' + (addError.message || 'Unknown error'));
              return;
            }
          } else {
            console.error('Switch error code:', switchError.code);
            alert('Please manually switch to Sepolia Testnet in MetaMask\n\nError: ' + (switchError.message || 'Unknown error'));
            return;
          }
        }
      } else {
        alert('You must be on Sepolia Testnet to use this application.\n\nCurrent network chainId: ' + chainId);
        return;
      }
    } else {
      console.log('✅ On Sepolia network! ChainId:', chainId);
    }

    // Update UI
    const connectedAddressEl = document.getElementById('connected-address');
    if (connectedAddressEl) {
      connectedAddressEl.textContent = 
        `${userAddress.substring(0, 6)}...${userAddress.substring(38)}`;
    }
    
    const connectionDetailsEl = document.getElementById('connection-details');
    if (connectionDetailsEl) connectionDetailsEl.style.display = 'block';
    
    const adminPanelEl = document.getElementById('admin-panel');
    if (adminPanelEl) adminPanelEl.style.display = 'block';
    
    const verifyPanelEl = document.getElementById('verify-panel');
    if (verifyPanelEl) verifyPanelEl.style.display = 'block';
    
    const connectBtnEl = document.getElementById('connect-btn');
    if (connectBtnEl) connectBtnEl.style.display = 'none';

    // Listen for account changes
    window.ethereum.on('accountsChanged', (accounts) => {
      if (accounts.length === 0) {
        window.location.reload();
      } else {
        window.location.reload();
      }
    });
    
    // Listen for network changes
    window.ethereum.on('chainChanged', () => {
      location.reload();
    });

    // Validate contract address before creating contract instance
    if (typeof CONTRACT_ADDRESS === 'undefined' || CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") {
      alert('Error: Contract address not set!\n\nPlease update CONTRACT_ADDRESS in config.js with your deployed contract address.');
      return;
    }
    
    contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

    // Verify if connected address is admin
    await checkAdminStatus();

  } catch (error) {
    console.error('Error connecting wallet:', error);
    if (error.code === 4001) {
      alert('Please connect your MetaMask wallet to continue.');
    } else {
      alert('Error connecting wallet: ' + (error.message || 'Unknown error'));
    }
  }
}

async function checkAdminStatus() {
  try {
    if (!contract) return;
    
    const adminAddress = await contract.admin();
    const isAdmin = adminAddress.toLowerCase() === userAddress.toLowerCase();
    
    if (!isAdmin) {
      showError(`⚠️ Warning: Connected address is not the admin!\n\nAdmin address: ${adminAddress}\nYour address: ${userAddress}\n\nOnly the admin (contract deployer) can assign roles.`);
    } else {
      showSuccess('✅ You are connected as the admin. You can assign roles.');
    }
  } catch (error) {
    console.error('Error checking admin status:', error);
  }
}

async function handleAssignRole(level, roleName, buttonElement) {
  // Map HTML level to secure contract role enum
  // HTML uses: 0=Counselor, 1=YearCoord, 2=HOD, 3=Dean
  // Secure contract uses: 1=Counselor, 2=YearCoord, 3=HOD, 4=Dean
  const roleEnum = level + 1; // Add 1 to convert from HTML level to contract enum
  
  const inputId = level === 0 ? 'counselor-address' : 
                  level === 1 ? 'yearcoord-address' : 
                  level === 2 ? 'hod-address' : 'dean-address';
  const addressInput = document.getElementById(inputId);
  const address = addressInput.value.trim();
  const statusDiv = document.getElementById(`status-${level}`);

  if (!address) {
    statusDiv.textContent = 'Please enter an address';
    statusDiv.className = 'status-message error';
    return;
  }

  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    statusDiv.textContent = 'Invalid Ethereum address format';
    statusDiv.className = 'status-message error';
    return;
  }

  if (!contract) {
    alert('Please connect your wallet first!');
    return;
  }

  try {
    statusDiv.textContent = `Assigning ${roleName} role...`;
    statusDiv.className = 'status-message info';

    // Use assignRole with role enum (1-4 for Counselor, YearCoord, HOD, Dean)
    const tx = await contract.assignRole(address, roleEnum);
    statusDiv.textContent = 'Transaction sent! Waiting for confirmation...';
    
    await tx.wait();
    
    statusDiv.textContent = `✅ ${roleName} role assigned successfully to ${address.substring(0, 6)}...${address.substring(38)}!`;
    statusDiv.className = 'status-message success';
    
    // Clear input after successful assignment
    addressInput.value = '';

  } catch (error) {
    console.error('Error assigning role:', error);
    let errorMessage = 'Error: ';
    
    if (error.reason) {
      errorMessage += error.reason;
    } else if (error.message) {
      errorMessage += error.message;
    } else {
      errorMessage += 'Unknown error occurred';
    }
    
    // Check for common errors
    if (errorMessage.includes('Only admin')) {
      errorMessage = '❌ Only the admin (contract deployer) can assign roles. Please connect with the deployer account.';
    } else if (errorMessage.includes('Cannot assign role to yourself')) {
      errorMessage = '❌ Cannot assign role to yourself.';
    } else if (errorMessage.includes('Cannot assign ADMIN role')) {
      errorMessage = '❌ Cannot assign ADMIN role through this interface.';
    }
    
    statusDiv.textContent = errorMessage;
    statusDiv.className = 'status-message error';
  }
}

async function verifyRoles() {
  const addressInput = document.getElementById('verify-address');
  const address = addressInput.value.trim();
  const resultDiv = document.getElementById('verify-result');

  if (!address) {
    resultDiv.innerHTML = '<p class="status-message error">Please enter an address to check</p>';
    return;
  }

  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    resultDiv.innerHTML = '<p class="status-message error">Invalid Ethereum address format</p>';
    return;
  }

  if (!contract) {
    alert('Please connect your wallet first!');
    return;
  }

  try {
    resultDiv.innerHTML = '<p class="status-message info">Checking role...</p>';
    
    const roleValue = await contract.getUserRole(address);
    const roleNum = parseInt(roleValue.toString());
    const roleName = ROLE_NAMES[roleNum] || 'Unknown';
    
    // Also check if it's the admin
    const adminAddress = await contract.admin();
    const isAdmin = adminAddress.toLowerCase() === address.toLowerCase();
    
    let resultHTML = '<div class="status-message success">';
    resultHTML += `<strong>Role for ${address.substring(0, 6)}...${address.substring(38)}:</strong><br>`;
    
    if (isAdmin) {
      resultHTML += `<strong style="color: #10b981;">Admin (Contract Deployer)</strong><br>`;
    }
    
    resultHTML += `<strong>Assigned Role:</strong> ${roleName} (${roleNum})`;
    resultHTML += '</div>';
    
    resultDiv.innerHTML = resultHTML;

  } catch (error) {
    console.error('Error verifying role:', error);
    resultDiv.innerHTML = '<p class="status-message error">Error checking role: ' + (error.message || 'Unknown error') + '</p>';
  }
}

function showError(message) {
  const statusDiv = document.getElementById('status-message') || document.body;
  const errorDiv = document.createElement('div');
  errorDiv.className = 'status-message error';
  errorDiv.textContent = message;
  errorDiv.style.margin = '10px 0';
  errorDiv.style.padding = '10px';
  
  if (statusDiv.id === 'status-message') {
    statusDiv.innerHTML = '';
    statusDiv.appendChild(errorDiv);
  } else {
    const container = document.querySelector('.container');
    if (container) {
      container.insertBefore(errorDiv, container.firstChild);
    }
  }
}

function showSuccess(message) {
  const statusDiv = document.getElementById('status-message') || document.body;
  const successDiv = document.createElement('div');
  successDiv.className = 'status-message success';
  successDiv.textContent = message;
  successDiv.style.margin = '10px 0';
  successDiv.style.padding = '10px';
  
  if (statusDiv.id === 'status-message') {
    statusDiv.innerHTML = '';
    statusDiv.appendChild(successDiv);
  } else {
    const container = document.querySelector('.container');
    if (container) {
      container.insertBefore(successDiv, container.firstChild);
    }
  }
}
