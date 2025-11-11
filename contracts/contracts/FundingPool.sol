// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

interface IProjectRegistry {
    struct Project {
        uint256 id;
        address owner;
        string name;
        string description;
        string category;
        string logoUrl;
        uint256 fundingGoal;
        uint256 submissionDate;
        uint8 status;
        uint256[] milestoneIds;
        uint256 totalFundsRaised;
        uint256 totalPredictions;
    }
    
    function getProject(uint256 _projectId) external view returns (Project memory);
    function recordFundsRaised(uint256 _projectId, uint256 _amount) external;
}

interface IPredictionMarket {
    function getTopPredictors(uint256 marketId, uint256 limit) external view returns (
        address[] memory topPredictors,
        uint256[] memory amounts
    );
}

/**
 * @title FundingPool
 * @notice Manages funding allocation to projects based on prediction market confidence
 * @dev Handles fund distribution, token allocation rights, and milestone-based releases
 */
contract FundingPool is Ownable, ReentrancyGuard, Pausable {
    
    // ========================================
    // STATE VARIABLES
    // ========================================
    
    IProjectRegistry public projectRegistry;
    IPredictionMarket public predictionMarket;
    
    uint256 public totalPoolBalance;
    uint256 public totalAllocated;
    uint256 public totalDistributed;
    
    // Token allocation percentages (in basis points)
    uint256 public constant TOP_3_ALLOCATION_BPS = 200;     // 2% each (6% total)
    uint256 public constant NEXT_7_ALLOCATION_BPS = 50;     // 0.5% each (3.5% total)
    uint256 public constant BASIS_POINTS = 10000;           // 100%
    
    uint256 private _allocationIdCounter;
    
    // ========================================
    // STRUCTS
    // ========================================
    
    struct ProjectAllocation {
        uint256 projectId;
        uint256 totalAllocated;
        uint256 totalReleased;
        uint256 pendingRelease;
        uint256[] milestoneReleases;
        bool exists;
    }
    
    struct TokenAllocationRight {
        uint256 allocationId;
        address recipient;
        uint256 projectId;
        uint256 allocationBps;
        bool granted;
        bool claimed;
        uint256 grantedTimestamp;
    }
    
    struct MilestoneRelease {
        uint256 projectId;
        uint256 milestoneId;
        uint256 amount;
        uint256 releaseTime;
        bool released;
    }
    
    struct PoolStats {
        uint256 balance;
        uint256 allocated;
        uint256 distributed;
        uint256 available;
    }
    
    // ========================================
    // MAPPINGS
    // ========================================
    
    mapping(uint256 => ProjectAllocation) public projectAllocations;
    mapping(uint256 => TokenAllocationRight) public tokenAllocations;
    mapping(address => uint256[]) public userTokenAllocations;
    mapping(uint256 => uint256[]) public projectTokenAllocations;
    mapping(uint256 => mapping(uint256 => MilestoneRelease)) public milestoneReleases;
    mapping(uint256 => bool) public hasReceivedAllocation;
    
    // ========================================
    // EVENTS
    // ========================================
    
    event FundsReceived(
        address indexed from,
        uint256 amount,
        uint256 newBalance
    );
    
    event FundsAllocated(
        uint256 indexed projectId,
        uint256 amount,
        uint256 totalAllocated
    );
    
    event FundsReleased(
        uint256 indexed projectId,
        uint256 indexed milestoneId,
        uint256 amount,
        address indexed recipient
    );
    
    event TokenAllocationGranted(
        uint256 indexed allocationId,
        address indexed recipient,
        uint256 indexed projectId,
        uint256 allocationBps
    );
    
    event TokenAllocationClaimed(
        uint256 indexed allocationId,
        address indexed recipient,
        uint256 indexed projectId
    );
    
    event EmergencyWithdrawal(
        address indexed to,
        uint256 amount
    );
    
    constructor(
        address _projectRegistry,
        address _predictionMarket
    ) Ownable(msg.sender) {
        require(_projectRegistry != address(0), "Invalid registry address");
        require(_predictionMarket != address(0), "Invalid market address");
        
        projectRegistry = IProjectRegistry(_projectRegistry);
        predictionMarket = IPredictionMarket(_predictionMarket);
        _allocationIdCounter = 1;
    }
    
    // ========================================
    // EXTERNAL FUNCTIONS - FUND MANAGEMENT
    // ========================================
    
    /**
     * @notice Receive funds from PredictionMarket contract
     */
    receive() external payable {
        totalPoolBalance += msg.value;
        emit FundsReceived(msg.sender, msg.value, totalPoolBalance);
    }
    
    /**
     * @notice Allocate funds to a project
     */
    function allocateToProject(uint256 projectId, uint256 amount) 
        external 
        onlyOwner 
        nonReentrant 
        whenNotPaused 
    {
        _validateAllocation(amount);
        _verifyProjectExists(projectId);
        _initializeAllocationIfNeeded(projectId);
        _updateAllocation(projectId, amount);
        
        emit FundsAllocated(projectId, amount, projectAllocations[projectId].totalAllocated);
    }
    
    /**
     * @notice Release funds when a milestone is achieved
     */
    function releaseOnMilestone(
        uint256 projectId,
        uint256 milestoneId,
        uint256 amount
    ) external onlyOwner nonReentrant whenNotPaused {
        _validateRelease(projectId, milestoneId, amount);
        
        address projectOwner = _getProjectOwner(projectId);
        _processRelease(projectId, milestoneId, amount);
        _transferFunds(projectOwner, amount);
        
        emit FundsReleased(projectId, milestoneId, amount, projectOwner);
    }
    
    /**
     * @notice Grant token allocation rights to top predictors
     */
    function grantTokenAllocations(uint256 projectId, uint256 marketId) 
        external 
        onlyOwner 
        nonReentrant 
    {
        require(!hasReceivedAllocation[projectId], "Already granted for this project");
        
        (address[] memory topPredictors, ) = predictionMarket.getTopPredictors(marketId, 10);
        require(topPredictors.length > 0, "No predictors found");
        
        _processTokenAllocations(projectId, topPredictors);
        hasReceivedAllocation[projectId] = true;
    }
    
    /**
     * @notice Batch allocate to multiple projects
     */
    function batchAllocate(
        uint256[] memory projectIds,
        uint256[] memory amounts
    ) external onlyOwner nonReentrant whenNotPaused {
        _validateBatchInput(projectIds, amounts);
        _validateBatchBalance(amounts);
        
        for (uint256 i = 0; i < projectIds.length; i++) {
            if (amounts[i] > 0) {
                _allocateInternal(projectIds[i], amounts[i]);
            }
        }
    }
    
    // ========================================
    // VIEW FUNCTIONS
    // ========================================
    
    function getProjectAllocation(uint256 projectId) 
        external 
        view 
        returns (ProjectAllocation memory) 
    {
        require(projectAllocations[projectId].exists, "No allocation for project");
        return projectAllocations[projectId];
    }
    
    function getTokenAllocation(uint256 allocationId) 
        external 
        view 
        returns (TokenAllocationRight memory) 
    {
        require(tokenAllocations[allocationId].granted, "Allocation not found");
        return tokenAllocations[allocationId];
    }
    
    function getUserTokenAllocations(address user) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return userTokenAllocations[user];
    }
    
    function getProjectTokenAllocations(uint256 projectId) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return projectTokenAllocations[projectId];
    }
    
    function getAvailablePool() external view returns (uint256) {
        return totalPoolBalance > totalAllocated ? totalPoolBalance - totalAllocated : 0;
    }
    
    function getUserProjectAllocation(address user, uint256 projectId) 
        external 
        view 
        returns (uint256 totalBps) 
    {
        uint256[] memory allocations = userTokenAllocations[user];
        
        for (uint256 i = 0; i < allocations.length; i++) {
            TokenAllocationRight memory allocation = tokenAllocations[allocations[i]];
            if (allocation.projectId == projectId && !allocation.claimed) {
                totalBps += allocation.allocationBps;
            }
        }
        
        return totalBps;
    }
    
    function isMilestoneReleased(uint256 projectId, uint256 milestoneId) 
        external 
        view 
        returns (bool) 
    {
        return milestoneReleases[projectId][milestoneId].released;
    }
    
    function getMilestoneRelease(uint256 projectId, uint256 milestoneId) 
        external 
        view 
        returns (MilestoneRelease memory) 
    {
        return milestoneReleases[projectId][milestoneId];
    }
    
    function getPoolStats() 
        external 
        view 
        returns (PoolStats memory stats) 
    {
        stats.balance = totalPoolBalance;
        stats.allocated = totalAllocated;
        stats.distributed = totalDistributed;
        stats.available = totalPoolBalance > totalAllocated ? totalPoolBalance - totalAllocated : 0;
    }
    
    // ========================================
    // INTERNAL FUNCTIONS - VALIDATION
    // ========================================
    
    function _validateAllocation(uint256 amount) internal view {
        require(amount > 0, "Amount must be positive");
        require(totalPoolBalance >= totalAllocated + amount, "Insufficient pool balance");
    }
    
    function _validateRelease(
        uint256 projectId,
        uint256 milestoneId,
        uint256 amount
    ) internal view {
        require(projectAllocations[projectId].exists, "No allocation for project");
        require(amount > 0, "Amount must be positive");
        require(
            projectAllocations[projectId].pendingRelease >= amount,
            "Insufficient pending release"
        );
        require(
            !milestoneReleases[projectId][milestoneId].released,
            "Milestone already released"
        );
    }
    
    function _validateBatchInput(
        uint256[] memory projectIds,
        uint256[] memory amounts
    ) internal pure {
        require(projectIds.length == amounts.length, "Array length mismatch");
        require(projectIds.length > 0 && projectIds.length <= 20, "Invalid batch size");
    }
    
    function _validateBatchBalance(uint256[] memory amounts) internal view {
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalAmount += amounts[i];
        }
        require(totalPoolBalance >= totalAllocated + totalAmount, "Insufficient pool balance");
    }
    
    // ========================================
    // INTERNAL FUNCTIONS - HELPERS
    // ========================================
    
    function _verifyProjectExists(uint256 projectId) internal view {
        IProjectRegistry.Project memory project = projectRegistry.getProject(projectId);
        require(project.id == projectId, "Project does not exist");
    }
    
    function _getProjectOwner(uint256 projectId) internal view returns (address) {
        IProjectRegistry.Project memory project = projectRegistry.getProject(projectId);
        return project.owner;
    }
    
    function _initializeAllocationIfNeeded(uint256 projectId) internal {
        if (!projectAllocations[projectId].exists) {
            projectAllocations[projectId] = ProjectAllocation({
                projectId: projectId,
                totalAllocated: 0,
                totalReleased: 0,
                pendingRelease: 0,
                milestoneReleases: new uint256[](0),
                exists: true
            });
        }
    }
    
    function _updateAllocation(uint256 projectId, uint256 amount) internal {
        ProjectAllocation storage allocation = projectAllocations[projectId];
        allocation.totalAllocated += amount;
        allocation.pendingRelease += amount;
        totalAllocated += amount;
    }
    
    function _processRelease(
        uint256 projectId,
        uint256 milestoneId,
        uint256 amount
    ) internal {
        milestoneReleases[projectId][milestoneId] = MilestoneRelease({
            projectId: projectId,
            milestoneId: milestoneId,
            amount: amount,
            releaseTime: block.timestamp,
            released: true
        });
        
        ProjectAllocation storage allocation = projectAllocations[projectId];
        allocation.totalReleased += amount;
        allocation.pendingRelease -= amount;
        allocation.milestoneReleases.push(milestoneId);
        totalDistributed += amount;
        
        projectRegistry.recordFundsRaised(projectId, amount);
    }
    
    function _transferFunds(address recipient, uint256 amount) internal {
        (bool success, ) = payable(recipient).call{value: amount}("");
        require(success, "Transfer failed");
    }
    
    function _processTokenAllocations(
        uint256 projectId,
        address[] memory topPredictors
    ) internal {
        uint256 limit = topPredictors.length > 10 ? 10 : topPredictors.length;
        
        for (uint256 i = 0; i < limit; i++) {
            uint256 allocationBps = i < 3 ? TOP_3_ALLOCATION_BPS : NEXT_7_ALLOCATION_BPS;
            _grantTokenAllocation(topPredictors[i], projectId, allocationBps);
        }
    }
    
    function _grantTokenAllocation(
        address recipient,
        uint256 projectId,
        uint256 allocationBps
    ) internal {
        uint256 allocationId = _allocationIdCounter++;
        
        tokenAllocations[allocationId] = TokenAllocationRight({
            allocationId: allocationId,
            recipient: recipient,
            projectId: projectId,
            allocationBps: allocationBps,
            granted: true,
            claimed: false,
            grantedTimestamp: block.timestamp
        });
        
        userTokenAllocations[recipient].push(allocationId);
        projectTokenAllocations[projectId].push(allocationId);
        
        emit TokenAllocationGranted(allocationId, recipient, projectId, allocationBps);
    }
    
    function _allocateInternal(uint256 projectId, uint256 amount) internal {
        _verifyProjectExists(projectId);
        _initializeAllocationIfNeeded(projectId);
        _updateAllocation(projectId, amount);
        
        emit FundsAllocated(projectId, amount, projectAllocations[projectId].totalAllocated);
    }
    
    // ========================================
    // ADMIN FUNCTIONS
    // ========================================
    
    function emergencyWithdraw(address payable to, uint256 amount) 
        external 
        onlyOwner 
        nonReentrant 
    {
        require(to != address(0), "Invalid address");
        require(amount > 0 && amount <= address(this).balance, "Invalid amount");
        
        (bool success, ) = to.call{value: amount}("");
        require(success, "Transfer failed");
        
        emit EmergencyWithdrawal(to, amount);
    }
    
    function updateProjectRegistry(address newRegistry) external onlyOwner {
        require(newRegistry != address(0), "Invalid address");
        projectRegistry = IProjectRegistry(newRegistry);
    }
    
    function updatePredictionMarket(address newMarket) external onlyOwner {
        require(newMarket != address(0), "Invalid address");
        predictionMarket = IPredictionMarket(newMarket);
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    function getCurrentAllocationId() external view returns (uint256) {
        return _allocationIdCounter - 1;
    }
}