import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import FloatingNav from "@/components/FloatingNav";
import ScrollRevealText from "@/components/ScrollRevealText";
import ContactForm from "@/components/ContactForm";
import { Mail, MapPin, Instagram, Linkedin, Dribbble } from "lucide-react";

const About = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.hash === "#contact") {
      const element = document.getElementById("contact");
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [location]);

  const clients = [
    "Vogue Brasil",
    "D-Edge Club",
    "Galeria Vermelho",
    "ADG Brasil",
    "Flow Magazine",
    "Aurora AI",
    "Nike",
    "Spotify",
    "Adobe"
  ];

  const services = [
    "Brand Identity",
    "Visual Systems",
    "Art Direction",
    "Typography",
    "Digital Design",
    "Motion Graphics",
    "Print Design",
    "Packaging"
  ];

  const recognition = [
    { award: "ADG Brasil Award", year: "2024" },
    { award: "Type Directors Club", year: "2023" },
    { award: "Cannes Lions Bronze", year: "2022" },
  ];

  const socialLinks = [
    { name: "Instagram", icon: Instagram, url: "https://instagram.com" },
    { name: "LinkedIn", icon: Linkedin, url: "https://linkedin.com" },
    { name: "Dribbble", icon: Dribbble, url: "https://dribbble.com" },
  ];

  return (
    <>
      <main className="min-h-screen bg-background page-transition">
        <Navbar />
        
        {/* Hero Bio Section - Takes ~70% of the viewport */}
        <section className="min-h-[60vh] max-h-[70vh] flex flex-col justify-center px-6 pt-24 pb-8">
          <div className="max-w-[95%]">
            <ScrollRevealText 
              text="Alex Alb is an independent creative practice focused on graphic design, art direction, and visual identity systems that communicate with clarity and purpose."
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl leading-[1.1] font-display"
            />
          </div>
        </section>

        {/* Bottom Info Section - Horizontal Layout */}
        <section className="px-6 pb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 fade-in-up">
            {/* Selected Clients */}
            <div>
              <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-4 border-b border-border pb-2">
                Selected Clients
              </h3>
              <ul className="space-y-1">
                {clients.map((client) => (
                  <li key={client} className="text-sm">
                    {client}
                  </li>
                ))}
              </ul>
            </div>

            {/* Services */}
            <div>
              <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-4 border-b border-border pb-2">
                Services
              </h3>
              <ul className="space-y-1">
                {services.map((service) => (
                  <li key={service} className="text-sm">
                    {service}
                  </li>
                ))}
              </ul>
            </div>

            {/* Recognition */}
            <div>
              <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-4 border-b border-border pb-2">
                Recognition
              </h3>
              <ul className="space-y-1">
                {recognition.map((item) => (
                  <li key={item.award} className="text-sm flex justify-between gap-4">
                    <span>{item.award}</span>
                    <span className="text-muted-foreground">{item.year}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-4 border-b border-border pb-2">
                Say Hi!
              </h3>
              <div className="space-y-2">
                <a
                  href="#contact"
                  className="text-sm hover:opacity-70 transition-opacity flex items-center gap-2"
                >
                  <Mail size={14} />
                  Send me a message
                </a>
                <p className="text-sm flex items-center gap-2 text-muted-foreground">
                  <MapPin size={14} />
                  São Paulo, Brazil
                </p>
                <div className="flex gap-2 pt-3">
                  {socialLinks.map((social) => (
                    <a
                      key={social.name}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 border border-border rounded-full hover:bg-foreground hover:text-background transition-all duration-300"
                      aria-label={social.name}
                    >
                      <social.icon size={14} />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Contact Form */}
        <section id="contact" className="px-6 pb-32 scroll-mt-24">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16 border-t border-border pt-12">
            <div>
              <h2 className="text-3xl md:text-5xl font-semibold tracking-tight">Let's work together</h2>
              <p className="mt-4 max-w-sm text-muted-foreground">
                Have a project in mind or just want to say hi? Drop me a note and I'll reply as soon as I can.
              </p>
            </div>
            <ContactForm />
          </div>
        </section>
      </main>
      <FloatingNav />
    </>
  );
};

export default About;