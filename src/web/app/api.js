export class InsteonApiClient {
    constructor(baseUrl) {
        Object.defineProperty(this, "baseUrl", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: baseUrl
        });
    }
    async execute(audio) {
        const form = new FormData();
        form.append('audio', audio, 'recording.webm');
        const response = await fetch(`${this.baseUrl}/execute`, {
            method: 'POST',
            body: form,
        });
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        return response.json();
    }
}
