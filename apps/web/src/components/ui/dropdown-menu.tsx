import * as React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils';

interface DropdownMenuProps {
  children: React.ReactNode;
}

interface DropdownContext {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

const DropdownCtx = React.createContext<DropdownContext>({
  open: false,
  setOpen: () => {},
  triggerRef: { current: null },
});

function DropdownMenu({ children }: DropdownMenuProps) {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  return (
    <DropdownCtx.Provider value={{ open, setOpen, triggerRef }}>
      <div className="relative inline-block">{children}</div>
    </DropdownCtx.Provider>
  );
}

interface DropdownMenuTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

function DropdownMenuTrigger({ children, asChild }: DropdownMenuTriggerProps) {
  const { open, setOpen, triggerRef } = React.useContext(DropdownCtx);

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      ref: triggerRef,
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        setOpen(!open);
        (children as any).props?.onClick?.(e);
      },
    });
  }

  return (
    <button ref={triggerRef} onClick={() => setOpen(!open)}>
      {children}
    </button>
  );
}

interface DropdownMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'start' | 'end';
}

function DropdownMenuContent({
  children,
  className,
  align = 'end',
  ...props
}: DropdownMenuContentProps) {
  const { open, setOpen, triggerRef } = React.useContext(DropdownCtx);
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (
        contentRef.current &&
        !contentRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, setOpen, triggerRef]);

  if (!open) return null;

  const rect = triggerRef.current?.getBoundingClientRect();
  const style: React.CSSProperties = rect
    ? {
        position: 'fixed',
        top: rect.bottom + 4,
        ...(align === 'end'
          ? { right: window.innerWidth - rect.right }
          : { left: rect.left }),
        zIndex: 50,
      }
    : {};

  return createPortal(
    <div
      ref={contentRef}
      style={style}
      className={cn(
        'min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md',
        className
      )}
      {...props}
    >
      {children}
    </div>,
    document.body
  );
}

function DropdownMenuItem({
  className,
  onClick,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { setOpen } = React.useContext(DropdownCtx);
  return (
    <div
      className={cn(
        'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground',
        className
      )}
      onClick={(e) => {
        onClick?.(e);
        setOpen(false);
      }}
      {...props}
    />
  );
}

function DropdownMenuSeparator({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('-mx-1 my-1 h-px bg-muted', className)} {...props} />;
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
};
