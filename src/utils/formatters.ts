/**
 * Helper utilities for formatting currencies, numbers, dates, and exporting CSV with UTF-8 BOM
 */

export function formatKip(amount: number): string {
  if (isNaN(amount)) return '0 ₭';
  return `${new Intl.NumberFormat('en-US').format(amount)} ₭`;
}

export function formatNumber(num: number): string {
  if (isNaN(num)) return '0';
  return new Intl.NumberFormat('en-US').format(num);
}

export function formatDateTime(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return dateStr;
  }
}

export function generateDocNumber(type: 'IN' | 'OUT' | 'ADJUST', sequenceNum: number): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const seq = String(sequenceNum).padStart(3, '0');
  const prefix = type === 'IN' ? 'IN' : type === 'OUT' ? 'OUT' : 'ADJ';
  return `${prefix}-${year}${month}-${seq}`;
}

export function exportToCSV(headers: string[], rows: (string | number)[][], filename: string): void {
  // \uFEFF BOM is essential so Excel recognizes Lao unicode UTF-8 characters
  let csvContent = '\uFEFF';
  
  // Add headers
  csvContent += headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(',') + '\r\n';
  
  // Add rows
  rows.forEach(row => {
    csvContent += row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',') + '\r\n';
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
