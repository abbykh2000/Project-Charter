export function formatDate(value) {
  if (!value) {
    return "Not available";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Not available";
  }

  return parsedDate.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function getPercentageText(value, total) {
  if (!total) {
    return "0% of total";
  }

  const percentage = Math.round(
    (value / total) * 100
  );

  return `${percentage}% of total`;
}

export function getComplianceMessage(compliance) {
  if (compliance >= 90) {
    return "Strong compliance coverage";
  }

  if (compliance >= 70) {
    return "Progressing well";
  }

  if (compliance > 0) {
    return "Requires attention";
  }

  return "No controls passed yet";
}