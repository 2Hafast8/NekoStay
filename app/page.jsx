import Link from "next/link";
import { Cat, Check, Heart, Shield, Users } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { formatRupiah } from "@/lib/utils/format";

export default function LandingPage() {
  const classes = [
    {
      name: "Basic",
      price: 50000,
      description:
        "Kandang nyaman standar dengan ventilasi udara bersih yang terjaga berkala.",
      facilities: ["Kandang standar", "Makan 2x/hari", "Air minum steril"],
      gradient: "from-amber-500/10 to-orange-500/10 hover:border-orange-300",
    },
    {
      name: "Standard",
      price: 80000,
      description:
        "Kandang lebih luas serta dilengkapi area mainan kucing untuk menghilangkan bosan.",
      facilities: [
        "Kandang luas",
        "Makan 3x/hari",
        "Mainan dasar",
        "Pasir wangi",
      ],
      gradient:
        "from-primary/10 to-amber-500/10 hover:border-primary/40 border-primary/20 scale-102 shadow-xs",
    },
    {
      name: "Premium",
      price: 130000,
      description:
        "Ruang privat eksklusif ber-AC dengan pemantauan intensif dan perawatan mewah harian.",
      facilities: [
        "Ruang privat AC",
        "Makan teratur premium",
        "Grooming harian",
        "Layanan dokter hewan siaga",
      ],
      gradient: "from-amber-600/10 to-yellow-600/10 hover:border-yellow-400",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 sm:pb-24 lg:pt-32 lg:pb-32 bg-linear-to-b from-secondary/40 via-background to-background">
        {/* Soft background glow bubbles */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-primary/10 blur-3xl -z-10" />
        <div className="absolute top-1/3 right-1/4 translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-amber-500/10 blur-3xl -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="lg:grid lg:grid-cols-12 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold shadow-xs">
                <SparkleIcon className="w-3.5 h-3.5 animate-spin-slow" />
                <span>Hotel Kucing Bintang 5 Pertama di Kota Anda</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]">
                Penitipan Terbaik untuk Kucing Kesayangan Anda,{" "}
                <span className="bg-gradient-to-r from-primary via-orange-500 to-amber-600 bg-clip-text text-transparent">
                  Penuh Kasih Sayang.
                </span>
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Kami memahami kucing Anda adalah keluarga. NekoStay menghadirkan
                layanan penitipan kucing online premium dengan laporan berkala,
                ruang ber-AC, nutrisi terbaik, dan layanan kesehatan siaga.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  href="/booking/new"
                  className="px-8 py-4 rounded-2xl bg-primary text-primary-foreground font-bold hover:bg-primary/95 transition-all shadow-md shadow-primary/20 hover:scale-[1.01] active:scale-100 flex items-center justify-center gap-2"
                >
                  <Cat className="w-5 h-5" />
                  Pesan Penitipan Sekarang
                </Link>
                <Link
                  href="#services"
                  className="px-8 py-4 rounded-2xl border border-border bg-card font-bold hover:bg-muted transition-all flex items-center justify-center"
                >
                  Lihat Fasilitas & Tarif
                </Link>
              </div>

              {/* Stats */}
              <div className="pt-8 grid grid-cols-3 gap-6 max-w-md mx-auto lg:mx-0 border-t border-border/80">
                <div>
                  <p className="text-3xl font-extrabold text-foreground">
                    1,200+
                  </p>
                  <p className="text-xs font-medium text-muted-foreground mt-1">
                    Kucing Terlayani
                  </p>
                </div>
                <div>
                  <p className="text-3xl font-extrabold text-foreground">
                    99.8%
                  </p>
                  <p className="text-xs font-medium text-muted-foreground mt-1">
                    Rating Kepuasan
                  </p>
                </div>
                <div>
                  <p className="text-3xl font-extrabold text-foreground">
                    24/7
                  </p>
                  <p className="text-xs font-medium text-muted-foreground mt-1">
                    Dokter Hewan Siaga
                  </p>
                </div>
              </div>
            </div>

            {/* Right Image Mockup / Visual */}
            <div className="col-span-5 mt-12 lg:mt-0 relative flex justify-center">
              <div className="relative w-72 h-72 sm:w-96 sm:h-96 rounded-3xl overflow-hidden shadow-2xl border-4 border-card bg-gradient-to-tr from-primary/25 to-secondary rotate-2 group hover:rotate-0 transition-transform duration-500">
                <img
                  src="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=600&auto=format&fit=crop"
                  alt="Cute Cat"
                  className="object-cover w-full h-full"
                />

                <div className="absolute bottom-4 left-4 right-4 glass p-4 rounded-2xl flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <div className="flex-1">
                    <h4 className="text-xs font-bold text-foreground">
                      Laporan Kondisi
                    </h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Kucing Anda terpantau sehat & aktif bermain.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 sm:py-24 bg-card border-t border-b border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Mengapa Memilih NekoStay?
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
              Kami berkomitmen menjaga kenyamanan, keamanan, dan keceriaan
              kucing Anda selama Anda bepergian.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-background border border-border rounded-2xl space-y-4 hover:border-primary/30 transition-colors">
              <div className="p-3 bg-secondary text-primary rounded-xl w-fit">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">
                Keamanan & Higienitas Terjamin
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Setiap kandang dan area bermain dibersihkan menggunakan
                disinfektan ramah hewan secara berkala untuk mencegah bakteri
                dan virus.
              </p>
            </div>

            <div className="p-6 bg-background border border-border rounded-2xl space-y-4 hover:border-primary/30 transition-colors">
              <div className="p-3 bg-secondary text-primary rounded-xl w-fit">
                <Heart className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">
                Laporan Berkala 2 Hari Sekali
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Dapatkan notifikasi dan email berisi status kesehatan, nafsu
                makan, dan foto terbaru si mpus yang diupdate langsung oleh staf
                kami.
              </p>
            </div>

            <div className="p-6 bg-background border border-border rounded-2xl space-y-4 hover:border-primary/30 transition-colors">
              <div className="p-3 bg-secondary text-primary rounded-xl w-fit">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">Staf Ahli Penyayang Kucing</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Staf kami terlatih dalam menangani berbagai karakter kucing,
                mulai dari yang pemalu hingga yang hiperaktif, dengan kelembutan
                penuh.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing / Services Section */}
      <section id="services" className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Pilih Kelas Penitipan
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
              Beragam pilihan kelas yang dirancang khusus menyesuaikan
              kenyamanan kucing kesayangan Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {classes.map((cls) => (
              <div
                key={cls.name}
                className={`relative bg-card border border-border rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 ${cls.gradient}`}
              >
                {cls.name === "Standard" && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-[10px] font-extrabold text-primary-foreground tracking-wider uppercase shadow-sm">
                    Paling Populer
                  </span>
                )}
                <div>
                  <h3 className="text-xl font-extrabold text-foreground">
                    {cls.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                    {cls.description}
                  </p>

                  <div className="mt-5 flex items-baseline gap-1 text-foreground">
                    <span className="text-3xl font-extrabold">
                      {formatRupiah(cls.price)}
                    </span>
                    <span className="text-xs text-muted-foreground font-semibold">
                      /hari
                    </span>
                  </div>

                  <ul className="mt-6 space-y-3.5 border-t border-border/50 pt-6">
                    {cls.facilities.map((fac) => (
                      <li
                        key={fac}
                        className="flex items-center gap-3 text-sm text-muted-foreground"
                      >
                        <div className="p-0.5 rounded-full bg-primary/10 text-primary">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                        <span>{fac}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8">
                  <Link
                    href={`/booking/new?class=${cls.name}`}
                    className={`block w-full text-center py-3 rounded-2xl text-xs font-bold transition-all shadow-xs ${
                      cls.name === "Standard"
                        ? "bg-primary text-primary-foreground hover:bg-primary/95"
                        : "bg-card border border-border text-foreground hover:bg-muted"
                    }`}
                  >
                    Pilih Kelas {cls.name}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border bg-card py-12 text-center text-sm text-muted-foreground">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Cat className="w-5 h-5 text-primary" />
            <span className="font-extrabold text-foreground">NekoStay</span>
          </div>
          <p>
            © {new Date().getFullYear()} NekoStay. Seluruh hak cipta dilindungi.
          </p>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <Link
              href="/login"
              className="hover:text-foreground transition-colors"
            >
              Syarat & Ketentuan
            </Link>
            <Link
              href="/register"
              className="hover:text-foreground transition-colors"
            >
              Kebijakan Privasi
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SparkleIcon(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 3v18" />
      <path d="M3 12h18" />
      <path d="m18 6-12 12" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
