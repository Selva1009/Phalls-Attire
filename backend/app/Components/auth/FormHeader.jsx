export const FormHeader = ({ title, description }) => (
  <div className="w-full bg-gradient-to-r from-blue-600 to-blue-500 font-sans min-h-[240px] flex flex-col justify-center items-center text-center px-6 relative overflow-hidden">
    {/* Decorative elements */}
    <div className="absolute inset-0 opacity-10">
      <div className="absolute -right-20 -top-20 w-80 h-80 bg-white rounded-full mix-blend-overlay"></div>
      <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-blue-400 rounded-full mix-blend-overlay"></div>
    </div>
    
    {/* Logo container */}
    <div className="absolute top-6 left-6 sm:top-8 sm:left-8">
      <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white rounded-lg flex items-center justify-center shadow-md border border-gray-100">
        <img
          src="/Logo.png"
          alt="M-Place Logo"
          className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
        />
      </div>
    </div>
    
    {/* Content */}
    <div className="relative z-10 max-w-2xl">
      <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
        {title}
      </h1>
      <p className="mt-4 text-lg text-blue-100 max-w-xl leading-relaxed">
        {description}
      </p>
    </div>
    
   
  </div>
);
