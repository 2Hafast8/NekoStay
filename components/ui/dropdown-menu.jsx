"use client"

import * as React from "react"
import { Menu as MenuPrimitive } from "@base-ui/react/menu"

import { cn } from "@/lib/utils"
import { ChevronRightIcon, CheckIcon } from "lucide-react"

function DropdownMenu({
  ...props
}) {
  return <MenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
}

function DropdownMenuPortal({
  ...props
}) {
  return <MenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />;
}

function DropdownMenuTrigger({
  className,
  ...props
}) {
  return (
    <MenuPrimitive.Trigger
      data-slot="dropdown-menu-trigger"
      className={cn("cursor-pointer outline-none", className)}
      {...props}
    />
  );
}

function DropdownMenuContent({
  align = "start",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 4,
  className,
  ...props
}) {
  const popupRef = React.useRef(null);

  React.useEffect(() => {
    const el = popupRef.current;
    if (!el) return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    import("animejs").then(({ animate, utils }) => {
      // Animate container popup
      animate({
        targets: el,
        scale: [0.95, 1],
        opacity: [0, 1],
        translateY: [-6, 0],
        duration: 240,
        easing: "easeOutQuad",
      });

      // Stagger items entry
      const items = el.querySelectorAll(
        '[data-slot="dropdown-menu-item"], [data-slot="dropdown-menu-checkbox-item"], [data-slot="dropdown-menu-radio-item"], [data-slot="dropdown-menu-label"]'
      );
      if (items.length > 0) {
        animate({
          targets: items,
          opacity: [0, 1],
          translateX: [-8, 0],
          duration: 280,
          delay: utils.stagger(30, { start: 40 }),
          easing: "easeOutQuad",
        });
      }
    });
  }, []);

  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner
        className="isolate z-50 outline-none"
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}>
        <MenuPrimitive.Popup
          ref={popupRef}
          data-slot="dropdown-menu-content"
          className={cn(
            // Layout & sizing
            "z-50 max-h-(--available-height) w-(--anchor-width) min-w-[180px] origin-(--transform-origin) overflow-x-hidden overflow-y-auto outline-none",
            // Custom premium background: frosted glass
            "rounded-2xl p-1.5",
            "bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl",
            // Custom border & shadow
            "border border-neutral-200/70 dark:border-neutral-700/60",
            "shadow-[0_8px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.06)]",
            "dark:shadow-[0_8px_32px_rgba(0,0,0,0.4),0_2px_8px_rgba(0,0,0,0.2)]",
            className
          )}
          {...props} />
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  );
}

function DropdownMenuGroup({
  ...props
}) {
  return <MenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />;
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}) {
  return (
    <div
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn(
        "px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 data-[inset]:pl-8",
        className
      )}
      {...props}
    />
  );
}

function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}) {
  return (
    <MenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        // Base layout
        "group/dropdown-menu-item relative flex cursor-pointer select-none items-center gap-2.5",
        "rounded-xl px-3 py-2 text-sm outline-none",
        // Typography
        "font-medium text-neutral-700 dark:text-neutral-200",
        // Custom hover: brand-tinted background + left accent bar via before pseudo
        "transition-all duration-150",
        "hover:bg-orange-50 hover:text-orange-700 dark:hover:bg-orange-950/40 dark:hover:text-orange-300",
        "focus:bg-orange-50 focus:text-orange-700 dark:focus:bg-orange-950/40 dark:focus:text-orange-300",
        // Inset support
        "data-inset:pl-8",
        // Disabled state
        "data-disabled:pointer-events-none data-disabled:opacity-40",
        // SVG icons
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        // Destructive variant
        "data-[variant=destructive]:text-red-600 dark:data-[variant=destructive]:text-red-400",
        "data-[variant=destructive]:hover:bg-red-50 dark:data-[variant=destructive]:hover:bg-red-950/30",
        "data-[variant=destructive]:focus:bg-red-50 dark:data-[variant=destructive]:focus:bg-red-950/30",
        className
      )}
      {...props} />
  );
}

