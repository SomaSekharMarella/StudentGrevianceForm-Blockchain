// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title GrievanceSystemSecure
 * @author Senior Web3 Security Architect
 * @notice Secure, role-based grievance management system with strict access control
 * @dev Implements zero-trust model with single admin, role-based access, and strict visibility rules
 * 
 * SECURITY FEATURES:
 * 1. Single Admin - Only deployer/admin can assign roles
 * 2. Role-Based Access Control - Each wallet has exactly one role
 * 3. Student-Only Submission - Only STUDENT role can submit grievances
 * 4. Strict Visibility - Users only see grievances they're authorized to view
 * 5. HOD Assignment - Grievances must be explicitly assigned to HODs
 * 6. Immutable Audit Trail - All actions emit events
 */
contract GrievanceSystemSecure {
    
    // ============ ENUMS ============
    
    /**
     * @notice User roles in the system
     * Each wallet has exactly ONE role
     */
    enum Role {
        STUDENT,              // 0: Can submit grievances, view own grievances
        COUNSELOR,            // 1: Can view all student grievances, assign to HOD
        YEAR_COORDINATOR,     // 2: Can view all student grievances, assign to HOD
        HOD,                  // 3: Can view only assigned grievances
        DEAN,                 // 4: Can view escalated grievances
        ADMIN                 // 5: Can assign/revoke roles (system management only)
    }
    
    /**
     * @notice Grievance status lifecycle
     */
    enum Status {
        SUBMITTED,            // 0: Initial state
        IN_REVIEW,            // 1: Being reviewed
        ASSIGNED_TO_HOD,      // 2: Assigned to specific HOD
        ESCALATED,            // 3: Escalated to Dean
        RESOLVED,             // 4: Resolved
        CLOSED                // 5: Closed by Dean
    }
    
    // ============ STRUCTS ============
    
    /**
     * @notice Core grievance data structure
     */
    struct Grievance {
        uint256 grievanceId;
        address studentAddress;
        string description;
        Status status;
        address assignedHOD;          // HOD assigned to handle this
        address currentHandler;       // Current authority handling
        uint256 submittedAt;
        uint256 lastUpdatedAt;
        string resolutionRemarks;
        address resolvedBy;
    }
    
    // ============ STATE VARIABLES ============
    
    address public admin;              // Single admin (contract deployer)
    uint256 private grievanceCounter;
    
    // Mapping: wallet address => Role
    mapping(address => Role) public roles;
    
    // Mapping: grievanceId => Grievance
    mapping(uint256 => Grievance) public grievances;
    
    // Mapping: student address => grievanceId[]
    mapping(address => uint256[]) public studentGrievances;
    
    // Mapping: HOD address => grievanceId[] (only assigned grievances)
    mapping(address => uint256[]) public hodGrievances;
    
    // Mapping: grievanceId => bool (track if assigned to HOD)
    mapping(uint256 => bool) public assignedToHOD;
    
    // Mapping: grievanceId => Role (track current escalation level for hierarchical workflow)
    mapping(uint256 => Role) public grievanceLevel;
    
    // ============ EVENTS ============
    
    event RoleAssigned(address indexed user, Role role, address indexed assignedBy, uint256 timestamp);
    event RoleRevoked(address indexed user, Role role, address indexed revokedBy, uint256 timestamp);
    event GrievanceSubmitted(uint256 indexed grievanceId, address indexed student, string description, uint256 timestamp);
    event GrievanceAssignedToHOD(uint256 indexed grievanceId, address indexed hod, address indexed assignedBy, uint256 timestamp);
    event GrievanceEscalated(uint256 indexed grievanceId, address indexed escalatedBy, address indexed toHandler, uint256 timestamp);
    event GrievanceResolved(uint256 indexed grievanceId, address indexed resolvedBy, string remarks, uint256 timestamp);
    event GrievanceClosed(uint256 indexed grievanceId, address indexed closedBy, string remarks, uint256 timestamp);
    
    // ============ MODIFIERS ============
    
    /**
     * @notice Ensures only admin can execute
     */
    modifier onlyAdmin() {
        require(roles[msg.sender] == Role.ADMIN, "GrievanceSystemSecure: Only admin can perform this action");
        require(msg.sender == admin, "GrievanceSystemSecure: Only admin address allowed");
        _;
    }
    
    /**
     * @notice Ensures only students can execute
     */
    modifier onlyStudent() {
        require(roles[msg.sender] == Role.STUDENT, "GrievanceSystemSecure: Only students can perform this action");
        _;
    }
    
    /**
     * @notice Ensures only counselor or year coordinator can execute
     */
    modifier onlyCounselorOrCoordinator() {
        Role userRole = roles[msg.sender];
        require(
            userRole == Role.COUNSELOR || userRole == Role.YEAR_COORDINATOR,
            "GrievanceSystemSecure: Only counselor or year coordinator can perform this action"
        );
        _;
    }
    
    /**
     * @notice Ensures only assigned HOD can execute
     */
    modifier onlyAssignedHOD(uint256 _grievanceId) {
        require(
            roles[msg.sender] == Role.HOD,
            "GrievanceSystemSecure: Only HOD can perform this action"
        );
        require(
            grievances[_grievanceId].assignedHOD == msg.sender,
            "GrievanceSystemSecure: You are not assigned to this grievance"
        );
        _;
    }
    
    /**
     * @notice Ensures only Dean can execute
     */
    modifier onlyDean() {
        require(roles[msg.sender] == Role.DEAN, "GrievanceSystemSecure: Only Dean can perform this action");
        _;
    }
    
    /**
     * @notice Ensures grievance exists
     */
    modifier grievanceExists(uint256 _grievanceId) {
        require(_grievanceId > 0 && _grievanceId <= grievanceCounter, "GrievanceSystemSecure: Grievance does not exist");
        _;
    }
    
    // ============ CONSTRUCTOR ============
    
    /**
     * @notice Initialize contract with deployer as admin
     */
    constructor() {
        admin = msg.sender;
        roles[msg.sender] = Role.ADMIN;
        grievanceCounter = 0;
        emit RoleAssigned(msg.sender, Role.ADMIN, msg.sender, block.timestamp);
    }
    
    // ============ ADMIN FUNCTIONS ============
    
    /**
     * @notice Assign role to a user (ADMIN ONLY)
     * @dev Only admin can assign roles. Cannot assign ADMIN role (except in constructor)
     * @param _user Address to assign role to
     * @param _role Role to assign (cannot be ADMIN)
     */
    function assignRole(address _user, Role _role) external onlyAdmin {
        require(_user != address(0), "GrievanceSystemSecure: Invalid address");
        require(_role != Role.ADMIN, "GrievanceSystemSecure: Cannot assign ADMIN role");
        require(_user != admin, "GrievanceSystemSecure: Cannot change admin role");
        
        // Prevent self-assignment of roles
        require(_user != msg.sender, "GrievanceSystemSecure: Cannot assign role to yourself");
        
        roles[_user] = _role;
        emit RoleAssigned(_user, _role, msg.sender, block.timestamp);
    }
    
    /**
     * @notice Revoke role from a user (ADMIN ONLY)
     * @param _user Address to revoke role from
     */
    function revokeRole(address _user) external onlyAdmin {
        require(_user != address(0), "GrievanceSystemSecure: Invalid address");
        require(_user != admin, "GrievanceSystemSecure: Cannot revoke admin role");
        
        Role oldRole = roles[_user];
        require(oldRole != Role.ADMIN, "GrievanceSystemSecure: Cannot revoke admin");
        
        delete roles[_user];
        emit RoleRevoked(_user, oldRole, msg.sender, block.timestamp);
    }
    
    /**
     * @notice Transfer admin role (ADMIN ONLY)
     * @param _newAdmin Address of new admin
     */
    function transferAdmin(address _newAdmin) external onlyAdmin {
        require(_newAdmin != address(0), "GrievanceSystemSecure: Invalid address");
        require(_newAdmin != admin, "GrievanceSystemSecure: Already admin");
        
        roles[admin] = Role.STUDENT; // Old admin becomes student
        admin = _newAdmin;
        roles[_newAdmin] = Role.ADMIN;
        
        emit RoleRevoked(admin, Role.ADMIN, msg.sender, block.timestamp);
        emit RoleAssigned(_newAdmin, Role.ADMIN, msg.sender, block.timestamp);
    }
    
    // ============ STUDENT FUNCTIONS ============
    
    /**
     * @notice Submit a new grievance (STUDENTS ONLY)
     * @dev Only students can submit grievances
     * @param _description Grievance description
     * @return grievanceId Unique identifier of created grievance
     */
    function submitGrievance(string memory _description) external onlyStudent returns (uint256) {
        require(bytes(_description).length > 0, "GrievanceSystemSecure: Description cannot be empty");
        require(bytes(_description).length <= 1000, "GrievanceSystemSecure: Description too long");
        
        grievanceCounter++;
        
        Grievance memory newGrievance = Grievance({
            grievanceId: grievanceCounter,
            studentAddress: msg.sender,
            description: _description,
            status: Status.SUBMITTED,
            assignedHOD: address(0),
            currentHandler: address(0),
            submittedAt: block.timestamp,
            lastUpdatedAt: block.timestamp,
            resolutionRemarks: "",
            resolvedBy: address(0)
        });
        
        grievances[grievanceCounter] = newGrievance;
        studentGrievances[msg.sender].push(grievanceCounter);
        grievanceLevel[grievanceCounter] = Role.COUNSELOR; // Start at Counselor level
        
        emit GrievanceSubmitted(grievanceCounter, msg.sender, _description, block.timestamp);
        
        return grievanceCounter;
    }
    
    // ============ COUNSELOR/YEAR COORDINATOR FUNCTIONS ============
    
    /**
     * @notice Assign grievance to a specific HOD
     * @dev Only counselor or year coordinator can assign
     * @param _grievanceId Grievance ID to assign
     * @param _hodAddress HOD address to assign to
     */
    function assignGrievanceToHOD(uint256 _grievanceId, address _hodAddress) 
        external 
        grievanceExists(_grievanceId)
        onlyCounselorOrCoordinator 
    {
        require(roles[_hodAddress] == Role.HOD, "GrievanceSystemSecure: Address must be a HOD");
        require(_hodAddress != address(0), "GrievanceSystemSecure: Invalid HOD address");
        
        Grievance storage grievance = grievances[_grievanceId];
        require(
            grievance.status == Status.SUBMITTED || 
            grievance.status == Status.IN_REVIEW,
            "GrievanceSystemSecure: Grievance cannot be assigned in current status"
        );
        
        grievance.assignedHOD = _hodAddress;
        grievance.currentHandler = _hodAddress;
        grievance.status = Status.ASSIGNED_TO_HOD;
        grievance.lastUpdatedAt = block.timestamp;
        
        hodGrievances[_hodAddress].push(_grievanceId);
        assignedToHOD[_grievanceId] = true;
        
        emit GrievanceAssignedToHOD(_grievanceId, _hodAddress, msg.sender, block.timestamp);
    }
    
    /**
     * @notice Review a grievance (mark as IN_REVIEW)
     * @dev Counselor/Coordinator can review before assigning
     */
    function reviewGrievance(uint256 _grievanceId) external grievanceExists(_grievanceId) onlyCounselorOrCoordinator {
        Grievance storage grievance = grievances[_grievanceId];
        require(grievance.status == Status.SUBMITTED, "GrievanceSystemSecure: Can only review submitted grievances");
        
        // Check if grievance is at user's level
        require(
            grievanceLevel[_grievanceId] == Role.COUNSELOR || 
            (grievanceLevel[_grievanceId] == Role.YEAR_COORDINATOR && roles[msg.sender] == Role.YEAR_COORDINATOR),
            "GrievanceSystemSecure: Grievance is not at your level"
        );
        
        grievance.status = Status.IN_REVIEW;
        grievance.currentHandler = msg.sender;
        grievance.lastUpdatedAt = block.timestamp;
    }
    
    /**
     * @notice Resolve grievance (Counselor/Year Coordinator)
     * @dev Allows Counselor or Year Coordinator to resolve grievances at their level
     */
    function resolveGrievanceByCounselorOrCoordinator(uint256 _grievanceId, string memory _remarks) 
        external 
        grievanceExists(_grievanceId)
        onlyCounselorOrCoordinator
    {
        Grievance storage grievance = grievances[_grievanceId];
        Role userRole = roles[msg.sender];
        Role currentLevel = grievanceLevel[_grievanceId];
        
        // Counselor can only resolve grievances at Counselor level
        // Year Coordinator can only resolve grievances at Year Coordinator level
        require(
            (userRole == Role.COUNSELOR && currentLevel == Role.COUNSELOR) ||
            (userRole == Role.YEAR_COORDINATOR && currentLevel == Role.YEAR_COORDINATOR),
            "GrievanceSystemSecure: Grievance is not at your level to resolve"
        );
        
        require(
            grievance.status == Status.SUBMITTED || grievance.status == Status.IN_REVIEW,
            "GrievanceSystemSecure: Cannot resolve grievance in current status"
        );
        require(bytes(_remarks).length <= 500, "GrievanceSystemSecure: Remarks too long");
        
        grievance.status = Status.RESOLVED;
        grievance.resolutionRemarks = _remarks;
        grievance.resolvedBy = msg.sender;
        grievance.lastUpdatedAt = block.timestamp;
        
        emit GrievanceResolved(_grievanceId, msg.sender, _remarks, block.timestamp);
    }
    
    /**
     * @notice Escalate grievance to Year Coordinator (Counselor only)
     */
    function escalateToYearCoordinator(uint256 _grievanceId, string memory _remarks) 
        external 
        grievanceExists(_grievanceId)
    {
        require(roles[msg.sender] == Role.COUNSELOR, "GrievanceSystemSecure: Only Counselor can escalate to Year Coordinator");
        
        Grievance storage grievance = grievances[_grievanceId];
        require(
            grievanceLevel[_grievanceId] == Role.COUNSELOR,
            "GrievanceSystemSecure: Grievance is not at Counselor level"
        );
        require(
            grievance.status == Status.SUBMITTED || grievance.status == Status.IN_REVIEW,
            "GrievanceSystemSecure: Cannot escalate grievance in current status"
        );
        require(bytes(_remarks).length <= 500, "GrievanceSystemSecure: Remarks too long");
        
        grievanceLevel[_grievanceId] = Role.YEAR_COORDINATOR;
        grievance.status = Status.IN_REVIEW; // Set to IN_REVIEW for Year Coordinator
        grievance.currentHandler = address(0); // Will be set when Year Coordinator handles
        grievance.lastUpdatedAt = block.timestamp;
        
        emit GrievanceEscalated(_grievanceId, msg.sender, address(0), block.timestamp);
    }
    
    /**
     * @notice Escalate grievance to HOD (Year Coordinator only)
     */
    function escalateToHOD(uint256 _grievanceId, address _hodAddress, string memory _remarks) 
        external 
        grievanceExists(_grievanceId)
    {
        require(roles[msg.sender] == Role.YEAR_COORDINATOR, "GrievanceSystemSecure: Only Year Coordinator can escalate to HOD");
        require(roles[_hodAddress] == Role.HOD, "GrievanceSystemSecure: Address must be a HOD");
        require(_hodAddress != address(0), "GrievanceSystemSecure: Invalid HOD address");
        
        Grievance storage grievance = grievances[_grievanceId];
        require(
            grievanceLevel[_grievanceId] == Role.YEAR_COORDINATOR,
            "GrievanceSystemSecure: Grievance is not at Year Coordinator level"
        );
        require(
            grievance.status == Status.SUBMITTED || grievance.status == Status.IN_REVIEW,
            "GrievanceSystemSecure: Cannot escalate grievance in current status"
        );
        require(bytes(_remarks).length <= 500, "GrievanceSystemSecure: Remarks too long");
        
        grievanceLevel[_grievanceId] = Role.HOD;
        grievance.assignedHOD = _hodAddress;
        grievance.currentHandler = _hodAddress;
        grievance.status = Status.ASSIGNED_TO_HOD;
        grievance.lastUpdatedAt = block.timestamp;
        
        hodGrievances[_hodAddress].push(_grievanceId);
        assignedToHOD[_grievanceId] = true;
        
        emit GrievanceAssignedToHOD(_grievanceId, _hodAddress, msg.sender, block.timestamp);
        emit GrievanceEscalated(_grievanceId, msg.sender, _hodAddress, block.timestamp);
    }
    
    // ============ HOD FUNCTIONS ============
    
    /**
     * @notice Resolve grievance (ASSIGNED HOD ONLY)
     * @param _grievanceId Grievance ID to resolve
     * @param _remarks Resolution remarks
     */
    function resolveGrievance(uint256 _grievanceId, string memory _remarks) 
        external 
        grievanceExists(_grievanceId)
        onlyAssignedHOD(_grievanceId)
    {
        Grievance storage grievance = grievances[_grievanceId];
        require(
            grievance.status == Status.ASSIGNED_TO_HOD,
            "GrievanceSystemSecure: Grievance must be assigned to HOD to resolve"
        );
        require(bytes(_remarks).length <= 500, "GrievanceSystemSecure: Remarks too long");
        
        grievance.status = Status.RESOLVED;
        grievance.resolutionRemarks = _remarks;
        grievance.resolvedBy = msg.sender;
        grievance.lastUpdatedAt = block.timestamp;
        
        emit GrievanceResolved(_grievanceId, msg.sender, _remarks, block.timestamp);
    }
    
    /**
     * @notice Escalate grievance to Dean (ASSIGNED HOD ONLY)
     * @param _grievanceId Grievance ID to escalate
     * @param _remarks Escalation remarks
     */
    function escalateGrievance(uint256 _grievanceId, string memory _remarks) 
        external 
        grievanceExists(_grievanceId)
        onlyAssignedHOD(_grievanceId)
    {
        Grievance storage grievance = grievances[_grievanceId];
        require(
            grievance.status == Status.ASSIGNED_TO_HOD,
            "GrievanceSystemSecure: Grievance must be assigned to HOD to escalate"
        );
        require(bytes(_remarks).length <= 500, "GrievanceSystemSecure: Remarks too long");
        
        grievance.status = Status.ESCALATED;
        grievance.currentHandler = address(0); // Will be set when Dean handles
        grievance.lastUpdatedAt = block.timestamp;
        
        emit GrievanceEscalated(_grievanceId, msg.sender, address(0), block.timestamp);
    }
    
    // ============ DEAN FUNCTIONS ============
    
    /**
     * @notice Close grievance permanently (DEAN ONLY)
     * @param _grievanceId Grievance ID to close
     * @param _remarks Closing remarks
     */
    function closeGrievance(uint256 _grievanceId, string memory _remarks) 
        external 
        grievanceExists(_grievanceId)
        onlyDean
    {
        Grievance storage grievance = grievances[_grievanceId];
        require(grievance.status == Status.ESCALATED, "GrievanceSystemSecure: Can only close escalated grievances");
        require(bytes(_remarks).length <= 500, "GrievanceSystemSecure: Remarks too long");
        
        grievance.status = Status.CLOSED;
        grievance.resolutionRemarks = _remarks;
        grievance.resolvedBy = msg.sender;
        grievance.currentHandler = msg.sender;
        grievance.lastUpdatedAt = block.timestamp;
        
        emit GrievanceClosed(_grievanceId, msg.sender, _remarks, block.timestamp);
    }
    
    // ============ VIEW FUNCTIONS ============
    
    /**
     * @notice Get grievance by ID (role-based visibility)
     */
    function getGrievanceById(uint256 _grievanceId) 
        external 
        view 
        grievanceExists(_grievanceId) 
        returns (Grievance memory) 
    {
        Grievance memory grievance = grievances[_grievanceId];
        Role userRole = roles[msg.sender];
        
        // Students can only see their own grievances
        if (userRole == Role.STUDENT) {
            require(grievance.studentAddress == msg.sender, "GrievanceSystemSecure: Not authorized to view this grievance");
        }
        // Counselor can only see grievances at Counselor level
        else if (userRole == Role.COUNSELOR) {
            require(grievanceLevel[_grievanceId] == Role.COUNSELOR, "GrievanceSystemSecure: Grievance is not at Counselor level");
        }
        // Year Coordinator can only see grievances at Year Coordinator level
        else if (userRole == Role.YEAR_COORDINATOR) {
            require(grievanceLevel[_grievanceId] == Role.YEAR_COORDINATOR, "GrievanceSystemSecure: Grievance is not at Year Coordinator level");
        }
        // HOD can only see assigned grievances
        else if (userRole == Role.HOD) {
            require(grievance.assignedHOD == msg.sender, "GrievanceSystemSecure: Not assigned to this grievance");
        }
        // Dean can see escalated and closed grievances
        else if (userRole == Role.DEAN) {
            require(
                grievance.status == Status.ESCALATED || grievance.status == Status.CLOSED,
                "GrievanceSystemSecure: Can only view escalated or closed grievances"
            );
        }
        // Admin can see all (for system management)
        
        return grievance;
    }
    
    /**
     * @notice Get visible grievances based on user role
     * @return Array of grievance IDs visible to the caller
     */
    function getVisibleGrievances() external view returns (uint256[] memory) {
        Role userRole = roles[msg.sender];
        
        if (userRole == Role.STUDENT) {
            return studentGrievances[msg.sender];
        } else if (userRole == Role.HOD) {
            return hodGrievances[msg.sender];
        } else if (userRole == Role.COUNSELOR) {
            // Counselor sees grievances at Counselor level (including resolved/closed they handled)
            uint256[] memory counselorGrievances = new uint256[](grievanceCounter);
            uint256 count = 0;
            for (uint256 i = 1; i <= grievanceCounter; i++) {
                if (grievances[i].grievanceId > 0 && grievanceLevel[i] == Role.COUNSELOR) {
                    counselorGrievances[count] = i;
                    count++;
                }
            }
            uint256[] memory result = new uint256[](count);
            for (uint256 i = 0; i < count; i++) {
                result[i] = counselorGrievances[i];
            }
            return result;
        } else if (userRole == Role.YEAR_COORDINATOR) {
            // Year Coordinator sees grievances at Year Coordinator level (including resolved/closed they handled)
            uint256[] memory yearCoordGrievances = new uint256[](grievanceCounter);
            uint256 count = 0;
            for (uint256 i = 1; i <= grievanceCounter; i++) {
                if (grievances[i].grievanceId > 0 && grievanceLevel[i] == Role.YEAR_COORDINATOR) {
                    yearCoordGrievances[count] = i;
                    count++;
                }
            }
            uint256[] memory result = new uint256[](count);
            for (uint256 i = 0; i < count; i++) {
                result[i] = yearCoordGrievances[i];
            }
            return result;
        } else if (userRole == Role.DEAN) {
            // Return escalated and closed grievances
            uint256[] memory escalated = new uint256[](grievanceCounter);
            uint256 count = 0;
            for (uint256 i = 1; i <= grievanceCounter; i++) {
                if (grievances[i].status == Status.ESCALATED || grievances[i].status == Status.CLOSED) {
                    escalated[count] = i;
                    count++;
                }
            }
            uint256[] memory result = new uint256[](count);
            for (uint256 i = 0; i < count; i++) {
                result[i] = escalated[i];
            }
            return result;
        } else if (userRole == Role.ADMIN) {
            // Admin sees all (empty array - use getAllGrievances for admin)
            return new uint256[](0);
        }
        
        return new uint256[](0);
    }
    
    /**
     * @notice Get all grievances (ADMIN ONLY - for system management)
     */
    function getAllGrievances() external view onlyAdmin returns (uint256[] memory) {
        uint256[] memory allGrievances = new uint256[](grievanceCounter);
        for (uint256 i = 1; i <= grievanceCounter; i++) {
            allGrievances[i - 1] = i;
        }
        return allGrievances;
    }
    
    /**
     * @notice Get user role
     */
    function getUserRole(address _user) external view returns (Role) {
        return roles[_user];
    }
    
    /**
     * @notice Get total grievance count
     */
    function getTotalGrievances() external view returns (uint256) {
        return grievanceCounter;
    }
}

