import { VerSchema } from "../../types/schema";

export class MermaidExporter {
  public static generate(graph: VerSchema): string {
    const lines = ["graph TD"];
    const contractName = graph.metadata.protocol_name || "Contract";
    
    // Dependencies
    if (graph.structural.dependencies.length > 0) {
      graph.structural.dependencies.forEach((d) => {
          lines.push(`    ${contractName} --> ${d.target}`);
      });
    }

    // Roles
    if (graph.structural.roles.length > 0) {
      graph.structural.roles.forEach((r) => {
          lines.push(`    ${r.name} --> ${contractName}`);
      });
    }

    // Events
    if (graph.structural.events.length > 0) {
      graph.structural.events.forEach((e) => {
          lines.push(`    ${contractName} -.->|Emits| ${e.name}Event`);
      });
    }

    return lines.join("\n");
  }
}
