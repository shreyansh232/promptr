import { cn } from "@/lib/utils";

export function BentoGrid({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "mx-auto grid max-w-7xl grid-cols-1 gap-6 md:auto-rows-[33rem] md:grid-cols-3",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function BentoGridItem({
  className,
  title,
  description,
  header,
  icon,
}: {
  className?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  header?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <article
      className={cn(
        "group relative flex min-h-[24rem] flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[#0a0d14] p-5 shadow-[0_22px_60px_rgba(0,0,0,0.42)] transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_26px_70px_rgba(0,0,0,0.48)] md:min-h-0",
        className,
      )}
    >
      <div className="relative min-h-[17rem] flex-1 overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#0a0c14]/90 p-4 md:min-h-0">
        {header}
      </div>
      <div className="relative mt-5 space-y-3">
        {icon && (
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-[#8d81ff]">
            {icon}
          </div>
        )}
        <div className="text-3xl font-semibold tracking-tight text-white">
          {title}
        </div>
        <div className="max-w-xl text-sm leading-6 text-slate-300">
          {description}
        </div>
      </div>
    </article>
  );
}
