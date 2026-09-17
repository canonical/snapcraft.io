import { pointer, Selection, BaseType } from "d3-selection";

export default function chartTooltip(
  holder: Selection<BaseType, unknown, HTMLElement, unknown>,
  className: string,
) {
  const tooltip = holder
    .append("div")
    .attr("class", `${className} u-no-margin`);
  const message = tooltip.append("div").attr("class", "p-tooltip__message");

  return {
    show(html: string) {
      message.html(html);
      tooltip.style("display", "block");
    },
    move(event: MouseEvent) {
      const [x, y] = pointer(event, holder.node() as HTMLElement);
      tooltip.style("top", `${y}px`).style("left", `${x}px`);
    },
    hide() {
      tooltip.style("display", "none");
    },
  };
}
