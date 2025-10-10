import React, { useState, useEffect } from 'react';
import API from '../api';

// Hide upload UI for Admin users. Fetch profile to check role.

export default function UploadFile({ onUploadSuccess }) {
    const [file, setFile] = useState(null);
    const [files, setFiles] = useState([]);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [profile, setProfile] = useState(null);
    const token = localStorage.getItem('accessToken');

    useEffect(() => {
        fetchFiles();
        const fetchProfile = async () => {
            try {
                const res = await API.get('/users/profile', { headers: { Authorization: `Bearer ${token}` } });
                setProfile(res.data.user);
            } catch (err) {
                // ignore
            }
        };
        fetchProfile();
    }, []);

    async function fetchFiles() {
        try {
            const res = await API.get('/api/files/my');
            setFiles(res.data.files || []);
        } catch (err) {
            console.err();
        }
    }

    async function handleUpload(e) {
        e.preventDefault();
        if (!file) return alert ('Please select a file');

        const form = new FormData();
        form.append('file', file),
        form.append('title', title),
        form.append('description', description);


        try {
            await API.post('/api/files/upload', form, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setFile(null);
            setTitle('');
            setDescription('');
            fetchFiles();
            if (onUploadSuccess) onUploadSuccess();
            alert('Upload successful');
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Upload failed');
        }
    }

    async function handleDelete(id) {
        if (!confirm('Delete this file?')) return;
        try {
            await API.delete(`/api/files/${id}`);
            fetchFiles();
        } catch (err) {
            alert('Delete failed');
        }
    }

    return (
        <div>
            {profile?.role === 'Admin' ? (
                <p>Admins cannot upload files through the UI.</p>
            ) : (
                <>
                    <h3>Upload File</h3>
                    <form onSubmit={handleUpload} encType="multipart/form-data">
                        <input type="file" onChange={(e) => setFile(e.target.files[0])} accept=".pdf,.doc,.docx,.txt" required />
                        <input placeholder="Title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} />
                        <input placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
                        <button type="submit">Upload</button>
                    </form>
                </>
            )}

            <h4>Your Files</h4>
            <ul>
                {files.map(f => (
                    <li key={f._id}>
                        <a href={`/api/files/${f._id}/download`} target="_blank" rel="noreferrer">{f.title || f.originalName}</a>
                        &nbsp;({(f.size/1024).toFixed(1)} KB)
                        <button onClick={() => handleDelete(f._id)}>Delete</button>
                    </li>
                ))}
            </ul>
        </div>
    );
}