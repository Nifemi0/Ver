// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @notice Undeployed registry candidate. Revocation invalidates an attester's
/// existing graphs permanently; reauthorization requires fresh attestations.
contract VerRegistryV3 {
    struct Attestation {
        bytes32 graphHash;
        string metadataURI;
        address attester;
        uint256 timestamp;
        bool active;
        uint256 epoch;
    }

    address public owner;
    address public pendingOwner;
    mapping(address => bool) public authorizedAttesters;
    mapping(address => uint256) public attesterEpoch;
    mapping(address => Attestation) private _attestations;
    address[] private _protocols;
    mapping(address => bool) private _seen;

    error NotOwner();
    error NotAuthorized();
    error ZeroAddress();
    error ZeroHash();
    error EmptyURI();
    error NotAttested();
    error LengthMismatch();
    error InvalidOwner();
    event GraphAttested(address indexed protocol, bytes32 indexed graphHash, address indexed attester, string metadataURI, uint256 timestamp);
    event GraphRevoked(address indexed protocol, address indexed revokedBy, uint256 timestamp);
    event AttesterAuthorized(address indexed attester);
    event AttesterRevoked(address indexed attester);
    event OwnershipTransferStarted(address indexed previousOwner, address indexed newOwner);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() { if (msg.sender != owner) revert NotOwner(); _; }
    modifier onlyAuthorized() { if (!authorizedAttesters[msg.sender]) revert NotAuthorized(); _; }

    constructor() {
        owner = msg.sender;
        authorizedAttesters[msg.sender] = true;
        emit OwnershipTransferred(address(0), msg.sender);
        emit AttesterAuthorized(msg.sender);
    }

    function attest(address protocol, bytes32 graphHash, string calldata metadataURI) external onlyAuthorized {
        _attest(protocol, graphHash, metadataURI);
    }

    function attestBatch(address[] calldata protocols, bytes32[] calldata graphHashes, string[] calldata metadataURIs) external onlyAuthorized {
        if (protocols.length != graphHashes.length || protocols.length != metadataURIs.length) revert LengthMismatch();
        for (uint256 i; i < protocols.length; ++i) _attest(protocols[i], graphHashes[i], metadataURIs[i]);
    }

    function _attest(address protocol, bytes32 graphHash, string calldata metadataURI) private {
        if (protocol == address(0)) revert ZeroAddress();
        if (graphHash == bytes32(0)) revert ZeroHash();
        if (bytes(metadataURI).length == 0) revert EmptyURI();
        _attestations[protocol] = Attestation(graphHash, metadataURI, msg.sender, block.timestamp, true, attesterEpoch[msg.sender]);
        if (!_seen[protocol]) { _protocols.push(protocol); _seen[protocol] = true; }
        emit GraphAttested(protocol, graphHash, msg.sender, metadataURI, block.timestamp);
    }

    function revoke(address protocol) external onlyAuthorized {
        if (!_attestations[protocol].active) revert NotAttested();
        _attestations[protocol].active = false;
        emit GraphRevoked(protocol, msg.sender, block.timestamp);
    }

    function authorizeAttester(address attester) external onlyOwner {
        if (attester == address(0)) revert ZeroAddress();
        authorizedAttesters[attester] = true;
        emit AttesterAuthorized(attester);
    }

    function revokeAttester(address attester) external onlyOwner {
        if (attester == address(0)) revert ZeroAddress();
        if (attester == owner) revert InvalidOwner();
        _revokeAttester(attester);
    }

    function _revokeAttester(address attester) private {
        authorizedAttesters[attester] = false;
        ++attesterEpoch[attester];
        emit AttesterRevoked(attester);
    }

    // Starting a transfer grants no authority. The nominee must accept it.
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        if (newOwner == owner) revert InvalidOwner();
        pendingOwner = newOwner;
        emit OwnershipTransferStarted(owner, newOwner);
    }

    function cancelOwnershipTransfer() external onlyOwner {
        pendingOwner = address(0);
        emit OwnershipTransferStarted(owner, address(0));
    }

    function acceptOwnership() external {
        if (msg.sender != pendingOwner) revert NotAuthorized();
        address previousOwner = owner;
        owner = msg.sender;
        pendingOwner = address(0);
        _revokeAttester(previousOwner);
        authorizedAttesters[msg.sender] = true;
        emit AttesterAuthorized(msg.sender);
        emit OwnershipTransferred(previousOwner, msg.sender);
    }

    function _verified(Attestation storage a) private view returns (bool) {
        return a.active && authorizedAttesters[a.attester] && a.epoch == attesterEpoch[a.attester];
    }

    // Read signatures remain compatible with V2 consumers.
    function getAttestation(address protocol) external view returns (bytes32 graphHash, string memory metadataURI, address attester, uint256 timestamp, bool verified) {
        Attestation storage a = _attestations[protocol];
        return (a.graphHash, a.metadataURI, a.attester, a.timestamp, _verified(a));
    }
    function isVerified(address protocol) external view returns (bool) { return _verified(_attestations[protocol]); }
    function verifyHash(address protocol, bytes32 graphHash) external view returns (bool) {
        Attestation storage a = _attestations[protocol];
        return _verified(a) && a.graphHash == graphHash;
    }
    function getAllProtocols() external view returns (address[] memory) { return _protocols; }
    function totalProtocols() external view returns (uint256) { return _protocols.length; }
}
