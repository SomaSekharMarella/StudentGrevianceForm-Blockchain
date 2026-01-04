// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title GrievanceSystem
 * @author Senior Full-Stack Web3 Engineer
 * @notice Decentralized Grievance Redressal System for Academic Institutions
 * @dev Implements role-based access control with multi-level escalation workflow
 * 
 * WHY WEB3 OVER WEB2:
 * 1. Immutability: Grievances cannot be deleted or tampered with
 * 2. Transparency: All actions are publicly verifiable on blockchain
 * 3. Decentralization: No single point of failure or authority manipulation
 * 4. Traceability: Complete audit trail of all grievance interactions
 * 5. Trust: Students can verify system integrity without trusting centralized servers
 */
contract GrievanceSystem {
    
    // ============ ENUMS ============
    
    /**
     * @notice Grievance status lifecycle
     * SUBMITTED -> IN_REVIEW -> ESCALATED -> RESOLVED/CLOSED
     */
    enum Status {
        SUBMITTED,        // Initial state when student submits
        IN_REVIEW,        // Currently being reviewed by authority
        ESCALATED,        // Escalated to higher authority
        RESOLVED,         // Successfully resolved
        CLOSED            // Closed by Dean (final state)
    }
    
    /**
     * @notice Authority levels in escalation hierarchy
     * Student -> Counselor -> Year Coordinator -> HOD -> Dean
     */
    enum AuthorityLevel {
        COUNSELOR,        // Level 1: First responder
        YEAR_COORD,       // Level 2: Year Coordinator
        HOD,              // Level 3: Head of Department
        DEAN              // Level 4: Dean of Academics (Final authority)
    }
    
    // ============ STRUCTS ============
    
    /**
     * @notice Core grievance data structure
     * @dev All grievances are stored on-chain for immutability
     */
    struct Grievance {
        uint256 grievanceId;              // Unique identifier
        address studentAddress;           // Student who submitted
        string description;               // Grievance description
        AuthorityLevel currentLevel;      // Current authority level
        Status status;                    // Current status
        uint256 submittedAt;              // Submission timestamp
        uint256 lastUpdatedAt;            // Last update timestamp
        string resolutionRemarks;         // Resolution comments
        address resolvedBy;               // Authority who resolved
    }
    
    // ============ STATE VARIABLES ============
    
    uint256 private grievanceCounter;     // Auto-incrementing ID counter
    
    // Mapping: grievanceId => Grievance
    mapping(uint256 => Grievance) public grievances;
    
    // Mapping: authorityLevel => address => bool (role assignment)
    mapping(AuthorityLevel => mapping(address => bool)) public authorities;
    
    // Mapping: student address => grievanceId[]
    mapping(address => uint256[]) public studentGrievances;
    
    // Mapping: authority address => grievanceId[]
    mapping(address => uint256[]) public authorityGrievances;
    
    // ============ EVENTS ============
    
    /**
     * @notice Emitted when a new grievance is submitted
     */
    event GrievanceSubmitted(
        uint256 indexed grievanceId,
        address indexed student,
        string description,
        uint256 timestamp
    );
    
    /**
     * @notice Emitted when a grievance is escalated to higher authority
     */
    event GrievanceEscalated(
        uint256 indexed grievanceId,
        AuthorityLevel fromLevel,
        AuthorityLevel toLevel,
        address indexed escalatedBy,
        uint256 timestamp
    );
    
    /**
     * @notice Emitted when a grievance is resolved
     */
    event GrievanceResolved(
        uint256 indexed grievanceId,
        address indexed resolvedBy,
        AuthorityLevel authorityLevel,
        string resolutionRemarks,
        uint256 timestamp
    );
    
    /**
     * @notice Emitted when a grievance is closed by Dean
     */
    event GrievanceClosed(
        uint256 indexed grievanceId,
        address indexed closedBy,
        string remarks,
        uint256 timestamp
    );
    
    /**
     * @notice Emitted when an authority is assigned to a role
     */
    event AuthorityAssigned(
        address indexed authority,
        AuthorityLevel level,
        uint256 timestamp
    );
    
    // ============ MODIFIERS ============
    
    /**
     * @notice Ensures only authorized authority can perform action
     * @param level Required authority level
     */
    modifier onlyAuthority(AuthorityLevel level) {
        require(
            authorities[level][msg.sender],
            "GrievanceSystem: Unauthorized authority"
        );
        _;
    }
    
    /**
     * @notice Ensures grievance exists
     * @param _grievanceId Grievance ID to check
     */
    modifier grievanceExists(uint256 _grievanceId) {
        require(
            _grievanceId > 0 && _grievanceId <= grievanceCounter,
            "GrievanceSystem: Grievance does not exist"
        );
        _;
    }
    
    // ============ CONSTRUCTOR ============
    
    /**
     * @notice Initialize contract with initial authorities
     * @dev Deployer can assign initial authorities after deployment
     */
    constructor() {
        grievanceCounter = 0;
    }
    
    // ============ ADMIN FUNCTIONS ============
    
    /**
     * @notice Assign an address to an authority role
     * @dev NOTE: For production, add owner-only modifier. Currently open for demo/setup purposes.
     * @param _authority Address to assign role
     * @param _level Authority level to assign
     */
    function assignAuthority(
        address _authority,
        AuthorityLevel _level
    ) external {
        require(_authority != address(0), "GrievanceSystem: Invalid address");
        authorities[_level][_authority] = true;
        emit AuthorityAssigned(_authority, _level, block.timestamp);
    }
    
    /**
     * @notice Remove authority role from an address
     * @param _authority Address to remove role from
     * @param _level Authority level to remove
     */
    function removeAuthority(
        address _authority,
        AuthorityLevel _level
    ) external {
        require(_authority != address(0), "GrievanceSystem: Invalid address");
        authorities[_level][_authority] = false;
    }
    
    // ============ STUDENT FUNCTIONS ============
    
    /**
     * @notice Submit a new grievance
     * @dev Any address can submit (student role)
     * @param _description Grievance description
     * @return grievanceId Unique identifier of created grievance
     */
    function submitGrievance(
        string memory _description
    ) external returns (uint256) {
        require(
            bytes(_description).length > 0,
            "GrievanceSystem: Description cannot be empty"
        );
        require(
            bytes(_description).length <= 1000,
            "GrievanceSystem: Description too long"
        );
        
        grievanceCounter++;
        
        Grievance memory newGrievance = Grievance({
            grievanceId: grievanceCounter,
            studentAddress: msg.sender,
            description: _description,
            currentLevel: AuthorityLevel.COUNSELOR,
            status: Status.SUBMITTED,
            submittedAt: block.timestamp,
            lastUpdatedAt: block.timestamp,
            resolutionRemarks: "",
            resolvedBy: address(0)
        });
        
        grievances[grievanceCounter] = newGrievance;
        studentGrievances[msg.sender].push(grievanceCounter);
        
        emit GrievanceSubmitted(
            grievanceCounter,
            msg.sender,
            _description,
            block.timestamp
        );
        
        return grievanceCounter;
    }
    
    // ============ AUTHORITY FUNCTIONS ============
    
    /**
     * @notice Review a grievance (mark as IN_REVIEW)
     * @dev Only authorized authority at current level can review
     * @param _grievanceId Grievance ID to review
     */
    function reviewGrievance(
        uint256 _grievanceId
    ) external grievanceExists(_grievanceId) {
        Grievance storage grievance = grievances[_grievanceId];
        
        require(
            authorities[grievance.currentLevel][msg.sender],
            "GrievanceSystem: Not authorized for this level"
        );
        require(
            grievance.status == Status.SUBMITTED || 
            grievance.status == Status.IN_REVIEW ||
            grievance.status == Status.ESCALATED,
            "GrievanceSystem: Invalid status for review"
        );
        
        grievance.status = Status.IN_REVIEW;
        grievance.lastUpdatedAt = block.timestamp;
    }
    
    /**
     * @notice Resolve a grievance
     * @dev Only authorized authority at current level can resolve
     * @param _grievanceId Grievance ID to resolve
     * @param _resolutionRemarks Resolution comments
     */
    function resolveGrievance(
        uint256 _grievanceId,
        string memory _resolutionRemarks
    ) external grievanceExists(_grievanceId) {
        Grievance storage grievance = grievances[_grievanceId];
        
        require(
            authorities[grievance.currentLevel][msg.sender],
            "GrievanceSystem: Not authorized for this level"
        );
        require(
            grievance.status == Status.IN_REVIEW ||
            grievance.status == Status.SUBMITTED ||
            grievance.status == Status.ESCALATED,
            "GrievanceSystem: Cannot resolve grievance in current status"
        );
        require(
            bytes(_resolutionRemarks).length <= 500,
            "GrievanceSystem: Remarks too long"
        );
        
        grievance.status = Status.RESOLVED;
        grievance.resolutionRemarks = _resolutionRemarks;
        grievance.resolvedBy = msg.sender;
        grievance.lastUpdatedAt = block.timestamp;
        authorityGrievances[msg.sender].push(_grievanceId);
        
        emit GrievanceResolved(
            _grievanceId,
            msg.sender,
            grievance.currentLevel,
            _resolutionRemarks,
            block.timestamp
        );
    }
    
    /**
     * @notice Escalate grievance to next authority level
     * @dev Only authorized authority at current level can escalate
     * @param _grievanceId Grievance ID to escalate
     * @param _remarks Escalation remarks
     */
    function escalateGrievance(
        uint256 _grievanceId,
        string memory _remarks
    ) external grievanceExists(_grievanceId) {
        Grievance storage grievance = grievances[_grievanceId];
        
        require(
            authorities[grievance.currentLevel][msg.sender],
            "GrievanceSystem: Not authorized for this level"
        );
        require(
            grievance.status == Status.IN_REVIEW ||
            grievance.status == Status.SUBMITTED ||
            grievance.status == Status.ESCALATED,
            "GrievanceSystem: Cannot escalate grievance in current status"
        );
        require(
            grievance.currentLevel != AuthorityLevel.DEAN,
            "GrievanceSystem: Cannot escalate beyond Dean"
        );
        require(
            bytes(_remarks).length <= 500,
            "GrievanceSystem: Remarks too long"
        );
        
        AuthorityLevel previousLevel = grievance.currentLevel;
        
        // Escalate to next level
        if (grievance.currentLevel == AuthorityLevel.COUNSELOR) {
            grievance.currentLevel = AuthorityLevel.YEAR_COORD;
        } else if (grievance.currentLevel == AuthorityLevel.YEAR_COORD) {
            grievance.currentLevel = AuthorityLevel.HOD;
        } else if (grievance.currentLevel == AuthorityLevel.HOD) {
            grievance.currentLevel = AuthorityLevel.DEAN;
        }
        
        grievance.status = Status.ESCALATED;
        grievance.lastUpdatedAt = block.timestamp;
        authorityGrievances[msg.sender].push(_grievanceId);
        
        emit GrievanceEscalated(
            _grievanceId,
            previousLevel,
            grievance.currentLevel,
            msg.sender,
            block.timestamp
        );
    }
    
    /**
     * @notice Close grievance permanently (Dean only)
     * @dev Only Dean can close grievances
     * @param _grievanceId Grievance ID to close
     * @param _remarks Closing remarks
     */
    function closeGrievance(
        uint256 _grievanceId,
        string memory _remarks
    ) external grievanceExists(_grievanceId) onlyAuthority(AuthorityLevel.DEAN) {
        Grievance storage grievance = grievances[_grievanceId];
        
        require(
            grievance.currentLevel == AuthorityLevel.DEAN,
            "GrievanceSystem: Grievance must be at Dean level"
        );
        require(
            grievance.status != Status.CLOSED,
            "GrievanceSystem: Grievance already closed"
        );
        require(
            bytes(_remarks).length <= 500,
            "GrievanceSystem: Remarks too long"
        );
        
        grievance.status = Status.CLOSED;
        grievance.resolutionRemarks = _remarks;
        grievance.resolvedBy = msg.sender;
        grievance.lastUpdatedAt = block.timestamp;
        authorityGrievances[msg.sender].push(_grievanceId);
        
        emit GrievanceClosed(
            _grievanceId,
            msg.sender,
            _remarks,
            block.timestamp
        );
    }
    
    // ============ VIEW FUNCTIONS ============
    
    /**
     * @notice Get grievance by ID
     * @param _grievanceId Grievance ID
     * @return Grievance struct
     */
    function getGrievanceById(
        uint256 _grievanceId
    ) external view grievanceExists(_grievanceId) returns (Grievance memory) {
        return grievances[_grievanceId];
    }
    
    /**
     * @notice Get all grievances submitted by a student
     * @param _studentAddress Student address
     * @return Array of grievance IDs
     */
    function getStudentGrievances(
        address _studentAddress
    ) external view returns (uint256[] memory) {
        return studentGrievances[_studentAddress];
    }
    
    /**
     * @notice Get all grievances assigned to an authority
     * @param _authorityAddress Authority address
     * @return Array of grievance IDs
     */
    function getAuthorityGrievances(
        address _authorityAddress
    ) external view returns (uint256[] memory) {
        return authorityGrievances[_authorityAddress];
    }
    
    /**
     * @notice Get total number of grievances
     * @return Total count
     */
    function getTotalGrievances() external view returns (uint256) {
        return grievanceCounter;
    }
    
    /**
     * @notice Check if address has authority role
     * @param _address Address to check
     * @param _level Authority level to check
     * @return true if address has role
     */
    function hasAuthorityRole(
        address _address,
        AuthorityLevel _level
    ) external view returns (bool) {
        return authorities[_level][_address];
    }
}

