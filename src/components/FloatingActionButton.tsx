import { Link } from 'react-router-dom';
import './FloatingActionButton.css';

export default function FloatingActionButton() {
  return (
    <Link to="/create" className="fab">
      <svg 
        width="20" 
        height="20" 
        viewBox="0 0 20 20" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path 
          d="M10 4V16M4 10H16" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round"
        />
      </svg>
      <span>Skapa match</span>
    </Link>
  );
}
