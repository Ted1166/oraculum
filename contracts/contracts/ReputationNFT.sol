// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

interface IPredictionMarket {
    function getUserBets(address user) external view returns (uint256[] memory);
    function getBet(uint256 betId) external view returns (
        uint256,
        uint256 marketId,
        address bettor,
        uint8 prediction,
        uint256 amount,
        uint256 timestamp,
        bool claimed,
        uint256 rewardAmount
    );
}

/**
 * @title ReputationNFT
 * @notice ERC-721 NFTs for top predictors and achievement badges
 * @dev Dynamic metadata, on-chain SVG generation, reputation tracking
 */
contract ReputationNFT is ERC721, ERC721URIStorage, Ownable, ReentrancyGuard {
    using Strings for uint256;
    
    // ========================================
    // STATE VARIABLES
    // ========================================
    
    IPredictionMarket public predictionMarket;
    uint256 private _tokenIdCounter;
    
    // ========================================
    // ENUMS
    // ========================================
    
    enum AchievementType {
        TopPredictor,
        PerfectPrediction,
        WinStreak5,
        WinStreak10,
        EarlyBacker,
        HighRoller,
        Veteran,
        Legend,
        Whale,
        Consistent,
        Pioneer
    }
    
    enum Rarity {
        Common,
        Rare,
        Epic,
        Legendary
    }
    
    // ========================================
    // STRUCTS
    // ========================================
    
    struct Badge {
        uint256 tokenId;
        AchievementType achievementType;
        Rarity rarity;
        uint256 mintedAt;
        uint256 marketId;
        uint256 streak;
        string customMessage;
        bool soulbound;
    }
    
    struct UserStats {
        uint256 totalPredictions;
        uint256 totalWins;
        uint256 totalLosses;
        uint256 currentStreak;
        uint256 longestStreak;
        uint256 totalWagered;
        uint256 totalEarnings;
        uint256 firstPredictionTime;
        uint256[] badges;
    }
    
    // ========================================
    // MAPPINGS
    // ========================================
    
    mapping(uint256 => Badge) public badges;
    mapping(address => UserStats) public userStats;
    mapping(address => mapping(AchievementType => bool)) public hasAchievement;
    mapping(uint256 => bool) public isSoulbound;
    
    // ========================================
    // EVENTS
    // ========================================
    
    event BadgeMinted(
        uint256 indexed tokenId,
        address indexed recipient,
        AchievementType indexed achievementType,
        Rarity rarity
    );
    
    event StatsUpdated(
        address indexed user,
        uint256 totalPredictions,
        uint256 totalWins,
        uint256 currentStreak
    );
    
    event AchievementUnlocked(
        address indexed user,
        AchievementType indexed achievementType,
        uint256 tokenId
    );
    
    // ========================================
    // CONSTRUCTOR
    // ========================================
    
    constructor(address _predictionMarket) 
        ERC721("PREDICT & FUND Badge", "PFB") 
        Ownable(msg.sender) 
    {
        require(_predictionMarket != address(0), "Invalid market address");
        predictionMarket = IPredictionMarket(_predictionMarket);
        _tokenIdCounter = 1;
    }
    
    // ========================================
    // EXTERNAL FUNCTIONS - MINTING
    // ========================================
    
    function mintTopPredictorBadge(
        address recipient,
        uint256 marketId
    ) external onlyOwner nonReentrant returns (uint256) {
        require(recipient != address(0), "Invalid recipient");
        require(!hasAchievement[recipient][AchievementType.TopPredictor], "Already has this achievement");
        
        uint256 tokenId = _mintBadge(
            recipient,
            AchievementType.TopPredictor,
            Rarity.Epic,
            marketId,
            0,
            "Market Champion",
            false
        );
        
        hasAchievement[recipient][AchievementType.TopPredictor] = true;
        return tokenId;
    }
    
    function mintAchievementBadge(
        address recipient,
        AchievementType achievementType
    ) external onlyOwner nonReentrant returns (uint256) {
        require(recipient != address(0), "Invalid recipient");
        require(!hasAchievement[recipient][achievementType], "Already has this achievement");
        
        (Rarity rarity, string memory message, bool soulbound) = _getAchievementDetails(achievementType);
        
        uint256 tokenId = _mintBadge(
            recipient,
            achievementType,
            rarity,
            0,
            0,
            message,
            soulbound
        );
        
        hasAchievement[recipient][achievementType] = true;
        return tokenId;
    }
    
    function updateStats(
        address user,
        bool won,
        uint256 amount,
        uint256 earnings
    ) external onlyOwner {
        UserStats storage stats = userStats[user];
        
        if (stats.totalPredictions == 0) {
            stats.firstPredictionTime = block.timestamp;
        }
        
        stats.totalPredictions = stats.totalPredictions + 1;
        stats.totalWagered = stats.totalWagered + amount;
        
        if (won) {
            stats.totalWins = stats.totalWins + 1;
            stats.currentStreak = stats.currentStreak + 1;
            stats.totalEarnings = stats.totalEarnings + earnings;
            
            if (stats.currentStreak > stats.longestStreak) {
                stats.longestStreak = stats.currentStreak;
            }
            
            _checkStreakAchievements(user, stats.currentStreak);
        } else {
            stats.totalLosses += 1;
            stats.currentStreak = 0;
        }
        
        _checkMilestoneAchievements(user);
        
        emit StatsUpdated(user, stats.totalPredictions, stats.totalWins, stats.currentStreak);
    }
    
    // ========================================
    // VIEW FUNCTIONS
    // ========================================
    
    function getUserStats(address user) external view returns (UserStats memory) {
        return userStats[user];
    }
    
    function getUserBadges(address user) external view returns (uint256[] memory) {
        return userStats[user].badges;
    }
    
    function getBadge(uint256 tokenId) external view returns (Badge memory) {
        require(_ownerOf(tokenId) != address(0), "Badge does not exist");
        return badges[tokenId];
    }
    
    function getWinRate(address user) external view returns (uint256) {
        UserStats memory stats = userStats[user];
        if (stats.totalPredictions == 0) return 0;
        return (stats.totalWins * 10000) / stats.totalPredictions;
    }
    
    function hasUserAchievement(address user, AchievementType achievementType) 
        external 
        view 
        returns (bool) 
    {
        return hasAchievement[user][achievementType];
    }
    
    function getTotalBadges() external view returns (uint256) {
        return _tokenIdCounter - 1;
    }
    
    // ========================================
    // SVG GENERATION (SPLIT INTO PARTS)
    // ========================================
    
    function generateSVG(uint256 tokenId) public view returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Badge does not exist");
        Badge memory badge = badges[tokenId];
        
        string memory part1 = _generateSVGPart1(badge);
        string memory part2 = _generateSVGPart2(badge, tokenId);
        
        return string(abi.encodePacked(part1, part2));
    }
    
    function _generateSVGPart1(Badge memory badge) internal pure returns (string memory) {
        string memory rarityColor = _getRarityColor(badge.rarity);
        
        return string(abi.encodePacked(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 350 350">',
            '<defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">',
            '<stop offset="0%" style="stop-color:', rarityColor, ';stop-opacity:1" />',
            '<stop offset="100%" style="stop-color:#000;stop-opacity:1" />',
            '</linearGradient></defs>',
            '<rect width="350" height="350" fill="url(#grad)" />',
            '<circle cx="175" cy="120" r="60" fill="gold" opacity="0.8" />'
        ));
    }
    
    function _generateSVGPart2(Badge memory badge, uint256 tokenId) internal pure returns (string memory) {
        string memory achievementName = _getAchievementName(badge.achievementType);
        
        return string(abi.encodePacked(
            '<text x="175" y="130" font-family="Arial" font-size="40" fill="#fff" text-anchor="middle">',
            unicode"🏆",
            '</text>',
            '<text x="175" y="200" font-family="Arial" font-size="20" fill="#fff" text-anchor="middle" font-weight="bold">',
            achievementName,
            '</text>',
            '<text x="175" y="230" font-family="Arial" font-size="14" fill="#fff" text-anchor="middle">',
            badge.customMessage,
            '</text>',
            '<text x="175" y="270" font-family="Arial" font-size="12" fill="#ccc" text-anchor="middle">PREDICT & FUND</text>',
            '<text x="175" y="290" font-family="Arial" font-size="10" fill="#aaa" text-anchor="middle">Badge #', 
            tokenId.toString(),
            '</text></svg>'
        ));
    }
    
    // ========================================
    // TOKEN URI (SPLIT INTO PARTS)
    // ========================================
    
    function tokenURI(uint256 tokenId) 
        public 
        view 
        override(ERC721, ERC721URIStorage) 
        returns (string memory) 
    {
        require(_ownerOf(tokenId) != address(0), "Badge does not exist");
        
        string memory json = _buildTokenJSON(tokenId);
        return string(abi.encodePacked("data:application/json;base64,", Base64.encode(bytes(json))));
    }
    
    function _buildTokenJSON(uint256 tokenId) internal view returns (string memory) {
        Badge memory badge = badges[tokenId];
        string memory svg = generateSVG(tokenId);
        string memory encodedSVG = Base64.encode(bytes(svg));
        
        string memory part1 = _buildJSONPart1(badge, encodedSVG);
        string memory part2 = _buildJSONPart2(badge);
        
        return string(abi.encodePacked(part1, part2));
    }
    
    function _buildJSONPart1(Badge memory badge, string memory encodedSVG) 
        internal 
        pure 
        returns (string memory) 
    {
        string memory achievementName = _getAchievementName(badge.achievementType);
        
        return string(abi.encodePacked(
            '{"name": "', achievementName, ' Badge",',
            '"description": "PREDICT & FUND Achievement Badge - ', badge.customMessage, '",',
            '"image": "data:image/svg+xml;base64,', encodedSVG, '",'
        ));
    }
    
    function _buildJSONPart2(Badge memory badge) internal pure returns (string memory) {
        string memory achievementName = _getAchievementName(badge.achievementType);
        string memory rarityName = _getRarityName(badge.rarity);
        string memory soulboundStr = badge.soulbound ? "Yes" : "No";
        
        return string(abi.encodePacked(
            '"attributes": [',
            '{"trait_type": "Achievement", "value": "', achievementName, '"},',
            '{"trait_type": "Rarity", "value": "', rarityName, '"},',
            '{"trait_type": "Minted At", "value": ', badge.mintedAt.toString(), '},',
            '{"trait_type": "Soulbound", "value": "', soulboundStr, '"}',
            ']}'
        ));
    }
    
    // ========================================
    // INTERNAL FUNCTIONS
    // ========================================
    
    function _mintBadge(
        address recipient,
        AchievementType achievementType,
        Rarity rarity,
        uint256 marketId,
        uint256 streak,
        string memory customMessage,
        bool soulbound
    ) internal returns (uint256) {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter = _tokenIdCounter + 1;
        
        badges[tokenId] = Badge({
            tokenId: tokenId,
            achievementType: achievementType,
            rarity: rarity,
            mintedAt: block.timestamp,
            marketId: marketId,
            streak: streak,
            customMessage: customMessage,
            soulbound: soulbound
        });
        
        if (soulbound) {
            isSoulbound[tokenId] = true;
        }
        
        userStats[recipient].badges.push(tokenId);
        _safeMint(recipient, tokenId);
        
        emit BadgeMinted(tokenId, recipient, achievementType, rarity);
        emit AchievementUnlocked(recipient, achievementType, tokenId);
        
        return tokenId;
    }
    
    function _checkStreakAchievements(address user, uint256 streak) internal {
        if (streak == 5 && !hasAchievement[user][AchievementType.WinStreak5]) {
            _mintBadge(user, AchievementType.WinStreak5, Rarity.Rare, 0, 5, "5 Win Streak", true);
            hasAchievement[user][AchievementType.WinStreak5] = true;
        }
        
        if (streak == 10 && !hasAchievement[user][AchievementType.WinStreak10]) {
            _mintBadge(user, AchievementType.WinStreak10, Rarity.Epic, 0, 10, "10 Win Streak", true);
            hasAchievement[user][AchievementType.WinStreak10] = true;
        }
    }
    
    function _checkMilestoneAchievements(address user) internal {
        UserStats storage stats = userStats[user];
        
        if (stats.totalPredictions == 50 && !hasAchievement[user][AchievementType.Veteran]) {
            _mintBadge(user, AchievementType.Veteran, Rarity.Rare, 0, 0, "50 Predictions", true);
            hasAchievement[user][AchievementType.Veteran] = true;
        }
        
        if (stats.totalPredictions == 100 && !hasAchievement[user][AchievementType.Legend]) {
            _mintBadge(user, AchievementType.Legend, Rarity.Legendary, 0, 0, "100 Predictions", true);
            hasAchievement[user][AchievementType.Legend] = true;
        }
        
        if (stats.totalWagered >= 10 ether && !hasAchievement[user][AchievementType.Whale]) {
            _mintBadge(user, AchievementType.Whale, Rarity.Epic, 0, 0, "High Roller", true);
            hasAchievement[user][AchievementType.Whale] = true;
        }
        
        if (stats.totalPredictions >= 20) {
            uint256 winRate = (stats.totalWins * 100) / stats.totalPredictions;
            if (winRate >= 70 && !hasAchievement[user][AchievementType.Consistent]) {
                _mintBadge(user, AchievementType.Consistent, Rarity.Epic, 0, 0, "Consistent Winner", true);
                hasAchievement[user][AchievementType.Consistent] = true;
            }
        }
    }
    
    function _getAchievementDetails(AchievementType achievementType) 
        internal 
        pure 
        returns (Rarity rarity, string memory message, bool soulbound) 
    {
        if (achievementType == AchievementType.TopPredictor) {
            return (Rarity.Epic, "Market Champion", false);
        } else if (achievementType == AchievementType.PerfectPrediction) {
            return (Rarity.Legendary, "Perfect Prediction", true);
        } else if (achievementType == AchievementType.EarlyBacker) {
            return (Rarity.Common, "Early Backer", false);
        } else if (achievementType == AchievementType.HighRoller) {
            return (Rarity.Rare, "High Roller", false);
        } else if (achievementType == AchievementType.Pioneer) {
            return (Rarity.Legendary, "Platform Pioneer", true);
        } else {
            return (Rarity.Common, "Achievement Unlocked", false);
        }
    }
    
    function _getRarityColor(Rarity rarity) internal pure returns (string memory) {
        if (rarity == Rarity.Common) return "#808080";
        if (rarity == Rarity.Rare) return "#0080FF";
        if (rarity == Rarity.Epic) return "#9D00FF";
        if (rarity == Rarity.Legendary) return "#FFD700";
        return "#FFFFFF";
    }
    
    function _getRarityName(Rarity rarity) internal pure returns (string memory) {
        if (rarity == Rarity.Common) return "Common";
        if (rarity == Rarity.Rare) return "Rare";
        if (rarity == Rarity.Epic) return "Epic";
        if (rarity == Rarity.Legendary) return "Legendary";
        return "Unknown";
    }
    
    function _getAchievementName(AchievementType achievementType) internal pure returns (string memory) {
        if (achievementType == AchievementType.TopPredictor) return "Top Predictor";
        if (achievementType == AchievementType.PerfectPrediction) return "Perfect Prediction";
        if (achievementType == AchievementType.WinStreak5) return "5 Win Streak";
        if (achievementType == AchievementType.WinStreak10) return "10 Win Streak";
        if (achievementType == AchievementType.EarlyBacker) return "Early Backer";
        if (achievementType == AchievementType.HighRoller) return "High Roller";
        if (achievementType == AchievementType.Veteran) return "Veteran";
        if (achievementType == AchievementType.Legend) return "Legend";
        if (achievementType == AchievementType.Whale) return "Whale";
        if (achievementType == AchievementType.Consistent) return "Consistent";
        if (achievementType == AchievementType.Pioneer) return "Pioneer";
        return "Achievement";
    }
    
    // ========================================
    // OVERRIDE FUNCTIONS
    // ========================================
    
    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address)
    {
        address from = _ownerOf(tokenId);
        
        if (from == address(0) || to == address(0)) {
            return super._update(to, tokenId, auth);
        }
        
        require(!isSoulbound[tokenId], "Token is soulbound");
        
        return super._update(to, tokenId, auth);
    }
    
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
    
    // ========================================
    // ADMIN FUNCTIONS
    // ========================================
    
    function updatePredictionMarket(address newMarket) external onlyOwner {
        require(newMarket != address(0), "Invalid address");
        predictionMarket = IPredictionMarket(newMarket);
    }
    
    function getCurrentTokenId() external view returns (uint256) {
        return _tokenIdCounter - 1;
    }
}