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
  const formatDuration = (seconds: number | null) => {
    if (seconds === null) return "-";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="overflow-x-auto h-full relative">
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
              onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick(file); }}
            >
              <td className="max-w-xs truncate opacity-80">{file.filename}</td>
              <td className="truncate max-w-[150px]">{file.title || "-"}</td>
              <td className="truncate max-w-[150px] opacity-60 uppercase text-[9px] tracking-widest">{file.artist || "-"}</td>
              <td className="opacity-50 font-mono text-[10px]">{formatDuration(file.duration)}</td>
              <td className="flex gap-1">
                <button
                  className="btn text-[8px] h-5 min-h-0 btn-ghost border border-base-content/10 hover:bg-primary hover:text-primary-content hover:border-transparent transition-all"
                  onClick={(e) => { e.stopPropagation(); onEdit(file); }}
                >
                  Edit
                </button>
                <button
                  className="btn text-[8px] h-5 min-h-0 btn-ghost border border-primary/20 text-primary hover:bg-primary hover:text-primary-content hover:border-transparent transition-all"
                  onClick={(e) => { e.stopPropagation(); onOrganize(file.path); }}
                >
                  Organize
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
