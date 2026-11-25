const TIME_ZONE = "Asia/Ho_Chi_Minh";

const dateTimeFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: TIME_ZONE,
});

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: TIME_ZONE,
});

export function formatDateTime(value: string | Date | null | undefined) {
  if (!value) return "Chưa đặt";
  return dateTimeFormatter.format(new Date(value));
}

export function formatDate(value: string | Date | null | undefined) {
  if (!value) return "Chưa đặt";
  return dateFormatter.format(new Date(value));
}

export function deadlineLabel(value: string | Date | null | undefined) {
  if (!value) return "Chưa đặt deadline";

  const deadline = new Date(value).getTime();
  const diff = deadline - Date.now();

  if (diff <= 0) return "Đã hết hạn";

  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);

  if (days > 0) return `Còn ${days} ngày ${hours} giờ`;
  if (hours > 0) return `Còn ${hours} giờ`;
  return "Còn dưới 1 giờ";
}

export function isPast(value: string | Date | null | undefined) {
  if (!value) return false;
  return new Date(value).getTime() <= Date.now();
}

export function toDatetimeLocal(value: string | null | undefined) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}
