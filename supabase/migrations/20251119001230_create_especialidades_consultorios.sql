/*
  # Crear tablas de Especialidades y Consultorios

  1. Nuevas Tablas
    - `especialidades`
      - `id` (uuid, primary key)
      - `nombre` (text, unique)
      - `descripcion` (text)
      - `activa` (boolean)
      - `created_at` (timestamptz)
    
    - `consultorios`
      - `id` (uuid, primary key)
      - `numero` (text, unique)
      - `nombre` (text)
      - `ubicacion` (text)
      - `equipamiento` (text array)
      - `activo` (boolean)
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to read/write
*/

-- Create especialidades table
CREATE TABLE IF NOT EXISTS especialidades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text UNIQUE NOT NULL,
  descripcion text NOT NULL,
  activa boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create consultorios table
CREATE TABLE IF NOT EXISTS consultorios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero text UNIQUE NOT NULL,
  nombre text NOT NULL,
  ubicacion text NOT NULL,
  equipamiento text[] DEFAULT ARRAY[]::text[],
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE especialidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultorios ENABLE ROW LEVEL SECURITY;

-- Policies for especialidades
CREATE POLICY "Authenticated users can read especialidades"
  ON especialidades
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Empresa role can insert especialidades"
  ON especialidades
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Empresa role can update especialidades"
  ON especialidades
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Empresa role can delete especialidades"
  ON especialidades
  FOR DELETE
  TO authenticated
  USING (true);

-- Policies for consultorios
CREATE POLICY "Authenticated users can read consultorios"
  ON consultorios
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Empresa role can insert consultorios"
  ON consultorios
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Empresa role can update consultorios"
  ON consultorios
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Empresa role can delete consultorios"
  ON consultorios
  FOR DELETE
  TO authenticated
  USING (true);

-- Insert default especialidades
INSERT INTO especialidades (nombre, descripcion, activa) VALUES
  ('Medicina General', 'Atención médica general', true),
  ('Cardiología', 'Especialidad del corazón', true),
  ('Pediatría', 'Medicina infantil', true),
  ('Ginecología', 'Salud femenina', true),
  ('Dermatología', 'Enfermedades de la piel', true)
ON CONFLICT (nombre) DO NOTHING;

-- Insert default consultorios
INSERT INTO consultorios (numero, nombre, ubicacion, equipamiento, activo) VALUES
  ('101', 'Consultorio Principal', 'Primer Piso', ARRAY['Camilla', 'Tensiómetro', 'Estetoscopio'], true),
  ('102', 'Consultorio Cardiología', 'Primer Piso', ARRAY['ECG', 'Monitor Cardíaco'], true),
  ('201', 'Consultorio Pediatría', 'Segundo Piso', ARRAY['Báscula Pediátrica', 'Tallímetro'], true),
  ('202', 'Consultorio Ginecología', 'Segundo Piso', ARRAY['Mesa Ginecológica', 'Colposcopio'], true)
ON CONFLICT (numero) DO NOTHING;
