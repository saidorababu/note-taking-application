import React, { useState, useRef } from 'react';
import {
  TrashIcon,
  PencilIcon,
  ClipboardDocumentIcon,
  StarIcon,
  PlayIcon,
  PauseIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { Dialog } from '@headlessui/react';

interface NoteCardProps {
  note: {
    _id: string;
    title: string;
    content: string;
    created_at: string;
    is_favorite: boolean;
    image_url?: string;
    audio_url?: string;
  };
  onDelete: (id: string) => void;
  onEdit: (note: any) => void;
  onToggleFavorite: (id: string, isFavorite: boolean) => void;
}

export default function NoteCard({
  note,
  onDelete,
  onEdit,
  onToggleFavorite,
}: NoteCardProps) {
  const [showFullContent, setShowFullContent] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  const handleAudioPlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(note.content);
    toast.success('Copied to clipboard!');
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow flex flex-col h-full relative">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-gray-800">{note.title}</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => onToggleFavorite(note._id, !note.is_favorite)}
            className="text-gray-400 hover:text-yellow-500"
          >
            {note.is_favorite ? (
              <StarIconSolid className="h-5 w-5 text-yellow-500" />
            ) : (
              <StarIcon className="h-5 w-5" />
            )}
          </button>
          <button
            onClick={handleCopy}
            className="text-gray-400 hover:text-blue-500"
            title="Copy to clipboard"
          >
            <ClipboardDocumentIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => onEdit(note)}
            className="text-gray-400 hover:text-green-500"
            title="Edit note"
          >
          
            <PencilIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => onDelete(note._id)}
            className="text-gray-400 hover:text-red-500"
            title="Delete note"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      

      {/* Content section */}
      <div className="flex-grow">
        <p className="text-gray-600 mb-2">
          {showFullContent
            ? note.content
            : `${note.content.slice(0, 100)}${note.content.length > 100 ? '...' : ''}`}
        </p>

        {note.content.length > 100 && (
          <button
            onClick={() => setShowFullContent(!showFullContent)}
            className="text-blue-500 hover:text-blue-600 text-sm"
          >
            {showFullContent ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>

      {note.image_url && (
        <div onClick={toggleModal} className="cursor-pointer">
          <img
            src={note.image_url}
            alt="Note attachment"
            className="w-16 h-16 object-cover rounded-md mb-2"
          />
        </div>
      )}

      {/* Modal for full image */}
      <Dialog open={isModalOpen} onClose={toggleModal} className="fixed z-10 inset-0 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen">
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-50" />
          <div className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all max-w-3xl w-full">
            <img src={note.image_url} alt="Note attachment" className="w-full h-auto" />
            <button
              onClick={toggleModal}
              className="absolute top-0 right-0 m-4 text-gray-400 hover:text-gray-600"
              title = "Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </Dialog>

      {/* 🎵 Audio Play Button at Bottom-Right */}
      {note.audio_url && (
        <div className="absolute bottom-2 right-2">
          <button
            onClick={handleAudioPlay}
            className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition shadow-md"
          >
            {isPlaying ? (
              <PauseIcon className="h-6 w-6 text-gray-700" />
            ) : (
              <PlayIcon className="h-6 w-6 text-gray-700" />
            )}
          </button>
        </div>
      )}

      {/* Date at the bottom */}
      <div className="mt-auto text-sm text-gray-500">
        {format(new Date(note.created_at), 'MMM d, yyyy • h:mm a')}
      </div>

      {/* Hidden audio element */}
      {note.audio_url && (
        <audio ref={audioRef} src={note.audio_url} onEnded={() => setIsPlaying(false)} />
      )}


    </div>
  );
}
