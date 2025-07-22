import { motion } from 'framer-motion';
import { categories } from '../lib/data';
import { useRouter } from 'next/navigation';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const router = useRouter();

  return (
    <motion.div
      className={`fixed top-0 right-0 h-full w-64 bg-primary-dark text-primary-light p-6 z-50 ${
        isOpen ? 'block' : 'hidden'
      }`}
      initial={{ x: '100%' }}
      animate={{ x: isOpen ? 0 : '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <button className="text-2xl mb-4" onClick={onClose} aria-label="Close menu">
        &times;
      </button>
      <h2 className="text-xl font-bold mb-4">Categories</h2>
      <ul className="space-y-2">
        {categories.map((category) => (
          <li
            key={category.title}
            className="cursor-pointer hover:text-accent-blue"
            onClick={() => {
              router.push(category.path);
              onClose();
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && router.push(category.path)}
          >
            {category.title}
          </li>
        ))}
      </ul>
    </motion.div>
  );
};

export default Sidebar;