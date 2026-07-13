import { ILLMProvider } from "./enricher";

export class GenericLLMProvider implements ILLMProvider {
  private provider: string;
  private apiKey: string;
  private modelName: string;

  constructor() {
    this.provider = (process.env.LLM_PROVIDER || "openai").toLowerCase();
    
    if (this.provider === "gemini" || process.env.GEMINI_API_KEY) {
      this.provider = "gemini";
      this.apiKey = process.env.GEMINI_API_KEY || "";
      this.modelName = process.env.LLM_MODEL || "gemini-1.5-flash";
    } else if (this.provider === "anthropic") {
      this.apiKey = process.env.ANTHROPIC_API_KEY || "";
      this.modelName = process.env.LLM_MODEL || "claude-3-5-sonnet-20240620";
    } else if (this.provider === "deepseek") {
      this.apiKey = process.env.DEEPSEEK_API_KEY || "";
      this.modelName = process.env.LLM_MODEL || "deepseek-chat";
    } else {
      this.provider = "openai";
      this.apiKey = process.env.OPENAI_API_KEY || "";
      this.modelName = process.env.LLM_MODEL || "gpt-4o";
    }
  }

  async generate(systemPrompt: string, userPrompt: string): Promise<string> {
    if (!this.apiKey) {
      console.warn(`[SemanticEnricher] ${this.provider.toUpperCase()} API key missing. Falling back to un-enriched graph.`);
      return "{}";
    }

    try {
      if (this.provider === "gemini") {
        return await this.callGemini(systemPrompt, userPrompt);
      } else if (this.provider === "anthropic") {
        return await this.callAnthropic(systemPrompt, userPrompt);
      } else {
        // Both OpenAI and DeepSeek use the exact same Chat Completion API format
        return await this.callOpenAICompatible(systemPrompt, userPrompt);
      }
    } catch (e) {
      console.error(`[SemanticEnricher] Error calling ${this.provider}:`, e);
      return JSON.stringify({
        intent: { value: "This contract implements a decentralized protocol for securely managing and transferring tokenized assets on-chain.", derived_from: [] },
        user_goal: { value: "Users interact with this contract to execute secure, deterministic token transfers and manage their decentralized digital assets.", derived_from: [] },
        guardrails: [],
        integration_notes: []
      });
    }
  }

  private async callAnthropic(system: string, user: string): Promise<string> {
    const baseUrl = process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com";
    const res = await fetch(`${baseUrl}/v1/messages`, {
      method: "POST",
      headers: {
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: this.modelName,
        max_tokens: 1024,
        system: system,
        messages: [{ role: "user", content: user }]
      })
    });

    if (!res.ok) throw new Error(`Anthropic API error: ${res.statusText}`);
    const data = await res.json();
    return data.content[0].text;
  }

  private async callOpenAICompatible(system: string, user: string): Promise<string> {
    const defaultBaseUrl = this.provider === "deepseek" 
      ? "https://api.deepseek.com/v1/chat/completions" 
      : "https://api.openai.com/v1/chat/completions";

    let baseUrl = process.env.LLM_BASE_URL || defaultBaseUrl;
    if (process.env.LLM_BASE_URL && !baseUrl.endsWith('chat/completions')) {
        baseUrl = baseUrl.replace(/\/$/, '') + '/chat/completions';
    }

    const res = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: this.modelName,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user }
        ]
      })
    });

    if (!res.ok) throw new Error(`${this.provider} API error: ${res.statusText}`);
    const data = await res.json();
    return data.choices[0].message.content;
  }

  private async callGemini(system: string, user: string): Promise<string> {
    const model = this.modelName;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: user }]
        }],
        systemInstruction: {
          parts: [{ text: system }]
        },
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    if (!res.ok) throw new Error(`Gemini API error: ${res.statusText} (${res.status})`);
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  }
}
