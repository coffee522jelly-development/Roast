interface Mp3Metadata {
  path: String;
  filename: String;
  title: string | null;
  artist: string | null;
  album: string | null;
  year: number | null;
}

interface EditModalProps {
  file: Mp3Metadata;
  onSave: (file: Mp3Metadata) => void;
  onCancel: () => void;
  onChange: (file: Mp3Metadata) => void;
}

export function EditModal({ file, onSave, onCancel, onChange }: EditModalProps) {
  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Edit Metadata</h2>
        <label>
          Title:
          <input
            value={file.title || ""}
            onChange={(e) => onChange({ ...file, title: e.target.value })}
          />
        </label>
        <label>
          Artist:
          <input
            value={file.artist || ""}
            onChange={(e) => onChange({ ...file, artist: e.target.value })}
          />
        </label>
        <label>
          Album:
          <input
            value={file.album || ""}
            onChange={(e) => onChange({ ...file, album: e.target.value })}
          />
        </label>
        <label>
          Year:
          <input
            type="number"
            value={file.year || ""}
            onChange={(e) => onChange({ ...file, year: parseInt(e.target.value) || null })}
          />
        </label>
        <div className="modal-actions">
          <button onClick={() => onSave(file)}>Save</button>
          <button onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
