// components/VoiceRecorder.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Trash2, Send, RotateCw } from 'lucide-react';
import { toast } from 'sonner';

interface VoiceRecorderProps {
    onRecordingComplete: (blob: Blob) => void;
    onCancel: () => void;
}

export default function VoiceRecorder({ onRecordingComplete, onCancel }: VoiceRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<BlobPart[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);


    const getSupportedMimeType = () => {
        const types = [
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/mp4',
            'audio/ogg;codecs=opus',
            'audio/wav'
        ];
        for (const type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }
        return '';
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            const mimeType = getSupportedMimeType();
            if (!mimeType) {
                toast.error("Votre navigateur ne supporte pas l'enregistrement audio vocal.");
                return;
            }

            const mediaRecorder = new MediaRecorder(stream, { mimeType });

            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: mimeType });
                setAudioBlob(blob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);

            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (err: any) {
            console.error('Error accessing microphone:', err);
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                toast.error("Accès au microphone refusé. Veuillez vérifier vos permissions.");
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                toast.error("Aucun microphone détecté.");
            } else {
                toast.error("Erreur lors de l'accès au microphone : " + (err.message || "Inconnue"));
            }
            onCancel();
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        startRecording();
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
        };
    }, []);

    if (audioBlob) {
        return (
            <div className="flex items-center gap-2 w-full animate-in fade-in slide-in-from-bottom-2">
                <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full px-4 py-2 flex items-center gap-3">
                    <audio controls src={URL.createObjectURL(audioBlob)} className="h-8 w-full accent-indigo-600" />
                </div>
                <button
                    onClick={onCancel}
                    className="p-2.5 text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                >
                    <Trash2 className="w-5 h-5" />
                </button>
                <button
                    onClick={() => onRecordingComplete(audioBlob)}
                    className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-500/20 transition-all"
                >
                    <Send className="w-5 h-5" />
                </button>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-3 w-full animate-in fade-in slide-in-from-bottom-2">
            <div className="flex-1 flex items-center gap-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-2.5 rounded-full ring-1 ring-red-100 dark:ring-red-900/30">
                <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                <span className="font-mono font-medium">{formatTime(recordingTime)}</span>
                <div className="flex-1 h-8 flex items-center justify-center gap-0.5 opacity-50">
                    {/* Visualizer bars simulation */}
                    {[...Array(12)].map((_, i) => (
                        <div
                            key={i}
                            className="w-1 bg-red-500 rounded-full animate-music-bar"
                            style={{
                                height: Math.max(20, Math.random() * 100) + '%',
                                animationDelay: `${i * 0.1}s`
                            }}
                        />
                    ))}
                </div>
            </div>

            <button
                onClick={onCancel}
                className="p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
            >
                <Trash2 className="w-5 h-5" />
            </button>

            <button
                onClick={stopRecording}
                className="p-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl shadow-lg shadow-red-500/20 transition-all"
            >
                <Square className="w-5 h-5 fill-current" />
            </button>
        </div>
    );
}
