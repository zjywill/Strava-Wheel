// Minimal OpenAI SDK typing to satisfy type-check/lint when the package isn't installed yet.
// Remove this once the real `openai` dependency is installed.
declare module 'openai' {
  export type ChatMessage = {
    role: 'system' | 'user' | 'assistant';
    content: string;
  };

  export default class OpenAI {
    constructor(config: { apiKey: string; baseURL?: string; dangerouslyAllowBrowser?: boolean });
    chat: {
      completions: {
        create(params: {
          model: string;
          temperature?: number;
          messages: ChatMessage[];
        }): Promise<any>;
      };
    };
  }
}
