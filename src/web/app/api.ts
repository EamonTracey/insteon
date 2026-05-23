export class InsteonApiClient {
    constructor() {}

    async execute(audio: Blob): Promise<ExecuteResponse> {
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

export interface ExecuteResponse {
    prompt: string;
    tool_calls: ToolCall[];
}

export interface ToolCall {
    function: {
        name: string,
        arguments: Record<string, unknown>
    }
}
