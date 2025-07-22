const Footer: React.FC = () => (
    <footer className="bg-primary-dark text-primary-light text-center py-6 ">
      <div className="flex justify-center space-x-4 mb-2">
        <a href="/about" className="hover:text-accent-blue transition-colors">About</a>
        <a href="/contact" className="hover:text-accent-blue transition-colors">Contact</a>
        <a href="/privacy" className="hover:text-accent-blue transition-colors">Privacy Policy</a>
      </div>
      <p>© 2025 AIOToolSuite. Built for creators, developers, and marketers.</p>
    </footer>
  );

  export default Footer;