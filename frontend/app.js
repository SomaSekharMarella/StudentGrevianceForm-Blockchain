// ============ CONFIGURATION ============
// Contract address is loaded from config.js
// ⚠️ To update contract address, edit frontend/config.js only

// Contract ABI (Interface) - For GrievanceSystemSecure contract
const CONTRACT_ABI = [
  "function submitGrievance(string memory _description) external returns (uint256)",
  "function reviewGrievance(uint256 _grievanceId) external",
  "function resolveGrievanceByCounselorOrCoordinator(uint256 _grievanceId, string memory _remarks) external",
  "function escalateToYearCoordinator(uint256 _grievanceId, string memory _remarks) external",
  "function escalateToHOD(uint256 _grievanceId, address _hodAddress, string memory _remarks) external",
  "function assignGrievanceToHOD(uint256 _grievanceId, address _hodAddress) external",
  "function resolveGrievance(uint256 _grievanceId, string memory _remarks) external",
  "function escalateGrievance(uint256 _grievanceId, string memory _remarks) external",
  "function closeGrievance(uint256 _grievanceId, string memory _remarks) external",
  "function getGrievanceById(uint256 _grievanceId) external view returns (tuple(uint256 grievanceId, address studentAddress, string description, uint8 status, address assignedHOD, address currentHandler, uint256 submittedAt, uint256 lastUpdatedAt, string resolutionRemarks, address resolvedBy))",
  "function grievanceLevel(uint256 _grievanceId) external view returns (uint8)",
  "function getVisibleGrievances() external view returns (uint256[])",
  "function getTotalGrievances() external view returns (uint256)",
  "function getUserRole(address _user) external view returns (uint8)",
  "event GrievanceSubmitted(uint256 indexed grievanceId, address indexed student, string description, uint256 timestamp)",
  "event GrievanceAssignedToHOD(uint256 indexed grievanceId, address indexed hod, address indexed assignedBy, uint256 timestamp)",
  "event GrievanceEscalated(uint256 indexed grievanceId, address indexed escalatedBy, address indexed toHandler, uint256 timestamp)",
  "event GrievanceResolved(uint256 indexed grievanceId, address indexed resolvedBy, string remarks, uint256 timestamp)",
  "event GrievanceClosed(uint256 indexed grievanceId, address indexed closedBy, string remarks, uint256 timestamp)"
];

// Status enum (matches GrievanceSystemSecure.sol)
const STATUS = {
  0: "SUBMITTED",
  1: "IN_REVIEW",
  2: "ASSIGNED_TO_HOD",
  3: "ESCALATED",
  4: "RESOLVED",
  5: "CLOSED"
};

// Role enum (matches GrievanceSystemSecure.sol)
const ROLE = {
  STUDENT: 0,
  COUNSELOR: 1,
  YEAR_COORDINATOR: 2,
  HOD: 3,
  DEAN: 4,
  ADMIN: 5
};

const ROLE_NAMES = {
  0: "Student",
  1: "Counselor",
  2: "Year Coordinator",
  3: "HOD",
  4: "Dean",
  5: "Admin"
};

// Global variables
let provider;
let signer;
let contract;
let userAddress;
let userRole = ROLE.STUDENT; // Default to STUDENT (0)
let userRoleName = "Student";
let isAuthority = false;

// Cache for grievances data
let cachedMyGrievances = null;
let cachedAuthorityGrievances = null;
let grievancesLoaded = false;

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

// Check if we're on index.html or dashboard.html
const isDashboard = window.location.pathname.includes('dashboard.html');

if (isDashboard) {
  // Initialize dashboard
  document.addEventListener('DOMContentLoaded', async () => {
    waitForEthers(async () => {
      await initDashboard();
    });
  });
} else {
  // Initialize login page
  document.addEventListener('DOMContentLoaded', () => {
    waitForEthers(() => {
      initLoginPage();
    });
  });
}

// ============ LOGIN PAGE ============

function initLoginPage() {
  const connectBtn = document.getElementById('connect-btn');
  const proceedBtn = document.getElementById('proceed-btn');
  
  connectBtn.addEventListener('click', connectWallet);
  proceedBtn.addEventListener('click', () => {
    window.location.href = 'dashboard.html';
  });
}

