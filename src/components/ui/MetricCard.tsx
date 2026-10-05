import { Icon, type IconName } from "../../layouts/icons";

export type MetricCardProps = {
	title: string;
	description: string;
	icon: IconName;
	tone: string;
	line: string;
	value: number;
};

export default function MetricCard({
	title,
	description,
	icon,
	tone,
	line,
	value,
}: MetricCardProps) {
	return (
		<article className={`relative min-h-36 overflow-hidden rounded-lg p-4 shadow-sm ${tone}`}>
			<div className="flex items-start justify-between gap-3">
				<div>
					<h2 className="text-sm font-semibold capitalize">{title}</h2>
					<p className="mt-1 max-w-52 text-xs leading-4 opacity-80">{description}</p>
				</div>
				<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/85">
					<Icon name={icon} className="h-5 w-5" />
				</span>
			</div>
			<div className="absolute right-4 bottom-3 flex items-end gap-3">
				<span className="text-2xl font-semibold leading-none">{value}</span>
				<svg viewBox="0 0 130 40" className="h-10 w-32 opacity-70" aria-hidden="true">
					<path d={line} fill="none" stroke="currentColor" strokeWidth="2" />
				</svg>
			</div>
		</article>
	);
}