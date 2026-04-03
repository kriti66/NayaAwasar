import { ChevronLeft, ChevronRight } from 'lucide-react';
import { buildMonthGrid, statusDotClass } from '../../utils/interviewCalendarUi';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function InterviewCalendarGrid({
    year,
    monthIndex,
    onPrevMonth,
    onNextMonth,
    interviewsByDay,
    selectedDayKey,
    onSelectDay
}) {
    const cells = buildMonthGrid(year, monthIndex);
    const label = new Date(Date.UTC(year, monthIndex, 1)).toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC'
    });

    return (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between gap-2 px-3 py-3 sm:px-4 border-b border-slate-100 bg-slate-50/80">
                <button
                    type="button"
                    onClick={onPrevMonth}
                    className="p-2 rounded-lg text-slate-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200"
                    aria-label="Previous month"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="text-base sm:text-lg font-semibold text-slate-900 text-center flex-1">{label}</h2>
                <button
                    type="button"
                    onClick={onNextMonth}
                    className="p-2 rounded-lg text-slate-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200"
                    aria-label="Next month"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>

            <div className="grid grid-cols-7 gap-px bg-slate-200">
                {WEEKDAYS.map((w) => (
                    <div key={w} className="bg-slate-50 py-2 text-center text-xs font-semibold text-slate-500">
                        {w}
                    </div>
                ))}
                {cells.map((cell, idx) => {
                    if (cell.type === 'pad') {
                        return <div key={`p-${idx}`} className="bg-slate-50 min-h-[72px] sm:min-h-[88px]" />;
                    }
                    const list = interviewsByDay.get(cell.key) || [];
                    const statuses = [...new Set(list.map((i) => i.status))];
                    const selected = selectedDayKey === cell.key;
                    return (
                        <button
                            key={cell.key}
                            type="button"
                            onClick={() => onSelectDay(cell.key)}
                            className={`min-h-[72px] sm:min-h-[88px] bg-white p-1.5 sm:p-2 text-left transition-colors flex flex-col ${
                                selected ? 'ring-2 ring-[#29a08e] ring-inset z-10' : 'hover:bg-teal-50/40'
                            }`}
                        >
                            <span className="text-sm font-medium text-slate-900">{cell.day}</span>
                            <div className="mt-auto flex flex-wrap gap-1 justify-end">
                                {statuses.slice(0, 4).map((st) => (
                                    <span
                                        key={st}
                                        className={`h-2 w-2 rounded-full ${statusDotClass(st)}`}
                                        title={st}
                                    />
                                ))}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