// ============ DASHBOARD ============

async function initDashboard() {
  // Check if wallet is connected
  if (!window.ethereum) {
    alert('Please install MetaMask!');
    window.location.href = 'index.html';
    return;
  }

  // Initialize provider and contract
  await connectWallet();
  
  if (!userAddress) {
    window.location.href = 'index.html';
    return;
  }

  // Setup event listeners
  setupEventListeners();
  
  // Load initial data
  await checkUserRole();
  await loadGrievances();
}

function setupEventListeners() {
  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tabName = e.target.dataset.tab;
      switchTab(tabName);
    });
  });

  // Grievance form submission
  const grievanceForm = document.getElementById('grievance-form');
  if (grievanceForm) {
    grievanceForm.addEventListener('submit', handleSubmitGrievance);
    
    // Character counter
    const textarea = document.getElementById('grievance-description');
    const charCount = document.getElementById('char-count');
    if (textarea && charCount) {
      textarea.addEventListener('input', () => {
        charCount.textContent = textarea.value.length;
      });
    }
  }

  // Disconnect button
  const disconnectBtn = document.getElementById('disconnect-btn');
  if (disconnectBtn) {
    disconnectBtn.addEventListener('click', () => {
      window.location.href = 'index.html';
    });
  }

  // Modal close buttons
  document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('grievance-modal').style.display = 'none';
      document.getElementById('action-modal').style.display = 'none';
    });
  });

  // Action buttons
  document.getElementById('review-btn')?.addEventListener('click', handleReview);
  document.getElementById('resolve-btn')?.addEventListener('click', handleResolve);
  document.getElementById('escalate-btn')?.addEventListener('click', handleEscalate);
  document.getElementById('close-btn')?.addEventListener('click', handleClose);
}

// ============ WALLET CONNECTION ============

async function connectWallet() {
  try {
    if (!window.ethereum) {
      alert('MetaMask is not installed! Please install MetaMask to continue.');
      return;
    }

    // Request account access
    provider = new ethers.providers.Web3Provider(window.ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);
    
    // Check if user rejected the request
    if (!accounts || accounts.length === 0) {
      alert('Please connect your wallet in MetaMask to continue.');
      return;
    }
    
    signer = provider.getSigner();
    userAddress = await signer.getAddress();
    
    // Validate contract address
    if (typeof CONTRACT_ADDRESS === 'undefined' || CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") {
      alert('Error: Contract address not set!\n\nPlease update CONTRACT_ADDRESS in config.js with your deployed contract address.');
      return;
    }
    
    contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

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
    if (isDashboard) {
      const userAddressEl = document.getElementById('user-address');
      if (userAddressEl) {
        userAddressEl.textContent = 
          `${userAddress.substring(0, 6)}...${userAddress.substring(38)}`;
      }
    } else {
      const connectedAddressEl = document.getElementById('connected-address');
      if (connectedAddressEl) {
        connectedAddressEl.textContent = 
          `${userAddress.substring(0, 6)}...${userAddress.substring(38)}`;
      }
      
      const networkNameEl = document.getElementById('network-name');
      if (networkNameEl) networkNameEl.textContent = network.name;
      
      const connectionDetailsEl = document.getElementById('connection-details');
      if (connectionDetailsEl) connectionDetailsEl.style.display = 'block';
      
      const proceedBtnEl = document.getElementById('proceed-btn');
      if (proceedBtnEl) proceedBtnEl.style.display = 'block';
      
      const connectBtnEl = document.getElementById('connect-btn');
      if (connectBtnEl) connectBtnEl.style.display = 'none';
      
      const statusMessageEl = document.getElementById('status-message');
      if (statusMessageEl) {
        statusMessageEl.textContent = 'Connected';
        statusMessageEl.className = 'status-message success';
      }
    }

    // Listen for account changes
    window.ethereum.on('accountsChanged', (accounts) => {
      if (accounts.length === 0) {
        window.location.href = 'index.html';
      } else {
        window.location.reload();
      }
    });
    
    // Listen for network changes
    window.ethereum.on('chainChanged', () => {
      location.reload();
    });

  } catch (error) {
    console.error('Error connecting wallet:', error);
    let errorMessage = 'Failed to connect wallet';
    
    if (error.code === 4001) {
      errorMessage = 'Connection rejected. Please approve the connection in MetaMask.';
    } else if (error.message) {
      errorMessage += ': ' + error.message;
    }
    
    alert(errorMessage);
  }
}

