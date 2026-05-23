export class InsteonApiClient {
    constructor() {}

    async execute(audio: Blob): Promise<ExecuteResult> {
        const form = new FormData();
        form.append('audio', audio, 'audio.webm');

        const response = await fetch('execute', {
            method: 'POST',
            body: form,
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        return response.json();
    }
}

export interface ToolCall {
    name: string;
    arguments: Record<string, unknown>;
}

export interface ExecuteResult {
    transcript: string;
    tool_calls: ToolCall[];
}
