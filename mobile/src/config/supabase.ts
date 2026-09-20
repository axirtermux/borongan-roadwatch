import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL = "https://quokocvxoblojvgnkmpm.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b2tvY3Z4b2Jsb2p2Z25rbXBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MTk3NzUsImV4cCI6MjEwNTQ5NTc3NX0.1bnIOGmvIkQZqUYNJFXI_VaURp3AmsHMwePys93JrxE";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export const BORONGAN_CENTER = {
  latitude: 11.6083,
  longitude: 125.4319,
};

export const BORONGAN_BOUNDS = {
  minLat: 11.40,
  maxLat: 11.85,
  minLng: 125.25,
  maxLng: 125.55,
};

export const BARANGAYS = [
  "Alang-alang",
  "Amantacop",
  "Ando",
  "Bagongon",
  "Balacdas",
  "Balud",
  "Banuyo",
  "Baras",
  "Bato",
  "Bayobay",
  "Benowangan",
  "Bugas",
  "Cabalagnan",
  "Cabong",
  "Calico-an",
  "Camada",
  "Campesao",
  "Canjaway",
  "Can-abong",
  "Canlaray",
  "Divinubo",
  "Hebacong",
  "Hindang",
  "Lalawigan",
  "Libuton",
  "Locsoon",
  "Maybacong",
  "Pepelitan",
  "Pinanag-an",
  "Punta Maria",
  "Sabang North",
  "Sabang South",
  "San Andres",
  "San Gabriel",
  "San Jose",
  "San Mateo",
  "San Pablo",
  "San Saturnino",
  "Santa Fe",
  "Siha",
  "Songco",
  "Suribao",
  "Tabunan",
  "Taboc",
  "Tamoso",
  "Tycoon",
];
