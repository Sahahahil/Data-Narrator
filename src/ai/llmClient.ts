export interface LLMConfig {
  apiKey: string;
  endpoint: string;
  model?: string;
  timeout?: number;
  retryCount?: number;
}

export interface LLMResponse {
  sql: string;
  widgetType: 'bar' | 'line' | 'scatter' | 'kpi';
  chartConfig: {
    xAxisKey: string;
    yAxisKeys: string[];
    groupKey?: string;
    title: string;
    description: string;
  };
}

export class LLMClient {
  private apiKey: string;
  private endpoint: string;
  private model: string;
  private timeout: number;
  private retryCount: number;

  constructor(config: LLMConfig) {
    this.apiKey = config.apiKey;
    this.endpoint = config.endpoint;
    this.model = config.model || 'gpt-4';
    this.timeout = config.timeout || 30000;
    this.retryCount = config.retryCount || 3;
  }

  async generateSQLAndConfig(prompt: string): Promise<LLMResponse> {
    let lastError: Error;

    for (let attempt = 0; attempt <= this.retryCount; attempt++) {
      try {
        return await this.callLLM(prompt);
      } catch (error) {
        lastError = error as Error;
        if (attempt < this.retryCount) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
          await new Promise(r => setTimeout(r, delay));
        }
      }
    }
    throw lastError!;
  }

  private async callLLM(prompt: string): Promise<LLMResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: 'You are a Data Engineer & UI Architect.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.1,
          response_format: { type: 'json_object' },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`LLM API error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error('Empty response from LLM');

      return JSON.parse(content) as LLMResponse;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof DOMException && error.name === 'AbortError') {
        const timeoutError = new Error('Timeout');
        (timeoutError as Error & { cause?: unknown }).cause = error;
        throw timeoutError;
      }
      throw error;
    }
  }
}