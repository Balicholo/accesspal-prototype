const TODAY = [
  { title: 'Team meeting', time: '10:00 AM' },
  { title: 'Client call', time: '2:00 PM' },
];

const TOMORROW = [{ title: 'Assignment reminder window', time: '7:00 PM' }];

export function describeCalendar(day: 'today' | 'tomorrow' = 'today') {
  const events = day === 'tomorrow' ? TOMORROW : TODAY;
  if (!events.length) {
    return day === 'tomorrow' ? "Tomorrow's calendar is clear." : "You don't have any events today.";
  }
  const spoken = events.map((event) => `${event.title} at ${event.time}`).join(', and ');
  if (events.length === 1) {
    return `${day === 'tomorrow' ? 'Tomorrow' : 'Today'} you have ${spoken}.`;
  }
  return `You have ${events.length} events ${day}. ${spoken}.`;
}
