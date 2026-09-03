import { CompilerInput, GraphExtractor, EventResult, EventItem } from "../interfaces";

export class EventExtractor implements GraphExtractor<EventResult> {
    public name = "EventExtractor";

    public async extract(input: CompilerInput): Promise<EventResult> {
        const events: EventItem[] = [];

        if (input.abi) {
            for (const item of input.abi) {
                if (item && item.type === "event" && item.name) {
                    // Custom errors are revert payloads, not emitted logs.
                    events.push({
                        name: item.name,
                        source: "ABI"
                    });
                }
            }
        }

        return { events };
    }
}
