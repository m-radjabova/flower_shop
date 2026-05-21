import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="relative z-10 border-t border-[#5c2529]/70 bg-[rgba(11,2,6,0.62)] backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-4 px-4 py-8 text-[#e8c7c1] sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-10">
        <p className="text-sm">© {new Date().getFullYear()} Muslima Boutique. All rights reserved.</p>
        <div className="flex items-center gap-5 text-sm">
          <Link to="/" className="transition hover:text-white">
            Home
          </Link>
          <Link to="/bouquets" className="transition hover:text-white">
            Bouquets
          </Link>
          <Link to="/favorites" className="transition hover:text-white">
            Favorites
          </Link>
          <Link to="/cart" className="transition hover:text-white">
            Cart
          </Link>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