// ============ ROLE CHECKING ============

async function checkUserRole() {
  try {
    // Get user role from secure contract
    const roleValue = await contract.getUserRole(userAddress);
    userRole = parseInt(roleValue.toString());
    userRoleName = ROLE_NAMES[userRole] || "Unknown";
    
    // Check if user is an authority (not student, not admin)
    isAuthority = (userRole === ROLE.COUNSELOR || 
                   userRole === ROLE.YEAR_COORDINATOR || 
                   userRole === ROLE.HOD || 
                   userRole === ROLE.DEAN);
    
    // Update UI based on role
    const submitTabBtn = document.querySelector('[data-tab="submit"]');
    const submitTabContent = document.getElementById('submit-tab');
    const authorityTabBtn = document.getElementById('authority-tab');
    
    // Hide submit tab for non-students
    if (userRole !== ROLE.STUDENT) {
      if (submitTabBtn) submitTabBtn.style.display = 'none';
      if (submitTabContent) submitTabContent.style.display = 'none';
      
      // Show authority tab for authorities
      if (isAuthority && authorityTabBtn) {
        authorityTabBtn.style.display = 'inline-block';
        // Switch to authority tab by default
        setTimeout(() => switchTab('authority-grievances'), 100);
      }
    } else {
      // Student: show submit tab, hide authority tab
      if (submitTabBtn) submitTabBtn.style.display = 'inline-block';
      if (submitTabContent) submitTabContent.style.display = 'block';
      if (authorityTabBtn) authorityTabBtn.style.display = 'none';
    }
    
    // Update role display if on login page
    if (!isDashboard) {
      const roleElement = document.getElementById('user-role');
      if (roleElement) roleElement.textContent = userRoleName;
    }
    
    // Update header with role
    const userAddressEl = document.getElementById('user-address');
    if (userAddressEl) {
      userAddressEl.textContent = `${userRoleName} - ${userAddress.substring(0, 6)}...${userAddress.substring(38)}`;
    }
    
  } catch (error) {
    console.error('Error checking role:', error);
    // Default to student on error
    userRole = ROLE.STUDENT;
    userRoleName = "Student";
  }
}

// ============ TAB SWITCHING ============

function switchTab(tabName) {
  // Update tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.tab === tabName) {
      btn.classList.add('active');
    }
  });

  // Update tab content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });

  document.getElementById(`${tabName}-tab`).classList.add('active');

  // Tab switching just shows/hides content - data is already loaded on page init
  // No need to reload data when switching tabs
}

// ============ GRIEVANCE SUBMISSION ============

async function handleSubmitGrievance(e) {
  e.preventDefault();
  
  const description = document.getElementById('grievance-description').value;
  const statusDiv = document.getElementById('submit-status');
  
  if (!description.trim()) {
    statusDiv.textContent = 'Please enter a grievance description';
    statusDiv.className = 'status-message error';
    return;
  }

  try {
    statusDiv.textContent = 'Submitting grievance...';
    statusDiv.className = 'status-message info';

    const tx = await contract.submitGrievance(description);
    statusDiv.textContent = 'Transaction pending...';
    
    await tx.wait();
    
    statusDiv.textContent = 'Grievance submitted successfully!';
    statusDiv.className = 'status-message success';
    
    document.getElementById('grievance-form').reset();
    document.getElementById('char-count').textContent = '0';
    
    // Reload grievances
    setTimeout(() => {
      switchTab('my-grievances');
    }, 2000);

  } catch (error) {
    console.error('Error submitting grievance:', error);
    statusDiv.textContent = 'Error: ' + (error.reason || error.message);
    statusDiv.className = 'status-message error';
  }
}

