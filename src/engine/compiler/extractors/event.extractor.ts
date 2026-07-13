import { CompilerInput, GraphExtractor, EventResult, EventItem } from "../interfaces";

export class EventExtractor implements GraphExtractor<EventResult> {
    public name = "EventExtractor";

    public async extract(input: CompilerInput): Promise<EventResult> {
        const events: EventItem[] = [];

        if (input.abi) {
            for (const item of input.abi) {
                if (item && (item.type === "event" || item.type === "error") && item.name) {
                    // ADR-014: source = "ABI" ← events/errors extracted directly from verified ABI specifications
                    events.push({
                        name: item.type === "error" ? `[Error] ${item.name}` : item.name,
                        source: "ABI"
                    });
                }
            }
        }

        return { events };
    }
}
