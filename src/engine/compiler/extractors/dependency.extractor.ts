import { CompilerInput, GraphExtractor, DependencyResult, DependencyItem } from "../interfaces";

export class DependencyExtractor implements GraphExtractor<DependencyResult> {
    public name = "DependencyExtractor";

    public async extract(input: CompilerInput): Promise<DependencyResult> {
        if (input.depth >= input.maxDepth || input.visited.has(input.address)) {
            return { dependencies: [] };
        }
        input.visited.add(input.address);

        const depsMap = new Map<string, DependencyItem>();

        if (input.abi) {
            for (const item of input.abi) {
                if (item && item.inputs) {
                    for (const inputParam of item.inputs) {
                        if (inputParam.internalType && inputParam.internalType.startsWith("contract I")) {
                            // ADR-014: detected_from = "constructor" or "function" ← inferred from parameters pointing to custom contracts starting with I (e.g. contract IPriceOracle)
                            const target = inputParam.internalType.replace("contract ", "").replace("[]", "");
                            depsMap.set(target, {
                                target,
                                detected_from: item.type === "constructor" ? "constructor" : `function ${item.name}`,
                                evidence: `${item.type === "constructor" ? "constructor" : item.name}(${inputParam.internalType} ${inputParam.name})`
                            });
                        }
                    }
                }
            }
        }

        if (input.source) {
            if (input.source.includes("@openzeppelin/contracts/token/ERC20")) {
                // ADR-014: detected_from = "source imports" ← dependency inferred from openzeppelin token import path
                if (!depsMap.has("IERC20")) depsMap.set("IERC20", { target: "IERC20", detected_from: "source imports", evidence: "import @openzeppelin...ERC20" });
            }
            if (input.source.includes("@openzeppelin/contracts/token/ERC721")) {
                // ADR-014: detected_from = "source imports" ← dependency inferred from openzeppelin token import path
                if (!depsMap.has("IERC721")) depsMap.set("IERC721", { target: "IERC721", detected_from: "source imports", evidence: "import @openzeppelin...ERC721" });
            }
        }

        return { dependencies: Array.from(depsMap.values()) };
    }
}
