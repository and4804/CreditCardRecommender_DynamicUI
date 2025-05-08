export function Footer() {
  return (
    <footer className="bg-[#1C2833] text-white py-4 mt-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center space-x-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5 text-[#FFB700]"
              >
                <rect width="20" height="14" x="2" y="5" rx="2" />
                <line x1="2" x2="22" y1="10" y2="10" />
              </svg>
              <span className="font-sf-pro font-bold">CardConcierge</span>
            </div>
            <p className="text-xs mt-1 text-gray-400">© 2023 CardConcierge. All rights reserved.</p>
          </div>
          
          <div className="flex space-x-6">
            <a href="#" className="text-sm hover:text-[#FFB700] transition">Privacy Policy</a>
            <a href="#" className="text-sm hover:text-[#FFB700] transition">Terms of Service</a>
            <a href="#" className="text-sm hover:text-[#FFB700] transition">Contact Us</a>
            <a href="#" className="text-sm hover:text-[#FFB700] transition">Help</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
