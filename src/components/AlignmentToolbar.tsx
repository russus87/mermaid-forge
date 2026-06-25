import * as Icons from "lucide-react";

import { useStore } from "../store/useStore";

export function AlignmentToolbar() {
  const nodes = useStore((s) => s.nodes);
  const alignNodes = useStore((s) => s.alignNodes);
  const distributeNodes = useStore((s) => s.distributeNodes);
  const groupSelected = useStore((s) => s.groupSelected);
  const ungroupSelected = useStore((s) => s.ungroupSelected);

  const selected = nodes.filter((n) => n.selected);
  const selectedShapes = selected.filter((n) => !n.data.group);
  const hasGroupSelected = selected.some((n) => n.data.group);

  if (selectedShapes.length < 2 && !hasGroupSelected) return null;

  const canAlign = selectedShapes.length >= 2;
  const canDistribute = selectedShapes.length >= 3;

  return (
    <div className="mf-align">
      {canAlign && (
        <>
          <div className="mf-align-grp">
            <button onClick={() => alignNodes("left")} title="Align left"><Icons.AlignStartVertical size={15} /></button>
            <button onClick={() => alignNodes("hcenter")} title="Align center"><Icons.AlignCenterVertical size={15} /></button>
            <button onClick={() => alignNodes("right")} title="Align right"><Icons.AlignEndVertical size={15} /></button>
          </div>
          <div className="mf-align-grp">
            <button onClick={() => alignNodes("top")} title="Align top"><Icons.AlignStartHorizontal size={15} /></button>
            <button onClick={() => alignNodes("vcenter")} title="Align middle"><Icons.AlignCenterHorizontal size={15} /></button>
            <button onClick={() => alignNodes("bottom")} title="Align bottom"><Icons.AlignEndHorizontal size={15} /></button>
          </div>
          <div className="mf-align-grp">
            <button onClick={() => distributeNodes("h")} disabled={!canDistribute} title="Distribute horizontally"><Icons.AlignHorizontalSpaceAround size={15} /></button>
            <button onClick={() => distributeNodes("v")} disabled={!canDistribute} title="Distribute vertically"><Icons.AlignVerticalSpaceAround size={15} /></button>
          </div>
        </>
      )}
      <div className="mf-align-grp">
        {canAlign && (
          <button onClick={groupSelected} title="Group into container"><Icons.Group size={15} /></button>
        )}
        {hasGroupSelected && (
          <button onClick={ungroupSelected} title="Ungroup"><Icons.Ungroup size={15} /></button>
        )}
      </div>
    </div>
  );
}
