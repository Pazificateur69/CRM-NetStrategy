'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, Views, View } from 'react-big-calendar';
import withDragAndDrop, { withDragAndDropProps } from 'react-big-calendar/lib/addons/dragAndDrop';
import dynamic from 'next/dynamic';
import { format, parse, startOfWeek, getDay, addMonths, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/services/api';
import {
    Plus,
    Calendar as CalendarIcon,
    Clock,
    MapPin,
    User,
    Briefcase,
    X,
    Loader2,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Video,
    Phone,
    AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

const locales = {
    'fr': fr,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

// Lazy load DnDCalendar because it's heavy
const DnDCalendar = dynamic(() => Promise.resolve(withDragAndDrop<Event>(Calendar)), {
    ssr: false,
    loading: () => <div className="h-full flex items-center justify-center"><Loader2 className="w-10 h-10 text-indigo-500 animate-spin" /></div>
});

interface Event {
    id?: number;
    title: string;
    start: Date;
    end: Date;
    description?: string;
    type: string;
    client_id?: number;
    prospect_id?: number;
    user_id?: number;
    client?: { gerant: string; societe: string };
    prospect?: { societe: string; contact: string };
    user?: { name: string };
    // react-big-calendar requirements
    allDay?: boolean;
    resource?: any;
}

// ===========================================
// 🎨 CUSTOM COMPONENTS
// ===========================================

const CustomToolbar = (toolbar: any) => {
    const goToBack = () => {
        toolbar.onNavigate('PREV');
    };

    const goToNext = () => {
        toolbar.onNavigate('NEXT');
    };

    const goToCurrent = () => {
        toolbar.onNavigate('TODAY');
    };

    const label = () => {
        const date = toolbar.date;
        return (
            <span className="capitalize text-lg font-bold text-slate-900 dark:text-white">
                {format(date, 'MMMM yyyy', { locale: fr })}
            </span>
        );
    };

    return (
        <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-4">
                <div className="flex items-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-1 shadow-sm">
                    <button onClick={goToBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button onClick={goToCurrent} className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                        Aujourd'hui
                    </button>
                    <button onClick={goToNext} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors">
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
                {label()}
            </div>

            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                {['month', 'week', 'day', 'agenda'].map(view => (
                    <button
                        key={view}
                        onClick={() => toolbar.onView(view)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${toolbar.view === view
                            ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        {view === 'month' ? 'Mois' : view === 'week' ? 'Semaine' : view === 'day' ? 'Jour' : 'Agenda'}
                    </button>
                ))}
            </div>
        </div>
    );
};

const CustomEvent = ({ event }: { event: Event }) => {
    let Icon = CalendarIcon;
    if (event.type === 'call') Icon = Phone;
    if (event.type === 'visio') Icon = Video;
    if (event.type === 'deadline') Icon = AlertCircle;

    return (
        <div className="h-full w-full flex flex-col px-2 py-1 overflow-hidden">
            <div className="flex items-center gap-1.5 mb-0.5">
                <Icon className="w-3 h-3 opacity-80" />
                <span className="text-xs font-bold truncate">{event.title}</span>
            </div>
            {event.client && (
                <div className="text-[10px] opacity-90 truncate flex items-center gap-1">
                    <Briefcase className="w-2.5 h-2.5" />
                    {event.client.societe ? (
                        <>
                            {event.client.societe}
                            {event.client.gerant ? ` (${event.client.gerant})` : ''}
                        </>
                    ) : (
                        event.client.gerant
                    )}
                </div>
            )}
            {event.prospect && (
                <div className="text-[10px] opacity-90 truncate flex items-center gap-1">
                    <Briefcase className="w-2.5 h-2.5" />
                    {event.prospect.societe ? (
                        <>
                            {event.prospect.societe}
                            {event.prospect.contact ? ` (${event.prospect.contact})` : ''}
                        </>
                    ) : (
                        event.prospect.contact
                    )} (Prospect)
                </div>
            )}
        </div>
    );
};

export default function CalendarPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [clients, setClients] = useState<any[]>([]);
    const [prospects, setProspects] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [view, setView] = useState<View>(Views.MONTH);
    const [date, setDate] = useState(new Date());

    const onNavigate = useCallback((newDate: Date) => setDate(newDate), [setDate]);

    const [formData, setFormData] = useState({
        title: '',
        start: '',
        end: '',
        description: '',
        type: 'rdv',
        client_id: '',
        prospect_id: '',
        user_id: ''
    });

    useEffect(() => {
        fetchEvents();
        fetchClientsAndUsers();
        if (window.innerWidth < 768) {
            setView(Views.AGENDA);
        }
    }, []);

    const fetchEvents = async () => {
        try {
            const [eventsRes, todosRes, rappelsRes] = await Promise.all([
                api.get('/events'),
                api.get('/todos'),
                api.get('/rappels')
            ]);

            const dbEvents = eventsRes.data.map((ev: any) => ({
                ...ev,
                start: new Date(ev.start),
                end: new Date(ev.end),
            }));

            const todoEvents = (todosRes.data.data || []).filter((t: any) => t.date_echeance).map((t: any) => ({
                id: `todo-${t.id}`,
                title: `Task: ${t.titre}`,
                start: new Date(t.date_echeance),
                end: new Date(new Date(t.date_echeance).getTime() + 60 * 60 * 1000), // 1h duration
                type: 'todo',
                description: t.description,
                allDay: true,
                client: t.client
            }));

            const rappelEvents = (rappelsRes.data.data || []).map((r: any) => ({
                id: `rappel-${r.id}`,
                title: `Rappel: ${r.titre}`,
                start: new Date(r.date_rappel),
                end: new Date(new Date(r.date_rappel).getTime() + 30 * 60 * 1000), // 30min duration
                type: 'rappel',
                description: r.description,
                client: r.client
            }));

            setEvents([...dbEvents, ...todoEvents, ...rappelEvents]);
        } catch (err) {
            console.error(err);
            toast.error("Erreur lors du chargement des événements");
        } finally {
            setLoading(false);
        }
    };

    const fetchClientsAndUsers = async () => {
        try {
            const [clientsRes, prospectsRes, usersRes] = await Promise.all([
                api.get('/clients'),
                api.get('/prospects'),
                api.get('/users')
            ]);
            setClients(clientsRes.data.data || []);
            setProspects(prospectsRes.data.data || []);
            setUsers(usersRes.data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target?.result as string;
            // Basic ICS parsing logic
            const events = [];
            const lines = text.split(/\r\n|\n|\r/);
            let currentEvent: any = {};
            let inEvent = false;

            for (const line of lines) {
                if (line.startsWith('BEGIN:VEVENT')) {
                    inEvent = true;
                    currentEvent = {};
                } else if (line.startsWith('END:VEVENT')) {
                    inEvent = false;
                    if (currentEvent.summary && currentEvent.dtstart) {
                        events.push(currentEvent);
                    }
                } else if (inEvent) {
                    if (line.startsWith('SUMMARY:')) currentEvent.summary = line.substring(8);
                    if (line.startsWith('DESCRIPTION:')) currentEvent.description = line.substring(12);
                    if (line.startsWith('DTSTART:')) currentEvent.dtstart = line.substring(8);
                    if (line.startsWith('DTEND:')) currentEvent.dtend = line.substring(6);
                }
            }

            // Save imported events
            let importedCount = 0;
            for (const ev of events) {
                try {
                    // Simple date parsing (YYYYMMDDTHHMMSS)
                    const parseICSDate = (str: string) => {
                        if (!str) return new Date();
                        const year = parseInt(str.substring(0, 4));
                        const month = parseInt(str.substring(4, 6)) - 1;
                        const day = parseInt(str.substring(6, 8));
                        const hour = parseInt(str.substring(9, 11) || '0');
                        const min = parseInt(str.substring(11, 13) || '0');
                        return new Date(year, month, day, hour, min);
                    };

                    await api.post('/events', {
                        title: ev.summary || 'Événement importé',
                        start: parseICSDate(ev.dtstart).toISOString(),
                        end: parseICSDate(ev.dtend || ev.dtstart).toISOString(),
                        description: ev.description || '',
                        type: 'autre'
                    });
                    importedCount++;
                } catch (err) {
                    console.error('Failed to import event', ev);
                }
            }
            toast.success(`${importedCount} événements importés avec succès !`);
            fetchEvents();
        };
        reader.readAsText(file);
    };

    const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
        setFormData({
            ...formData,
            start: start.toISOString().slice(0, 16),
            end: end.toISOString().slice(0, 16),
            title: '',
            description: '',
            type: 'rdv',
            client_id: '',
            prospect_id: '',
            user_id: ''
        });
        setSelectedEvent(null);
        setShowModal(true);
    };

    const handleSelectEvent = (event: Event) => {
        setSelectedEvent(event);
        setFormData({
            title: event.title,
            start: new Date(event.start).toISOString().slice(0, 16),
            end: new Date(event.end).toISOString().slice(0, 16),
            description: event.description || '',
            type: event.type,
            client_id: event.client_id?.toString() || '',
            prospect_id: event.prospect_id?.toString() || '',
            user_id: event.user_id?.toString() || ''
        });
        setShowModal(true);
    };

    const onEventDrop = useCallback(async ({ event, start, end }: any) => {
        const updatedEvent = { ...event, start, end };

        // Optimistic update
        setEvents(prev => prev.map(ev => ev.id === event.id ? updatedEvent : ev));

        try {
            await api.put(`/events/${event.id}`, {
                start: start.toISOString(),
                end: end.toISOString()
            });
            toast.success('Événement déplacé');
        } catch (error) {
            console.error('Failed to move event', error);
            toast.error('Erreur lors du déplacement');
            fetchEvents(); // Revert
        }
    }, []);

    const onEventResize = useCallback(async ({ event, start, end }: any) => {
        const updatedEvent = { ...event, start, end };

        // Optimistic update
        setEvents(prev => prev.map(ev => ev.id === event.id ? updatedEvent : ev));

        try {
            await api.put(`/events/${event.id}`, {
                start: start.toISOString(),
                end: end.toISOString()
            });
            toast.success('Durée modifiée');
        } catch (error) {
            console.error('Failed to resize event', error);
            toast.error('Erreur lors de la modification');
            fetchEvents(); // Revert
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation : Client OU Prospect obligatoire
        if (!formData.client_id && !formData.prospect_id) {
            toast.error("Veuillez sélectionner un Client ou un Prospect.");
            return;
        }

        try {
            const payload = {
                ...formData,
                client_id: formData.client_id ? parseInt(formData.client_id) : null,
                prospect_id: formData.prospect_id ? parseInt(formData.prospect_id) : null,
                user_id: formData.user_id ? parseInt(formData.user_id) : null,
            };

            if (selectedEvent?.id) {
                await api.put(`/events/${selectedEvent.id}`, payload);
                toast.success('Événement modifié');
            } else {
                await api.post('/events', payload);
                toast.success('Événement créé');
            }
            setShowModal(false);
            fetchEvents();
        } catch (err) {
            console.error(err);
            toast.error('Erreur lors de la sauvegarde');
        }
    };

    const handleDelete = async () => {
        if (!selectedEvent?.id) return;
        if (!confirm('Voulez-vous vraiment supprimer cet événement ?')) return;
        try {
            await api.delete(`/events/${selectedEvent.id}`);
            setShowModal(false);
            fetchEvents();
        } catch (err) {
            console.error(err);
        }
    };

    const eventStyleGetter = (event: Event) => {
        let backgroundColor = '#4f46e5'; // indigo-600
        let borderLeft = '4px solid #3730a3'; // indigo-800

        if (event.type === 'tournage') {
            backgroundColor = '#e11d48'; // rose-600
            borderLeft = '4px solid #9f1239';
        }
        if (event.type === 'call' || event.type === 'visio') {
            backgroundColor = '#0891b2'; // cyan-600
            borderLeft = '4px solid #155e75';
        }
        if (event.type === 'deadline') {
            backgroundColor = '#ea580c'; // orange-600
            borderLeft = '4px solid #9a3412';
        }
        if (event.type === 'todo') {
            backgroundColor = '#16a34a'; // green-600
            borderLeft = '4px solid #14532d';
        }
        if (event.type === 'rappel') {
            backgroundColor = '#9333ea'; // purple-600
            borderLeft = '4px solid #581c87';
        }

        return {
            style: {
                backgroundColor,
                borderLeft,
                borderRadius: '6px',
                opacity: 0.95,
                color: 'white',
                borderTop: '0px',
                borderRight: '0px',
                borderBottom: '0px',
                display: 'block',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }
        };
    };

    return (
        <DashboardLayout>
            <div className="p-8 max-w-[1600px] mx-auto h-[calc(100vh-100px)] flex flex-col">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                            Calendrier
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">
                            Gérez votre planning, vos rendez-vous et vos échéances.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-xl font-medium border border-slate-200 dark:border-slate-700 transition-all cursor-pointer">
                            <CalendarIcon className="w-4 h-4" />
                            Importer
                            <input type="file" accept=".ics" className="hidden" onChange={handleImport} />
                        </label>
                        <button
                            onClick={() => {
                                setSelectedEvent(null);
                                setFormData({
                                    title: '',
                                    start: new Date().toISOString().slice(0, 16),
                                    end: new Date(new Date().getTime() + 60 * 60 * 1000).toISOString().slice(0, 16),
                                    description: '',
                                    type: 'rdv',
                                    client_id: '',
                                    prospect_id: '',
                                    user_id: ''
                                });
                                setShowModal(true);
                            }}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-indigo-500/20 transition-all"
                        >
                            <Plus className="w-5 h-5" />
                            Nouvel événement
                        </button>
                    </div>
                </div>

                <div className="flex-1 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 overflow-x-auto">
                    <div className="min-w-[700px] h-full">
                        <DnDCalendar
                            localizer={localizer}
                            events={events}
                            startAccessor="start"
                            endAccessor="end"
                            style={{ height: '100%' }}
                            culture='fr'
                            messages={{
                                next: "Suivant",
                                previous: "Précédent",
                                today: "Aujourd'hui",
                                month: "Mois",
                                week: "Semaine",
                                day: "Jour",
                                agenda: "Agenda",
                                date: "Date",
                                time: "Heure",
                                event: "Événement",
                                noEventsInRange: "Aucun événement dans cette période."
                            }}
                            onSelectSlot={handleSelectSlot}
                            onSelectEvent={handleSelectEvent}
                            onEventDrop={onEventDrop}
                            onEventResize={onEventResize}
                            resizable
                            selectable
                            eventPropGetter={eventStyleGetter}
                            components={{
                                toolbar: CustomToolbar,
                                event: CustomEvent
                            }}
                            view={view}
                            onView={setView}
                            date={date}
                            onNavigate={onNavigate}
                            className="dark:text-slate-200"
                        />
                    </div>
                </div>

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                    {selectedEvent ? 'Modifier l\'événement' : 'Nouvel événement'}
                                </h3>
                                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Titre de l'événement</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Briefcase className="h-5 w-5 text-slate-400" />
                                        </div>
                                        <input
                                            type="text"
                                            required
                                            value={formData.title}
                                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all"
                                            placeholder="Ex: Réunion stratégique..."
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Début</label>
                                        <div className="relative">
                                            <input
                                                type="datetime-local"
                                                required
                                                value={formData.start}
                                                onChange={e => setFormData({ ...formData, start: e.target.value })}
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Fin</label>
                                        <div className="relative">
                                            <input
                                                type="datetime-local"
                                                required
                                                value={formData.end}
                                                onChange={e => setFormData({ ...formData, end: e.target.value })}
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Type d'activité</label>
                                        <div className="relative">
                                            <select
                                                value={formData.type}
                                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none appearance-none transition-all"
                                            >
                                                <option value="rdv">📅 Rendez-vous</option>
                                                <option value="call">📞 Appel</option>
                                                <option value="visio">📹 Visio</option>
                                                <option value="tournage">🎬 Tournage</option>
                                                <option value="deadline">⚠️ Deadline</option>
                                                <option value="autre">📌 Autre</option>
                                            </select>
                                            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                                <ChevronRight className="w-4 h-4 text-slate-400 rotate-90" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Client associé</label>
                                            <div className="relative">
                                                <select
                                                    value={formData.client_id}
                                                    onChange={e => setFormData({ ...formData, client_id: e.target.value, prospect_id: '' })}
                                                    disabled={!!formData.prospect_id}
                                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none appearance-none transition-all disabled:opacity-50"
                                                >
                                                    <option value="">Aucun client</option>
                                                    {clients.map(c => (
                                                        <option key={c.id} value={c.id}>
                                                            {c.societe ? `${c.societe} ${c.gerant ? `(${c.gerant})` : ''}` : c.gerant}
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                                    <ChevronRight className="w-4 h-4 text-slate-400 rotate-90" />
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Prospect associé</label>
                                            <div className="relative">
                                                <select
                                                    value={formData.prospect_id}
                                                    onChange={e => setFormData({ ...formData, prospect_id: e.target.value, client_id: '' })}
                                                    disabled={!!formData.client_id}
                                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none appearance-none transition-all disabled:opacity-50"
                                                >
                                                    <option value="">Aucun prospect</option>
                                                    {prospects.map(p => (
                                                        <option key={p.id} value={p.id}>
                                                            {p.societe ? `${p.societe} ${p.contact ? `(${p.contact})` : ''}` : p.contact}
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                                    <ChevronRight className="w-4 h-4 text-slate-400 rotate-90" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Description / Notes</label>
                                    <textarea
                                        rows={3}
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none resize-none transition-all"
                                        placeholder="Ajoutez des détails, un lien visio, ou des notes..."
                                    />
                                </div>

                                <div className="flex items-center justify-between pt-4">
                                    {selectedEvent ? (
                                        <button
                                            type="button"
                                            onClick={handleDelete}
                                            className="text-red-600 hover:text-red-700 font-medium text-sm px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        >
                                            Supprimer
                                        </button>
                                    ) : <div></div>}

                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setShowModal(false)}
                                            className="px-4 py-2 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-lg shadow-indigo-500/20 transition-all"
                                        >
                                            Enregistrer
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
