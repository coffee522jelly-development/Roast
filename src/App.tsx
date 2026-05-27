import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { Mp3Table } from "./components/Mp3Table";
import { EditModal } from "./components/EditModal";
import "./App.css";

export interface Mp3Metadata {
  path: String;
  filename: String;
  title: string | null;
  artist: string | null;
  album: string | null;
  year: number | null;
}

function App() {
  const [selectedDir, setSelectedDir] = useState<string | null>(null);
  const [mp3Files, setMp3Files] = useState<Mp3Metadata[]>([]);
  const [editingFile, setEditingFile] = useState<Mp3Metadata | null>(null);
  const [status, setStatus] = useState<string>("");

  async function selectDirectory() {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
      });
      if (selected && typeof selected === "string") {
        setSelectedDir(selected);
        loadMp3Files(selected);
      }
    } catch (err) {
      console.error(err);
      setStatus("Error selecting directory");
    }
  }

  async function loadMp3Files(dir: string) {
    try {
      const files: Mp3Metadata[] = await invoke("get_mp3_metadata", { dirPath: dir });
      setMp3Files(files);
      setStatus(`Loaded ${files.length} files`);
    } catch (err) {
      console.error(err);
      setStatus("Error loading files");
    }
  }

  async function organizeFile(path: string) {
    try {
      await invoke("organize_mp3", { path });
      setStatus("File organized");
      if (selectedDir) loadMp3Files(selectedDir);
    } catch (err) {
      console.error(err);
      setStatus(`Error organizing file: ${err}`);
    }
  }

  async function updateMetadata(file: Mp3Metadata) {
    try {
      await invoke("update_mp3_metadata", { path: file.path, metadata: file });
      setStatus("Metadata updated");
      setEditingFile(null);
      if (selectedDir) loadMp3Files(selectedDir);
    } catch (err) {
      console.error(err);
      setStatus("Error updating metadata");
    }
  }

  return (
    <main className="container">
      <h1>Roast - Music Manager</h1>

      <div className="controls">
        <button onClick={selectDirectory}>Select Directory</button>
        {selectedDir && <p>Directory: {selectedDir}</p>}
        {status && <p className="status">{status}</p>}
      </div>

      <Mp3Table
        files={mp3Files}
        onEdit={(file) => setEditingFile(file)}
        onOrganize={organizeFile}
      />

      {editingFile && (
        <EditModal
          file={editingFile}
          onSave={updateMetadata}
          onCancel={() => setEditingFile(null)}
          onChange={(file) => setEditingFile(file)}
        />
      )}
    </main>
  );
}

export default App;
