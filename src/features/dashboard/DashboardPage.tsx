import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/useAuth";
import { Icon } from "@/components/icons/Icon";
import MetricCard, { type MetricCardProps } from "./components/MetricCard";
import Select from "@/components/ui/Select";
import QueueCard from "./components/QueueCard";
import { formatDashboardCalendarDate, formatDashboardDay } from "./dashboardFormat";

const carBanners = [
	{
		image:
			"https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1400&q=85",
		alt: "A modern car on the road",
	},
	{
		image:
			"https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1400&q=85",
		alt: "A sports car viewed from the front",
	},
];

const metrics: MetricCardProps[] = [
	{
		title: "Active leads / enquiries",
		description: "Leads in an open pipeline stage assigned to you",
		icon: "chart",
		tone: "bg-[#dcecdf] text-[#287560]",
		line: "M4 35 17 27 29 31 43 20 57 25 70 13 84 18 98 8 112 13 126 4",
		value: 0,
	},
	{
		title: "Scheduled appointments",
		description: "Appointments scheduled for you",
		icon: "calendar",
		tone: "bg-[#f7e3d7] text-[#bd672f]",
		line: "M4 35 17 27 29 31 43 20 57 25 70 13 84 18 98 8 112 13 126 4",
		value: 0,
	},
	{
		title: "Scheduled tasks",
		description: "Tasks due today",
		icon: "check",
		tone: "bg-[#f6e1d4] text-[#bb692f]",
		line: "M4 35 17 27 29 31 43 20 57 25 70 13 84 18 98 8 112 13 126 4",
		value: 0,
	},
	{
		title: "Overdue tasks",
		description: "Tasks past their due date",
		icon: "clock",
		tone: "bg-[#f4dddd] text-[#b44850]",
		line: "M4 35 17 27 29 31 43 20 57 25 70 13 84 18 98 8 112 13 126 4",
		value: 0,
	},
];

export default function DashboardPage() {
	const { user } = useAuth();
	const [selectedDate, setSelectedDate] = useState(() => new Date());
	const [location, setLocation] = useState("");
	const displayName = user?.full_name?.trim() || "My";
	const [teamMember, setTeamMember] = useState(user?.full_name ?? "");

	useEffect(() => {
		if (user?.full_name) setTeamMember(user.full_name);
	}, [user?.full_name]);
	
	function moveDate(days: number) {
		setSelectedDate((date) => {
			const nextDate = new Date(date);
			nextDate.setDate(nextDate.getDate() + days);
			return nextDate;
		});
	}

	return (
		<div className="mx-auto w-full max-w-[1600px] space-y-5 pb-8">
			<section className="flex flex-col justify-between gap-4 rounded-lg border border-slate-200 bg-white px-5 py-4 md:flex-row md:items-end">
				<div>
					<p className="text-xs text-slate-500">Sensus AI <span className="px-1 text-slate-300">/</span> My Dashboard</p>
					<h1 className="mt-1 font-brand text-2xl font-semibold capitalize text-slate-900">{displayName}</h1>
					<p className="mt-1 text-sm text-slate-500">{formatDashboardDay(selectedDate)}</p>
				</div>
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:min-w-[420px]">
					<label className="grid gap-1 text-xs font-medium text-slate-600">
						Filter location
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
				</div>
			</section>

			<section aria-label="Announcements" className="grid gap-3 md:grid-cols-2">
				{carBanners.map((banner, index) => (
					<article key={banner.image} className="relative isolate h-40 overflow-hidden rounded-lg bg-slate-800 shadow-sm sm:h-44">
						<img
							src={banner.image}
							alt={banner.alt}
							className="absolute inset-0 -z-20 h-full w-full object-cover"
							loading="lazy"
						/>
						<div className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-950/70 via-slate-950/20 to-transparent" />
						<span className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-md bg-slate-950/75 px-3 py-2 text-xs font-semibold text-white">
							<Icon name="megaphone" className="h-4 w-4" />
							No announcement
						</span>
						<span className="absolute top-3 right-3 rounded-full border border-white/40 bg-black/20 px-2 py-1 text-[10px] font-medium text-white/90">
							0{index + 1} / 02
						</span>
					</article>
				))}
			</section>

			<section aria-label="Dashboard summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				{metrics.map((metric) => <MetricCard key={metric.title} {...metric} />)}
			</section>

			<section aria-label="My work" className="grid items-stretch gap-4 xl:grid-cols-3">
				<QueueCard title="My new enquiries" subtitle="Recently assigned enquiries" icon="users" />
				<QueueCard title="My appointments" subtitle="Manage today's appointments" icon="calendar" tabs />
				<QueueCard title="My tasks" subtitle="Manage today's tasks" icon="clipboard" tabs />
			</section>

			<section className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1fr)_250px]" aria-label="Calendar">
				<div className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
					<header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={() => moveDate(-1)}
								aria-label="Previous day"
								className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50"
							>
								<Icon name="chevronLeft" className="h-4 w-4" />
							</button>
							<h2 className="min-w-32 text-sm font-semibold text-slate-900">{formatDashboardCalendarDate(selectedDate)}</h2>
							<button
								type="button"
								onClick={() => moveDate(1)}
								aria-label="Next day"
								className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50"
							>
								<Icon name="chevronRight" className="h-4 w-4" />
							</button>
							<button
								type="button"
								onClick={() => setSelectedDate(new Date())}
								className="ml-1 rounded-md px-2 py-1 text-xs font-medium text-teal-800 hover:bg-teal-50"
							>
								Today
							</button>
						</div>
						<div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
							<Icon name="calendar" className="h-4 w-4 text-slate-500" />
							Calendar
						</div>
						<span className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700">Day</span>
					</header>
					<div className="thin-scroll max-h-[540px] overflow-y-auto">
						{Array.from({ length: 24 }, (_, hour) => (
							<div key={hour} className="grid h-14 grid-cols-[62px_minmax(0,1fr)]">
								<div className="-mt-2 px-3 text-[11px] text-slate-500">
									{new Intl.DateTimeFormat("en-US", { hour: "numeric" }).format(new Date(2020, 0, 1, hour))}
								</div>
								<div className="border-t border-slate-100" />
							</div>
						))}
					</div>
				</div>
				<aside className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
					<header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
						<h2 className="text-sm font-semibold text-slate-900">All events</h2>
						<div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-center">
							<span className="block text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">Total</span>
							<span className="block text-base font-bold leading-4 text-slate-900">0</span>
						</div>
					</header>
					<div className="flex min-h-48 items-center justify-center p-5 text-center text-sm text-slate-400">
						No bookings for this day
					</div>
				</aside>
			</section>
		</div>
	);
}
