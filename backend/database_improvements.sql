-- Script SQL pour améliorer la structure de la base de données
-- Ajout des colonnes manquantes à la table tontines

-- 1. Ajouter la colonne creator_id
ALTER TABLE tontines ADD COLUMN creator_id INT;

-- 2. Ajouter la colonne created_at avec valeur par défaut
ALTER TABLE tontINEs ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 3. Ajouter une contrainte de clé étrangère pour creator_id (optionnel)
-- ALTER TABLE tontines 
-- ADD CONSTRAINT fk_tontines_creator 
-- FOREIGN KEY (creator_id) REFERENCES users(id);

-- 4. Vérifier la structure de la table
-- DESCRIBE tontines; 