import type { ReactNode } from "react";
import Button, { ButtonVariant, type ButtonVariant as ButtonVariantName } from "./Button";
import Modal, { ModalAlign, ModalSize, type ModalAlign as ModalAlignName, type ModalSize as ModalSizeName } from "./Modal";

export type ModalBoxButton = {
  text: string;
  onClick: () => void;
  variant?: ButtonVariantName;
  background?: string;
  disabled?: boolean;
};

type ModalBoxProps = {
  open: boolean;
  title: string;
  description?: string;
  text?: ReactNode;
  note?: ReactNode;
  onClose: () => void;
  buttons?: ModalBoxButton[];
  alert?: boolean;
  children?: ReactNode;
  size?: ModalSizeName;
  align?: ModalAlignName;
};

export default function ModalBox({
  open,
  title,
  description,
  text,
  note,
  onClose,
  buttons = [],
  alert = false,
  children,
  size = ModalSize.sm,
  align = ModalAlign.center,
}: ModalBoxProps) {
  const confirmation = Boolean(alert || text || note || buttons.length > 0);

  return (
    <Modal
      open={open}
      title={title}
      description={confirmation ? undefined : description}
      onClose={onClose}
      size={size}
      align={align}
      compact
      hideTitle={confirmation}
    >
      {confirmation ? (
        <div className="flex flex-col items-center px-1 pb-1 text-center">
          {alert ? (
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[#f4dddd] text-[#b44850]">
              <AlertIcon />
            </span>
          ) : null}
          <h2 id="modal-title" className={`${alert ? "mt-3" : ""} text-base font-semibold text-slate-900`}>
            {title}
          </h2>
          {description ? <p className="mt-0.5 text-xs text-slate-500">{description}</p> : null}
          {text ? <div className="mt-1 text-sm text-slate-500">{text}</div> : null}
          {note ? <p className="mt-1 text-xs text-slate-400">{note}</p> : null}
          {children}
          {buttons.length > 0 ? (
            <div className="mt-4 flex w-full gap-2">
              {buttons.map((button, index) => (
                <Button
                  key={`${button.text}-${index}`}
                  variant={button.variant ?? ButtonVariant.secondary}
                  background={button.background}
                  width="100%"
                  onClick={button.onClick}
                  disabled={button.disabled}
                >
                  {button.text}
                </Button>
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        children
      )}
    </Modal>
  );
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
      <path d="M10.3 4.8 2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.8a2 2 0 0 0-3.4 0Z" />
    </svg>
  );
}