// ============ LOAD GRIEVANCES ============

async function loadGrievances() {
  // Load all grievances once on page load
  await loadMyGrievances();
  if (isAuthority) {
    await loadAuthorityGrievances();
  }
  grievancesLoaded = true;
}

async function loadMyGrievances() {
  const listDiv = document.getElementById('my-grievances-list');
  if (!listDiv) return;
  
  listDiv.innerHTML = '<p class="empty-state">Loading...</p>';

  try {
    // Use getVisibleGrievances() which returns role-filtered grievances
    const grievanceIds = await contract.getVisibleGrievances();
    
    if (grievanceIds.length === 0) {
      if (userRole === ROLE.STUDENT) {
        listDiv.innerHTML = '<p class="empty-state">No grievances submitted yet.</p>';
      } else {
        listDiv.innerHTML = '<p class="empty-state">No grievances visible for your role.</p>';
      }
      return;
    }

    listDiv.innerHTML = '';
    
    for (const id of grievanceIds) {
      try {
        const grievance = await contract.getGrievanceById(id);
        const grievanceCard = createGrievanceCard(grievance, userRole !== ROLE.STUDENT);
        listDiv.appendChild(grievanceCard);
      } catch (e) {
        console.log('Skipping grievance', id.toString(), ':', e.message);
      }
    }

  } catch (error) {
    console.error('Error loading grievances:', error);
    listDiv.innerHTML = '<p class="empty-state error">Error loading grievances: ' + (error.message || 'Unknown error') + '</p>';
  }
}

async function loadAuthorityGrievances() {
  const listDiv = document.getElementById('authority-grievances-list');
  if (!listDiv) return;
  
  listDiv.innerHTML = '<p class="empty-state">Loading grievances...</p>';

  try {
    // Use getVisibleGrievances() which returns role-filtered grievances
    const grievanceIds = await contract.getVisibleGrievances();
    
    if (grievanceIds.length === 0) {
      if (userRole === ROLE.HOD) {
        listDiv.innerHTML = '<p class="empty-state">No grievances assigned to you yet.</p>';
      } else if (userRole === ROLE.DEAN) {
        listDiv.innerHTML = '<p class="empty-state">No escalated grievances to review.</p>';
      } else {
        listDiv.innerHTML = '<p class="empty-state">No grievances available for your role.</p>';
      }
      return;
    }

    listDiv.innerHTML = '';
    
    for (const id of grievanceIds) {
      try {
        const grievance = await contract.getGrievanceById(id);
        const grievanceCard = createGrievanceCard(grievance, true);
        listDiv.appendChild(grievanceCard);
      } catch (e) {
        console.log('Skipping grievance', id.toString(), ':', e.message);
      }
    }

  } catch (error) {
    console.error('Error loading authority grievances:', error);
    listDiv.innerHTML = '<p class="empty-state error">Error loading grievances: ' + (error.message || 'Unknown error') + '</p>';
  }
}

// ============ GRIEVANCE CARD CREATION ============

