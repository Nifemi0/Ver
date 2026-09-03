import { CompilerInput, GraphExtractor, FunctionResult, FunctionItem } from "../interfaces";
import { abiSignature } from "../../abi";

export class FunctionExtractor implements GraphExtractor<FunctionResult> {
    public name = "FunctionExtractor";

    public async extract(input: CompilerInput): Promise<FunctionResult> {
        const privileged: FunctionItem[] = [];
        const publicFuncs: FunctionItem[] = [];

        if (input.abi) {
            for (const item of input.abi) {
                if (item && item.type === "function") {
                    const isViewOrPure = item.stateMutability === "view" || item.stateMutability === "pure";
                    
                    const isPrivileged = !isViewOrPure && typeof item.name === "string" && (
                        item.name.startsWith("set") ||
                        item.name.startsWith("update") ||
                        item.name === "pause" ||
                        item.name === "unpause" ||
                        item.name === "mint" ||
                        item.name === "burn" ||
                        item.name === "transferOwnership" ||
                        item.name === "upgradeTo"
                    );

                    const visibility = (item.stateMutability === "private" || item.stateMutability === "internal") 
                        ? item.stateMutability : "external";

                    if (isPrivileged) {
                        // A name heuristic is a review hint, not proof of access control.
                        privileged.push({
                            name: item.name || "",
                            signature: abiSignature(item),
                            classification: "potentially privileged",
                            reason: "Name-based heuristic only; access control is not established",
                            visibility
                        });
                    } else if (visibility !== "private" && visibility !== "internal") {
                        // External visibility does not mean unrestricted authorization.
                        publicFuncs.push({
                            name: item.name || "",
                            signature: abiSignature(item),
                            classification: isViewOrPure ? "read-only" : "unknown",
                            reason: isViewOrPure ? "ABI declares no state mutation" : "ABI visibility does not establish access control",
                            visibility
                        });
                    }
                }
            }
        }

        return { 
            privileged_functions: privileged, 
            public_functions: publicFuncs 
        };
    }
}
