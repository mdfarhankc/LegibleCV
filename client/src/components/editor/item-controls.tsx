import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

type ItemControlsProps = {
  // What is being moved or removed, for screen readers: "section", "entry 2".
  label: string;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
};

export function ItemControls({
  label,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onRemove,
}: ItemControlsProps) {
  return (
    <div className="flex shrink-0 items-center">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        disabled={isFirst}
        onClick={onMoveUp}
        aria-label={`Move ${label} up`}
      >
        <ArrowUp />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        disabled={isLast}
        onClick={onMoveDown}
        aria-label={`Move ${label} down`}
      >
        <ArrowDown />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="text-muted-foreground hover:text-destructive"
        onClick={onRemove}
        aria-label={`Remove ${label}`}
      >
        <Trash2 />
      </Button>
    </div>
  );
}