function createGrievanceCard(grievance, isAuthorityView) {
  const card = document.createElement('div');
  card.className = 'grievance-card';
  card.dataset.grievanceId = grievance.grievanceId.toString();

  const statusClass = getStatusClass(grievance.status);
  const statusText = STATUS[grievance.status] || "UNKNOWN";
  
  // For secure contract, we don't have currentLevel, so show assigned HOD or current handler
  let levelText = "";
  if (grievance.assignedHOD && grievance.assignedHOD !== ethers.constants.AddressZero) {
    levelText = `Assigned to HOD: ${grievance.assignedHOD.substring(0, 6)}...`;
  } else if (grievance.currentHandler && grievance.currentHandler !== ethers.constants.AddressZero) {
    levelText = `Handler: ${grievance.currentHandler.substring(0, 6)}...`;
  } else {
    levelText = "Not assigned";
  }

  const date = new Date(grievance.submittedAt.toNumber() * 1000).toLocaleDateString();
  const description = grievance.description.length > 150 
    ? grievance.description.substring(0, 150) + '...' 
    : grievance.description;

  card.innerHTML = `
    <div class="grievance-header">
      <div class="grievance-id">Grievance #${grievance.grievanceId}</div>
      <span class="status-badge ${statusClass}">${statusText}</span>
    </div>
    <div class="grievance-body">
      <p class="grievance-description">${escapeHtml(description)}</p>
      <div class="grievance-meta">
        <span><strong>Level:</strong> ${levelText}</span>
        <span><strong>Submitted:</strong> ${date}</span>
      </div>
    </div>
    <div class="grievance-actions">
      <button class="btn btn-small btn-view" data-grievance-id="${grievance.grievanceId}">View Details</button>
      ${isAuthorityView && grievance.status !== 4 && grievance.status !== 5 
        ? `<button class="btn btn-small btn-action" data-grievance-id="${grievance.grievanceId}">Take Action</button>` 
        : ''}
    </div>
  `;

  // Add event listeners
  card.querySelector('.btn-view').addEventListener('click', () => {
    showGrievanceDetails(grievance.grievanceId);
  });

  if (isAuthorityView) {
    const actionBtn = card.querySelector('.btn-action');
    if (actionBtn) {
      actionBtn.addEventListener('click', () => {
        showActionModal(grievance.grievanceId);
      });
    }
  }

  return card;
}

// ============ GRIEVANCE DETAILS ============

// Helper function to get role name for an address
async function getRoleNameForAddress(address) {
  try {
    const roleValue = await contract.getUserRole(address);
    const role = parseInt(roleValue.toString());
    return ROLE_NAMES[role] || "Unknown";
  } catch (error) {
    return "Unknown";
  }
}

// Helper function to query events and build timeline
async function getGrievanceTimeline(grievanceId) {
  const timeline = [];
  
  try {
    // Query all events for this grievance
    const submittedFilter = contract.filters.GrievanceSubmitted(grievanceId);
    const resolvedFilter = contract.filters.GrievanceResolved(grievanceId);
    const escalatedFilter = contract.filters.GrievanceEscalated(grievanceId);
    const assignedFilter = contract.filters.GrievanceAssignedToHOD(grievanceId);
    const closedFilter = contract.filters.GrievanceClosed(grievanceId);
    
    const [submittedEvents, resolvedEvents, escalatedEvents, assignedEvents, closedEvents] = await Promise.all([
      contract.queryFilter(submittedFilter),
      contract.queryFilter(resolvedFilter),
      contract.queryFilter(escalatedFilter),
      contract.queryFilter(assignedFilter),
      contract.queryFilter(closedFilter)
    ]);
    
    // Process submitted events
    submittedEvents.forEach(event => {
      timeline.push({
        type: 'submitted',
        address: event.args.student,
        remarks: event.args.description,
        timestamp: event.args.timestamp.toNumber(),
        roleName: 'Student'
      });
    });
    
    // Process assigned to HOD events
    assignedEvents.forEach(event => {
      timeline.push({
        type: 'assigned',
        address: event.args.assignedBy,
        remarks: `Assigned to HOD: ${event.args.hod.substring(0, 6)}...${event.args.hod.substring(38)}`,
        timestamp: event.args.timestamp.toNumber(),
        roleName: null // Will be filled
      });
    });
    
    // Process escalated events
    escalatedEvents.forEach(event => {
      timeline.push({
        type: 'escalated',
        address: event.args.escalatedBy,
        remarks: 'Escalated to higher authority',
        timestamp: event.args.timestamp.toNumber(),
        roleName: null // Will be filled
      });
    });
    
    // Process resolved events
    resolvedEvents.forEach(event => {
      timeline.push({
        type: 'resolved',
        address: event.args.resolvedBy,
        remarks: event.args.remarks,
        timestamp: event.args.timestamp.toNumber(),
        roleName: null // Will be filled
      });
    });
    
    // Process closed events
    closedEvents.forEach(event => {
      timeline.push({
        type: 'closed',
        address: event.args.closedBy,
        remarks: event.args.remarks,
        timestamp: event.args.timestamp.toNumber(),
        roleName: null // Will be filled
      });
    });
    
    // Sort by timestamp
    timeline.sort((a, b) => a.timestamp - b.timestamp);
    
    // Fill in role names
    for (let item of timeline) {
      if (!item.roleName && item.address) {
        item.roleName = await getRoleNameForAddress(item.address);
      }
    }
    
  } catch (error) {
    console.error('Error querying events:', error);
  }
  
  return timeline;
}

