Based on the provided Protocol Graph, extract the semantic "intent" and "user_goal".

- "intent": What does this contract actually do technically?
- "user_goal": Why would a human user interact with it?

Your output must be strict JSON matching this structure:
{
  "intent": {
    "value": "string",
    "derived_from": ["string", "string"]
  },
  "user_goal": {
    "value": "string",
    "derived_from": ["string", "string"]
  }
}

The `derived_from` arrays MUST contain EXACT MATCHES from the provided compiler payload (e.g. "deposit()", "Withdraw event", "Owner"). If a derived fact is not present in the payload, you will be rejected.
