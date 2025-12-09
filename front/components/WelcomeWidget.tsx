import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Sun, Moon, CloudSun, Sparkles } from 'lucide-react';
import MoodSelector from '@/components/MoodSelector';

export default function WelcomeWidget({ userName }: { userName?: string }) {
    const [greeting, setGreeting] = useState('');
    const [icon, setIcon] = useState<React.ReactNode>(null);

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) {
            setGreeting('Bonjour');
            setIcon(<Sun className="w-6 h-6 text-amber-500" />);
        } else if (hour >= 12 && hour < 18) {
            setGreeting('Bon après-midi');
            setIcon(<CloudSun className="w-6 h-6 text-orange-500" />);
        } else {
            setGreeting('Bonsoir');
            setIcon(<Moon className="w-6 h-6 text-indigo-400" />);
        }
    }, []);

    const [tip, setTip] = useState('');

    useEffect(() => {
        const tips = [
            "💡 Astuce : Utilisez Cmd+K pour naviguer rapidement.",
            "🚀 Focus : Terminez vos tâches prioritaires avant midi.",
            "📅 Planning : Avez-vous mis à jour vos statuts de projet ?",
            "✨ Bien-être : Prenez une pause de 5 minutes toutes les heures."
        ];
        setTip(tips[Math.floor(Math.random() * tips.length)]);
    }, []);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
            <div className="lg:col-span-3 relative overflow-hidden bg-gradient-to-br from-indigo-600 to-violet-700 dark:from-indigo-900 dark:to-slate-900 rounded-3xl p-8 text-white shadow-xl shadow-indigo-500/20 group">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
                <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl animate-pulse"></div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2 text-indigo-100 font-medium bg-white/10 w-fit px-3 py-1 rounded-full backdrop-blur-md">
                            <span className="animate-bounce-slow">{icon}</span>
                            <span>{format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}</span>
                        </div>
                        <h2 className="text-4xl font-heading font-bold tracking-tight mb-2">
                            {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-indigo-200">{userName || 'Admin'}</span> !
                        </h2>
                        <p className="text-indigo-100/90 max-w-lg text-lg leading-relaxed">
                            Prêt à développer votre activité aujourd'hui ?
                        </p>

                        <div className="mt-6 flex items-center gap-2 text-sm text-indigo-200 bg-black/20 px-4 py-2 rounded-xl w-fit">
                            <Sparkles className="w-4 h-4 text-yellow-300" />
                            {tip}
                        </div>
                    </div>
                </div>
            </div>

            <div className="lg:col-span-1">
                <MoodSelector />
            </div>
        </div>
    );
}
