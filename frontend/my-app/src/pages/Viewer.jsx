import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const Viewer = () => {
  const { id } = useParams();
  const [file, setFile] = useState(null);

  useEffect(() => {
    axios.get(`http://localhost:5000/api/files`)
      .then((res) => {
        const doc = res.data.find((f) => f._id === id);
        setFile(doc);
      });
  }, [id]);

  if (!file) return <p>Loading document...</p>;

  const embedLink = file.link.replace('/edit', '/preview');

  return (
    <div className="p-4 w-full max-w-4xl mx-auto">
      <h1 className="text-xl font-bold mb-3">{file.title}</h1>
      <iframe
        src={embedLink}
        width="100%"
        height="600"
        title={file.title}
        className="border rounded w-full h-[60vh] md:h-[80vh]"
      />
    </div>
  );
};

export default Viewer;
