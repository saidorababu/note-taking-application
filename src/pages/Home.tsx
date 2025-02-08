import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import NoteCard from '../components/NoteCard';
import NoteEditor from '../components/NoteEditor';
import { PlusIcon } from '@heroicons/react/24/outline';
import { HiAdjustmentsHorizontal } from "react-icons/hi2";
import { toast } from 'react-hot-toast';

const API_URL = 'http://localhost:5000'; // Replace with your API endpoint

export default function Home() {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [loading, setLoading] = useState(true); // ✅ Add loading state

  useEffect(() => {
    if (user) {
      fetchNotes();
    }
  }, [user, sortOrder]);

  const fetchNotes = async () => {
    setLoading(true); // ✅ Start loading before fetching notes
    try {
      console.log(user);
      const response = await fetch(`${API_URL}/notes?user_id=${user.id}&sort=${sortOrder}`);
      if (!response.ok) throw new Error('Error fetching notes');
      const data = await response.json();
      console.log(data);
      setNotes(data);
    } catch (error) {
      toast.error('Error fetching notes');
      console.error('Error:', error);
    } finally {
      setLoading(false); // ✅ Stop loading after fetching
    }
  };

  const handleDeleteNote = async (id) => {
    try {
      const response = await fetch(`${API_URL}/notes/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Error deleting note');
      toast.success('Note deleted successfully');
      fetchNotes();
    } catch (error) {
      toast.error('Error deleting note');
      console.error('Error:', error);
    }
  };

  const handleToggleFavorite = async (note_id) => {
    try {
      const response = await fetch(`${API_URL}/notes/${user.id}/${note_id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      if (!response.ok) throw new Error('Error updating favorite status');
      fetchNotes();
    } catch (error) {
      toast.error('Error updating favorite status');
      console.error('Error:', error);
    }
  };

  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto flex flex-col justify-between">
      <div className="mb-6 flex justify-between items-center">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="ml-4 flex items-center space-x-4">
          <button
            onClick={() => setShowSortOptions(!showSortOptions)}
            className="flex items-center px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
          >
            Sort
            <HiAdjustmentsHorizontal className="h-5 w-5 ml-2" />
          </button>

          {/* Dropdown Menu */}
          {showSortOptions && (
            <div className="absolute right-0 mt-2 w-40 bg-white shadow-md rounded-lg overflow-hidden">
              <button
                onClick={() => {
                  setSortOrder('desc');
                  setShowSortOptions(false);
                }}
                className={`block w-full text-left px-4 py-2 hover:bg-gray-100 ${
                  sortOrder === 'desc' ? 'font-bold' : ''
                }`}
              >
                New to Old
              </button>
              <button
                onClick={() => {
                  setSortOrder('asc');
                  setShowSortOptions(false);
                }}
                className={`block w-full text-left px-4 py-2 hover:bg-gray-100 ${
                  sortOrder === 'asc' ? 'font-bold' : ''
                }`}
              >
                Old to New
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ✅ Show Loading Spinner while Fetching Notes */}
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <svg
            className="animate-spin h-10 w-10 text-blue-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            ></path>
          </svg>
        </div>
      ) : (
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
      )}

      <div className="fixed bottom-4 right-4">
        <button
          onClick={() => {
            setEditingNote(null);
            setIsEditorOpen(true);
          }}
          className="inline-flex items-center px-6 py-3 border border-transparent rounded-full shadow-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          New Note
        </button>
      </div>
       
      <NoteEditor
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingNote(null);
        }}
        initialNote={editingNote}
        fetchNotes={fetchNotes}
      />
    </div>
  );
}
