// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockERC20
 * @notice Mock ERC20 token for testing (USDC/EURC simulation)
 * @dev Includes a faucet function for MVP testing (10,000 tokens per wallet, once only)
 */
contract MockERC20 is ERC20 {
    uint8 private _decimals;

    /// @notice Faucet amount: 10,000 tokens (with 6 decimals = 10_000_000_000)
    uint256 public constant FAUCET_AMOUNT = 10_000 * 1e6;

    /// @notice Track which addresses have used the faucet
    mapping(address => bool) public hasClaimed;

    /// @notice Emitted when someone claims from faucet
    event FaucetClaimed(address indexed user, uint256 amount);

    constructor(string memory name, string memory symbol, uint8 decimals_) ERC20(name, symbol) {
        _decimals = decimals_;
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    /**
     * @notice Claim tokens from the faucet (once per wallet)
     * @dev Mints FAUCET_AMOUNT tokens to the caller
     */
    function faucet() external {
        require(!hasClaimed[msg.sender], "Already claimed from faucet");

        hasClaimed[msg.sender] = true;
        _mint(msg.sender, FAUCET_AMOUNT);

        emit FaucetClaimed(msg.sender, FAUCET_AMOUNT);
    }

    /**
     * @notice Check if an address can still claim from faucet
     * @param account The address to check
     * @return True if the address can claim
     */
    function canClaim(address account) external view returns (bool) {
        return !hasClaimed[account];
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external {
        _burn(from, amount);
    }
}
