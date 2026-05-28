import { useState } from "react";
import { Mp3Metadata } from "../App";

interface Mp3TableProps {
  files: Mp3Metadata[];
  onEdit: (file: Mp3Metadata) => void;
  onOrganize: (path: string) => void;
  onSelect: (file: Mp3Metadata) => void;
  onDoubleClick: (file: Mp3Metadata) => void;
  selectedPath: string | null;
}

export function Mp3Table({ files, onEdit, onOrganize, onSelect, onDoubleClick, selectedPath }: Mp3TableProps) {
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, file: Mp3Metadata } | null>(null);

  const formatDuration = (seconds: number | null) => {
    if (seconds === null) return "-";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleContextMenu = (e: React.MouseEvent, file: Mp3Metadata) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, file });
    onSelect(file);
  };

  const closeContextMenu = () => setContextMenu(null);

  return (
    <div className="overflow-x-auto h-full relative" onClick={closeContextMenu}>
      <table className="table table-xs table-pin-rows">
        <thead>
          <tr>
            <th>Filename</th>
            <th>Title</th>
            <th>Artist</th>
            <th>Length</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {files.map((file) => (
            <tr
              key={file.path}
              className={`hover cursor-pointer border-transparent ${selectedPath === file.path ? "bg-primary/10 text-primary font-medium" : ""}`}
              onClick={(e) => { e.stopPropagation(); onSelect(file); }}
              onDoubleClick={() => onDoubleClick(file)}
              onContextMenu={(e) => handleContextMenu(e, file)}
            >
              <td className="max-w-xs truncate opacity-80">{file.filename}</td>
              <td className="truncate max-w-[150px]">{file.title || "-"}</td>
              <td className="truncate max-w-[150px] opacity-60 uppercase text-[9px] tracking-widest">{file.artist || "-"}</td>
              <td className="opacity-50 font-mono text-[10px]">{formatDuration(file.duration)}</td>
              <td className="flex gap-1">
                <button
                  className="btn btn-[8px] h-5 min-h-0 btn-ghost border border-base-content/10 hover:bg-primary hover:text-primary-content hover:border-transparent transition-all"
                  onClick={(e) => { e.stopPropagation(); onEdit(file); }}
                >
                  Edit
                </button>
                <button
                  className="btn btn-[8px] h-5 min-h-0 btn-ghost border border-primary/20 text-primary hover:bg-primary hover:text-primary-content hover:border-transparent transition-all"
                  onClick={(e) => { e.stopPropagation(); onOrganize(file.path); }}
                >
                  Organize
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {contextMenu && (
        <div
          className="fixed z-50 bg-base-200 border border-base-content/10 shadow-xl rounded-lg p-1 min-w-[120px]"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <ul className="menu menu-xs p-0 gap-0.5">
            <li>
              <button
                className="hover:bg-primary hover:text-primary-content py-1.5"
                onClick={() => { onEdit(contextMenu.file); closeContextMenu(); }}
              >
                Edit Meta
              </button>
            </li>
            <li>
              <button
                className="hover:bg-primary hover:text-primary-content py-1.5"
                onClick={() => { onOrganize(contextMenu.file.path); closeContextMenu(); }}
              >
                Organize
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
