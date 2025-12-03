import React from 'react';
import { Video, Copy, ExternalLink, X } from 'lucide-react';
import { toast } from 'sonner';

interface VideoConfModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function VideoConfModal({ isOpen, onClose }: VideoConfModalProps) {
    if (!isOpen) return null;

    const generateJitsiLink = () => {
        const roomName = `NetStrategy-${Math.random().toString(36).substring(7)}`;
        return `https://meet.jit.si/${roomName}`;
    };

    const [link, setLink] = React.useState(generateJitsiLink());

    const copyToClipboard = () => {
        navigator.clipboard.writeText(link);
        toast.success('Lien copié dans le presse-papier !');
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
                    <h3 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                        <Video className="w-6 h-6 text-indigo-600" />
                        Visioconférence
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Lien de la réunion</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                readOnly
                                value={link}
                                className="flex-1 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-gray-600 dark:text-gray-300"
                            />
                            <button
                                onClick={copyToClipboard}
                                className="p-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg text-gray-600 dark:text-gray-300 transition-colors"
                                title="Copier"
                            >
                                <Copy className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
                        >
                            <ExternalLink className="w-4 h-4" />
                            Rejoindre
                        </a>
                        <button
                            onClick={() => setLink(generateJitsiLink())}
                            className="px-4 py-3 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors font-medium"
                        >
                            Générer un autre lien
                        </button>
                    </div>

                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-sm text-blue-700 dark:text-blue-300">
                        <p className="font-semibold mb-1">💡 Astuce</p>
                        Ce lien est temporaire et gratuit via Jitsi Meet. Aucune installation requise pour vos clients.
                    </div>
                </div>
            </div>
        </div>
    );
}
