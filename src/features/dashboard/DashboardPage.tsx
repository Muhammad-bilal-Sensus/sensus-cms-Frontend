import { useState } from "react";
import { useAuth } from "@/features/auth/useAuth";
import { Icon } from "@/components/icons/Icon";
import MetricCard, { type MetricCardProps } from "./components/MetricCard";
import Select from "@/components/ui/Select";
import QueueCard from "./components/QueueCard";
import { formatDashboardCalendarDate, formatDashboardDay } from "./dashboardFormat";

const calendarViews = [
	{ value: "day", label: "Day" },
	{ value: "week", label: "Week" },
	{ value: "month", label: "Month" },
] as const;

type CalendarView = (typeof calendarViews)[number]["value"];

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const hours = Array.from({ length: 24 }, (_, hour) => hour);

function isCalendarView(value: string): value is CalendarView {
	return calendarViews.some((view) => view.value === value);
}

function startOfWeek(date: Date) {
	const start = new Date(date);
	start.setHours(0, 0, 0, 0);
	start.setDate(start.getDate() - start.getDay());
	return start;
}

function isSameDay(left: Date, right: Date) {
	return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate();
}

function hourLabel(hour: number) {
	return new Intl.DateTimeFormat("en-US", { hour: "numeric" }).format(new Date(2020, 0, 1, hour));
}

function weekDays(date: Date) {
	const start = startOfWeek(date);
	return Array.from({ length: 7 }, (_, index) => {
		const day = new Date(start);
		day.setDate(start.getDate() + index);
		return day;
	});
}

function monthDays(date: Date) {
	const first = new Date(date.getFullYear(), date.getMonth(), 1);
	const start = startOfWeek(first);
	return Array.from({ length: 42 }, (_, index) => {
		const day = new Date(start);
		day.setDate(start.getDate() + index);
		return day;
	});
}

function calendarTitle(date: Date, view: CalendarView) {
	if (view === "month") return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(date);
	if (view === "week") {
		const days = weekDays(date);
		const start = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(days[0]);
		const end = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(days[6]);
		return `${start} – ${end}`;
	}
	return formatDashboardCalendarDate(date);
}

const metrics: MetricCardProps[] = [
	{
		title: "Leads",
		description: "Leads in an open pipeline stage assigned to you",
		icon: "chart",
		tone: "bg-[#dcecdf] text-[#287560]",
		line: "M4 35 17 27 29 31 43 20 57 25 70 13 84 18 98 8 112 13 126 4",
		value: 0,
	},
	{
		title: "Contact enquiry",
		description: "Contact enquiries waiting for a response",
		icon: "headset",
		tone: "bg-[#f7e3d7] text-[#bd672f]",
		line: "M4 35 17 27 29 31 43 20 57 25 70 13 84 18 98 8 112 13 126 4",
		value: 0,
	},
	{
		title: "Test drive enquiry",
		description: "Test drive enquiries waiting to be booked",
		icon: "car",
		tone: "bg-[#dce7f5] text-[#2f5f9e]",
		line: "M4 35 17 27 29 31 43 20 57 25 70 13 84 18 98 8 112 13 126 4",
		value: 0,
	},
];

