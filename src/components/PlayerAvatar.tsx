import './PlayerAvatar.css';

interface PlayerAvatarProps {
  name: string;
}

function PlayerAvatar({ name }: PlayerAvatarProps) {
  const getInitials = (fullName: string) => {
    return fullName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="player-avatar">
      {getInitials(name)}
    </div>
  );
}

export default PlayerAvatar;
