Based on the provided Protocol Graph, extract security guardrails.

- "guardrails": Provide an array of security principles enforced by this contract, explicitly citing the privileged functions and roles they derive from.

Your output must be strict JSON matching this structure:
{
  "guardrails": [
    {
      "value": "string",
      "derived_from": ["string", "string"]
    }
  ]
}

The `derived_from` arrays MUST contain EXACT MATCHES from the provided compiler payload.