async function showGrievanceDetails(grievanceId) {
  try {
    const grievance = await contract.getGrievanceById(grievanceId);
    const modal = document.getElementById('grievance-modal');
    const modalBody = document.getElementById('modal-body');

    const submittedDate = new Date(grievance.submittedAt.toNumber() * 1000).toLocaleString();
    const updatedDate = new Date(grievance.lastUpdatedAt.toNumber() * 1000).toLocaleString();
    const statusClass = getStatusClass(grievance.status);

    // Get timeline for full traceability
    const timeline = await getGrievanceTimeline(grievanceId);
    
    // Build timeline HTML
    let timelineHTML = '';
    if (timeline.length > 0) {
      timelineHTML = '<div class="timeline-section" style="margin-top: 20px; border-top: 2px solid #e0e0e0; padding-top: 20px;"><h3 style="margin-bottom: 15px;">Timeline & Remarks</h3>';
      timeline.forEach((item, index) => {
        const dateTime = new Date(item.timestamp * 1000).toLocaleString();
        const typeLabels = {
          'submitted': 'Submitted',
          'assigned': 'Assigned to HOD',
          'escalated': 'Escalated',
          'resolved': 'Resolved',
          'closed': 'Closed'
        };
        const typeColors = {
          'submitted': '#4CAF50',
          'assigned': '#2196F3',
          'escalated': '#FF9800',
          'resolved': '#9C27B0',
          'closed': '#F44336'
        };
        
        timelineHTML += `
          <div class="timeline-item" style="margin-bottom: 20px; padding: 15px; background: #f9f9f9; border-left: 4px solid ${typeColors[item.type] || '#666'}; border-radius: 4px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <strong style="color: ${typeColors[item.type] || '#666'};">${typeLabels[item.type] || item.type}</strong>
              <span style="color: #666; font-size: 0.9em;">${dateTime}</span>
            </div>
            <div style="margin-bottom: 8px;">
              <strong>By:</strong> ${item.roleName} (<code style="font-size: 0.85em;">${item.address.substring(0, 6)}...${item.address.substring(38)}</code>)
            </div>
            ${item.remarks ? `<div style="margin-top: 8px; padding: 10px; background: white; border-radius: 4px;"><strong>Remarks:</strong> ${escapeHtml(item.remarks)}</div>` : ''}
          </div>
        `;
      });
      timelineHTML += '</div>';
    }

    // Get resolved by role name
    let resolvedByDisplay = '';
    if (grievance.resolvedBy !== ethers.constants.AddressZero) {
      const resolvedByRole = await getRoleNameForAddress(grievance.resolvedBy);
      resolvedByDisplay = `${resolvedByRole} (<code>${grievance.resolvedBy}</code>)`;
    }

    modalBody.innerHTML = `
      <h2>Grievance #${grievance.grievanceId}</h2>
      <div class="grievance-detail">
        <div class="detail-item">
          <strong>Status:</strong>
          <span class="status-badge ${statusClass}">${STATUS[grievance.status]}</span>
        </div>
        ${grievance.assignedHOD && grievance.assignedHOD !== ethers.constants.AddressZero
          ? `<div class="detail-item">
              <strong>Assigned HOD:</strong>
              <code>${grievance.assignedHOD}</code>
            </div>`
          : ''}
        ${grievance.currentHandler && grievance.currentHandler !== ethers.constants.AddressZero
          ? `<div class="detail-item">
              <strong>Current Handler:</strong>
              <code>${grievance.currentHandler}</code>
            </div>`
          : ''}
        <div class="detail-item">
          <strong>Student Address:</strong>
          <code>${grievance.studentAddress}</code>
        </div>
        <div class="detail-item">
          <strong>Submitted At:</strong>
          ${submittedDate}
        </div>
        <div class="detail-item">
          <strong>Last Updated:</strong>
          ${updatedDate}
        </div>
        <div class="detail-item">
          <strong>Description:</strong>
          <p class="detail-description">${escapeHtml(grievance.description)}</p>
        </div>
        ${resolvedByDisplay
          ? `<div class="detail-item">
              <strong>Resolved By:</strong>
              ${resolvedByDisplay}
            </div>`
          : ''}
        ${grievance.resolutionRemarks 
          ? `<div class="detail-item">
              <strong>Final Resolution Remarks:</strong>
              <p class="detail-remarks">${escapeHtml(grievance.resolutionRemarks)}</p>
            </div>`
          : ''}
      </div>
      ${timelineHTML}
    `;

    modal.style.display = 'block';
  } catch (error) {
    console.error('Error loading grievance details:', error);
    alert('Error loading grievance details: ' + (error.message || 'Unknown error'));
  }
}

