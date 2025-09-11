export default function AboutPage() {
  return (
    <main className="bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 min-h-screen py-16">
      <div className="container mx-auto px-6 max-w-7xl">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Meet Our Team
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 mx-auto mb-6"></div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            We're a passionate group of innovators dedicated to creating sustainable solutions 
            for a greener future. Each team member brings unique expertise to drive environmental change.
          </p>
        </div>

        <div className="grid gap-8 grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
          {/* Card 1 */}
          <div className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-emerald-200 hover:-translate-y-2">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/5 to-teal-400/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                A
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">Anannaya</h2>
              {/* <p className="text-gray-600 text-sm text-center leading-relaxed">
                Sustainability strategist passionate about eco-friendly innovations and circular economy solutions.
              </p> */}
              <div className="mt-4 flex justify-center">
                <div className="w-12 h-0.5 bg-gradient-to-r from-emerald-400 to-teal-400"></div>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-emerald-200 hover:-translate-y-2">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/5 to-teal-400/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                I
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">Ishita</h2>
              {/* <p className="text-gray-600 text-sm text-center leading-relaxed">
                Full-stack developer and researcher specializing in green technology and clean energy systems.
              </p> */}
              <div className="mt-4 flex justify-center">
                <div className="w-12 h-0.5 bg-gradient-to-r from-emerald-400 to-teal-400"></div>
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-emerald-200 hover:-translate-y-2">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/5 to-teal-400/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                L
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">Loheyta</h2>
              {/* <p className="text-gray-600 text-sm text-center leading-relaxed">
                UX/UI designer crafting intuitive interfaces for environmental applications and sustainability platforms.
              </p> */}
              <div className="mt-4 flex justify-center">
                <div className="w-12 h-0.5 bg-gradient-to-r from-emerald-400 to-teal-400"></div>
              </div>
            </div>
          </div>

          {/* Card 4 */}
          <div className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-emerald-200 hover:-translate-y-2">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/5 to-teal-400/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                P
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">Prisha</h2>
              {/* <p className="text-gray-600 text-sm text-center leading-relaxed">
                Environmental data scientist analyzing climate patterns and supporting evidence-based sustainability decisions.
              </p> */}
              <div className="mt-4 flex justify-center">
                <div className="w-12 h-0.5 bg-gradient-to-r from-emerald-400 to-teal-400"></div>
              </div>
            </div>
          </div>

          {/* Card 5 */}
          <div className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-emerald-200 hover:-translate-y-2">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/5 to-teal-400/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                S
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">Sakshi</h2>
              {/* <p className="text-gray-600 text-sm text-center leading-relaxed">
                Environmental policy analyst driving strategic initiatives for sustainable business practices and compliance.
              </p> */}
              <div className="mt-4 flex justify-center">
                <div className="w-12 h-0.5 bg-gradient-to-r from-emerald-400 to-teal-400"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Mission Statement */}
        <div className="mt-20 text-center bg-white rounded-3xl p-12 shadow-xl border border-gray-100">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
          <p className="text-lg text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Together, we're building innovative solutions that make sustainability accessible, 
            measurable, and impactful. Our diverse expertise in technology, design, and environmental 
            science enables us to tackle complex challenges and create meaningful change for our planet.
          </p>
          <div className="mt-8 flex justify-center space-x-2">
            <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
            <div className="w-3 h-3 bg-teal-400 rounded-full"></div>
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
          </div>

          {/* Card 5 */}
          {/* <div className="border-4 border-green-700 rounded-xl p-4 bg-white shadow-md transition-transform transform hover:scale-105 hover:shadow-xl"> */}
            {/* <img
              src="https://via.placeholder.com/150"
              alt=""
              className="w-full h-40 object-cover rounded-md mb-4"
            />
            <p className="text-gray-700 text-sm">
              Developer and researcher focused on green technology.
            </p> */}
          {/* </div> */}
        </div>
      </div>
    </main>
  );
}