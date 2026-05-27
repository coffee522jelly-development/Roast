interface Mp3Metadata {
  path: String;
  filename: String;
  title: string | null;
  artist: string | null;
  album: string | null;
  year: number | null;
}

interface Mp3TableProps {
  files: Mp3Metadata[];
  onEdit: (file: Mp3Metadata) => void;
  onOrganize: (path: string) => void;
}

export function Mp3Table({ files, onEdit, onOrganize }: Mp3TableProps) {
  return (
    <div className="file-list">
      <table>
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
            <tr key={file.path as string}>
              <td>{file.filename}</td>
              <td>{file.title || "-"}</td>
              <td>{file.artist || "-"}</td>
              <td>
                <button onClick={() => onEdit(file)}>Edit</button>
                <button onClick={() => onOrganize(file.path as string)}>Organize</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
