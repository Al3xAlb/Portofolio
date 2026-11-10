import floralImg from "@/assets/kasturi-roy-floral.jpg";
import varoomImg from "@/assets/nik-varoom.jpg";
import synthwaveImg from "@/assets/nik-synthwave.jpg";
import deerImg from "@/assets/omk-deer.jpg";
import holographicImg from "@/assets/simon-lee-holographic.jpg";
import catImg from "@/assets/syarafina-cat.jpg";
import birdImg from "@/assets/nypl-bird.jpg";
import jewelryImg from "@/assets/nypl-jewelry.jpg";
import spheresImg from "@/assets/victoria-spheres.jpg";

export interface Project {
  id: string;
  title: string;
  tags: string[];
  description: string;
  year: string;
  client?: string;
  images: string[];
  color: string;
  aspectRatio: 'portrait' | 'landscape' | 'square';
}

export const projects: Project[] = [
  {
    id: "chromatic-dreams",
    title: "Chromatic Dreams",
    tags: ["illustration", "digital art", "abstract"],
    description: "A series of digital illustrations exploring the interaction between geometric shapes and vibrant colors. The project emerged from a desire to translate emotions into abstract visual compositions, where each piece represents a different emotional state through specific chromatic palettes.",
    year: "2024",
    client: "Personal Project",
    images: [
      spheresImg,
      "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&q=80",
      "https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=800&q=80"
    ],
    color: "#FF6B6B",
    aspectRatio: "portrait"
  },
  {
    id: "vogue-editorial",
    title: "Vogue Editorial",
    tags: ["editorial", "magazine", "fashion"],
    description: "Art direction and editorial design for a special edition of Vogue Brasil. The project involved creating bold typographic layouts that dialogue with fashion photography, resulting in pages that are true works of graphic art.",
    year: "2024",
    client: "Vogue Brasil",
    images: [
      varoomImg,
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&q=80"
    ],
    color: "#4ECDC4",
    aspectRatio: "landscape"
  },
  {
    id: "neon-nights",
    title: "Neon Nights",
    tags: ["poster", "typography", "nightlife"],
    description: "A collection of typographic posters created for a series of electronic music events in São Paulo. The aesthetic combines experimental typography with neon gradients, capturing the vibrant energy of nightlife.",
    year: "2023",
    client: "D-Edge Club",
    images: [
      synthwaveImg,
      "https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=800&q=80"
    ],
    color: "#A855F7",
    aspectRatio: "portrait"
  },
  {
    id: "botanical-essence",
    title: "Botanical Essence",
    tags: ["branding", "identity", "cosmetics"],
    description: "Complete visual identity for a natural cosmetics brand. The project includes logo, color system, typography, packaging, and communication materials, all inspired by the delicacy and sophistication of the botanical universe.",
    year: "2024",
    client: "Botanical Essence",
    images: [
      floralImg,
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80"
    ],
    color: "#10B981",
    aspectRatio: "square"
  },
  {
    id: "urban-fragments",
    title: "Urban Fragments",
    tags: ["illustration", "urban", "collage"],
    description: "An illustration project exploring the fragmentation of the contemporary urban landscape. Through digital collages, the pieces capture the chaotic overlay of architectural elements, signs, and textures that define major metropolises.",
    year: "2023",
    client: "Galeria Vermelho",
    images: [
      deerImg,
      "https://images.unsplash.com/photo-1549490349-8643362247b5?w=800&q=80"
    ],
    color: "#F59E0B",
    aspectRatio: "landscape"
  },
  {
    id: "typeface-manifesto",
    title: "Typeface Manifesto",
    tags: ["typography", "poster", "experimental"],
    description: "A series of experimental posters exploring the limits of typography as a form of visual expression. Each piece challenges traditional typographic conventions, transforming letters into graphic sculptures.",
    year: "2024",
    client: "ADG Brasil",
    images: [
      holographicImg,
      "https://images.unsplash.com/photo-1559028012-481c04fa702d?w=800&q=80"
    ],
    color: "#EC4899",
    aspectRatio: "portrait"
  },
  {
    id: "flow-magazine",
    title: "Flow Magazine",
    tags: ["editorial", "magazine", "lifestyle"],
    description: "Editorial design for Flow magazine, a publication about mindfulness and well-being. The project involved creating a visual system that conveys calm and balance through generous spacing, elegant typography, and contemplative photography.",
    year: "2023",
    client: "Flow Magazine",
    images: [
      catImg,
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80"
    ],
    color: "#6366F1",
    aspectRatio: "landscape"
  },
  {
    id: "aurora-identity",
    title: "Aurora Identity",
    tags: ["branding", "identity", "tech"],
    description: "Visual identity for Aurora, a technology startup focused on artificial intelligence. The visual system combines fluid shapes inspired by aurora borealis with contemporary typography and a vibrant color palette.",
    year: "2024",
    client: "Aurora AI",
    images: [
      birdImg,
      "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&q=80"
    ],
    color: "#14B8A6",
    aspectRatio: "square"
  },
  {
    id: "street-poetry",
    title: "Street Poetry",
    tags: ["linework", "illustration", "urban"],
    description: "A visual exploration of urban poetry through intricate linework illustrations. Each piece captures the rhythm and energy of street life, translating movement and emotion into delicate black and white compositions.",
    year: "2024",
    client: "Urban Arts Festival",
    images: [
      jewelryImg,
      "https://images.unsplash.com/photo-1502759683299-cdcd6974244f?w=800&q=80"
    ],
    color: "#1F2937",
    aspectRatio: "portrait"
  },
  {
    id: "color-theory",
    title: "Color Theory",
    tags: ["abstract", "digital", "experimental"],
    description: "An experimental study of color relationships and their psychological impact. This personal project explores how different color combinations can evoke specific emotions and create visual tension or harmony.",
    year: "2024",
    client: "Personal Project",
    images: [
      "https://images.unsplash.com/photo-1550859492-d5da9d8e45f3?w=800&q=80",
      "https://images.unsplash.com/photo-1525909002-1b05e0c869d8?w=800&q=80"
    ],
    color: "#8B5CF6",
    aspectRatio: "landscape"
  },
  {
    id: "digital-natives",
    title: "Digital Natives",
    tags: ["illustration", "character", "digital"],
    description: "Character design series exploring the identity of the digital generation. These illustrations blend human forms with digital elements, questioning the boundaries between our physical and virtual selves.",
    year: "2023",
    client: "Tech Conference",
    images: [
      "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80",
      "https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=800&q=80"
    ],
    color: "#06B6D4",
    aspectRatio: "square"
  },
  {
    id: "festival-posters",
    title: "Festival Posters",
    tags: ["poster", "music", "print"],
    description: "A vibrant collection of posters designed for music festivals across Brazil. Each poster captures the unique energy of the event through bold typography, dynamic compositions, and striking color palettes.",
    year: "2023",
    client: "Various Festivals",
    images: [
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80",
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80"
    ],
    color: "#F43F5E",
    aspectRatio: "portrait"
  },
  {
    id: "brand-fusion",
    title: "Brand Fusion",
    tags: ["branding", "strategy", "identity"],
    description: "A comprehensive rebranding project for a merged company, combining two distinct brand identities into a cohesive new visual language. The challenge was to honor both legacies while creating something fresh and forward-looking.",
    year: "2024",
    client: "Fusion Corp",
    images: [
      "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&q=80",
      "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=800&q=80"
    ],
    color: "#0EA5E9",
    aspectRatio: "landscape"
  },
  {
    id: "ink-stories",
    title: "Ink Stories",
    tags: ["linework", "illustration", "narrative"],
    description: "A series of narrative illustrations using traditional ink techniques digitized for modern applications. Each piece tells a story through intricate line details and carefully balanced compositions.",
    year: "2023",
    client: "Publishing House",
    images: [
      "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=80",
      "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&q=80"
    ],
    color: "#374151",
    aspectRatio: "portrait"
  },
  {
    id: "paper-dreams",
    title: "Paper Dreams",
    tags: ["collage", "mixed media", "experimental"],
    description: "Mixed media collage work combining vintage paper textures with contemporary digital techniques. This project explores themes of memory and nostalgia through layered visual storytelling.",
    year: "2024",
    client: "Art Gallery",
    images: [
      "https://images.unsplash.com/photo-1482160549825-59d1b23cb208?w=800&q=80",
      "https://images.unsplash.com/photo-1456086272160-b28b0645b729?w=800&q=80"
    ],
    color: "#D97706",
    aspectRatio: "square"
  },
  {
    id: "minimal-bold",
    title: "Minimal Bold",
    tags: ["typography", "minimalism", "poster"],
    description: "A typographic experiment pushing the boundaries of minimalism. Using only black, white, and bold sans-serif type, these posters communicate maximum impact with minimal elements.",
    year: "2024",
    client: "Design Museum",
    images: [
      "https://images.unsplash.com/photo-1509343256512-d77a5cb3791b?w=800&q=80",
      "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=800&q=80"
    ],
    color: "#111827",
    aspectRatio: "portrait"
  },
  {
    id: "motion-blur",
    title: "Motion Blur",
    tags: ["motion", "digital", "animation"],
    description: "Exploration of movement and time through static imagery that suggests motion. This project captures the essence of speed and fluidity, freezing dynamic moments in visually striking compositions.",
    year: "2023",
    client: "Sports Brand",
    images: [
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
      "https://images.unsplash.com/photo-1504805572947-34fad45aed93?w=800&q=80"
    ],
    color: "#7C3AED",
    aspectRatio: "landscape"
  }
];

export const getProjectById = (id: string): Project | undefined => {
  return projects.find(project => project.id === id);
};

// Get unique categories from all project tags
export const getCategories = (): string[] => {
  const allTags = projects.flatMap(project => project.tags);
  return [...new Set(allTags)];
};