// ============ ACTION MODAL ============

async function showActionModal(grievanceId) {
  try {
    const grievance = await contract.getGrievanceById(grievanceId);
    const modal = document.getElementById('action-modal');
    document.getElementById('action-grievance-id').value = grievanceId;
    document.getElementById('action-remarks').value = '';

    // Show/hide buttons based on role
    const reviewBtn = document.getElementById('review-btn');
    const resolveBtn = document.getElementById('resolve-btn');
    const escalateBtn = document.getElementById('escalate-btn');
    const closeBtn = document.getElementById('close-btn');
    
    // Hide all first
    reviewBtn.style.display = 'none';
    resolveBtn.style.display = 'none';
    escalateBtn.style.display = 'none';
    closeBtn.style.display = 'none';
    
    // Show appropriate buttons based on role
    if (userRole === ROLE.COUNSELOR || userRole === ROLE.YEAR_COORDINATOR) {
      reviewBtn.style.display = 'inline-block';
      resolveBtn.style.display = 'inline-block';
      escalateBtn.style.display = 'inline-block';
    } else if (userRole === ROLE.HOD) {
      resolveBtn.style.display = 'inline-block';
      escalateBtn.style.display = 'inline-block';
    } else if (userRole === ROLE.DEAN && grievance.status === 3) {
      closeBtn.style.display = 'inline-block';
    }

    modal.style.display = 'block';
  } catch (error) {
    console.error('Error showing action modal:', error);
    alert('Error loading grievance');
  }
}

// ============ ACTIONS ============

async function handleReview() {
  const grievanceId = document.getElementById('action-grievance-id').value;
  const statusDiv = document.getElementById('action-status');

  try {
    statusDiv.textContent = 'Marking as in review...';
    statusDiv.className = 'status-message info';

    const tx = await contract.reviewGrievance(grievanceId);
    await tx.wait();

    statusDiv.textContent = 'Grievance marked as in review!';
    statusDiv.className = 'status-message success';
    document.getElementById('action-modal').style.display = 'none';
    
    setTimeout(() => {
      loadAuthorityGrievances();
    }, 1000);

  } catch (error) {
    statusDiv.textContent = 'Error: ' + (error.reason || error.message);
    statusDiv.className = 'status-message error';
  }
}

async function handleResolve() {
  const grievanceId = document.getElementById('action-grievance-id').value;
  const remarks = document.getElementById('action-remarks').value;
  const statusDiv = document.getElementById('action-status');

  if (!remarks.trim()) {
    statusDiv.textContent = 'Please enter resolution remarks';
    statusDiv.className = 'status-message error';
    return;
  }

  try {
    statusDiv.textContent = 'Resolving grievance...';
    statusDiv.className = 'status-message info';

    let tx;
    // Route to correct function based on role
    if (userRole === ROLE.COUNSELOR || userRole === ROLE.YEAR_COORDINATOR) {
      tx = await contract.resolveGrievanceByCounselorOrCoordinator(grievanceId, remarks);
    } else if (userRole === ROLE.HOD) {
      tx = await contract.resolveGrievance(grievanceId, remarks);
    } else {
      throw new Error('You do not have permission to resolve grievances');
    }
    
    await tx.wait();

    statusDiv.textContent = 'Grievance resolved successfully!';
    statusDiv.className = 'status-message success';
    document.getElementById('action-modal').style.display = 'none';
    
    setTimeout(() => {
      if (userRole === ROLE.STUDENT) {
        loadMyGrievances();
      } else {
        loadAuthorityGrievances();
      }
    }, 1000);

  } catch (error) {
    statusDiv.textContent = 'Error: ' + (error.reason || error.message);
    statusDiv.className = 'status-message error';
  }
}

