import { Mp3Metadata } from "../App";

interface Mp3TableProps {
  files: Mp3Metadata[];
  onEdit: (file: Mp3Metadata) => void;
  onOrganize: (path: string) => void;
  onSelect: (file: Mp3Metadata) => void;
  selectedPath: string | null;
}

export function Mp3Table({ files, onEdit, onOrganize, onSelect, selectedPath }: Mp3TableProps) {
  return (
    <div className="overflow-x-auto h-full">
      <table className="table table-xs table-pin-rows">
        <thead>
          <tr>
            <th>Filename</th>
            <th>Title</th>
            <th>Artist</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {files.map((file) => (
            <tr
              key={file.path}
              className={`hover cursor-pointer ${selectedPath === file.path ? "bg-base-200" : ""}`}
              onClick={() => onSelect(file)}
            >
              <td className="max-w-xs truncate">{file.filename}</td>
              <td>{file.title || "-"}</td>
              <td>{file.artist || "-"}</td>
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
