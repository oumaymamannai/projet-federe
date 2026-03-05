-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: localhost    Database: gradflow
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `documents`
--

DROP TABLE IF EXISTS `documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `documents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `titre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `fichier_path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('template','stage','general') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'general',
  `publie` tinyint(1) DEFAULT '0',
  `uploaded_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `uploaded_by` (`uploaded_by`),
  CONSTRAINT `documents_ibfk_1` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `documents`
--

LOCK TABLES `documents` WRITE;
/*!40000 ALTER TABLE `documents` DISABLE KEYS */;
INSERT INTO `documents` VALUES (1,'Guide de rédaction du rapport','Template officiel pour la rédaction du rapport de soutenance','uploads/template_rapport.pdf','template',1,1,'2026-03-01 15:57:53'),(6,'prisma','','1772715701222-130515027.docx','template',1,1,'2026-03-05 13:01:41'),(7,'guide','','1772716382421-624829618.pdf','stage',1,1,'2026-03-05 13:13:02');
/*!40000 ALTER TABLE `documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `periode_soutenances`
--

DROP TABLE IF EXISTS `periode_soutenances`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `periode_soutenances` (
  `id` int NOT NULL AUTO_INCREMENT,
  `date_debut` date NOT NULL,
  `date_fin` date NOT NULL,
  `salles` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `periode_soutenances`
--

LOCK TABLES `periode_soutenances` WRITE;
/*!40000 ALTER TABLE `periode_soutenances` DISABLE KEYS */;
INSERT INTO `periode_soutenances` VALUES (1,'2026-03-03','2026-04-04','[\"Salle A101\", \"Salle B203\", \"Amphi 1\"]','2026-03-02 11:26:25');
/*!40000 ALTER TABLE `periode_soutenances` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reclamations`
--

DROP TABLE IF EXISTS `reclamations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reclamations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `etudiant_id` int NOT NULL,
  `type` enum('probleme_date','pas_encadreur','autre') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `reponse` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `statut` enum('en_attente','traitee') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'en_attente',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `reponse_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `etudiant_id` (`etudiant_id`),
  CONSTRAINT `reclamations_ibfk_1` FOREIGN KEY (`etudiant_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reclamations`
--

LOCK TABLES `reclamations` WRITE;
/*!40000 ALTER TABLE `reclamations` DISABLE KEYS */;
INSERT INTO `reclamations` VALUES (1,5,'pas_encadreur','dd','Encadreur affecté: samir belhaj','traitee','2026-03-02 13:49:13','2026-03-02 14:29:53'),(2,5,'probleme_date','ll',NULL,'en_attente','2026-03-05 12:44:18',NULL);
/*!40000 ALTER TABLE `reclamations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `soutenance_jury`
--

DROP TABLE IF EXISTS `soutenance_jury`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `soutenance_jury` (
  `id` int NOT NULL AUTO_INCREMENT,
  `soutenance_id` int NOT NULL,
  `jury_id` int NOT NULL,
  `role` enum('encadreur','president','3eme_membre') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `note` decimal(4,2) DEFAULT NULL,
  `remarques` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `soutenance_id` (`soutenance_id`),
  KEY `jury_id` (`jury_id`),
  CONSTRAINT `soutenance_jury_ibfk_1` FOREIGN KEY (`soutenance_id`) REFERENCES `soutenances` (`id`) ON DELETE CASCADE,
  CONSTRAINT `soutenance_jury_ibfk_2` FOREIGN KEY (`jury_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `soutenance_jury`
--

LOCK TABLES `soutenance_jury` WRITE;
/*!40000 ALTER TABLE `soutenance_jury` DISABLE KEYS */;
INSERT INTO `soutenance_jury` VALUES (1,1,11,'encadreur',NULL,NULL),(4,1,2,'president',16.00,'tres bien'),(5,1,3,'3eme_membre',NULL,NULL),(6,2,3,'encadreur',NULL,NULL),(7,2,9,'president',NULL,NULL),(8,2,11,'3eme_membre',NULL,NULL);
/*!40000 ALTER TABLE `soutenance_jury` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `soutenances`
--

DROP TABLE IF EXISTS `soutenances`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `soutenances` (
  `id` int NOT NULL AUTO_INCREMENT,
  `etudiant_id` int NOT NULL,
  `sujet` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_soutenance` datetime DEFAULT NULL,
  `salle` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `statut` enum('en_attente','planifiee','terminee') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'en_attente',
  `note_finale` decimal(4,2) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `encadreur_fige` tinyint(1) DEFAULT '0',
  `encadreur_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `etudiant_id` (`etudiant_id`),
  KEY `encadreur_id` (`encadreur_id`),
  CONSTRAINT `soutenances_ibfk_1` FOREIGN KEY (`etudiant_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `soutenances_ibfk_2` FOREIGN KEY (`encadreur_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `soutenances`
--

LOCK TABLES `soutenances` WRITE;
/*!40000 ALTER TABLE `soutenances` DISABLE KEYS */;
INSERT INTO `soutenances` VALUES (1,5,'ljbbj','2026-03-03 09:00:00','Salle A101','terminee',16.00,'2026-03-02 12:24:00',1,NULL),(2,6,'ia','2026-03-03 10:30:00','Salle B203','planifiee',NULL,'2026-03-02 12:24:00',1,NULL),(3,7,'','2026-03-03 14:00:00','Amphi 1','planifiee',NULL,'2026-03-02 12:24:00',0,NULL);
/*!40000 ALTER TABLE `soutenances` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stage_soumissions`
--

DROP TABLE IF EXISTS `stage_soumissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stage_soumissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `etudiant_id` int NOT NULL,
  `nom_etudiant` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `prenom_etudiant` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email_contact` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `encadreur` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `societe` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sujet` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `fichiers` json DEFAULT NULL,
  `fichier_path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `statut` enum('soumis','traite') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'soumis',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `etudiant_id` (`etudiant_id`),
  CONSTRAINT `stage_soumissions_ibfk_1` FOREIGN KEY (`etudiant_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stage_soumissions`
--

LOCK TABLES `stage_soumissions` WRITE;
/*!40000 ALTER TABLE `stage_soumissions` DISABLE KEYS */;
INSERT INTO `stage_soumissions` VALUES (2,6,'youcef','kaci','etudiant2@gradflow.dz','Sara Meziane','vermeg','ia','hhhh','[\"1772547143430-803508540.pdf\", \"1772547143437-561918551.pdf\"]',NULL,'traite','2026-03-03 14:12:23'),(3,7,'Sara ','Meziane','etudiant3@gradflow.dz','Youcef Kaci','Sofrecom','Développement d\'un site web','','[\"1772565750765-375821652.pdf\", \"1772565750779-652046182.docx\", \"1772565750779-728158413.pdf\"]',NULL,'soumis','2026-03-03 19:22:30'),(4,5,'benali','amina','etudiant1@gradflow.dz','salma masmoudi','Sofrecom','développement mobile','','[\"1772713885709-782400646.docx\", \"1772713885711-669135773.docx\"]',NULL,'soumis','2026-03-05 12:31:25');
/*!40000 ALTER TABLE `stage_soumissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nom` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `prenom` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('etudiant','jury','admin') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'etudiant',
  `specialite` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Admin','GradFlow','admin@gradflow.dz','$2a$12$B/gAzP5MEw8MUGJkd0YMwufKFkT2jQ27yoM5WOSg/9UWG8tS/gPFa','admin',NULL,'2026-03-01 15:57:53'),(2,'Hadj','Karim','jury1@gradflow.dz','$2a$12$B/gAzP5MEw8MUGJkd0YMwufKFkT2jQ27yoM5WOSg/9UWG8tS/gPFa','jury',NULL,'2026-03-01 15:57:53'),(3,'Meziane','Sara','jury2@gradflow.dz','$2a$12$B/gAzP5MEw8MUGJkd0YMwufKFkT2jQ27yoM5WOSg/9UWG8tS/gPFa','jury',NULL,'2026-03-01 15:57:53'),(4,'Kaci','Youcef','jury3@gradflow.dz','$2a$12$B/gAzP5MEw8MUGJkd0YMwufKFkT2jQ27yoM5WOSg/9UWG8tS/gPFa','jury',NULL,'2026-03-01 15:57:53'),(5,'Benali','Amina','etudiant1@gradflow.dz','$2a$12$B/gAzP5MEw8MUGJkd0YMwufKFkT2jQ27yoM5WOSg/9UWG8tS/gPFa','etudiant',NULL,'2026-03-01 15:57:53'),(6,'Kaci','Youcef','etudiant2@gradflow.dz','$2a$12$B/gAzP5MEw8MUGJkd0YMwufKFkT2jQ27yoM5WOSg/9UWG8tS/gPFa','etudiant',NULL,'2026-03-01 15:57:53'),(7,'Meziane','Sara','etudiant3@gradflow.dz','$2a$12$B/gAzP5MEw8MUGJkd0YMwufKFkT2jQ27yoM5WOSg/9UWG8tS/gPFa','etudiant',NULL,'2026-03-01 15:57:53'),(8,'masmoudi','salma','salma@gradflow.dz','$2a$12$y/S9jqs8ToABtzF38F6n7ueJUXOqz2OjxY.n8XQDivoSeiRp2sAau','jury',NULL,'2026-03-02 10:06:19'),(9,'ayari','fatma','fatma@gradflow.dz','$2a$12$y/S9jqs8ToABtzF38F6n7ueJUXOqz2OjxY.n8XQDivoSeiRp2sAau','jury',NULL,'2026-03-02 10:06:44'),(11,'belhaj','samir','samir@gradflow.dz','$2a$12$y/S9jqs8ToABtzF38F6n7ueJUXOqz2OjxY.n8XQDivoSeiRp2sAau','jury',NULL,'2026-03-02 10:07:05');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-05 14:39:22
