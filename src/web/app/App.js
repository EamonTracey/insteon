import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Callout, Card, Classes, Elevation, H2, Intent, Tag, OverlayToaster, } from '@blueprintjs/core';
import { Microphone } from '@blueprintjs/icons';
import { InsteonApiClient } from './api';
import styles from './App.module.css';
const client = new InsteonApiClient(import.meta.env.VITE_API_URL);
export default function App() {
    const [permissionGranted, setPermissionGranted] = useState(false);
    const [status, setStatus] = useState('requesting-permission');
    const [result, setResult] = useState(null);
    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);
    useEffect(() => {
        void requestMicrophonePermission();
    }, []);
    const requestMicrophonePermission = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
            });
            stream.getTracks().forEach((track) => track.stop());
            setPermissionGranted(true);
            setStatus('ready');
        }
        catch {
            setPermissionGranted(false);
            setStatus('error');
        }
    }, []);
    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
            });
            const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : undefined;
            const recorder = mimeType
                ? new MediaRecorder(stream, {
                    mimeType,
                })
                : new MediaRecorder(stream);
            chunksRef.current = [];
            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };
            recorder.start();
            mediaRecorderRef.current = recorder;
            setResult(null);
            setStatus('recording');
        }
        catch {
            setStatus('error');
        }
    }, []);
    const stopRecording = useCallback(async () => {
        const recorder = mediaRecorderRef.current;
        if (!recorder) {
            throw new Error('No active recorder');
        }
        return new Promise((resolve, reject) => {
            recorder.onstop = () => {
                try {
                    const audioBlob = new Blob(chunksRef.current, {
                        type: recorder.mimeType || 'audio/webm',
                    });
                    resolve(audioBlob);
                }
                catch (error) {
                    reject(error);
                }
                finally {
                    recorder.stream.getTracks().forEach((track) => track.stop());
                    mediaRecorderRef.current = null;
                }
            };
            recorder.stop();
        });
    }, []);
    const executeRecording = useCallback(async () => {
        try {
            setStatus('processing');
            const audioBlob = await stopRecording();
            const executeResult = await client.execute(audioBlob);
            setResult(executeResult);
            setStatus('ready');
        }
        catch (Error) {
            setStatus('error');
            OverlayToaster.create().show({
                intent: Intent.DANGER,
                message: 'Agent execution failed',
            });
        }
    }, [stopRecording]);
    const handleMicrophoneClick = useCallback(async () => {
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
    return (_jsx("div", { className: `${Classes.DARK} ${styles.container}`, children: _jsxs(Card, { elevation: Elevation.THREE, className: styles.card, children: [_jsx(H2, { className: styles.title, children: "Falmouth Agent" }), _jsx(Button, { size: "large", loading: isBusy, disabled: !permissionGranted || isBusy, intent: microphoneIntent, icon: _jsx(Microphone, { size: 32 }), onClick: () => {
                        void handleMicrophoneClick();
                    }, className: styles.micButton }), _jsx(Tag, { minimal: true, size: "large", intent: statusConfig.intent, children: statusConfig.text }), result && (_jsxs(Callout, { className: styles.result, intent: result.tool_calls.length > 0 ? Intent.PRIMARY : Intent.WARNING, children: [_jsxs("div", { className: styles.transcript, children: [_jsx("strong", { children: "Transcript:" }), ' ', result.transcript.trim() || 'No speech detected'] }), result.tool_calls.length > 0 ? (_jsxs("div", { className: styles.history, children: [_jsx("strong", { children: "Actions:" }), result.tool_calls.map((toolCall, index) => (_jsxs(Tag, { fill: true, minimal: true, intent: Intent.SUCCESS, className: styles.historyItem, children: [toolCall.name, "(", JSON.stringify(toolCall.arguments), ")"] }, `${toolCall.name}-${index}`)))] })) : (_jsx("div", { className: styles.warning, children: "No devices matched your request." }))] }))] }) }));
}
