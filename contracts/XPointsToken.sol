// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title XPointsToken
 * @dev ERC20 token for the xPoints loyalty exchange platform
 * Features:
 * - Minting of new tokens by authorized minters
 * - Burning tokens when redeemed for loyalty points
 * - Pausing functionality in case of emergency
 * - Role-based access control for administrative functions
 */
contract XPointsToken is ERC20, ERC20Burnable, ERC20Pausable, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // Loyalty program backing tracker
    mapping(string => uint256) private _loyaltyPointsReserves;
    string[] private _supportedPrograms;
    
    // Events
    event LoyaltyPointsDeposited(string program, uint256 amount);
    event LoyaltyPointsWithdrawn(string program, uint256 amount);
    event ProgramAdded(string program);

    /**
     * @dev Constructor for XPointsToken
     * @param admin The address that will have admin privileges
     */
    constructor(address admin) ERC20("xPoints Token", "XPT") {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
    }

    /**
     * @dev Mints new tokens to a specified address
     * @param to The address that will receive the minted tokens
     * @param amount The amount of tokens to mint
     * Requirements:
     * - The caller must have the MINTER_ROLE
     */
    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    /**
     * @dev Pauses all token transfers
     * Requirements:
     * - The caller must have the PAUSER_ROLE
     */
    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @dev Unpauses all token transfers
     * Requirements:
     * - The caller must have the PAUSER_ROLE
     */
    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @dev Adds a supported loyalty program
     * @param program The loyalty program identifier
     * Requirements:
     * - The caller must have the ADMIN_ROLE
     */
    function addLoyaltyProgram(string memory program) public onlyRole(ADMIN_ROLE) {
        for (uint i = 0; i < _supportedPrograms.length; i++) {
            require(keccak256(bytes(_supportedPrograms[i])) != keccak256(bytes(program)), "Program already exists");
        }
        _supportedPrograms.push(program);
        emit ProgramAdded(program);
    }

    /**
     * @dev Deposits loyalty points to back the tokens
     * @param program The loyalty program identifier
     * @param amount The amount of loyalty points deposited
     * Requirements:
     * - The caller must have the ADMIN_ROLE
     */
    function depositLoyaltyPoints(string memory program, uint256 amount) public onlyRole(ADMIN_ROLE) {
        bool found = false;
        for (uint i = 0; i < _supportedPrograms.length; i++) {
            if (keccak256(bytes(_supportedPrograms[i])) == keccak256(bytes(program))) {
                found = true;
                break;
            }
        }
        require(found, "Unsupported loyalty program");
        
        _loyaltyPointsReserves[program] += amount;
        emit LoyaltyPointsDeposited(program, amount);
    }

    /**
     * @dev Withdraws loyalty points when tokens are redeemed
     * @param program The loyalty program identifier
     * @param amount The amount of loyalty points to withdraw
     * Requirements:
     * - The caller must have the ADMIN_ROLE
     */
    function withdrawLoyaltyPoints(string memory program, uint256 amount) public onlyRole(ADMIN_ROLE) {
        require(_loyaltyPointsReserves[program] >= amount, "Insufficient loyalty points");
        
        _loyaltyPointsReserves[program] -= amount;
        emit LoyaltyPointsWithdrawn(program, amount);
    }

    /**
     * @dev Returns the balance of loyalty points for a specified program
     * @param program The loyalty program identifier
     * @return The balance of loyalty points
     */
    function loyaltyPointsBalance(string memory program) public view returns (uint256) {
        return _loyaltyPointsReserves[program];
    }

    /**
     * @dev Returns all supported loyalty programs
     * @return List of supported loyalty programs
     */
    function supportedPrograms() public view returns (string[] memory) {
        return _supportedPrograms;
    }

    /**
     * @dev Hook that is called before any token transfer
     */
    function _update(address from, address to, uint256 amount) internal override(ERC20, ERC20Pausable) {
        super._update(from, to, amount);
    }
}