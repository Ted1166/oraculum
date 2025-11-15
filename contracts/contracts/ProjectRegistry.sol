// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ProjectRegistry
 * @notice Manages project submissions, milestones, and metadata for ORACULUM
 * @dev Handles project lifecycle from submission to completion
 */
contract ProjectRegistry is Ownable, ReentrancyGuard {
    
    uint256 private _projectIdCounter;
    uint256 private _milestoneIdCounter;
    
    // Listing fee for submitting a project (0.1 BNB)
    uint256 public constant LISTING_FEE = 0.001 ether;
    
    // Project status enum
    enum ProjectStatus {
        Pending,      // Awaiting approval
        Active,       // Accepting predictions
        Completed,    // All milestones resolved
        Cancelled     // Project cancelled
    }
    
    // Milestone structure
    struct Milestone {
        uint256 id;
        string description;
        uint256 targetDate;
        bool isResolved;
        bool outcomeAchieved;
        uint256 resolutionDate;
    }
    
    // Project structure
    struct Project {
        uint256 id;
        address owner;
        string name;
        string description;
        string category;
        string logoUrl;
        uint256 fundingGoal;
        uint256 submissionDate;
        ProjectStatus status;
        uint256[] milestoneIds;
        uint256 totalFundsRaised;
        uint256 totalPredictions;
    }
    
    // Storage mappings
    mapping(uint256 => Project) public projects;
    mapping(uint256 => Milestone) public milestones;
    mapping(uint256 => mapping(uint256 => bool)) public projectMilestones; // projectId => milestoneId => exists
    mapping(address => uint256[]) public ownerProjects;
    
    // Events
    event ProjectSubmitted(
        uint256 indexed projectId,
        address indexed owner,
        string name,
        uint256 fundingGoal
    );
    
    event MilestoneAdded(
        uint256 indexed projectId,
        uint256 indexed milestoneId,
        string description,
        uint256 targetDate
    );
    
    event MilestoneResolved(
        uint256 indexed projectId,
        uint256 indexed milestoneId,
        bool outcomeAchieved
    );
    
    event ProjectStatusUpdated(
        uint256 indexed projectId,
        ProjectStatus oldStatus,
        ProjectStatus newStatus
    );
    
    event FundsRaised(
        uint256 indexed projectId,
        uint256 amount,
        uint256 totalRaised
    );
    
    // ========================================
    // CONSTRUCTOR
    // ========================================
    
    constructor() Ownable(msg.sender) {
        _projectIdCounter = 0;
        _milestoneIdCounter = 0;
    }
    
    // ========================================
    // EXTERNAL FUNCTIONS
    // ========================================
    
    /**
     * @notice Submit a new project with milestones
     * @param _name Project name
     * @param _description Project description
     * @param _category Project category (DeFi, GameFi, NFT, etc.)
     * @param _logoUrl Logo URL
     * @param _fundingGoal Funding goal in BNB
     * @param _milestoneDescriptions Array of milestone descriptions
     * @param _milestoneDates Array of milestone target dates (timestamps)
     */
    function submitProject(
        string memory _name,
        string memory _description,
        string memory _category,
        string memory _logoUrl,
        uint256 _fundingGoal,
        string[] memory _milestoneDescriptions,
        uint256[] memory _milestoneDates
    ) external payable nonReentrant returns (uint256) {
        require(msg.value >= LISTING_FEE, "Insufficient listing fee");
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(_fundingGoal > 0, "Funding goal must be positive");
        require(_milestoneDescriptions.length > 0, "Must have at least one milestone");
        require(
            _milestoneDescriptions.length == _milestoneDates.length,
            "Milestone arrays length mismatch"
        );
        require(_milestoneDescriptions.length <= 10, "Maximum 10 milestones");
        
        // Increment and get project ID
        uint256 projectId = ++_projectIdCounter;
        
        // Create project
        projects[projectId] = Project({
            id: projectId,
            owner: msg.sender,
            name: _name,
            description: _description,
            category: _category,
            logoUrl: _logoUrl,
            fundingGoal: _fundingGoal,
            submissionDate: block.timestamp,
            status: ProjectStatus.Active,
            milestoneIds: new uint256[](0),
            totalFundsRaised: 0,
            totalPredictions: 0
        });
        
        // Add to owner's projects
        ownerProjects[msg.sender].push(projectId);
        
        // Create milestones
        for (uint256 i = 0; i < _milestoneDescriptions.length; i++) {
            require(_milestoneDates[i] > block.timestamp, "Milestone date must be in future");
            
            uint256 milestoneId = ++_milestoneIdCounter;
            
            milestones[milestoneId] = Milestone({
                id: milestoneId,
                description: _milestoneDescriptions[i],
                targetDate: _milestoneDates[i],
                isResolved: false,
                outcomeAchieved: false,
                resolutionDate: 0
            });
            
            projects[projectId].milestoneIds.push(milestoneId);
            projectMilestones[projectId][milestoneId] = true;
            
            emit MilestoneAdded(projectId, milestoneId, _milestoneDescriptions[i], _milestoneDates[i]);
        }
        
        emit ProjectSubmitted(projectId, msg.sender, _name, _fundingGoal);
        
        return projectId;
    }
    
    /**
     * @notice Resolve a milestone (only owner or oracle can call)
     * @param _projectId Project ID
     * @param _milestoneId Milestone ID
     * @param _outcomeAchieved Whether the milestone was achieved
     */
    function resolveMilestone(
        uint256 _projectId,
        uint256 _milestoneId,
        bool _outcomeAchieved
    ) external {
        require(_projectId > 0 && _projectId <= _projectIdCounter, "Invalid project ID");
        require(projectMilestones[_projectId][_milestoneId], "Milestone not in project");
        require(
            msg.sender == projects[_projectId].owner || msg.sender == owner(),
            "Not authorized"
        );
        require(!milestones[_milestoneId].isResolved, "Already resolved");
        require(
            block.timestamp >= milestones[_milestoneId].targetDate,
            "Milestone date not reached"
        );
        
        milestones[_milestoneId].isResolved = true;
        milestones[_milestoneId].outcomeAchieved = _outcomeAchieved;
        milestones[_milestoneId].resolutionDate = block.timestamp;
        
        emit MilestoneResolved(_projectId, _milestoneId, _outcomeAchieved);
        
        // Check if all milestones are resolved
        _checkProjectCompletion(_projectId);
    }
    
    /**
     * @notice Update project status
     * @param _projectId Project ID
     * @param _newStatus New status
     */
    function updateProjectStatus(uint256 _projectId, ProjectStatus _newStatus) external {
        require(_projectId > 0 && _projectId <= _projectIdCounter, "Invalid project ID");
        require(
            msg.sender == projects[_projectId].owner || msg.sender == owner(),
            "Not authorized"
        );
        
        ProjectStatus oldStatus = projects[_projectId].status;
        projects[_projectId].status = _newStatus;
        
        emit ProjectStatusUpdated(_projectId, oldStatus, _newStatus);
    }
    
    /**
     * @notice Record funds raised for a project
     * @param _projectId Project ID
     * @param _amount Amount raised
     */
    function recordFundsRaised(uint256 _projectId, uint256 _amount) external onlyOwner {
        require(_projectId > 0 && _projectId <= _projectIdCounter, "Invalid project ID");
        
        projects[_projectId].totalFundsRaised += _amount;
        
        emit FundsRaised(_projectId, _amount, projects[_projectId].totalFundsRaised);
    }
    
    /**
     * @notice Increment prediction count for a project
     * @param _projectId Project ID
     */
    function incrementPredictions(uint256 _projectId) external onlyOwner {
        require(_projectId > 0 && _projectId <= _projectIdCounter, "Invalid project ID");
        projects[_projectId].totalPredictions += 1;
    }
    
    // ========================================
    // VIEW FUNCTIONS
    // ========================================
    
    /**
     * @notice Get project details
     * @param _projectId Project ID
     */
    function getProject(uint256 _projectId) external view returns (Project memory) {
        require(_projectId > 0 && _projectId <= _projectIdCounter, "Invalid project ID");
        return projects[_projectId];
    }
    
    /**
     * @notice Get milestone details
     * @param _milestoneId Milestone ID
     */
    function getMilestone(uint256 _milestoneId) external view returns (Milestone memory) {
        require(_milestoneId > 0 && _milestoneId <= _milestoneIdCounter, "Invalid milestone ID");
        return milestones[_milestoneId];
    }
    
    /**
     * @notice Get all milestones for a project
     * @param _projectId Project ID
     */
    function getProjectMilestones(uint256 _projectId) external view returns (Milestone[] memory) {
        require(_projectId > 0 && _projectId <= _projectIdCounter, "Invalid project ID");
        
        uint256[] memory milestoneIdsList = projects[_projectId].milestoneIds;
        Milestone[] memory result = new Milestone[](milestoneIdsList.length);
        
        for (uint256 i = 0; i < milestoneIdsList.length; i++) {
            result[i] = milestones[milestoneIdsList[i]];
        }
        
        return result;
    }
    
    /**
     * @notice Get projects owned by an address
     * @param _owner Owner address
     */
    function getOwnerProjects(address _owner) external view returns (uint256[] memory) {
        return ownerProjects[_owner];
    }
    
    /**
     * @notice Get total number of projects
     */
    function getTotalProjects() external view returns (uint256) {
        return _projectIdCounter;
    }
    
    /**
     * @notice Get total number of milestones
     */
    function getTotalMilestones() external view returns (uint256) {
        return _milestoneIdCounter;
    }

    function getAllProjects() external view returns (Project[] memory) {
        if (_projectIdCounter == 0) {
            return new Project[](0);
        }

        Project[] memory allProjects = new Project[](_projectIdCounter);

        for (uint256 i = 1; i <= _projectIdCounter; i++) {
            allProjects[i - 1] = projects[i];
        }

        return allProjects;
    }
    
    // ========================================
    // ADMIN FUNCTIONS
    // ========================================
    
    /**
     * @notice Withdraw listing fees (only owner)
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }
    
    // ========================================
    // INTERNAL FUNCTIONS
    // ========================================
    
    /**
     * @dev Check if all milestones are resolved and update project status
     * @param _projectId Project ID
     */
    function _checkProjectCompletion(uint256 _projectId) private {
        uint256[] memory milestoneIdsList = projects[_projectId].milestoneIds;
        bool allResolved = true;
        
        for (uint256 i = 0; i < milestoneIdsList.length; i++) {
            if (!milestones[milestoneIdsList[i]].isResolved) {
                allResolved = false;
                break;
            }
        }
        
        if (allResolved && projects[_projectId].status == ProjectStatus.Active) {
            ProjectStatus oldStatus = projects[_projectId].status;
            projects[_projectId].status = ProjectStatus.Completed;
            emit ProjectStatusUpdated(_projectId, oldStatus, ProjectStatus.Completed);
        }
    }
}