function DropdownMenuSub({
  ...props
}) {
  return <MenuPrimitive.SubmenuRoot data-slot="dropdown-menu-sub" {...props} />;
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}) {
  return (
    <MenuPrimitive.SubmenuTrigger
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        "flex cursor-pointer select-none items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium outline-none",
        "text-neutral-700 dark:text-neutral-200 transition-all duration-150",
        "hover:bg-orange-50 hover:text-orange-700 dark:hover:bg-orange-950/40 dark:hover:text-orange-300",
        "focus:bg-orange-50 focus:text-orange-700 dark:focus:bg-orange-950/40 dark:focus:text-orange-300",
        "data-popup-open:bg-orange-50 data-popup-open:text-orange-700 dark:data-popup-open:bg-orange-950/40 dark:data-popup-open:text-orange-300",
        "data-open:bg-orange-50 data-open:text-orange-700 dark:data-open:bg-orange-950/40 dark:data-open:text-orange-300",
        "data-inset:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}>
      {children}
      <ChevronRightIcon className="ml-auto opacity-50" />
    </MenuPrimitive.SubmenuTrigger>
  );
}

function DropdownMenuSubContent({
  align = "start",
  alignOffset = -3,
  side = "right",
  sideOffset = 0,
  className,
  ...props
}) {
  return (
    <DropdownMenuContent
      data-slot="dropdown-menu-sub-content"
      className={cn(
        "w-auto min-w-[96px] rounded-lg bg-popover p-1 text-popover-foreground shadow-lg ring-1 ring-foreground/10 duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
        className
      )}
      align={align}
      alignOffset={alignOffset}
      side={side}
      sideOffset={sideOffset}
      {...props} />
  );
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  inset,
  ...props
}) {
  return (
    <MenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      data-inset={inset}
      className={cn(
        "relative flex cursor-pointer select-none items-center gap-2.5 rounded-xl py-2 pr-9 pl-3 text-sm font-medium outline-none",
        "text-neutral-700 dark:text-neutral-200 transition-all duration-150",
        "hover:bg-orange-50 hover:text-orange-700 dark:hover:bg-orange-950/40 dark:hover:text-orange-300",
        "focus:bg-orange-50 focus:text-orange-700 dark:focus:bg-orange-950/40 dark:focus:text-orange-300",
        "data-inset:pl-8 data-disabled:pointer-events-none data-disabled:opacity-40",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      checked={checked}
      {...props}>
      <span
        className="pointer-events-none absolute right-2.5 flex size-4 items-center justify-center rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-orange-500"
        data-slot="dropdown-menu-checkbox-item-indicator">
        <MenuPrimitive.CheckboxItemIndicator>
          <CheckIcon className="size-3" />
        </MenuPrimitive.CheckboxItemIndicator>
      </span>
      {children}
    </MenuPrimitive.CheckboxItem>
  );
}

function DropdownMenuRadioGroup({
  ...props
}) {
  return (<MenuPrimitive.RadioGroup data-slot="dropdown-menu-radio-group" {...props} />);
}

function DropdownMenuRadioItem({
  className,
  children,
  inset,
  ...props
}) {
  return (
    <MenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      data-inset={inset}
      className={cn(
        "relative flex cursor-pointer select-none items-center gap-2.5 rounded-xl py-2 pr-9 pl-3 text-sm font-medium outline-none",
        "text-neutral-700 dark:text-neutral-200 transition-all duration-150",
        "hover:bg-orange-50 hover:text-orange-700 dark:hover:bg-orange-950/40 dark:hover:text-orange-300",
        "focus:bg-orange-50 focus:text-orange-700 dark:focus:bg-orange-950/40 dark:focus:text-orange-300",
        "data-inset:pl-8 data-disabled:pointer-events-none data-disabled:opacity-40",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}>
      <span
        className="pointer-events-none absolute right-2.5 flex size-4 items-center justify-center rounded-full border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800"
        data-slot="dropdown-menu-radio-item-indicator">
        <MenuPrimitive.RadioItemIndicator>
          <span className="block size-2 rounded-full bg-orange-500" />
        </MenuPrimitive.RadioItemIndicator>
      </span>
      {children}
    </MenuPrimitive.RadioItem>
  );
}

function DropdownMenuSeparator({
  className,
  ...props
}) {
  return (
    <MenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn("-mx-1.5 my-1.5 h-px bg-neutral-100 dark:bg-neutral-800", className)}
      {...props} />
  );
}

function DropdownMenuShortcut({
  className,
  ...props
}) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn(
        "ml-auto rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 text-[10px] font-mono tracking-wide text-neutral-400 dark:text-neutral-500",
        "group-focus/dropdown-menu-item:border-orange-200 group-focus/dropdown-menu-item:bg-orange-50 group-focus/dropdown-menu-item:text-orange-500 dark:group-focus/dropdown-menu-item:border-orange-800 dark:group-focus/dropdown-menu-item:bg-orange-950/30 dark:group-focus/dropdown-menu-item:text-orange-400",
        className
      )}
      {...props} />
  );
}

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
}
