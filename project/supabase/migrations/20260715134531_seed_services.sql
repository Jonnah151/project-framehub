/*
# Seed Services Catalog

Populates the `services` table with sample photography, videography, printing,
and branding services so the app has content on first load.
*/

INSERT INTO services (name, category, description, price, image_url, is_active) VALUES
  ('Portrait Photography', 'photography', 'Professional studio and outdoor portrait sessions with high-resolution edits.', 150.00, '', true),
  ('Event Photography', 'photography', 'Full coverage for weddings, corporate events, and parties. 200+ edited photos.', 500.00, '', true),
  ('Product Photography', 'photography', 'Clean product shots for e-commerce and catalogs with white background options.', 200.00, '', true),
  ('Wedding Videography', 'videography', 'Cinematic wedding film with drone footage and highlight reel.', 1200.00, '', true),
  ('Promotional Video', 'videography', '30-60 second promotional video for social media and marketing campaigns.', 800.00, '', true),
  ('Business Cards Printing', 'printing', 'Premium business cards printed on 350gsm matte or gloss stock. 500 pcs.', 45.00, '', true),
  ('Banner Printing', 'printing', 'Large format banners up to 3m. Weatherproof vinyl, full color.', 120.00, '', true),
  ('Photo Prints (A4)', 'printing', 'High-quality photo prints on glossy or matte A4 paper.', 5.00, '', true),
  ('Flyer Printing', 'printing', 'Double-sided color flyers. 1000 pcs on 200gsm paper.', 80.00, '', true),
  ('Logo Design', 'branding', 'Custom logo design with 3 concepts, unlimited revisions, and source files.', 250.00, '', true),
  ('Brand Identity Package', 'branding', 'Complete brand kit: logo, color palette, typography, and brand guidelines.', 600.00, '', true),
  ('Social Media Branding', 'branding', 'Profile graphics, post templates, and cover designs for all platforms.', 180.00, '', true)
ON CONFLICT DO NOTHING;