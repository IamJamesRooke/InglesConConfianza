import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Inglés con Confianza",
    short_name: "ICC",
    description:
      "Lecciones de inglés claras y prácticas para hispanohablantes.",
    start_url: "/",
    display: "standalone",
    background_color: "#fbfaf6",
    theme_color: "#2448c8",
    icons: [
      { src: "/icon/32", sizes: "32x32", type: "image/png" },
      { src: "/icon/180", sizes: "180x180", type: "image/png" },
      { src: "/icon/512", sizes: "512x512", type: "image/png" },
    ],
  };
}
