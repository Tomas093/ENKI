// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title ENKI Global Profiles
/// @author ENKI Team
/// @notice Contract for managing global user identity/nicknames on-chain.
/// @dev Decoupled from games and factories to minimize deployment & invocation gas costs.
contract ENKIProfiles {

    // --- State Variables ---

    /// @notice Maps a user's wallet address to their registered nickname.
    mapping(address => string) public nicknames;

    // --- Events ---

    /// @notice Emitted when a user registers or updates their nickname.
    /// @param user The address of the user who updated their nickname.
    /// @param newNickname The new nickname registered for the user.
    event NicknameUpdated(address indexed user, string newNickname);

    // --- Custom Errors ---

    /// @notice Reverted when the nickname is empty (0 characters).
    error NicknameCannotBeEmpty();

    /// @notice Reverted when the nickname exceeds the maximum length of 30 bytes.
    /// @param length The length of the invalid nickname in bytes.
    error NicknameTooLong(uint256 length);

    // --- External Functions ---

    /// @notice Registers or updates the caller's global nickname.
    /// @param _nickname The new nickname to associate with the caller's wallet.
    function setNickname(string calldata _nickname) external {
        bytes memory nicknameBytes = bytes(_nickname);
        uint256 len = nicknameBytes.length;

        if (len == 0) {
            revert NicknameCannotBeEmpty();
        }
        if (len > 30) {
            revert NicknameTooLong(len);
        }

        nicknames[msg.sender] = _nickname;

        emit NicknameUpdated(msg.sender, _nickname);
    }
}
