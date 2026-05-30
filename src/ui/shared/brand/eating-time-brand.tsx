import clsx from "clsx";
import Image from "next/image";

import EatingTimeLogo from "@/ui/shared/images/logo.png";

type EatingTimeBrandProps = {
  iconClassName?: string;
  iconSize?: number;
  priority?: boolean;
  showText?: boolean;
  textClassName?: string;
  wrapperClassName?: string;
};

export default function EatingTimeBrand({
  iconClassName,
  iconSize = 42,
  priority = false,
  showText = true,
  textClassName,
  wrapperClassName,
}: EatingTimeBrandProps) {
  return (
    <span className={clsx("flex items-center gap-3", wrapperClassName)}>
      <Image
        src={EatingTimeLogo}
        alt="EatingTime"
        width={iconSize}
        height={iconSize}
        className={clsx("shrink-0 rounded-xl object-cover", iconClassName)}
        priority={priority}
      />
      {showText ? (
        <span
          className={clsx(
            "whitespace-nowrap text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white",
            textClassName,
          )}
        >
          Eating<span className="text-red-600 dark:text-red-500">Time</span>
        </span>
      ) : null}
    </span>
  );
}
