// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title  VerRegistry
 * @notice On-chain attestation registry for compiled Protocol Graphs.
 *         When Ver compiles a protocol off-chain, the SHA-256 hash
 *         of that graph is anchored here. AI agents verify graph integrity
 *         by calling verifyHash() or getAttestation().
 */
contract VerRegistry {

    event GraphAttested(
        address indexed protocol,
        bytes32 indexed graphHash,
        address indexed attester,
        string  metadataURI,
        uint256 timestamp
    );
    event GraphRevoked(address indexed protocol, address indexed revokedBy, uint256 timestamp);
    event AttesterAuthorized(address indexed attester);
    event AttesterRevoked(address indexed attester);

    struct Attestation {
        bytes32 graphHash;
        string  metadataURI;
        address attester;
        uint256 timestamp;
        bool    active;
    }

    address public owner;
    mapping(address => bool)        public authorizedAttesters;
    mapping(address => Attestation) private _attestations;
    address[]                       private _protocols;
    mapping(address => bool)        private _seen;

    error NotOwner();
    error NotAuthorized();
    error ZeroHash();
    error EmptyURI();
    error NotAttested();

    modifier onlyOwner()      { if (msg.sender != owner) revert NotOwner(); _; }
    modifier onlyAuthorized() {
        if (!authorizedAttesters[msg.sender] && msg.sender != owner) revert NotAuthorized();
        _;
    }

    constructor() {
        owner = msg.sender;
        authorizedAttesters[msg.sender] = true;
    }

    function attest(address protocol, bytes32 graphHash, string calldata metadataURI)
        external onlyAuthorized
    {
        if (graphHash == bytes32(0))          revert ZeroHash();
        if (bytes(metadataURI).length == 0)   revert EmptyURI();
        _attestations[protocol] = Attestation({
            graphHash: graphHash, metadataURI: metadataURI,
            attester: msg.sender, timestamp: block.timestamp, active: true
        });
        if (!_seen[protocol]) { _protocols.push(protocol); _seen[protocol] = true; }
        emit GraphAttested(protocol, graphHash, msg.sender, metadataURI, block.timestamp);
    }

    function attestBatch(
        address[] calldata protocols,
        bytes32[] calldata graphHashes,
        string[]  calldata metadataURIs
    ) external onlyAuthorized {
        require(protocols.length == graphHashes.length && graphHashes.length == metadataURIs.length, "Length mismatch");
        for (uint256 i = 0; i < protocols.length; i++) {
            if (graphHashes[i] == bytes32(0))          revert ZeroHash();
            if (bytes(metadataURIs[i]).length == 0)    revert EmptyURI();
            _attestations[protocols[i]] = Attestation({
                graphHash: graphHashes[i], metadataURI: metadataURIs[i],
                attester: msg.sender, timestamp: block.timestamp, active: true
            });
            if (!_seen[protocols[i]]) { _protocols.push(protocols[i]); _seen[protocols[i]] = true; }
            emit GraphAttested(protocols[i], graphHashes[i], msg.sender, metadataURIs[i], block.timestamp);
        }
    }

    function revoke(address protocol) external onlyAuthorized {
        if (!_attestations[protocol].active) revert NotAttested();
        _attestations[protocol].active = false;
        emit GraphRevoked(protocol, msg.sender, block.timestamp);
    }

    // solhint-disable-next-line ordering
    function authorizeAttester(address attester) external onlyOwner {
        authorizedAttesters[attester] = true;
        emit AttesterAuthorized(attester);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Zero address");
        owner = newOwner;
    }

    function getAttestation(address protocol) external view returns (
        bytes32 graphHash, string memory metadataURI,
        address attester, uint256 timestamp, bool verified
    ) {
        Attestation storage a = _attestations[protocol];
        return (a.graphHash, a.metadataURI, a.attester, a.timestamp, a.active);
    }

    function isVerified(address protocol) external view returns (bool) {
        return _attestations[protocol].active;
    }

    function verifyHash(address protocol, bytes32 graphHash) external view returns (bool) {
        Attestation storage a = _attestations[protocol];
        return a.active && a.graphHash == graphHash;
    }

    // solhint-disable-next-line ordering
    function getAllProtocols() external view returns (address[] memory) { return _protocols; }
    function totalProtocols() external view returns (uint256) { return _protocols.length; }
}
