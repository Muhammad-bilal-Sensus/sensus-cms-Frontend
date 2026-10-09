import { useState } from "react";
import { Icon, type IconName } from "@/components/icons/Icon";

type QueueCardProps = {
	title: string;
	subtitle: string;
	icon: IconName;
	tabs?: boolean;
};

export default function QueueCard({
	title,
	subtitle,
	icon,
	tabs = false,
}: QueueCardProps) {
	const [activeTab, setActiveTab] = useState<"open" | "completed">("open");

	return (
		<section className="flex min-h-[300px] flex-col rounded-lg border border-slate-200 bg-white shadow-sm">
			<header className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
				<div className="flex min-w-0 items-center gap-3">
					<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
						<Icon name={icon} className="h-5 w-5" />
					</span>
					<div className="min-w-0">
						<h2 className="truncate text-sm font-semibold text-slate-900">{title}</h2>
						<p className="truncate text-xs text-slate-500">{subtitle}</p>
					</div>
				</div>
				<div className="shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-center">
					<span className="block text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">Total</span>
					<span className="block text-base font-bold leading-4 text-slate-900">0</span>
				</div>
			</header>
			{tabs && (
				<div className="grid grid-cols-2 border-b border-slate-200 text-xs font-medium">
					<button
						type="button"
						onClick={() => setActiveTab("open")}
						className={`border-b-2 px-3 py-2.5 ${activeTab === "open" ? "border-slate-800 text-slate-900" : "border-transparent text-slate-500"}`}
					>
						All open
					</button>
					<button
						type="button"
						onClick={() => setActiveTab("completed")}
						className={`border-b-2 px-3 py-2.5 ${activeTab === "completed" ? "border-slate-800 text-slate-900" : "border-transparent text-slate-500"}`}
					>
						Completed
					</button>
				</div>
			)}
			<div className="flex flex-1 flex-col items-center justify-center px-5 py-8 text-center">
				<span className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-400">
					<Icon name={icon} className="h-5 w-5" />
				</span>
				<p className="text-sm font-medium text-slate-600">
					{activeTab === "completed" ? "No completed items" : "Nothing scheduled today"}
				</p>
				<p className="mt-1 text-xs text-slate-400">New items assigned to you will appear here.</p>
			</div>
		</section>
	);
}