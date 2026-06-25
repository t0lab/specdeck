import { ColumnTag } from "@/components/status/column-tag";
import { SpecCardView } from "@/components/board/spec-card-view";
import type { BoardColumn, SpecCard } from "@/mock/types";

// One board column: header (ColumnTag + count) over a vertical stack of cards.
export function BoardColumnLane({
  column,
  cards,
}: {
  column: BoardColumn;
  cards: SpecCard[];
}) {
  return (
    <section className="flex flex-col gap-3" aria-label={column}>
      <ColumnTag column={column} count={cards.length} />
      <div className="flex flex-col gap-3">
        {cards.map((card) => (
          <SpecCardView key={card.id} card={card} />
        ))}
      </div>
    </section>
  );
}
