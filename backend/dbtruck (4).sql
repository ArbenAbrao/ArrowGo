-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 12, 2026 at 11:34 AM
-- Server version: 10.4.22-MariaDB
-- PHP Version: 8.1.2

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `dbtruck`
--

-- --------------------------------------------------------

--
-- Table structure for table `accounts`
--

CREATE TABLE `accounts` (
  `id` int(11) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('User','Admin','IT') NOT NULL,
  `branch` enum('Marilao','Taguig','Palawan','Davao','Cebu') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `last_active` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `accounts`
--

INSERT INTO `accounts` (`id`, `first_name`, `last_name`, `email`, `username`, `password`, `role`, `branch`, `created_at`, `last_active`, `is_active`) VALUES
(1, 'Arben', 'Abrao', 'arbenabrao123@gmail.com', 'arben_dpo', '$2b$10$WKAT79mp1iuqMcZNbXZf4uQaAmkUMLYJlAssjF6ARiDWALQBq2g1i', 'IT', 'Taguig', '2026-01-27 03:29:02', '2026-02-12 09:16:39', 1),
(2, 'Admin', 'Try', 'kwekong123@gmail.com', 'Admin01', '$2b$10$WHjJa.2WO0xfFLDTYF.NgeoERVE1s80U4gmGchhl74yvcciE/oEUi', 'IT', 'Taguig', '2026-02-12 09:33:27', NULL, 1);

-- --------------------------------------------------------

--
-- Table structure for table `appointments`
--

CREATE TABLE `appointments` (
  `id` int(11) NOT NULL,
  `visitor_name` varchar(100) NOT NULL,
  `company` varchar(100) DEFAULT NULL,
  `person_to_visit` varchar(100) NOT NULL,
  `purpose` text NOT NULL,
  `appointment_date` datetime NOT NULL,
  `branch` varchar(50) NOT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `appointment_requests`
--

CREATE TABLE `appointment_requests` (
  `id` int(11) NOT NULL,
  `visitor_name` varchar(255) NOT NULL,
  `company` varchar(255) DEFAULT NULL,
  `person_to_visit` varchar(255) NOT NULL,
  `purpose` text NOT NULL,
  `date` date DEFAULT NULL,
  `schedule_time` varchar(8) DEFAULT NULL,
  `branch` varchar(255) NOT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `branches`
--

CREATE TABLE `branches` (
  `id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `branches`
--

INSERT INTO `branches` (`id`, `name`, `created_at`) VALUES
(1, 'Taguig', '2026-01-31 02:51:05'),
(2, 'Marilao', '2026-01-31 02:51:50'),
(3, 'Cebu', '2026-01-31 02:51:55'),
(4, 'Palawan', '2026-01-31 02:52:01'),
(5, 'Davao', '2026-01-31 02:52:05');

-- --------------------------------------------------------

--
-- Table structure for table `branch_clients`
--

CREATE TABLE `branch_clients` (
  `id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `branch_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `clients`
--

CREATE TABLE `clients` (
  `id` int(11) NOT NULL,
  `clientName` varchar(255) NOT NULL,
  `branchRegistered` varchar(50) DEFAULT NULL,
  `truckType` varchar(255) NOT NULL,
  `plateNumber` varchar(100) NOT NULL,
  `qr_code` varchar(255) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `qrCode` longblob DEFAULT NULL,
  `brandName` varchar(100) DEFAULT NULL,
  `model` varchar(100) DEFAULT NULL,
  `fuelType` varchar(50) DEFAULT NULL,
  `displacement` varchar(50) DEFAULT NULL,
  `payloadCapacity` varchar(50) DEFAULT NULL,
  `imageUrl` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `login_logs`
--

CREATE TABLE `login_logs` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `username_or_email` varchar(255) DEFAULT NULL,
  `status` enum('SUCCESS','FAILED','LOGOUT') NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `location` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `request-truck`
--

CREATE TABLE `request-truck` (
  `id` int(11) NOT NULL,
  `plate_number` varchar(50) NOT NULL,
  `truck_type` varchar(50) NOT NULL,
  `client_name` varchar(100) NOT NULL,
  `brand_name` varchar(50) DEFAULT NULL,
  `model` varchar(50) DEFAULT NULL,
  `fuel_type` varchar(50) DEFAULT NULL,
  `displacement` varchar(50) DEFAULT NULL,
  `payload_capacity` varchar(50) DEFAULT NULL,
  `branch` varchar(50) NOT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `request_truck`
--

CREATE TABLE `request_truck` (
  `id` int(11) NOT NULL,
  `plate_number` varchar(50) NOT NULL,
  `truck_type` varchar(50) NOT NULL,
  `client_name` varchar(100) NOT NULL,
  `brand_name` varchar(100) NOT NULL,
  `model` varchar(100) NOT NULL,
  `fuel_type` varchar(50) NOT NULL,
  `displacement` int(11) NOT NULL,
  `payload_capacity` varchar(50) NOT NULL,
  `branch` varchar(100) NOT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `trucks`
--

CREATE TABLE `trucks` (
  `id` int(11) NOT NULL,
  `clientName` varchar(255) NOT NULL,
  `branchRegistered` varchar(100) DEFAULT NULL,
  `truckType` varchar(255) NOT NULL,
  `plateNumber` varchar(50) NOT NULL,
  `bay` varchar(10) DEFAULT NULL,
  `driver` varchar(255) DEFAULT NULL,
  `purpose` varchar(255) DEFAULT NULL,
  `date` date DEFAULT NULL,
  `timeIn` varchar(10) DEFAULT NULL,
  `timeOut` varchar(10) DEFAULT NULL,
  `timeOutDate` date DEFAULT NULL,
  `duration` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `visitors`
--

CREATE TABLE `visitors` (
  `id` int(10) UNSIGNED NOT NULL,
  `visitorName` varchar(255) NOT NULL,
  `company` varchar(255) DEFAULT NULL,
  `personToVisit` varchar(255) DEFAULT NULL,
  `purpose` varchar(255) DEFAULT NULL,
  `idType` varchar(50) DEFAULT NULL,
  `idNumber` varchar(50) DEFAULT NULL,
  `badgeNumber` varchar(50) DEFAULT NULL,
  `branch` varchar(100) DEFAULT NULL,
  `vehicleMode` varchar(50) DEFAULT 'On Foot',
  `vehicleDetails` varchar(255) DEFAULT NULL,
  `date` date DEFAULT NULL,
  `timeIn` varchar(10) DEFAULT NULL,
  `timeOut` varchar(10) DEFAULT NULL,
  `appointmentRequest` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `accounts`
--
ALTER TABLE `accounts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indexes for table `appointments`
--
ALTER TABLE `appointments`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `appointment_requests`
--
ALTER TABLE `appointment_requests`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `branches`
--
ALTER TABLE `branches`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `branch_clients`
--
ALTER TABLE `branch_clients`
  ADD PRIMARY KEY (`id`),
  ADD KEY `branch_id` (`branch_id`);

--
-- Indexes for table `clients`
--
ALTER TABLE `clients`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `plateNumber` (`plateNumber`);

--
-- Indexes for table `login_logs`
--
ALTER TABLE `login_logs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `request-truck`
--
ALTER TABLE `request-truck`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `request_truck`
--
ALTER TABLE `request_truck`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `trucks`
--
ALTER TABLE `trucks`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `visitors`
--
ALTER TABLE `visitors`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `accounts`
--
ALTER TABLE `accounts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `appointments`
--
ALTER TABLE `appointments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `appointment_requests`
--
ALTER TABLE `appointment_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `branches`
--
ALTER TABLE `branches`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `branch_clients`
--
ALTER TABLE `branch_clients`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `clients`
--
ALTER TABLE `clients`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `login_logs`
--
ALTER TABLE `login_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `request-truck`
--
ALTER TABLE `request-truck`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `request_truck`
--
ALTER TABLE `request_truck`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `trucks`
--
ALTER TABLE `trucks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `visitors`
--
ALTER TABLE `visitors`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `branch_clients`
--
ALTER TABLE `branch_clients`
  ADD CONSTRAINT `branch_clients_ibfk_1` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
