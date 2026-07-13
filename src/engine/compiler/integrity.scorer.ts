import { IntegrityEvidence, CompilerInput } from "./interfaces";

export class IntegrityScorer {
    public score(evidence: IntegrityEvidence): number {
        let score = 0;
        
        // ADR-014: +50 points ← verified source code available (highest confidence source)
        if (evidence.verifiedSource) score += 50;
        // ADR-014: +30 points ← verified ABI available (fallback when no source code)
        else if (evidence.verifiedABI) score += 30;

        // ADR-014: +15 points ← standard openzeppelin imports found, showing standard/secure base libraries
        if (evidence.openzeppelin) score += 15;
        // ADR-014: +20 points ← proxy address resolved successfully, verifying implementation legitimacy
        if (evidence.proxyResolved) score += 20;
        // ADR-014: +5 points ← dependency links found, enriching graph coverage
        if (evidence.dependencyCoverage > 0) score += 5;
        // ADR-014: +10 points ← events/errors successfully extracted
        if (evidence.eventCoverage > 0) score += 10;

        return Math.min(100, score);
    }
}

export class IntegrityBuilder {
    public build(input: CompilerInput, extractedDeps: number, extractedEvents: number): IntegrityEvidence {
        return {
            verifiedABI: !!(input.abi && input.abi.length > 0),
            verifiedSource: !!input.source,
            openzeppelin: !!(input.source && input.source.includes("@openzeppelin")),
            proxyResolved: input.isProxy && !!input.implementation,
            dependencyCoverage: extractedDeps > 0 ? 1.0 : 0.0,
            eventCoverage: extractedEvents > 0 ? 1.0 : 0.0,
        };
    }
}
