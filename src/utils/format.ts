export function formatDashboardDay(date: Date) {
	return new Intl.DateTimeFormat("en-US", {
		weekday: "long",
		month: "long",
		day: "numeric",
		year: "numeric",
	}).format(date);
}

export function formatDashboardCalendarDate(date: Date) {
	return new Intl.DateTimeFormat("en-US", {
		weekday: "short",
		month: "short",
		day: "2-digit",
	}).format(date);
}
