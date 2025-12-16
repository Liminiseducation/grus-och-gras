import './Button.css';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  type?: 'button' | 'submit' | 'reset';
}

export default function Button({ 
  children, 
  onClick, 
  variant = 'primary',
  type = 'button'
}: ButtonProps) {
  return (
    <button 
      className={`button button-${variant}`}
      onClick={onClick}
      type={type}
    >
      {children}
    </button>
  );
}
