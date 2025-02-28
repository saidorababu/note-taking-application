import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
// import { toast } from "react-hot-toast";

const API_URL = 'http://localhost:5000';

export default function Profile() {
  const { user, updatePassword, updateProfileImage } = useAuth(); // Assume updateProfileImage exists

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // ✅ Fetch user profile image from API when component loads
  useEffect(() => {
    console.log(user);
    if (user?.id) {
      fetch(`${API_URL}/profile-image/${user.id}`)
        .then((response) => response.json())
        .then((data) => {
          console.log(data);
          if (data.imageUrl) {
            setPreview(data.imageUrl); // ✅ Set profile image from API
          }
        })
        .catch((error) => console.error("Error fetching profile image:", error));
    }
  }, [user]);

  // ✅ Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  // ✅ Handle image upload
  const handleImageUpload = async () => {
    if (!image) {
      // toast.error("Please select an image first.");
      return;
    }

    const formData = new FormData();
    formData.append("profileImage", image);
    formData.append("userId", user?.id); // Send user ID

    try {
      const imageUrl = await updateProfileImage(formData);
      if (imageUrl) {
        setPreview(imageUrl);
        // toast.success("Profile picture updated successfully!");
      }
    } catch (error) {
      // toast.error("Error uploading image");
      console.error(error);
    }
  };

  // ✅ Handle password update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      // toast.error("Passwords do not match");
      return;
    }

    try {
      await updatePassword(newPassword);
      // toast.success("Password updated successfully");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      // toast.error("Error updating password");
      console.error(error);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8">
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6">Profile Settings</h2>

        {/* ✅ Profile Picture */}
        <div className="flex flex-col items-center mb-6">
          <img
            src={preview || "/"} // Default image
            alt="Profile"
            className="w-24 h-24 rounded-full border-2 border-gray-300 shadow-md object-cover"
          />
          <span className="font-medium">{user.email}</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="mt-3"
            placeholder="Select an image"
          />
          <button
            onClick={handleImageUpload}
            className="mt-2 px-4 py-2 bg-green-600 text-white rounded-md shadow-md hover:bg-green-700"
          >
            Upload New Picture
          </button>
        </div>


        {/* ✅ Password Update Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
              New Password
            </label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
              minLength={6}
            />
          </div>

          <div className="mb-6">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Update Password
          </button>
        </form>
      </div>
    </div>
  );
}
