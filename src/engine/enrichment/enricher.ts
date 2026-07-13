import { VerSchema, DerivedStringSchema, DerivedArraySchema } from "../../types/schema";
import { z } from "zod";
import fs from "fs";
import path from "path";

export interface ILLMProvider {
  generate(systemPrompt: string, userPrompt: string): Promise<string>;
}

export interface EnrichmentDiagnostics {
  status: "PENDING" | "RUNNING" | "COMPLETE" | "FAILED" | "SKIPPED";
  enrichment_time_ms: number;
  report: string;
}

export class SemanticEnricher {
  private llm: ILLMProvider;
  public readonly promptVersion = "1.0.0";
  public readonly model = "gemini-2.5-pro";

  constructor(llmProvider: ILLMProvider) {
    this.llm = llmProvider;
  }

  public async enrich(graph: VerSchema): Promise<{ graph: VerSchema, diagnostics: EnrichmentDiagnostics }> {
    const start = performance.now();
    let status: EnrichmentDiagnostics["status"] = "SKIPPED";

    try {
      // V2 Architecture: LLM generation is completely offloaded to the MCP Client.
      // Ver acts purely as a deterministic compiler and serves the hard facts.
      // The AI agent (Cursor, Claude, etc.) reads these facts and generates semantics locally.

      graph.semantic.intent = { 
        value: "Semantic enrichment delegated to client AI.", 
        derived_from: [] 
      };
      graph.semantic.user_goal = { 
        value: "Semantic enrichment delegated to client AI.", 
        derived_from: [] 
      };
      graph.security.guardrails = [{
        value: "Security analysis delegated to client AI.",
        derived_from: []
      }];
      graph.developer.integration_notes = [{
        value: "Developer integration notes delegated to client AI.",
        derived_from: []
      }];

      status = "SKIPPED"; // Using SKIPPED to explicitly show internal LLM was bypassed
    } catch (e) {
      status = "FAILED";
      console.error(e);
    }

    const timeMs = Math.round(performance.now() - start);
    
    graph.semantic.semantic_status = status;
    if ((status as string) === "COMPLETE") {
        graph.semantic.prompt_version = this.promptVersion;
        graph.semantic.model = this.model;
        graph.semantic.generated_at = new Date().toISOString();
        graph.semantic.enrichment_time_ms = timeMs;
    }

    const report = this.generateReport(graph);

    return {
      graph,
      diagnostics: {
        status,
        enrichment_time_ms: timeMs,
        report
      }
    };
  }

  private loadPrompt(filename: string): string {
    return fs.readFileSync(path.join(process.cwd(), "src/prompts", filename), "utf-8");
  }

  private validateAndParse<T>(jsonStr: string, schema: z.ZodSchema<T>): T {
    const cleaned = jsonStr.replace(/```json/g, "").replace(/```/g, "").trim();
    try {
      return schema.parse(JSON.parse(cleaned));
    } catch (e: any) {
      console.error(`Failed to parse JSON: ${e.message}\nRaw output: ${cleaned}`);
      throw e;
    }
  }



  private generateReport(graph: VerSchema): string {
    const intentBlock = graph.semantic.intent ? 
      `Intent\n\nGenerated from\n${graph.semantic.intent.derived_from.map(d => `• ${d}`).join("\n")}` : '';
      
    const securityBlock = graph.security.guardrails && graph.security.guardrails.length > 0 ? 
      `Security\n\nGenerated from\n${graph.security.guardrails.map(g => g.derived_from.map(d => `• ${d}`).join("\n")).join("\n")}` : '';

    const devBlock = graph.developer.integration_notes && graph.developer.integration_notes.length > 0 ? 
      `Developer Notes\n\nGenerated from\n${graph.developer.integration_notes.map(g => g.derived_from.map(d => `• ${d}`).join("\n")).join("\n")}` : '';

    return [
      `Explainability Report`,
      ``,
      intentBlock,
      ``,
      securityBlock,
      ``,
      devBlock,
      ``,
      `Structural Integrity`,
      `${graph.semantic.structural_integrity_score}`,
      ``,
      `Semantic Status`,
      `${graph.semantic.semantic_status}`
    ].filter(Boolean).join("\n");
  }
}
