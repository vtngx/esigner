// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract DocumentAnchor {
    mapping(bytes32 => uint256) public anchoredAt;

    event DocumentAnchored(bytes32 indexed documentHash, uint256 timestamp);

    function anchor(bytes32 documentHash) external {
        require(anchoredAt[documentHash] == 0, "Already anchored");

        anchoredAt[documentHash] = block.timestamp;

        emit DocumentAnchored(documentHash, block.timestamp);
    }

    function isAnchored(bytes32 documentHash) external view returns (bool) {
        return anchoredAt[documentHash] != 0;
    }
}