Based on the provided Protocol Graph, extract developer integration notes.

- "integration_notes": Key things a frontend developer or backend indexer needs to know to integrate with this protocol.

Your output must be strict JSON matching this structure:
{
  "integration_notes": [
    {
      "value": "string",
      "derived_from": ["string", "string"]
    }
  ]
}

The `derived_from` arrays MUST contain EXACT MATCHES from the provided compiler payload.
