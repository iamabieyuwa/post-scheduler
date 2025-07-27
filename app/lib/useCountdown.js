// hooks/useCountdown.js
import { useEffect, useState } from "react";

export function useCountdown(targetDate) {
  const [timeLabel, setTimeLabel] = useState("");

  useEffect(() => {
    if (!targetDate) return;

    const interval = setInterval(() => {
      const now = new Date();
      const target = new Date(targetDate);
      const diff = target - now;
      const absDiff = Math.abs(diff);

      const mins = Math.floor(absDiff / (1000 * 60));
      const hours = Math.floor(absDiff / (1000 * 60 * 60));
      const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));

      const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

      if (diff > 0) {
        // Future: countdown
        if (mins < 60) setTimeLabel(`⏳ ${rtf.format(mins, "minute")}`);
        else if (hours < 24) setTimeLabel(`⏳ ${rtf.format(hours, "hour")}`);
        else setTimeLabel(`⏳ ${rtf.format(days, "day")}`);
      } else {
        // Past: posted already
        if (mins < 60) setTimeLabel(`✅ Posted ${rtf.format(-mins, "minute")}`);
        else if (hours < 24) setTimeLabel(`✅ Posted ${rtf.format(-hours, "hour")}`);
        else setTimeLabel(`✅ Posted ${rtf.format(-days, "day")}`);
      }
    }, 60000); // update every 1 minute

    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLabel;
}
