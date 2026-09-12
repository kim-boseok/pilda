export function fmtTime(d: Date): string {
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export function fmtDayLabel(d: Date, base: Date): string {
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const baseDay = new Date(base.getFullYear(), base.getMonth(), base.getDate()).getTime();
  const diff = Math.round((day - baseDay) / 86400000);
  if (diff === 0) return '오늘';
  if (diff === 1) return '내일';
  if (diff === -1) return '어제';
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function windDirName(deg: number): string {
  const names = ['북', '북동', '동', '남동', '남', '남서', '서', '북서'];
  return names[Math.round(((deg % 360) + 360) % 360 / 45) % 8] + '풍';
}

export function hourFloat(d: Date): number {
  return d.getHours() + d.getMinutes() / 60;
}