async function handleEscalate() {
  const grievanceId = document.getElementById('action-grievance-id').value;
  const remarks = document.getElementById('action-remarks').value;
  const statusDiv = document.getElementById('action-status');

  if (!remarks.trim()) {
    statusDiv.textContent = 'Please enter escalation remarks';
    statusDiv.className = 'status-message error';
    return;
  }

  try {
    statusDiv.textContent = 'Escalating grievance...';
    statusDiv.className = 'status-message info';

    let tx;
    // Route to correct function based on role
    if (userRole === ROLE.COUNSELOR) {
      // Counselor escalates to Year Coordinator
      tx = await contract.escalateToYearCoordinator(grievanceId, remarks);
    } else if (userRole === ROLE.YEAR_COORDINATOR) {
      // Year Coordinator escalates to HOD - needs HOD address
      // For now, we'll need to get a list of HODs or allow manual input
      // This is a simplified version - in production, you'd want a dropdown or search
      const hodAddress = prompt('Enter HOD address to escalate to:');
      if (!hodAddress || !hodAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
        statusDiv.textContent = 'Error: Invalid HOD address';
        statusDiv.className = 'status-message error';
        return;
      }
      tx = await contract.escalateToHOD(grievanceId, hodAddress, remarks);
    } else if (userRole === ROLE.HOD) {
      // HOD escalates to Dean
      tx = await contract.escalateGrievance(grievanceId, remarks);
    } else {
      throw new Error('You do not have permission to escalate grievances');
    }
    
    await tx.wait();

    statusDiv.textContent = 'Grievance escalated successfully!';
    statusDiv.className = 'status-message success';
    document.getElementById('action-modal').style.display = 'none';
    
    setTimeout(() => {
      if (userRole === ROLE.STUDENT) {
        loadMyGrievances();
      } else {
        loadAuthorityGrievances();
      }
    }, 1000);

  } catch (error) {
    statusDiv.textContent = 'Error: ' + (error.reason || error.message);
    statusDiv.className = 'status-message error';
  }
}

async function handleClose() {
  const grievanceId = document.getElementById('action-grievance-id').value;
  const remarks = document.getElementById('action-remarks').value;
  const statusDiv = document.getElementById('action-status');

  if (!remarks.trim()) {
    statusDiv.textContent = 'Please enter closing remarks';
    statusDiv.className = 'status-message error';
    return;
  }

  try {
    statusDiv.textContent = 'Closing grievance...';
    statusDiv.className = 'status-message info';

    const tx = await contract.closeGrievance(grievanceId, remarks);
    await tx.wait();

    statusDiv.textContent = 'Grievance closed successfully!';
    statusDiv.className = 'status-message success';
    document.getElementById('action-modal').style.display = 'none';
    
    setTimeout(() => {
      if (userRole === ROLE.STUDENT) {
        loadMyGrievances();
      } else {
        loadAuthorityGrievances();
      }
    }, 1000);

  } catch (error) {
    statusDiv.textContent = 'Error: ' + (error.reason || error.message);
    statusDiv.className = 'status-message error';
  }
}

// ============ UTILITY FUNCTIONS ============

function getStatusClass(status) {
  const classes = {
    0: 'status-submitted',      // SUBMITTED
    1: 'status-review',          // IN_REVIEW
    2: 'status-review',          // ASSIGNED_TO_HOD
    3: 'status-escalated',       // ESCALATED
    4: 'status-resolved',        // RESOLVED
    5: 'status-closed'           // CLOSED
  };
  return classes[status] || 'status-submitted';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

