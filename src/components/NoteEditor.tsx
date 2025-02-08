

import React, { useState, useRef, useEffect } from "react";

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}
import { Dialog } from "@headlessui/react";
import { toast } from "react-hot-toast";
import {
  MicrophoneIcon,
  PaperAirplaneIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";

import { useAuth } from '../contexts/AuthContext';

interface NoteEditorProps {
  isOpen: boolean;
  onClose: () => void;
  // onSave: (note: {
  //   title: string;
  //   content: string;
  //   image?: File;
  //   audio?: Blob;
  // }) => void;
  initialNote?: {
    _id:string;
    user_id:string;
    title: string;
    content: string;
    image_url?: string;
    audio_url?: string;
    is_favorite:Boolean;
  };
  fetchNotes:()=>void;
}

const API_URL = 'http://localhost:5000';
export default function NoteEditor({
  isOpen,
  onClose,
  // onSave,
  initialNote,
  fetchNotes
}: NoteEditorProps) {
  const [title, setTitle] = useState(initialNote?.title || "");
  const [content, setContent] = useState(initialNote?.content || "");
  const [isRecording, setIsRecording] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [recordedAudio, setRecordedAudio] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const recognition = useRef<any>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);


  const audioRef = useRef<HTMLAudioElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
    const toggleModal = () => {
      setIsModalOpen(!isModalOpen);
    };

  const handlePlayAudio = () => {
    if (audioRef.current) {
      audioRef.current.play();
    }
  };

  const {user} = useAuth();

  useEffect(() => {
    console.log(initialNote);
  });


  // Play sound function
  const playSound = (soundFile: string) => {
    const audio = new Audio(soundFile);
    audio.play();
  };
  

  // Initialize speech recognition
  const initializeSpeechRecognition = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognition.current = new SpeechRecognition();
      recognition.current.continuous = true;
      recognition.current.interimResults = true;

      recognition.current.onresult = (event: any) => {
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }

        setContent((prev) => prev + " " + finalTranscript);
      };

      recognition.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsRecording(false);
      };
    }
  };

  // Toggle voice recording
  const toggleRecording = async () => {
    if (!isRecording) {
      playSound("/audio/start.mp3");
      // Start both voice-to-text and audio recording
      if (!recognition.current) {
        initializeSpeechRecognition();
      }
      recognition.current?.start();

      // Start Audio Recording
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.current.onstop = () => {
        playSound("/audio/start.mp3");
        const audioBlob = new Blob(audioChunks.current, { type: "audio/wav" });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudio(audioUrl);
        setAudioBlob(audioBlob);
        audioChunks.current = []; // Reset chunks
      };

      mediaRecorder.current.start();
      setIsRecording(true);

      // Start Timer
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      // Stop both speech recognition and audio recording
      recognition.current?.stop();
      mediaRecorder.current?.stop();
      setIsRecording(false);
      // Stop Timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
    }
  };

  // // Handle note submission
  // const handleSubmit = (e: React.FormEvent) => {
  //   e.preventDefault();
  //   onSave({ title, content, image: selectedImage || undefined, audio: audioBlob || undefined });
  //   onClose();
  // };

  // Submit Note
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("user_id", user.id);
    formData.append("title", title);
    formData.append("content", content);

    if (selectedImage) {
      formData.append("image", selectedImage);
    }
    if (audioBlob) {
      formData.append("audio", audioBlob,"recording.wav");
    }

    try {
      const url = initialNote ? `${API_URL}/upload-note/${initialNote._id}` : `${API_URL}/upload-note`;
      const method = initialNote ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Error saving note");
      }

      const data = await response.json();
      toast.success("Note saved successfully!");
      fetchNotes()
      onClose();
    } catch (error) {
      toast.error("Failed to save note.");
      console.error(error);
    }

    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="fixed inset-0 z-10 overflow-y-auto">
      <div className="min-h-screen px-4 text-center">
        <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
        <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          <form onSubmit={handleSubmit}>
            {/* Title Input */}
            <div className="mb-4">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Title
              </label>
              <input
                type="text"
                id="title"
                value={initialNote?.title || title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            {/* Content Textarea */}
            <div className="mb-4">
              <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                Content
              </label>
              <textarea
                id="content"
                value={initialNote?.content || content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            {initialNote?.image_url && (
                <div onClick={toggleModal} className="cursor-pointer">
                  <img
                    src={initialNote?.image_url}
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
                    <img src={initialNote?.image_url} alt="Note attachment" className="w-full h-auto" />
                    <button
                      onClick={toggleModal}
                      className="absolute top-0 right-0 m-4 text-gray-400 hover:text-gray-600"
                      title="Close"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </Dialog>

            {/* Image Upload */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Image</label>
              <div className="mt-1 flex items-center">
                <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                  <PhotoIcon className="h-5 w-5 mr-2" />
                  Choose Image
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                </label>
                {selectedImage && (
                  <span className="ml-2 text-sm text-gray-500">{selectedImage.name}</span>
                )}
              </div>
            </div>

            {/* Controls: Recording & Submit */}
            <div className="flex justify-between items-center mt-4">
              <button
                type="button"
                onClick={toggleRecording}
                className={`inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium ${
                  isRecording
                    ? "text-red-100 bg-red-600 hover:bg-red-400"
                    : "text-gray-700 bg-white hover:bg-gray-50"
                }`}
              >
                <MicrophoneIcon className="h-5 w-5 mr-2" />
                {isRecording ? `Stop Recording (${recordingTime}s)` : "Start Recording"}
              </button>

              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <PaperAirplaneIcon className="h-5 w-5 mr-2" />
                Save Note
              </button>
            </div>

            {/* Play Recorded Audio
            {recordedAudio && (
              <button
                onClick={() => new Audio(recordedAudio).play()}
                className="mt-4 inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                🎵 Play Audio
              </button>
            )} */}

            {/* Audio Element */}
            {/* <audio ref={audioRef} src={initialNote?.image_url} /> */}

            {/* Play Recorded Audio */}
            {/* {initialNote?.image_url && (
              <div className="mt-4">
                <audio controls>
                  <source src={initialNote?.image_url} type="audio/wav" />
                  Your browser does not support the audio element.
                </audio>
              </div>
            )} */}

            {/* 🎵 Display Audio Player if exists */}
            {initialNote?.audio_url && (
              <div className="mt-2">
                <audio controls className="w-full">
                  <source src={initialNote?.audio_url} type="audio/wav" />
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}
          </form>
        </div>
      </div>
    </Dialog>
  );
}
