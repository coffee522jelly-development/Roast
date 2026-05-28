import { useState, useEffect, useRef, useMemo } from "react";
import { invoke, convertFileSrc } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { Mp3Table } from "./components/Mp3Table";
import { EditModal } from "./components/EditModal";
import { DetailView } from "./components/DetailView";
import "./App.css";

export interface Mp3Metadata {
  path: string;
  filename: string;
  title: string | null;
  artist: string | null;
  album: string | null;
  year: number | null;
  duration: number | null;
  size: number;
}

function App() {
  const [selectedDir, setSelectedDir] = useState<string | null>(null);
  const [mp3Files, setMp3Files] = useState<Mp3Metadata[]>([]);
  const [editingFile, setEditingFile] = useState<Mp3Metadata | null>(null);
  const [selectedFile, setSelectedFile] = useState<Mp3Metadata | null>(null);
  const [selectedArtwork, setSelectedArtwork] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoop, setIsLoop] = useState(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const drawerToggleRef = useRef<HTMLInputElement | null>(null);

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

  const selectFile = async (file: Mp3Metadata) => {
    setSelectedFile(file);
    try {
      const artwork: string | null = await invoke("get_mp3_artwork", { path: file.path });
      setSelectedArtwork(artwork);
    } catch (err) {
      console.error("Error fetching artwork:", err);
      setSelectedArtwork(null);
    }
  };

  const playFile = (file: Mp3Metadata) => {
    selectFile(file);
    if (audioRef.current) {
      audioRef.current.src = convertFileSrc(file.path);
      audioRef.current.play();
      setIsPlaying(true);
    }
    // Open drawer on double click
    if (drawerToggleRef.current) {
      drawerToggleRef.current.checked = true;
    }
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const filteredFiles = useMemo(() => {
    if (!searchQuery) return mp3Files;
    const q = searchQuery.toLowerCase();
    return mp3Files.filter(f =>
      f.filename.toLowerCase().includes(q) ||
      (f.title?.toLowerCase().includes(q)) ||
      (f.artist?.toLowerCase().includes(q)) ||
      (f.album?.toLowerCase().includes(q))
    );
  }, [mp3Files, searchQuery]);

  // Update selected file if the list changes
  useEffect(() => {
    if (selectedFile) {
      const updated = mp3Files.find(f => f.path === selectedFile.path);
      if (updated) setSelectedFile(updated);
    }
  }, [mp3Files]);

  return (
    <div className="drawer drawer-end h-screen bg-base-100 text-base-content overflow-hidden">
      <input
        id="my-drawer"
        type="checkbox"
        className="drawer-toggle"
        ref={drawerToggleRef}
        defaultChecked={true}
      />
      <div className="drawer-content flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="navbar bg-base-200 border-b border-base-content/10 px-4 min-h-0 h-12 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-sm font-black tracking-tighter uppercase opacity-50">Roast</h1>
            <button className="btn btn-xs btn-ghost border border-base-content/20" onClick={selectDirectory}>
              Open Folder
            </button>
            {selectedDir && (
              <span className="text-[10px] opacity-50 truncate max-w-[200px]">
                {selectedDir}
              </span>
            )}
          </div>

          <div className="flex-1 max-w-sm mx-4">
            <input
              type="text"
              placeholder="Search..."
              className="input input-bordered input-xs w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-4">
            {status && <span className="text-[10px] italic opacity-50">{status}</span>}
            <label htmlFor="my-drawer" className="btn btn-xs btn-square btn-ghost border border-base-content/20">
              <span className="text-[10px]">INFO</span>
            </label>
          </div>
        </div>

        {/* Main Area */}
        <div className="flex-1 overflow-hidden p-2">
          <Mp3Table
            files={filteredFiles}
            onEdit={(file) => setEditingFile(file)}
            onOrganize={organizeFile}
            onSelect={selectFile}
            onDoubleClick={playFile}
            selectedPath={selectedFile?.path || null}
          />
        </div>

        {/* Simple Player Bar */}
        {selectedFile && (
          <div className="bg-base-300 h-16 border-t border-base-content/10 flex items-center px-4 gap-4">
             <button className="btn btn-circle btn-sm" onClick={togglePlay}>
                {isPlaying ? "⏸" : "▶"}
             </button>
             <div className="flex flex-col flex-1 min-w-0">
                <span className="text-xs font-bold truncate">{selectedFile.title || selectedFile.filename}</span>
                <span className="text-[10px] opacity-50">{selectedFile.artist || "Unknown Artist"}</span>
             </div>

             <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold opacity-50">Loop</span>
                <input
                  type="checkbox"
                  className="toggle toggle-xs"
                  checked={isLoop}
                  onChange={(e) => setIsLoop(e.target.checked)}
                />
             </div>

             <audio
              ref={audioRef}
              loop={isLoop}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              className="hidden"
             />
          </div>
        )}
      </div>

      {/* Sidebar (Detail View) */}
      <div className="drawer-side h-full overflow-hidden border-l border-base-content/10">
        <label htmlFor="my-drawer" className="drawer-overlay"></label>
        <div className="bg-base-200 w-80 h-full overflow-hidden">
          <DetailView file={selectedFile} artwork={selectedArtwork} />
        </div>
      </div>

      {editingFile && (
        <EditModal
          file={editingFile}
          onSave={updateMetadata}
          onCancel={() => setEditingFile(null)}
          onChange={(file) => setEditingFile(file)}
        />
      )}
    </div>
  );
}

export default App;
