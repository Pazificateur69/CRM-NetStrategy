import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Sun, Moon, CloudSun, Sparkles } from 'lucide-react';

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

    return (
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-violet-700 dark:from-indigo-900 dark:to-slate-900 rounded-3xl p-8 text-white shadow-xl shadow-indigo-500/20 mb-8">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl"></div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2 text-indigo-100 font-medium">
                        {icon}
                        <span>{format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}</span>
                    </div>
                    <h2 className="text-4xl font-bold tracking-tight mb-2">
                        {greeting}, {userName || 'Admin'} !
                    </h2>
                    <p className="text-indigo-100/80 max-w-lg text-lg">
                        Prêt à développer votre activité aujourd'hui ? Voici un aperçu de vos performances.
                    </p>
                </div>


            </div>
        </div>
    );
}
