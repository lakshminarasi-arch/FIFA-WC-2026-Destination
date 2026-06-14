import type { CSSProperties } from "react";
import type { Team } from "../../types";
import { styleForTeam } from "../../lib/flags";

interface FlagProps {
  teams: Record<string, Team>;
  code: string | null | undefined;
  width: number;
  height: number;
  /** Border radius of the swatch. */
  radius?: number;
  /** Border colour; defaults to a faint dark hairline. */
  border?: string;
}

// A flag swatch — CSS colour bands inside a bordered, clipped box (placeholder
// art per the handoff). Swap for real flag SVGs when a flag library is added.
export function Flag({
  teams,
  code,
  width,
  height,
  radius = 3,
  border = "rgba(0,0,0,.08)",
}: FlagProps) {
  const wrap: CSSProperties = {
    width,
    height,
    borderRadius: radius,
    border: `1px solid ${border}`,
    overflow: "hidden",
    flex: "none",
  };
  return (
    <div style={wrap}>
      <div style={styleForTeam(teams, code)} />
    </div>
  );
}
