import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Button,
    Callout,
    Card,
    Classes,
    Elevation,
    H2,
    Intent,
    Tag,
    OverlayToaster,
} from '@blueprintjs/core';
import { Microphone } from '@blueprintjs/icons';

import { InsteonApiClient, ExecuteResult } from './api';
import styles from './App.module.css';

const client = new InsteonApiClient();

type Status = 'requesting-permission' | 'ready' | 'recording' | 'processing' | 'error';

export default function App() {
    const [permissionGranted, setPermissionGranted] = useState(false);
    const [status, setStatus] = useState<Status>('requesting-permission');
    const [result, setResult] = useState<ExecuteResult | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);

    const chunksRef = useRef<BlobPart[]>([]);

    useEffect(() => {
        void requestMicrophonePermission();
    }, []);

    const requestMicrophonePermission = useCallback(async (): Promise<void> => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
            });

            stream.getTracks().forEach((track) => track.stop());

            setPermissionGranted(true);
            setStatus('ready');
        } catch {
            setPermissionGranted(false);
            setStatus('error');
        }
    }, []);

    const startRecording = useCallback(async (): Promise<void> => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
            });

            const mimeType = 'audio/webm'
            const recorder = new MediaRecorder(stream, { mimeType })
            chunksRef.current = [];
            recorder.ondataavailable = (event: BlobEvent) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };
            recorder.start();
            mediaRecorderRef.current = recorder;

            setResult(null);
            setStatus('recording');
        } catch {
            setStatus('error');
        }
    }, []);

    const stopRecording = useCallback(async (): Promise<Blob> => {
        const recorder = mediaRecorderRef.current;

        if (!recorder) {
            throw new Error('No active recorder');
        }

        return new Promise((resolve, reject) => {
            recorder.onstop = () => {
                try {
                    const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
                    resolve(audioBlob);
                } catch (error) {
                    reject(error);
                } finally {
                    recorder.stream.getTracks().forEach((track) => track.stop());
                    mediaRecorderRef.current = null;
                }
            };

            recorder.stop();
        });
    }, []);

    const executeRecording = useCallback(async (): Promise<void> => {
        try {
            setStatus('processing');

            const audioBlob = await stopRecording();
            const executeResult = await client.execute(audioBlob);

            setResult(executeResult);
            setStatus('ready');
        } catch (Error) {
            setStatus('error');
            OverlayToaster.create().show({
                intent: Intent.DANGER,
                message: 'Agent execution failed',
            });
        }
    }, [stopRecording]);

    const handleMicrophoneClick = useCallback(async (): Promise<void> => {
        if (!permissionGranted) {
            return;
        }

        if (status === 'processing') {
            return;
        }

        if (status === 'recording') {
            await executeRecording();
            return;
        }

        await startRecording();
    }, [executeRecording, permissionGranted, startRecording, status]);

    const statusConfig = useMemo(() => {
        switch (status) {
            case 'requesting-permission':
                return {
                    text: 'Requesting microphone access...',
                    intent: Intent.WARNING,
                };
            case 'ready':
                return {
                    text: 'Ready',
                    intent: Intent.SUCCESS,
                };
            case 'recording':
                return {
                    text: 'Recording...',
                    intent: Intent.DANGER,
                };
            case 'processing':
                return {
                    text: 'Processing...',
                    intent: Intent.PRIMARY,
                };
            case 'error':
                return {
                    text: 'Error',
                    intent: Intent.DANGER,
                };
        }
    }, [status]);

    const microphoneIntent = status === 'recording' ? Intent.DANGER : Intent.PRIMARY;

    const isBusy = status === 'processing';

    return (
        <div className={`${Classes.DARK} ${styles.container}`}>
            <Card elevation={Elevation.THREE} className={styles.card}>
                <H2 className={styles.title}>Falmouth Agent</H2>

                <Button
                    size="large"
                    loading={isBusy}
                    disabled={!permissionGranted || isBusy}
                    intent={microphoneIntent}
                    icon={<Microphone size={32} />}
                    onClick={() => {
                        void handleMicrophoneClick();
                    }}
                    className={styles.micButton}
                />

                <Tag minimal size="large" intent={statusConfig.intent}>
                    {statusConfig.text}
                </Tag>

                {result && (
                    <Callout
                        className={styles.result}
                        intent={result.tool_calls.length > 0 ? Intent.PRIMARY : Intent.WARNING}
                    >
                        <div className={styles.transcript}>
                            <strong>Transcript:</strong>{' '}
                            {result.transcript.trim() || 'No speech detected'}
                        </div>

                        {result.tool_calls.length > 0 ? (
                            <div className={styles.history}>
                                <strong>Actions:</strong>
                                {result.tool_calls.map((toolCall, index) => (
                                    <Tag
                                        key={`${toolCall.name}-${index}`}
                                        fill
                                        minimal
                                        intent={Intent.SUCCESS}
                                        className={styles.historyItem}
                                    >
                                        {toolCall.name}({JSON.stringify(toolCall.arguments)})
                                    </Tag>
                                ))}
                            </div>
                        ) : (
                            <div className={styles.warning}>No devices matched your request.</div>
                        )}
                    </Callout>
                )}
            </Card>
        </div>
    );
}
