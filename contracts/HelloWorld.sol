// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title HelloWorld
 * @dev A simple contract that stores and retrieves a greeting message
 */
contract HelloWorld {
    string private greeting;
    address public owner;

    event GreetingChanged(string newGreeting, address changedBy);

    constructor() {
        greeting = "Hello World!";
        owner = msg.sender;
    }

    /**
     * @dev Sets a new greeting message
     * @param _greeting The new greeting message
     */
    function setGreeting(string memory _greeting) public {
        greeting = _greeting;
        emit GreetingChanged(_greeting, msg.sender);
    }

    /**
     * @dev Returns the current greeting message
     * @return The current greeting string
     */
    function getGreeting() public view returns (string memory) {
        return greeting;
    }
}
