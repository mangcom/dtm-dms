interface ComingSoonProps {
  title: string;
  phase: string;
}

export function ComingSoon({ title, phase }: ComingSoonProps) {
  return (
    <div className="animate-fadein">
      <div className="mb-1 text-[22px] font-bold">{title}</div>
      <div className="mb-6 text-sm text-text-2">ฟีเจอร์นี้จะเปิดใช้งานใน {phase}</div>
      <div className="flex items-center justify-center rounded-xl border border-dashed border-border bg-surface py-20 text-sm text-text-3">
        อยู่ระหว่างการพัฒนา
      </div>
    </div>
  );
}
