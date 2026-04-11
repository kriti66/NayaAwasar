const LEGEND = [
    { label: 'Pending acceptance', dot: 'bg-amber-500' },
    { label: 'Scheduled', dot: 'bg-yellow-500' },
    { label: 'Completed', dot: 'bg-emerald-500' },
    { label: 'Missed', dot: 'bg-slate-500' },
    { label: 'Reschedule requested', dot: 'bg-sky-500' },
    { label: 'Cancelled', dot: 'bg-red-500' }
];

export default function InterviewCalendarLegend() {
    return (
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs sm:text-sm text-slate-600">
            {LEGEND.map((item) => (
                <span key={item.label} className="inline-flex items-center gap-1.5">
                    <span className={`h-2.5 w-2.5 rounded-full ${item.dot}`} />
                    {item.label}
                </span>
            ))}
        </div>
    );
}
