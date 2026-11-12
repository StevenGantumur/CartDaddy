import { useEffect, useRef } from "react";

// A thin wrapper around the native <dialog>. showModal() gives us the hard
// accessibility parts for free: focus is trapped inside, Escape closes it,
// the page behind becomes inert, and focus returns to whatever opened it.
// `side` is a panel sliding in from the right; `center` is a small modal.
function Sheet({ open, onClose, label, variant = "side", children }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={label}
      onClose={onClose}
      // A click whose target is the <dialog> itself landed on the backdrop,
      // because the body below fills the whole dialog box.
      onClick={(e) => e.target === ref.current && onClose()}
      className={`sheet ${variant === "center" ? "sheet-center" : ""}`}
    >
      <div className="h-full overflow-y-auto p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {open && children}
      </div>
    </dialog>
  );
}

export default Sheet;
