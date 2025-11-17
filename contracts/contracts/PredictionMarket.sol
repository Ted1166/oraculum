// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title PredictionMarket - Community-Driven Milestone Betting
 * @notice Users bet on project milestones. Winners funded by losers + project owner bonus on wins
 * 
 * ECONOMIC MODEL:
 * - Users bet YES/NO on project milestones
 * - When WINNERS win: They get their stake + share of loser pool + project owner bonus
 * - When WINNERS lose: No rewards
 * - Losers always lose their stake (distributed to winners + platform)
 * - Platform takes 3% fee from losing pool
 * - Project owner contributes bonus ONLY when their milestone succeeds (YES wins)
 */
contract PredictionMarket is Ownable, ReentrancyGuard {
    
    // ========================================
    // STATE VARIABLES
    // ========================================
    
    uint256 public marketCounter;
    uint256 public betCounter;
    uint256 public minBetAmount = 0.01 ether;
    uint256 public platformFee = 3; // 3% of losing pool goes to platform
    uint256 public platformBalance;
    
    // ========================================
    // STRUCTS
    // ========================================
    
    struct Market {
        uint256 id;
        uint256 projectId;
        uint256 milestoneIndex;
        address projectOwner;       // Who owns the project
        uint256 deadline;           // When betting closes
        uint256 ownerBonusPool;     // Bonus from project owner (only if YES wins)
        bool isOpen;                
        bool isResolved;            
        bool outcome;               // true = YES won (milestone achieved)
        uint256 totalYesAmount;
        uint256 totalNoAmount;
        uint256 yesCount;
        uint256 noCount;
    }
    
    struct Bet {
        uint256 id;
        uint256 marketId;
        address bettor;
        uint256 amount;
        bool predictedYes;
        bool claimed;
        uint256 reward;
    }
    
    // ========================================
    // MAPPINGS
    // ========================================
    
    mapping(uint256 => Market) public markets;
    mapping(uint256 => Bet) public bets;
    mapping(address => uint256[]) public userBets;
    mapping(uint256 => uint256[]) public marketBets;
    mapping(uint256 => mapping(uint256 => uint256)) public projectMilestoneMarket;
    mapping(uint256 => mapping(address => bool)) public hasBet;
    
    // Track project followers for community engagement
    mapping(uint256 => address[]) public projectFollowers;
    mapping(uint256 => mapping(address => bool)) public isFollowing;
    
    // ========================================
    // EVENTS
    // ========================================
    
    event MarketCreated(uint256 indexed marketId, uint256 indexed projectId, uint256 milestoneIndex, address projectOwner, uint256 deadline);
    event OwnerBonusAdded(uint256 indexed marketId, address indexed owner, uint256 amount);
    event BetPlaced(uint256 indexed betId, uint256 indexed marketId, address indexed bettor, bool predictedYes, uint256 amount);
    event MarketResolved(uint256 indexed marketId, bool outcome);
    event RewardClaimed(uint256 indexed betId, address indexed bettor, uint256 amount);
    event ProjectFollowed(uint256 indexed projectId, address indexed follower);
    event ProjectUnfollowed(uint256 indexed projectId, address indexed follower);
    
    // ========================================
    // CONSTRUCTOR
    // ========================================
    
    constructor() Ownable(msg.sender) {
        marketCounter = 1;
        betCounter = 1;
    }
    
    // ========================================
    // CORE FUNCTIONS
    // ========================================
    
    /**
     * @notice Create a new prediction market for a milestone
     * @param projectId The project ID
     * @param milestoneIndex The milestone index (0, 1, 2...)
     * @param projectOwner The address of the project owner
     * @param daysUntilDeadline How many days until betting closes
     */
    function createMarket(
        uint256 projectId, 
        uint256 milestoneIndex,
        address projectOwner,
        uint256 daysUntilDeadline
    ) external onlyOwner returns (uint256) {
        require(projectMilestoneMarket[projectId][milestoneIndex] == 0, "Market already exists");
        require(projectOwner != address(0), "Invalid owner");
        require(daysUntilDeadline > 0, "Invalid deadline");
        
        uint256 marketId = marketCounter++;
        uint256 deadline = block.timestamp + (daysUntilDeadline * 1 days);
        
        markets[marketId] = Market({
            id: marketId,
            projectId: projectId,
            milestoneIndex: milestoneIndex,
            projectOwner: projectOwner,
            deadline: deadline,
            ownerBonusPool: 0,
            isOpen: true,
            isResolved: false,
            outcome: false,
            totalYesAmount: 0,
            totalNoAmount: 0,
            yesCount: 0,
            noCount: 0
        });
        
        projectMilestoneMarket[projectId][milestoneIndex] = marketId;
        
        emit MarketCreated(marketId, projectId, milestoneIndex, projectOwner, deadline);
        
        return marketId;
    }
    
    /**
     * @notice Project owner adds bonus pool (ONLY paid if milestone succeeds = YES wins)
     * @dev This incentivizes project owners to deliver on milestones
     * @param marketId The market ID
     */
    function addOwnerBonus(uint256 marketId) external payable {
        Market storage market = markets[marketId];
        require(market.id != 0, "Market does not exist");
        require(msg.sender == market.projectOwner, "Not project owner");
        require(market.isOpen, "Market closed");
        require(msg.value > 0, "No bonus sent");
        
        market.ownerBonusPool += msg.value;
        
        emit OwnerBonusAdded(marketId, msg.sender, msg.value);
    }
    
    /**
     * @notice Place a bet on a milestone
     * @param projectId The project ID
     * @param milestoneIndex The milestone index
     * @param predictYes true = bet milestone succeeds, false = bet milestone fails
     */
    function placeBet(
        uint256 projectId,
        uint256 milestoneIndex,
        bool predictYes
    ) external payable nonReentrant returns (uint256) {
        require(msg.value >= minBetAmount, "Bet too small");
        
        uint256 marketId = projectMilestoneMarket[projectId][milestoneIndex];
        require(marketId != 0, "Market does not exist");
        
        Market storage market = markets[marketId];
        require(market.isOpen, "Market closed");
        require(block.timestamp < market.deadline, "Betting ended");
        require(!hasBet[marketId][msg.sender], "Already bet");
        
        // Full amount goes into the betting pool (no upfront fees)
        uint256 betAmount = msg.value;
        
        // Create bet
        uint256 betId = betCounter++;
        
        bets[betId] = Bet({
            id: betId,
            marketId: marketId,
            bettor: msg.sender,
            amount: betAmount,
            predictedYes: predictYes,
            claimed: false,
            reward: 0
        });
        
        // Update market
        if (predictYes) {
            market.totalYesAmount += betAmount;
            market.yesCount++;
        } else {
            market.totalNoAmount += betAmount;
            market.noCount++;
        }
        
        // Track bet
        userBets[msg.sender].push(betId);
        marketBets[marketId].push(betId);
        hasBet[marketId][msg.sender] = true;
        
        emit BetPlaced(betId, marketId, msg.sender, predictYes, betAmount);
        
        return betId;
    }
    
    /**
     * @notice Resolve a market with outcome
     * @param marketId The market ID
     * @param milestoneAchieved true = milestone succeeded (YES wins), false = milestone failed (NO wins)
     */
    function resolveMarket(uint256 marketId, bool milestoneAchieved) external onlyOwner {
        Market storage market = markets[marketId];
        require(market.id != 0, "Market does not exist");
        require(!market.isResolved, "Already resolved");
        require(block.timestamp >= market.deadline, "Betting not ended");
        
        market.isResolved = true;
        market.isOpen = false;
        market.outcome = milestoneAchieved;
        
        // Calculate rewards
        _calculateRewards(marketId, milestoneAchieved);
        
        emit MarketResolved(marketId, milestoneAchieved);
    }
    
    /**
     * @notice Claim reward for winning bet
     */
    function claimReward(uint256 betId) external nonReentrant {
        Bet storage bet = bets[betId];
        require(bet.id != 0, "Bet does not exist");
        require(bet.bettor == msg.sender, "Not your bet");
        require(!bet.claimed, "Already claimed");
        
        Market memory market = markets[bet.marketId];
        require(market.isResolved, "Not resolved");
        require(bet.predictedYes == market.outcome, "Lost bet");
        require(bet.reward > 0, "No reward");
        
        bet.claimed = true;
        
        (bool success, ) = payable(msg.sender).call{value: bet.reward}("");
        require(success, "Transfer failed");
        
        emit RewardClaimed(betId, msg.sender, bet.reward);
    }
    
    /**
     * @dev Calculate rewards based on outcome
     * 
     * WINNING SCENARIO:
     * - Winners get: their stake + proportional share of (loser pool - platform fee) + owner bonus (if YES wins)
     * - Platform gets: 3% of losing pool
     * - Project owner: Pays bonus ONLY if milestone achieved (YES wins)
     * 
     * LOSING SCENARIO:
     * - Losers get: nothing
     * - Their stake is distributed to winners
     */
    function _calculateRewards(uint256 marketId, bool outcome) internal {
        Market memory market = markets[marketId];
        
        uint256 winningPool = outcome ? market.totalYesAmount : market.totalNoAmount;
        uint256 losingPool = outcome ? market.totalNoAmount : market.totalYesAmount;
        
        // If no losing bets, winners just get their stake back
        if (losingPool == 0) {
            uint256[] memory refundBetIds = marketBets[marketId];
            for (uint256 i = 0; i < refundBetIds.length; i++) {
                Bet storage bet = bets[refundBetIds[i]];
                if (bet.predictedYes == outcome) {
                    bet.reward = bet.amount;
                    
                    // Refund owner bonus if YES wins but no losers
                    if (outcome && market.ownerBonusPool > 0 && i == 0) {
                        bet.reward += market.ownerBonusPool;
                    }
                }
            }
            return;
        }
        
        // Take platform fee from losing pool
        uint256 platformCut = (losingPool * platformFee) / 100;
        platformBalance += platformCut;
        
        // Distribute remaining losing pool to winners
        uint256 distributeAmount = losingPool - platformCut;
        
        // Add owner bonus ONLY if milestone achieved (YES wins)
        if (outcome && market.ownerBonusPool > 0) {
            distributeAmount += market.ownerBonusPool;
        }
        // If NO wins (milestone failed), owner keeps their bonus
        
        // Distribute to winners proportionally
        uint256[] memory winningBetIds = marketBets[marketId];
        for (uint256 i = 0; i < winningBetIds.length; i++) {
            Bet storage bet = bets[winningBetIds[i]];
            
            if (bet.predictedYes == outcome) {
                // Winner: stake + proportional share of distribute pool
                uint256 share = (bet.amount * distributeAmount) / winningPool;
                bet.reward = bet.amount + share;
            } else {
                // Loser: no reward
                bet.reward = 0;
            }
        }
    }
    
    // ========================================
    // COMMUNITY ENGAGEMENT
    // ========================================
    
    /**
     * @notice Follow a project to stay updated
     */
    function followProject(uint256 projectId) external {
        require(!isFollowing[projectId][msg.sender], "Already following");
        
        projectFollowers[projectId].push(msg.sender);
        isFollowing[projectId][msg.sender] = true;
        
        emit ProjectFollowed(projectId, msg.sender);
    }
    
    /**
     * @notice Unfollow a project
     */
    function unfollowProject(uint256 projectId) external {
        require(isFollowing[projectId][msg.sender], "Not following");
        
        isFollowing[projectId][msg.sender] = false;
        
        emit ProjectUnfollowed(projectId, msg.sender);
    }
    
    /**
     * @notice Get project followers
     */
    function getProjectFollowers(uint256 projectId) external view returns (address[] memory) {
        return projectFollowers[projectId];
    }
    
    /**
     * @notice Check if user is following project
     */
    function isUserFollowing(uint256 projectId, address user) external view returns (bool) {
        return isFollowing[projectId][user];
    }
    
    // ========================================
    // VIEW FUNCTIONS
    // ========================================
    
    function getMarket(uint256 marketId) external view returns (Market memory) {
        return markets[marketId];
    }
    
    function getMarketByProject(uint256 projectId, uint256 milestoneIndex) external view returns (Market memory) {
        uint256 marketId = projectMilestoneMarket[projectId][milestoneIndex];
        require(marketId != 0, "Market does not exist");
        return markets[marketId];
    }
    
    function getBet(uint256 betId) external view returns (Bet memory) {
        return bets[betId];
    }
    
    function getUserBets(address user) external view returns (uint256[] memory) {
        return userBets[user];
    }
    
    function getMarketBets(uint256 marketId) external view returns (uint256[] memory) {
        return marketBets[marketId];
    }
    
    function hasUserBet(uint256 marketId, address user) external view returns (bool) {
        return hasBet[marketId][user];
    }
    
    function getMarketOdds(uint256 marketId) external view returns (uint256 yesPercent, uint256 noPercent) {
        Market memory market = markets[marketId];
        uint256 total = market.totalYesAmount + market.totalNoAmount;
        
        if (total == 0) {
            return (50, 50);
        }
        
        yesPercent = (market.totalYesAmount * 100) / total;
        noPercent = 100 - yesPercent;
    }
    
    /**
     * @notice Get potential reward for a winning bet
     * @dev Estimates reward if market resolves in predicted direction
     */
    function estimateReward(uint256 betId) external view returns (uint256) {
        Bet memory bet = bets[betId];
        Market memory market = markets[bet.marketId];
        
        if (market.isResolved) {
            return bet.reward;
        }
        
        uint256 winningPool = bet.predictedYes ? market.totalYesAmount : market.totalNoAmount;
        uint256 losingPool = bet.predictedYes ? market.totalNoAmount : market.totalYesAmount;
        
        if (losingPool == 0) {
            return bet.amount;
        }
        
        uint256 platformCut = (losingPool * platformFee) / 100;
        uint256 distributeAmount = losingPool - platformCut;
        
        // Add owner bonus if betting YES
        if (bet.predictedYes && market.ownerBonusPool > 0) {
            distributeAmount += market.ownerBonusPool;
        }
        
        uint256 share = (bet.amount * distributeAmount) / winningPool;
        return bet.amount + share;
    }
    
    // ========================================
    // ADMIN FUNCTIONS
    // ========================================
    
    function closeMarket(uint256 marketId) external onlyOwner {
        markets[marketId].isOpen = false;
    }
    
    function withdrawPlatformFees(address payable to) external onlyOwner nonReentrant {
        require(to != address(0), "Invalid address");
        require(platformBalance > 0, "No balance");
        
        uint256 amount = platformBalance;
        platformBalance = 0;
        
        (bool success, ) = to.call{value: amount}("");
        require(success, "Transfer failed");
    }
    
    function setMinBet(uint256 newMin) external onlyOwner {
        require(newMin > 0, "Invalid amount");
        minBetAmount = newMin;
    }
    
    function setPlatformFee(uint256 newFee) external onlyOwner {
        require(newFee <= 10, "Fee too high"); // Max 10%
        platformFee = newFee;
    }
}