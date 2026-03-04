// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SignatureAnchor {

    mapping(bytes32 => bool) public anchored;

    event Anchored(bytes32 root);

    function anchor(bytes32 root) public {
        require(!anchored[root], "Already anchored");

        anchored[root] = true;

        emit Anchored(root);
    }

    function verify(bytes32 root) public view returns(bool) {
        return anchored[root];
    }
}