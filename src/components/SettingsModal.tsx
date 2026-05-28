import { open } from "@tauri-apps/plugin-dialog";

interface Settings {
  defaultFolder: string | null;
}

interface SettingsModalProps {
  settings: Settings;
  onSave: (settings: Settings) => void;
  onClose: () => void;
}

export function SettingsModal({ settings, onSave, onClose }: SettingsModalProps) {
  const selectFolder = async () => {
    const selected = await open({
      directory: true,
      multiple: false,
    });
    if (selected && typeof selected === "string") {
      onSave({ ...settings, defaultFolder: selected });
    }
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-md p-6">
        <h3 className="font-bold text-lg mb-6">Settings</h3>

        <div className="form-control w-full gap-4">
          <div>
            <label className="label p-0 mb-1">
              <span className="label-text font-bold">Default Music Folder</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                placeholder="No folder selected"
                className="input input-bordered input-xs flex-1"
                value={settings.defaultFolder || ""}
              />
              <button className="btn btn-xs btn-outline" onClick={selectFolder}>
                Browse
              </button>
            </div>
            <p className="text-[10px] opacity-50 mt-1">
              This folder will be scanned automatically when the app starts.
            </p>
          </div>
        </div>

        <div className="modal-action mt-8">
          <button className="btn btn-xs btn-primary px-6" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
