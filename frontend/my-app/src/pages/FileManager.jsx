import { useState, useEffect } from 'react';
import axios from 'axios';

const FileManager = () => {
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [files, setFiles] = useState([]);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    const res = await axios.get('http://localhost:5000/api/files');
    setFiles(res.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !link) return alert('Please fill in both fields');

    await axios.post('http://localhost:5000/api/files', { title, link });
    setTitle('');
    setLink('');
    fetchFiles();
  };

  return (
    <div className="mx-auto w-full max-w-screen-xl px-4 py-6">
      <div className="p-6 max-w-3xl mx-auto w-full">
      <h1 className="text-2xl font-bold mb-4">📄 Google Docs File Manager</h1>

      <form onSubmit={handleSubmit} className="mb-6 space-y-3">
        <input
          type="text"
          placeholder="Enter document title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border p-2 rounded"
        />
        <input
          type="text"
          placeholder="Paste Google Docs link"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          className="w-full border p-2 rounded"
        />
        <button className="bg-blue-600 text-white px-4 py-2 rounded">Add Document</button>
      </form>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        {files.map((file) => (
          <div key={file._id} className="border rounded p-3 shadow-sm hover:shadow-md transition">
            <h3 className="font-semibold">{file.title}</h3>
            <a
              href={`/viewer/${file._id}`}
              className="text-blue-500 underline text-sm"
            >
              View Document →
            </a>
          </div>
        ))}
      </div>
      </div>
    </div>
  );
};

export default FileManager;
