import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import NoteCard from '../components/NoteCard';
import NoteEditor from '../components/NoteEditor';
// import { toast } from 'react-hot-toast';

const API_URL = 'http://localhost:5000'; // Replace with your API endpoint

export default function Favorites() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Array<{ _id: string; title: string; content: string; created_at: string; is_favorite: boolean; image_url?: string; audio_url?: string }>>([]);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  const fetchFavorites = async () => {
    try {
      const response = await fetch(`${API_URL}/notes?user_id=${user.id}&is_favorite=true`);
      if (!response.ok) throw new Error('Error fetching favorites');
      const data = await response.json();
      setNotes(data);
    } catch (error) {
      // toast.error('Error fetching favorites');
      console.error('Error:', error);
    }
  };

  // const handleSaveNote = async (noteData :any) => {
  //   const { title, content, image } = noteData;

  //   try {
  //     let imageUrl = null;

  //     if (image) {
  //       const formData = new FormData();
  //       formData.append('file', image);
  //       const uploadResponse = await fetch(`${API_URL}/upload`, {
  //         method: 'POST',
  //         body: formData,
  //       });
  //       if (!uploadResponse.ok) throw new Error('Error uploading image');
  //       const uploadData = await uploadResponse.json();
  //       imageUrl = uploadData.publicUrl;
  //     }

  //     const notePayload = {
  //       title,
  //       content,
  //       image_url: imageUrl || editingNote?.image_url,
  //     };

  //     const response = await fetch(`${API_URL}/notes/${editingNote.id}`, {
  //       method: 'PUT',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify(notePayload),
  //     });

  //     if (!response.ok) throw new Error('Error saving note');

  //     toast.success('Note updated successfully');
  //     fetchFavorites();
  //   } catch (error) {
  //     toast.error('Error saving note');
  //     console.error('Error:', error);
  //   }
  // };

  const handleDeleteNote = async (id:any) => {
    try {
      const response = await fetch(`${API_URL}/notes/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Error deleting note');
      // toast.success('Note deleted successfully');
      fetchFavorites();
    } catch (error) {
      // toast.error('Error deleting note');
      console.error('Error:', error);
    }
  };

  const handleToggleFavorite = async (id:any, isFavorite:any) => {
    try {
      const response = await fetch(`${API_URL}/notes/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_favorite: isFavorite }),
      });
      if (!response.ok) throw new Error('Error updating favorite status');
      fetchFavorites();
    } catch (error) {
      // toast.error('Error updating favorite status');
      console.error('Error:', error);
    }
  };

  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search favorites..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-md px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredNotes.map((note) => (
          <NoteCard
            key={note._id}
            note={note}
            onDelete={handleDeleteNote}
            onEdit={(note) => {
              setEditingNote(note);
              setIsEditorOpen(true);
            }}
            onToggleFavorite={handleToggleFavorite}
          />
        ))}
      </div>

      <NoteEditor
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingNote(null);
        }}
        initialNote={editingNote || undefined}
        fetchNotes={fetchFavorites}
      />
    </div>
  );
}