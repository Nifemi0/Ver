import { CompilerInput, GraphExtractor, RoleResult, RoleItem } from "../interfaces";
import { abiSignature, canonicalJson } from "../../abi";

export class RoleExtractor implements GraphExtractor<RoleResult> {
    public name = "RoleExtractor";

    public async extract(input: CompilerInput): Promise<RoleResult> {
        const rolesMap = new Map<string, RoleItem>();

        if (input.abi) {
            for (const item of [...input.abi].sort((a, b) => canonicalJson(a).localeCompare(canonicalJson(b)))) {
                if (item && item.type === "function") {
                    if (item.name === "owner" || item.name === "transferOwnership") {
                        // Names indicate a possible role, not proven authorization.
                        rolesMap.set("Owner", { name: "Owner", source: "ABI heuristic", confidence: 0.5, evidence: `${abiSignature(item)}; access control not established` });
                    }
                    if (item.name === "hasRole") {
                        // Do not infer an authorization mechanism from ABI presence.
                        rolesMap.set("AccessControl", { name: "AccessControl", source: "ABI heuristic", confidence: 0.5, evidence: `${abiSignature(item)}; access control not established` });
                    }
                    if (item.name === "MINTER_ROLE") {
                        // A role getter does not prove that minting enforces this role.
                        rolesMap.set("Minter", { name: "Minter", source: "ABI heuristic", confidence: 0.5, evidence: `${abiSignature(item)}; access control not established` });
                    }
                }
            }
        }

        if (input.source) {
            if (input.source.includes("contract Ownable") || input.source.includes("is Ownable")) {
                if (!rolesMap.has("Owner")) {
                    // A source text match is also only a heuristic.
                    rolesMap.set("Owner", { name: "Owner", source: "Source heuristic", confidence: 0.5, evidence: "Ownable text pattern; inheritance and access control not established" });
                }
            }
        }

        return { roles: Array.from(rolesMap.values()).sort((a, b) => a.name.localeCompare(b.name)) };
    }
}