export default function DashboardPage() {
	const { user } = useAuth();
	const [selectedDate, setSelectedDate] = useState(() => new Date());
	const [calendarView, setCalendarView] = useState<CalendarView>("month");
	const displayName = user?.full_name?.trim() || "My";
	// const [location, setLocation] = useState("");
	// const [teamMember, setTeamMember] = useState(user?.full_name ?? "");
	// useEffect(() => {
	// 	if (user?.full_name) setTeamMember(user.full_name);
	// }, [user?.full_name]);
	
	function moveDate(direction: -1 | 1) {
		setSelectedDate((date) => {
			const nextDate = new Date(date);
			if (calendarView === "month") nextDate.setMonth(nextDate.getMonth() + direction);
			else if (calendarView === "week") nextDate.setDate(nextDate.getDate() + direction * 7);
			else nextDate.setDate(nextDate.getDate() + direction);
			return nextDate;
		});
	}

	const today = new Date();
	const visibleWeek = weekDays(selectedDate);
	const visibleMonth = monthDays(selectedDate);

	return (
		<div className="mx-auto w-full max-w-[1600px] space-y-5 pb-8">
			<section className="flex flex-col justify-between gap-4 rounded-lg border border-slate-200 bg-white px-5 py-4 md:flex-row md:items-end">
				<div>
					<p className="text-xs text-slate-500">Sensus AI <span className="px-1 text-slate-300">/</span> My Dashboard</p>
					<h1 className="mt-1 font-brand text-2xl font-semibold capitalize text-slate-900">{displayName}</h1>
					<p className="mt-1 text-sm text-slate-500">{formatDashboardDay(selectedDate)}</p>
				</div>
				{/* <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:min-w-[420px]">
					<label className="grid gap-1 text-xs font-medium text-slate-600">
						Filter locations
						<Select value={location} onChange={setLocation} placeholder="All locations" options={[]} />
					</label>
					<label className="grid gap-1 text-xs font-medium text-slate-600">
						Team members
						<Select
							value={teamMember}
							onChange={setTeamMember}
							placeholder="All team members"
							options={user?.full_name ? [{ value: user.full_name, label: user.full_name }] : []}
						/>
					</label>
				</div> */}
			</section>

			<section aria-label="Dashboard summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
				{metrics.map((metric) => <MetricCard key={metric.title} {...metric} />)}
			</section>

			<section aria-label="My work" className="grid items-stretch gap-4 xl:grid-cols-2">
				<QueueCard title="My new enquiries" subtitle="Recently assigned enquiries" icon="users" />
				<QueueCard title="My appointments" subtitle="Manage today's appointments" icon="calendar" />
			</section>

			<section className="min-w-0" aria-label="Calendar">
				<div className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
					<header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
						<div className="flex items-center gap-1">
							<button
								type="button"
								onClick={() => moveDate(-1)}
								aria-label={`Previous ${calendarView}`}
								className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50"
							>
								<Icon name="chevronLeft" className="h-4 w-4" />
							</button>
							<h2 className="px-1 text-center text-sm font-semibold text-slate-900">{calendarTitle(selectedDate, calendarView)}</h2>
							<button
								type="button"
								onClick={() => moveDate(1)}
								aria-label={`Next ${calendarView}`}
								className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50"
							>
								<Icon name="chevronRight" className="h-4 w-4" />
							</button>
						</div>
						<Select
							size="sm"
							value={calendarView}
							onChange={(value) => {
								if (isCalendarView(value)) setCalendarView(value);
							}}
							aria-label="Calendar view"
							options={[...calendarViews]}
						/>
					</header>
					{calendarView === "month" ? (
						<div>
							<div className="grid grid-cols-7 border-b border-slate-100 text-center text-[11px] font-medium uppercase tracking-wide text-slate-400">
								{weekdayLabels.map((label) => <div key={label} className="px-2 py-2">{label}</div>)}
							</div>
							<div className="grid grid-cols-7">
								{visibleMonth.map((day) => {
									const inMonth = day.getMonth() === selectedDate.getMonth();
									const selected = isSameDay(day, selectedDate);
									const isToday = isSameDay(day, today);
									return (
										<button
											key={day.toISOString()}
											type="button"
											onClick={() => setSelectedDate(day)}
											className={`h-16 border-b border-r border-slate-100 p-2 text-left text-sm sm:h-20 ${inMonth ? "text-slate-900" : "text-slate-300"}`}
										>
											<span className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${isToday ? "bg-teal-700 text-white" : selected ? "bg-teal-50 text-teal-800" : ""}`}>
												{day.getDate()}
											</span>
										</button>
									);
								})}
							</div>
						</div>
					) : calendarView === "week" ? (
						<div className="thin-scroll max-h-[540px] overflow-auto">
							<div className="sticky top-0 z-10 grid grid-cols-[62px_repeat(7,minmax(72px,1fr))] border-b border-slate-100 bg-white">
								<div />
								{visibleWeek.map((day) => {
									const selected = isSameDay(day, selectedDate);
									const isToday = isSameDay(day, today);
									return (
										<button
											key={day.toISOString()}
											type="button"
											onClick={() => setSelectedDate(day)}
											className="px-1 py-2 text-center"
										>
											<span className="block text-[11px] text-slate-400">{weekdayLabels[day.getDay()]}</span>
											<span className={`mx-auto mt-1 flex h-7 w-7 items-center justify-center rounded-full text-sm ${isToday ? "bg-teal-700 text-white" : selected ? "bg-teal-50 font-semibold text-teal-800" : "text-slate-900"}`}>
												{day.getDate()}
											</span>
										</button>
									);
								})}
							</div>
							{hours.map((hour) => (
								<div key={hour} className="grid h-14 grid-cols-[62px_repeat(7,minmax(72px,1fr))]">
									<div className="-mt-2 px-3 text-[11px] text-slate-500">{hourLabel(hour)}</div>
									{visibleWeek.map((day) => (
										<div key={day.toISOString()} className="border-t border-l border-slate-100" />
									))}
								</div>
							))}
						</div>
					) : (
						<div className="thin-scroll max-h-[540px] overflow-y-auto">
							{hours.map((hour) => (
								<div key={hour} className="grid h-14 grid-cols-[62px_minmax(0,1fr)]">
									<div className="-mt-2 px-3 text-[11px] text-slate-500">{hourLabel(hour)}</div>
									<div className="border-t border-slate-100" />
								</div>
							))}
						</div>
					)}
				</div>
			</section>
		</div>
	);
}
