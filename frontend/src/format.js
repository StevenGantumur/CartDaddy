// "7:05 PM" in the iPad's own locale.
export const formatTime = (date) =>
  date?.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
