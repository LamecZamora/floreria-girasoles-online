-- Restrict bucket listing to admins only (images still publicly viewable individually via URL)
DROP POLICY IF EXISTS "Admins can list product image bucket" ON storage.buckets;
CREATE POLICY "Admins can list product image bucket"
  ON storage.buckets FOR SELECT
  TO authenticated
  USING (id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

-- Insert 150 products
INSERT INTO public.products (id, name, description, price, stock, image, category, active) VALUES
  ('1', 'Ramo de Rosas Rojas Premium', 'Elegante ramo de 12 rosas rojas con eucalipto y nube, envuelto en papel de seda blanco con listón satinado.', 850, 15, '/src/assets/products/ramo-rosas-rojas.jpg', '14-febrero', true),
  ('2', 'Corazón Romántico', 'Arreglo en forma de corazón con rosas rosas, crisantemos morados, nube y pampas secas.', 1200, 8, '/src/assets/products/arreglo-corazon-valentines.jpg', '14-febrero', true),
  ('3', 'Caja de Rosas y Chocolates', 'Caja roja con rosas rojas, claveles rosas y trufas de chocolate. El regalo perfecto para enamorar.', 980, 12, '/src/assets/products/caja-rosas-chocolates.jpg', '14-febrero', true),
  ('4', 'Caja Rústica Rosas y Lirios', 'Encantadora caja de madera rústica con rosas rojas, lirios blancos, eucalipto y flores secas.', 1350, 7, '/src/assets/products/caja-rustica-rosas.jpg', '14-febrero', true),
  ('5', 'Oso con Ramo de Rosas', 'Adorable oso de peluche gigante con ramo de rosas rojas frescas. El regalo más tierno.', 1450, 8, '/src/assets/products/oso-rosas.jpg', '14-febrero', true),
  ('6', 'Rosa Eterna en Cúpula', 'Rosa preservada bajo cúpula de cristal con luces LED cálidas. Inspirada en La Bella y la Bestia.', 1800, 10, '/src/assets/products/rosa-eterna.jpg', '14-febrero', true),
  ('7', 'Corazón de 50 Rosas', 'Lujoso arreglo de 50 rosas rojas dispuestas en forma de corazón dentro de caja blanca premium.', 2800, 4, '/src/assets/products/corazon-50-rosas.jpg', '14-febrero', true),
  ('8', 'Ramo de Tulipanes Rosas', 'Delicado ramo de 20 tulipanes rosas y blancos envueltos en papel kraft con listón satinado.', 1100, 10, '/src/assets/products/ramo-tulipanes.jpg', '14-febrero', true),
  ('9', 'Canasta Vino y Rosas', 'Canasta de mimbre con rosas rojas, botella de vino tinto y caja de chocolates finos.', 2200, 5, '/src/assets/products/canasta-vino-rosas.jpg', '14-febrero', true),
  ('10', 'Rosa Individual con Nube', 'Elegante rosa roja de tallo largo con nube, envuelta en celofán transparente con moño rojo.', 180, 50, '/src/assets/products/rosa-individual.jpg', '14-febrero', true),
  ('11', 'Letras LOVE de Rosas', 'Arreglo creativo con rosas rojas y rosas formando la palabra LOVE. Sorprende de forma única.', 1950, 4, '/src/assets/products/letras-love-rosas.jpg', '14-febrero', true),
  ('12', 'Mega Ramo 100 Rosas', 'Impresionante ramo de 100 rosas rojas envuelto en papel negro con detalles dorados.', 5500, 2, '/src/assets/products/mega-ramo-100-rosas.jpg', '14-febrero', true),
  ('13', 'Pecera con Rosas y Velas', 'Romántica pecera de cristal con rosas rojas y blancas flotantes acompañadas de velas.', 1400, 6, '/src/assets/products/pecera-rosas-velas.jpg', '14-febrero', true),
  ('14', 'Caja Acrílico Rosas LED', 'Modernas rosas rosas preservadas en caja de acrílico transparente con luces LED púrpura.', 2100, 5, '/src/assets/products/caja-acrilico-rosas.jpg', '14-febrero', true),
  ('15', 'Ramo Rosas y Margaritas', 'Alegre ramo de rosas rojas con margaritas blancas y eucalipto, envuelto en papel rojo.', 650, 20, '/src/assets/products/ramo-claveles-rojos.jpg', '14-febrero', true),
  ('16', 'Centro de Mesa Elegante', 'Centro de mesa con rosas blancas y rosas, peonías, hortensias y follaje verde sobre base dorada.', 1800, 5, '/src/assets/products/centro-mesa-boda.jpg', 'bodas', true),
  ('17', 'Ramo de Novia Cascada', 'Elegante ramo de novia en cascada con rosas blancas, peonías, orquídeas y follaje verde.', 2200, 3, '/src/assets/products/ramo-novia.jpg', 'bodas', true),
  ('18', 'Arreglo de Orquídeas Premium', 'Sofisticado arreglo de orquídeas blancas y púrpuras en jarrón de cristal con musgo y piedras.', 2500, 4, '/src/assets/products/arreglo-orquideas.jpg', 'bodas', true),
  ('19', 'Arco de Flores para Boda', 'Espectacular arco floral para ceremonia con rosas blancas, peonías y hortensias. Montaje incluido.', 8500, 2, '/src/assets/products/arco-flores-boda.jpg', 'bodas', true),
  ('20', 'Boutonnière Novio Clásico', 'Boutonnière elegante con rosa blanca y nube, envuelto con listón de seda.', 350, 15, '/src/assets/products/boutonniere-boda.jpg', 'bodas', true),
  ('21', 'Centro Rústico con Lavanda', 'Centro de mesa rústico en caja de madera con rosas blancas, lavanda y eucalipto.', 1200, 8, '/src/assets/products/centro-rustico-boda.jpg', 'bodas', true),
  ('22', 'Ramos para Damas de Honor', 'Set de ramos para damas de honor con rosas rosas y blancas con eucalipto. Precio por pieza.', 800, 12, '/src/assets/products/ramos-damas-honor.jpg', 'bodas', true),
  ('23', 'Decoración Banca de Iglesia', 'Arreglo floral para banca de iglesia con rosas blancas, follaje y moños de tul. Precio por pieza.', 450, 20, '/src/assets/products/decoracion-banca-iglesia.jpg', 'bodas', true),
  ('24', 'Centro Alto de Alcatraces', 'Elegante centro de mesa alto con alcatraces blancos, cristales colgantes y flores sumergidas.', 3200, 4, '/src/assets/products/centro-alto-alcatraces.jpg', 'bodas', true),
  ('25', 'Camino de Pétalos', 'Decoración de pasillo con pétalos de rosa rojos y blancos para ceremonia. Cubre 10 metros.', 1500, 6, '/src/assets/products/camino-petalos.jpg', 'bodas', true),
  ('26', 'Decoración Floral para Pastel', 'Decoración cascading de rosas blancas y nube para pastel de bodas de 3 a 5 pisos.', 1800, 5, '/src/assets/products/decoracion-pastel-boda.jpg', 'bodas', true),
  ('27', 'Ramo de Peonías Novia', 'Romántico ramo de novia con peonías blancas y blush, forma redonda clásica con listones de seda.', 2800, 3, '/src/assets/products/ramo-peonias-novia.jpg', 'bodas', true),
  ('28', 'Decoración Mesa de Novios', 'Decoración completa para mesa de novios con arreglo floral, candelabros dorados y telas.', 5500, 2, '/src/assets/products/mesa-novios-decoracion.jpg', 'bodas', true),
  ('29', 'Canasta para Paje', 'Encantadora canasta de mimbre decorada con rosas blancas y pétalos para el paje de la boda.', 550, 10, '/src/assets/products/canasta-paje.jpg', 'bodas', true),
  ('30', 'Decoración Auto de Boda', 'Arreglo floral para auto de boda con rosas blancas, tul y moños elegantes.', 1200, 6, '/src/assets/products/decoracion-auto-boda.jpg', 'bodas', true)
ON CONFLICT (id) DO NOTHING;