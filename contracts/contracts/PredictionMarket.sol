// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

interface IProjectRegistry {
    function getMilestone(uint256 _milestoneId) external view returns (
        uint256 milestoneId,
        uint256 projectId,
        string memory title,
        string memory description,
        uint256 targetDate,
        uint8 status,
        uint256 marketId,
        bool verified,
        string memory proofURI
    );
    function setMilestoneMarketId(uint256 milestoneId, uint256 marketId) external;
    function incrementPredictions(uint256 projectId) external;
}

/**
 * @title PredictionMarket
 * @notice Binary prediction markets for project milestones
 * @dev Handles betting, market resolution, and reward distribution
 */
contract PredictionMarket is Ownable, ReentrancyGuard, Pausable {
    
    // ========================================
    // STATE VARIABLES
    // ========================================
    
    IProjectRegistry public projectRegistry;
    
    uint256 private _marketIdCounter;
    uint256 private _betIdCounter;
    
    // Fee structure (in basis points, 1% = 100)
    uint256 public constant PROTOCOL_FEE_BPS = 300;      // 3%
    uint256 public constant FUNDING_POOL_BPS = 200;      // 2%
    uint256 public constant WINNER_SHARE_BPS = 7000;     // 70% of loser pool
    uint256 public constant FUNDING_SHARE_BPS = 3000;    // 30% of loser pool
    uint256 public constant BASIS_POINTS = 10000;        // 100%
    
    uint256 public minBetAmount = 0.01 ether;
    uint256 public protocolFeesCollected;
    uint256 public fundingPoolBalance;
    
    // ========================================
    // ENUMS
    // ========================================
    
    enum MarketStatus {
        Open,        // Accepting bets
        Closed,      // No more bets, awaiting resolution
        Resolved,    // Outcome determined
        Cancelled    // Market cancelled
    }
    
    enum Outcome {
        Yes,         // Milestone will be achieved
        No           // Milestone will not be achieved
    }
    
    // ========================================
    // STRUCTS
    // ========================================
    
    struct Market {
        uint256 marketId;
        uint256 milestoneId;
        uint256 projectId;
        uint256 closeTime;
        MarketStatus status;
        bool outcomeSet;
        Outcome finalOutcome;
        uint256 totalYesStake;
        uint256 totalNoStake;
        uint256 totalYesBettors;
        uint256 totalNoBettors;
        uint256 resolutionTime;
        bool rewardsCalculated;
    }
    
    struct Bet {
        uint256 betId;
        uint256 marketId;
        address bettor;
        Outcome prediction;
        uint256 amount;
        uint256 timestamp;
        bool claimed;
        uint256 rewardAmount;
    }
    
    // ========================================
    // MAPPINGS
    // ========================================
    
    mapping(uint256 => Market) public markets;
    mapping(uint256 => Bet) public bets;
    mapping(uint256 => uint256[]) public marketBets;           // marketId => betIds
    mapping(address => uint256[]) public userBets;             // user => betIds
    mapping(uint256 => mapping(address => bool)) public hasUserBet; // marketId => user => hasBet
    mapping(uint256 => address[]) public marketWinners;        // marketId => winner addresses
    
    // ========================================
    // EVENTS
    // ========================================
    
    event MarketCreated(
        uint256 indexed marketId,
        uint256 indexed milestoneId,
        uint256 indexed projectId,
        uint256 closeTime
    );
    
    event BetPlaced(
        uint256 indexed betId,
        uint256 indexed marketId,
        address indexed bettor,
        Outcome prediction,
        uint256 amount
    );
    
    event BetIncreased(
        uint256 indexed betId,
        uint256 additionalAmount,
        uint256 newTotalAmount
    );
    
    event MarketClosed(
        uint256 indexed marketId,
        uint256 timestamp
    );
    
    event MarketResolved(
        uint256 indexed marketId,
        Outcome finalOutcome,
        uint256 timestamp
    );
    
    event RewardsClaimed(
        uint256 indexed betId,
        address indexed bettor,
        uint256 amount
    );
    
    event MarketCancelled(
        uint256 indexed marketId,
        string reason
    );
    
    event ProtocolFeesWithdrawn(
        address indexed to,
        uint256 amount
    );
    
    event FundingPoolTransferred(
        address indexed fundingPool,
        uint256 amount
    );
    
    // ========================================
    // CONSTRUCTOR
    // ========================================
    
    constructor(address _projectRegistry) Ownable(msg.sender) {
        require(_projectRegistry != address(0), "Invalid registry address");
        projectRegistry = IProjectRegistry(_projectRegistry);
        _marketIdCounter = 1;
        _betIdCounter = 1;
    }
    
    // ========================================
    // EXTERNAL FUNCTIONS - MARKET MANAGEMENT
    // ========================================
    
    /**
     * @notice Create a prediction market for a milestone
     * @param milestoneId The milestone to create market for
     * @return marketId The ID of the created market
     */
    function createMarket(uint256 milestoneId) 
        external 
        onlyOwner 
        whenNotPaused 
        returns (uint256) 
    {
        uint256 marketId = _marketIdCounter++;
        
        // Get milestone details and create market
        _validateAndCreateMarket(milestoneId, marketId);
        
        emit MarketCreated(marketId, milestoneId, markets[marketId].projectId, markets[marketId].closeTime);
        
        return marketId;
    }
    
    /**
     * @dev Validate milestone and create market
     * @param milestoneId The milestone ID
     * @param marketId The market ID to create
     */
    function _validateAndCreateMarket(uint256 milestoneId, uint256 marketId) internal {
        // Get milestone details from registry
        (
            ,
            uint256 projectId,
            ,
            ,
            uint256 targetDate,
            ,
            uint256 existingMarketId,
            ,
        ) = projectRegistry.getMilestone(milestoneId);
        
        require(existingMarketId == 0, "Market already exists for milestone");
        require(targetDate > block.timestamp, "Milestone date must be in future");
        
        markets[marketId] = Market({
            marketId: marketId,
            milestoneId: milestoneId,
            projectId: projectId,
            closeTime: targetDate,
            status: MarketStatus.Open,
            outcomeSet: false,
            finalOutcome: Outcome.Yes,
            totalYesStake: 0,
            totalNoStake: 0,
            totalYesBettors: 0,
            totalNoBettors: 0,
            resolutionTime: 0,
            rewardsCalculated: false
        });
        
        // Register market ID with milestone
        projectRegistry.setMilestoneMarketId(milestoneId, marketId);
    }
    
    /**
     * @notice Place a bet on a market outcome
     * @param marketId The market to bet on
     * @param prediction The outcome prediction (Yes/No)
     * @return betId The ID of the placed bet
     */
    function placeBet(uint256 marketId, Outcome prediction) 
        external 
        payable 
        nonReentrant 
        whenNotPaused 
        returns (uint256) 
    {
        require(msg.value >= minBetAmount, "Bet amount too low");
        require(markets[marketId].marketId != 0, "Market does not exist");
        require(markets[marketId].status == MarketStatus.Open, "Market not open");
        require(block.timestamp < markets[marketId].closeTime, "Market closed");
        require(!hasUserBet[marketId][msg.sender], "Already bet on this market");
        
        uint256 betId = _betIdCounter++;
        
        // Process bet and fees
        uint256 betAmount = _processBetAndFees(marketId, betId, prediction);
        
        emit BetPlaced(betId, marketId, msg.sender, prediction, betAmount);
        
        return betId;
    }
    
    /**
     * @dev Process bet creation and fee deduction
     * @param marketId The market ID
     * @param betId The bet ID
     * @param prediction The prediction
     * @return betAmount The actual bet amount after fees
     */
    function _processBetAndFees(
        uint256 marketId,
        uint256 betId,
        Outcome prediction
    ) internal returns (uint256) {
        Market storage market = markets[marketId];
        
        // Calculate fees
        uint256 protocolFee = (msg.value * PROTOCOL_FEE_BPS) / BASIS_POINTS;
        uint256 fundingPoolFee = (msg.value * FUNDING_POOL_BPS) / BASIS_POINTS;
        uint256 betAmount = msg.value - protocolFee - fundingPoolFee;
        
        // Update fee balances
        protocolFeesCollected = protocolFeesCollected + protocolFee;
        fundingPoolBalance = fundingPoolBalance + fundingPoolFee;
        
        // Create bet
        bets[betId] = Bet({
            betId: betId,
            marketId: marketId,
            bettor: msg.sender,
            prediction: prediction,
            amount: betAmount,
            timestamp: block.timestamp,
            claimed: false,
            rewardAmount: 0
        });
        
        // Update market totals
        if (prediction == Outcome.Yes) {
            market.totalYesStake = market.totalYesStake + betAmount;
            market.totalYesBettors = market.totalYesBettors + 1;
        } else {
            market.totalNoStake = market.totalNoStake + betAmount;
            market.totalNoBettors = market.totalNoBettors + 1;
        }
        
        // Track bet
        marketBets[marketId].push(betId);
        userBets[msg.sender].push(betId);
        hasUserBet[marketId][msg.sender] = true;
        
        // Increment prediction count in registry
        projectRegistry.incrementPredictions(market.projectId);
        
        return betAmount;
    }
    
    /**
     * @notice Increase an existing bet amount
     * @param betId The bet to increase
     */
    function increaseBet(uint256 betId) 
        external 
        payable 
        nonReentrant 
        whenNotPaused 
    {
        require(msg.value >= minBetAmount, "Additional amount too low");
        require(bets[betId].betId != 0, "Bet does not exist");
        require(bets[betId].bettor == msg.sender, "Not your bet");
        
        uint256 marketId = bets[betId].marketId;
        require(markets[marketId].status == MarketStatus.Open, "Market not open");
        require(block.timestamp < markets[marketId].closeTime, "Market closed");
        
        // Process increase
        uint256 additionalAmount = _processIncrease(betId, marketId);
        
        emit BetIncreased(betId, additionalAmount, bets[betId].amount);
    }
    
    /**
     * @dev Process bet increase and update totals
     * @param betId The bet ID
     * @param marketId The market ID
     * @return additionalAmount The additional bet amount after fees
     */
    function _processIncrease(uint256 betId, uint256 marketId) internal returns (uint256) {
        // Calculate fees
        uint256 protocolFee = (msg.value * PROTOCOL_FEE_BPS) / BASIS_POINTS;
        uint256 fundingPoolFee = (msg.value * FUNDING_POOL_BPS) / BASIS_POINTS;
        uint256 additionalAmount = msg.value - protocolFee - fundingPoolFee;
        
        // Update fee balances
        protocolFeesCollected = protocolFeesCollected + protocolFee;
        fundingPoolBalance = fundingPoolBalance + fundingPoolFee;
        
        // Update bet
        Bet storage bet = bets[betId];
        bet.amount = bet.amount + additionalAmount;
        
        // Update market totals
        Market storage market = markets[marketId];
        if (bet.prediction == Outcome.Yes) {
            market.totalYesStake = market.totalYesStake + additionalAmount;
        } else {
            market.totalNoStake = market.totalNoStake + additionalAmount;
        }
        
        return additionalAmount;
    }
    
    /**
     * @notice Close market for betting (manual for MVP, can be automated)
     * @param marketId The market to close
     */
    function closeMarket(uint256 marketId) external onlyOwner {
        require(markets[marketId].marketId != 0, "Market does not exist");
        require(markets[marketId].status == MarketStatus.Open, "Market not open");
        
        markets[marketId].status = MarketStatus.Closed;
        
        emit MarketClosed(marketId, block.timestamp);
    }
    
    /**
     * @notice Resolve market with final outcome
     * @param marketId The market to resolve
     * @param finalOutcome The actual outcome (Yes/No)
     */
    function resolveMarket(uint256 marketId, Outcome finalOutcome) 
        external 
        onlyOwner 
        nonReentrant 
    {
        require(markets[marketId].marketId != 0, "Market does not exist");
        Market storage market = markets[marketId];
        require(
            market.status == MarketStatus.Closed || 
            block.timestamp >= market.closeTime,
            "Market must be closed first"
        );
        require(!market.outcomeSet, "Market already resolved");
        
        // Set outcome
        market.finalOutcome = finalOutcome;
        market.outcomeSet = true;
        market.status = MarketStatus.Resolved;
        market.resolutionTime = block.timestamp;
        
        // Calculate rewards
        _calculateRewards(marketId);
        
        emit MarketResolved(marketId, finalOutcome, block.timestamp);
    }
    
    /**
     * @notice Claim rewards for a winning bet
     * @param betId The bet to claim rewards for
     */
    function claimRewards(uint256 betId) external nonReentrant {
        require(bets[betId].betId != 0, "Bet does not exist");
        Bet storage bet = bets[betId];
        require(bet.bettor == msg.sender, "Not your bet");
        require(!bet.claimed, "Already claimed");
        
        Market memory market = markets[bet.marketId];
        require(market.status == MarketStatus.Resolved, "Market not resolved");
        require(market.rewardsCalculated, "Rewards not calculated");
        
        // Check if winner
        require(bet.prediction == market.finalOutcome, "Not a winning bet");
        require(bet.rewardAmount > 0, "No rewards to claim");
        
        // Mark as claimed
        bet.claimed = true;
        
        // Transfer rewards
        (bool success, ) = payable(msg.sender).call{value: bet.rewardAmount}("");
        require(success, "Reward transfer failed");
        
        emit RewardsClaimed(betId, msg.sender, bet.rewardAmount);
    }
    
    /**
     * @notice Cancel a market and refund all bets
     * @param marketId The market to cancel
     * @param reason Reason for cancellation
     */
    function cancelMarket(uint256 marketId, string memory reason) 
        external 
        onlyOwner 
        nonReentrant 
    {
        require(markets[marketId].marketId != 0, "Market does not exist");
        Market storage market = markets[marketId];
        require(market.status != MarketStatus.Resolved, "Cannot cancel resolved market");
        
        market.status = MarketStatus.Cancelled;
        
        // Refund all bets
        uint256[] memory betIds = marketBets[marketId];
        for (uint256 i = 0; i < betIds.length; i++) {
            Bet storage bet = bets[betIds[i]];
            if (!bet.claimed && bet.amount > 0) {
                bet.claimed = true;
                (bool success, ) = payable(bet.bettor).call{value: bet.amount}("");
                require(success, "Refund failed");
            }
        }
        
        emit MarketCancelled(marketId, reason);
    }
    
    // ========================================
    // INTERNAL FUNCTIONS
    // ========================================
    
    /**
     * @dev Calculate rewards for all bets in a market
     * @param marketId The market to calculate rewards for
     */
    function _calculateRewards(uint256 marketId) internal {
        Market storage market = markets[marketId];
        require(!market.rewardsCalculated, "Rewards already calculated");
        
        uint256 winningPool = market.finalOutcome == Outcome.Yes ? market.totalYesStake : market.totalNoStake;
        uint256 losingPool = market.finalOutcome == Outcome.Yes ? market.totalNoStake : market.totalYesStake;

        if (losingPool == 0) {
            _distributeStakeOnly(marketId);
            market.rewardsCalculated = true;
            return;
        }

        uint256 winnerShare = (losingPool * WINNER_SHARE_BPS) / BASIS_POINTS;
        uint256 fundingShare = losingPool - winnerShare;

        fundingPoolBalance = fundingPoolBalance + fundingShare;

        _distributeWinnings(marketId, winningPool, winnerShare);
        market.rewardsCalculated = true; 
    }

    /**
    * @dev Distribute stakes back when there's no losing pool
    * @param marketId The market ID
    */
    function _distributeStakeOnly(uint256 marketId) internal {
        Market memory market = markets[marketId];
        uint256[] memory betIds = marketBets[marketId];
        
        for (uint256 i = 0; i < betIds.length; i++) {
            Bet storage bet = bets[betIds[i]];
            if (bet.prediction == market.finalOutcome) {
                bet.rewardAmount = bet.amount;
                marketWinners[marketId].push(bet.bettor);
            }
        }
    }

    /**
    * @dev Distribute winnings proportionally
    * @param marketId The market ID
    * @param winningPool Total stake on winning side
    * @param winnerShare Amount to distribute to winners
    */
    function _distributeWinnings(
        uint256 marketId,
        uint256 winningPool,
        uint256 winnerShare
    ) internal {
        Market memory market = markets[marketId];
        uint256[] memory betIds = marketBets[marketId];
        
        for (uint256 i = 0; i < betIds.length; i++) {
            Bet storage bet = bets[betIds[i]];
            
            if (bet.prediction == market.finalOutcome) {
                uint256 share = (bet.amount * winnerShare) / winningPool;
                bet.rewardAmount = bet.amount + share;
                marketWinners[marketId].push(bet.bettor);
            } else {
                bet.rewardAmount = 0;
            }
        }
    }

    /**
    * @dev Get user's reward amount for a specific market
    * @param marketId The market ID
    * @param user The user address
    */
    function _getUserRewardForMarket(uint256 marketId, address user) 
        internal 
        view 
        returns (uint256) 
    {
        uint256[] memory userBetIds = userBets[user];
        
        for (uint256 i = 0; i < userBetIds.length; i++) {
            if (bets[userBetIds[i]].marketId == marketId) {
                return bets[userBetIds[i]].rewardAmount;
            }
        }
        
        return 0;
    }
    
    // ========================================
    // VIEW FUNCTIONS
    // ========================================
    
    /**
     * @notice Get market details
     * @param marketId The market ID
     */
    function getMarket(uint256 marketId) external view returns (Market memory) {
        require(markets[marketId].marketId != 0, "Market does not exist");
        return markets[marketId];
    }
    
    /**
     * @notice Get bet details
     * @param betId The bet ID
     */
    function getBet(uint256 betId) external view returns (Bet memory) {
        require(bets[betId].betId != 0, "Bet does not exist");
        return bets[betId];
    }
    
    /**
     * @notice Get all bets for a market
     * @param marketId The market ID
     */
    function getMarketBets(uint256 marketId) external view returns (uint256[] memory) {
        return marketBets[marketId];
    }
    
    /**
     * @notice Get all bets by a user
     * @param user The user address
     */
    function getUserBets(address user) external view returns (uint256[] memory) {
        return userBets[user];
    }
    
    /**
     * @notice Get market odds (probability based on stake)
     * @param marketId The market ID
     * @return yesOdds Percentage for Yes outcome (in basis points)
     * @return noOdds Percentage for No outcome (in basis points)
     */
    function getMarketOdds(uint256 marketId) 
        external 
        view 
        returns (uint256 yesOdds, uint256 noOdds) 
    {
        require(markets[marketId].marketId != 0, "Market does not exist");
        Market memory market = markets[marketId];
        
        uint256 totalStake = market.totalYesStake + market.totalNoStake;
        
        if (totalStake == 0) {
            return (5000, 5000); // 50/50 if no bets
        }
        
        yesOdds = (market.totalYesStake * BASIS_POINTS) / totalStake;
        noOdds = (market.totalNoStake * BASIS_POINTS) / totalStake;
    }
    
    /**
     * @notice Get top predictors for a market
     * @param marketId The market ID
     * @param limit Maximum number of predictors to return
     */
    function getTopPredictors(uint256 marketId, uint256 limit) 
        external 
        view 
        returns (address[] memory topPredictors, uint256[] memory amounts) 
    {
        require(markets[marketId].marketId != 0, "Market does not exist");
        require(markets[marketId].status == MarketStatus.Resolved, "Market not resolved");
        
        address[] memory winners = marketWinners[marketId];
        uint256 resultSize = winners.length > limit ? limit : winners.length;
        
        topPredictors = new address[](resultSize);
        amounts = new uint256[](resultSize);
        
        // Simple approach: return first N winners (can be enhanced with sorting)
        for (uint256 i = 0; i < resultSize; i++) {
            topPredictors[i] = winners[i];
            // Find their bet amount
            amounts[i] = _getUserRewardForMarket(marketId, winners[i]);
        }
        
        return (topPredictors, amounts);
    }
    
    /**
     * @notice Check if user has bet on a market
     * @param marketId The market ID
     * @param user The user address
     */
    function hasUserBetOnMarket(uint256 marketId, address user) 
        external 
        view 
        returns (bool) 
    {
        return hasUserBet[marketId][user];
    }
    
    /**
     * @notice Get claimable amount for a bet
     * @param betId The bet ID
     */
    function getClaimableAmount(uint256 betId) external view returns (uint256) {
        require(bets[betId].betId != 0, "Bet does not exist");
        Bet memory bet = bets[betId];
        
        if (bet.claimed) return 0;
        
        Market memory market = markets[bet.marketId];
        if (market.status != MarketStatus.Resolved) return 0;
        if (bet.prediction != market.finalOutcome) return 0;
        
        return bet.rewardAmount;
    }
    
    // ========================================
    // ADMIN FUNCTIONS
    // ========================================
    
    /**
     * @notice Update minimum bet amount
     * @param newMinBet New minimum bet amount
     */
    function updateMinBetAmount(uint256 newMinBet) external onlyOwner {
        require(newMinBet > 0, "Min bet must be positive");
        minBetAmount = newMinBet;
    }
    
    /**
     * @notice Withdraw protocol fees
     * @param to Address to send fees to
     */
    function withdrawProtocolFees(address payable to) external onlyOwner nonReentrant {
        require(to != address(0), "Invalid address");
        require(protocolFeesCollected > 0, "No fees to withdraw");
        
        uint256 amount = protocolFeesCollected;
        protocolFeesCollected = 0;
        
        (bool success, ) = to.call{value: amount}("");
        require(success, "Withdrawal failed");
        
        emit ProtocolFeesWithdrawn(to, amount);
    }
    
    /**
     * @notice Transfer funding pool to FundingPool contract
     * @param fundingPoolContract Address of FundingPool contract
     */
    function transferFundingPool(address payable fundingPoolContract) 
        external 
        onlyOwner 
        nonReentrant 
    {
        require(fundingPoolContract != address(0), "Invalid address");
        require(fundingPoolBalance > 0, "No funding pool balance");
        
        uint256 amount = fundingPoolBalance;
        fundingPoolBalance = 0;
        
        (bool success, ) = fundingPoolContract.call{value: amount}("");
        require(success, "Transfer failed");
        
        emit FundingPoolTransferred(fundingPoolContract, amount);
    }
    
    /**
     * @notice Pause contract
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @notice Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @notice Get current market counter
     */
    function getCurrentMarketId() external view returns (uint256) {
        return _marketIdCounter - 1;
    }
    
    /**
     * @notice Get current bet counter
     */
    function getCurrentBetId() external view returns (uint256) {
        return _betIdCounter - 1;
    }
}
