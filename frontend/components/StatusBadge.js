export default function StatusBadge({ status }) {
  const cls =
    status === 'Present' ? 'badge-present' : status === 'Late' ? 'badge-late' : 'badge-absent';
  return <span className={`badge ${cls}`}>{status || 'Absent'}</span>;
}
