"use client";

export default function Modal({
  onClose,
  children,
  maxWidth = "460px",
}: {
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-coffee/55 p-3.5 md:items-center md:p-8"
      onClick={onClose}
    >
      <div
        className="w-full rounded-t-[20px] bg-ivory p-6 md:max-h-[88vh] md:overflow-auto md:rounded-[20px]"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
