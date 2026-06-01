import React, { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { userService } from '@/services/api';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';
import { Camera, Loader2 } from 'lucide-react';


interface ProfilePictureUploadProps {
  onUploadSuccess?: (imagePath: string) => void;
  className?: string;
}

const ProfilePictureUpload: React.FC<ProfilePictureUploadProps> = ({
  onUploadSuccess,
  className = '',
}) => {
  const { user, updateUser } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload a JPEG, PNG, or GIF image.');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size too large. Maximum size is 5MB.');
      return;
    }

    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('image', file);

      const response = await userService.uploadProfilePicture(formData);
      
      // Update user context with new profile picture
      if (updateUser) {
        updateUser({
          ...user,
          profile_picture: response.data.profile_picture
        });
      }

      toast.success('Profile picture updated successfully');
      onUploadSuccess?.(response.data.profile_picture);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Error uploading profile picture');
    } finally {
      setIsUploading(false);
    }
  };

  const getImageUrl = () => {
    if (previewUrl) return previewUrl;
    if (user?.profile_picture) {
      return `${process.env.NEXT_PUBLIC_API_URL}/${user.profile_picture}`;
    }
    return '/default-avatar.png'; // Make sure to add a default avatar image
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative w-32 h-32 mb-4">
        <div className="w-full h-full rounded-full overflow-hidden border-4 border-white shadow-lg">
          <Image
            src={getImageUrl()}
            alt="Profile"
            width={128}
            height={128}
            className="w-full h-full object-cover"
          />
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/jpeg,image/png,image/gif"
          className="hidden"
        />
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <Camera className="w-4 h-4 mr-2" />
          Choose Image
        </Button>

        {previewUrl && (
          <Button
            onClick={handleUpload}
            disabled={isUploading}
            className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              'Upload'
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default ProfilePictureUpload; 