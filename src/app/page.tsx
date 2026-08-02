import Link from 'next/link';
import Image from 'next/image';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Hero Section with Image Background */}
      <div className="relative h-[600px] bg-gradient-to-r from-blue-600 to-blue-800">
        {/* Background Image - Replace with actual Supermed imagery */}
        <div className="absolute inset-0 bg-cover bg-center opacity-30" 
             style={{ backgroundImage: 'url(/media/hero-banner.svg)' }}></div>
        
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="text-white">
                <div className="flex items-center gap-4 mb-6">
                  {/* Logo - Responsive sizing */}
                  <div className="relative w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24">
                    <Image
                      src="/media/logo.svg"
                      alt="Supermed Pharmacy Logo"
                      fill
                      className="object-contain"
                      priority
                    />
                  </div>
                  <div>
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold">
                      Supermed Pharmacy
                    </h1>
                    <p className="text-blue-100 text-lg md:text-xl">
                      Loyalty System
                    </p>
                  </div>
                </div>
                
                <p className="text-xl md:text-2xl text-blue-100 mb-8 font-light">
                  Enhancing Quality of Life Through Super Products, Super Staff and Super Service
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/login" className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition text-center">
                    Staff Login
                  </Link>
                  <Link href="/workflows" className="bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-800 transition text-center">
                    Get Started
                  </Link>
                </div>
              </div>
              
              {/* Pharmacy Imagery - Replace with actual Supermed photos */}
              <div className="hidden md:block">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="aspect-square bg-white/20 rounded-lg flex items-center justify-center">
                      <span className="text-6xl">💊</span>
                    </div>
                    <div className="aspect-square bg-white/20 rounded-lg flex items-center justify-center">
                      <span className="text-6xl">🏥</span>
                    </div>
                    <div className="aspect-square bg-white/20 rounded-lg flex items-center justify-center">
                      <span className="text-6xl">👨‍⚕️</span>
                    </div>
                    <div className="aspect-square bg-white/20 rounded-lg flex items-center justify-center">
                      <span className="text-6xl">❤️</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Why Choose Supermed Pharmacy?
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Bulawayo's leading Pharmacy offering quality pharmaceuticals and cosmetics
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              title: "Quality Products",
              description: "Premium pharmaceuticals and cosmetics you can trust",
              icon: "💊"
            },
            {
              title: "Expert Staff",
              description: "Highly trained professionals ready to help",
              icon: "👨‍⚕️"
            },
            {
              title: "Super Service",
              description: "Exceptional customer care and support",
              icon: "⭐"
            }
          ].map((feature, index) => (
            <div key={index} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">{feature.title}</h3>
              <p className="text-slate-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Location Section */}
      <div className="bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                Visit Our Main Branch
              </h2>
              <p className="text-slate-600 mb-6">
                Shop 2 Zonk Izizwe Shopping Complex, Bradfield City
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📍</span>
                  <span className="text-slate-700">Bulawayo, Zimbabwe</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📞</span>
                  <span className="text-slate-700">+263 9 73388, +263 9 605 01</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">✉️</span>
                  <span className="text-slate-700">info@supermed-pharmacies.co.zw</span>
                </div>
              </div>
            </div>
            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-xl font-semibold text-slate-900 mb-4">
                Join Our Loyalty Program
              </h3>
              <p className="text-slate-600 mb-6">
                Start earning rewards on every purchase and enjoy exclusive member benefits.
              </p>
              <Link href="/workflows/enroll" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
                Enroll Today
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="relative w-12 h-12">
                  <Image
                    src="/media/logo.svg"
                    alt="Supermed Pharmacy Logo"
                    fill
                    className="object-contain"
                  />
                </div>
                <span className="font-semibold text-lg">Supermed Pharmacy</span>
              </div>
              <p className="text-slate-400 text-sm">
                Enhancing Quality of Life Through Super Products, Super Staff and Super Service
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><Link href="/workflows" className="hover:text-white transition">Our Services</Link></li>
                <li><Link href="/workflows/enroll" className="hover:text-white transition">Loyalty Program</Link></li>
                <li><Link href="/login" className="hover:text-white transition">Staff Login</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li>📍 Shop 2 Zonk Izizwe Shopping Complex</li>
                <li>📞 +263 9 73388, +263 9 605 01</li>
                <li>✉️ info@supermed-pharmacies.co.zw</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center">
            <p className="text-slate-400 text-sm">
              © 2026 Supermed Pharmacy (Pvt) Ltd. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}