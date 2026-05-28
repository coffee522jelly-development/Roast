import { Mp3Metadata } from "../App";

interface EditModalProps {
  file: Mp3Metadata;
  onSave: (file: Mp3Metadata) => void;
  onCancel: () => void;
  onChange: (file: Mp3Metadata) => void;
}

export function EditModal({ file, onSave, onCancel, onChange }: EditModalProps) {
  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-sm p-4">
        <h3 className="font-bold text-lg mb-4">Edit Metadata</h3>
        <div className="form-control gap-2">
          <label className="label p-0">
            <span className="label-text text-xs">Title</span>
          </label>
          <input
            className="input input-bordered input-xs w-full"
            value={file.title || ""}
            onChange={(e) => onChange({ ...file, title: e.target.value })}
          />

          <label className="label p-0">
            <span className="label-text text-xs">Artist</span>
          </label>
          <input
            className="input input-bordered input-xs w-full"
            value={file.artist || ""}
            onChange={(e) => onChange({ ...file, artist: e.target.value })}
          />

          <label className="label p-0">
            <span className="label-text text-xs">Album</span>
          </label>
          <input
            className="input input-bordered input-xs w-full"
            value={file.album || ""}
            onChange={(e) => onChange({ ...file, album: e.target.value })}
          />

          <label className="label p-0">
            <span className="label-text text-xs">Year</span>
          </label>
          <input
            type="number"
            className="input input-bordered input-xs w-full"
            value={file.year || ""}
            onChange={(e) => onChange({ ...file, year: parseInt(e.target.value) || null })}
          />
        </div>
        <div className="modal-action mt-6 gap-2">
          <button className="btn btn-xs btn-primary" onClick={() => onSave(file)}>Save</button>
          <button className="btn btn-xs" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
