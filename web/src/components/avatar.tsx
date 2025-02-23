import { useState } from 'react';

export const Avatar = ({ username, src, size = 48 }: AvatarProps) => {
  const [imageError, setImageError] = useState(false);
  const fullPath = `${import.meta.env.VITE_API_URL}${src}`;

  const getColorByUsername = (username: string) => {
    // Generate a hash from the username
    const hash = username.split('').reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);

    // Define a set of predefined hue values that work well for avatars
    const hues = [
      215, // Blue
      155, // Green-Blue
      330, // Pink
      185, // Cyan
      280, // Purple
      30, // Orange
      120, // Green
      245, // Indigo
      340, // Rose
      190, // Teal
    ];

    // Select a hue from our predefined list
    const hue = hues[hash % hues.length];

    // Use fixed saturation and lightness values that ensure good contrast
    return `hsl(${hue}, 65%, 45%)`;
  };

  return (
    <div
      className="relative flex items-center justify-center rounded-full text-white overflow-hidden"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: getColorByUsername(username),
        boxShadow:
          'inset 0 0 25px rgba(0, 0, 0, 0.2), 0 2px 8px rgba(0, 0, 0, 0.15)',
      }}
    >
      {fullPath && !imageError ? (
        <img
          src={fullPath}
          alt={username}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <span style={{ fontSize: `${size / 2}px` }}>
          {username[0].toUpperCase()}
        </span>
      )}
    </div>
  );
};

interface AvatarProps {
  username: string;
  src?: string;
  size?: number;
}
