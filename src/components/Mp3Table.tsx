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
    <div className="overflow-x-auto h-full">
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
              className={`hover cursor-pointer ${selectedPath === file.path ? "bg-base-200" : ""}`}
              onClick={() => onSelect(file)}
              onDoubleClick={() => onDoubleClick(file)}
            >
              <td className="max-w-xs truncate">{file.filename}</td>
              <td className="truncate max-w-[150px]">{file.title || "-"}</td>
              <td className="truncate max-w-[150px]">{file.artist || "-"}</td>
              <td>{formatDuration(file.duration)}</td>
              <td className="flex gap-1">
                <button
                  className="btn btn-xs btn-outline"
                  onClick={(e) => { e.stopPropagation(); onEdit(file); }}
                >
                  Edit
                </button>
                <button
                  className="btn btn-xs btn-outline btn-primary"
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
