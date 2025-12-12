-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Dec 12, 2025 at 02:03 AM
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
-- Table structure for table `clients`
--

CREATE TABLE `clients` (
  `id` int(11) NOT NULL,
  `clientName` varchar(255) NOT NULL,
  `truckType` varchar(255) NOT NULL,
  `plateNumber` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `clients`
--

INSERT INTO `clients` (`id`, `clientName`, `truckType`, `plateNumber`) VALUES
(5, 'Arrowgo', '10 Wheel', 'ASDQ 1313'),
(6, 'Nippon', '6W', '2558'),
(7, 'NIPON', 'EV01', 'LKJ098'),
(8, 'Toyota', 'EV 01', 'aasd123'),
(9, 'Arrowgo', 'adaad', '1234');

-- --------------------------------------------------------

--
-- Table structure for table `trucks`
--

CREATE TABLE `trucks` (
  `id` int(11) NOT NULL,
  `clientName` varchar(255) NOT NULL,
  `truckType` varchar(255) NOT NULL,
  `plateNumber` varchar(50) NOT NULL,
  `bay` varchar(10) DEFAULT NULL,
  `driver` varchar(255) DEFAULT NULL,
  `purpose` varchar(255) DEFAULT NULL,
  `date` date DEFAULT NULL,
  `timeIn` varchar(10) DEFAULT NULL,
  `timeOut` varchar(10) DEFAULT NULL,
  `duration` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `trucks`
--

INSERT INTO `trucks` (`id`, `clientName`, `truckType`, `plateNumber`, `bay`, `driver`, `purpose`, `date`, `timeIn`, `timeOut`, `duration`) VALUES
(18, 'Arrowgo', '10 Wheel', 'ASDQ 1313', '1a', 'ARBEN', 'pickup', '2025-12-06', '10:16 AM', '11:45 AM', 'NaNh NaNm'),
(19, 'Nippon', '6W', '2558', '6b', 'rtrt', 'jjkkj', '2025-12-06', '11:43 AM', '11:45 AM', 'NaNh NaNm'),
(20, 'Arrowgo', '10 Wheel', 'ASDQ 1313', '6b', 'jc', 'Inquire', '2025-12-06', '03:07 PM', '04:19 PM', 'NaNh NaNm'),
(21, 'Arrowgo', '10 Wheel', 'ASDQ 1313', '1a', 'arben', 'pick up', '2025-12-11', '11:02 AM', NULL, NULL),
(22, 'Toyota', 'EV 01', 'aasd123', '1b', 'JC', 'pickup', '2025-12-11', '11:13 AM', '11:17 AM', 'NaNh NaNm'),
(23, 'Arrowgo', '10 Wheel', 'ASDQ 1313', '1b', 'jc', 'Inquire', '2025-12-11', '11:44 AM', '11:47 AM', 'NaNh NaNm');

-- --------------------------------------------------------

--
-- Table structure for table `truck_types`
--

CREATE TABLE `truck_types` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL
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
  `vehicleMode` varchar(50) DEFAULT 'On Foot',
  `vehicleDetails` varchar(255) DEFAULT NULL,
  `date` date NOT NULL,
  `timeIn` varchar(10) DEFAULT NULL,
  `timeOut` varchar(10) DEFAULT NULL,
  `appointmentRequest` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `visitors`
--

INSERT INTO `visitors` (`id`, `visitorName`, `company`, `personToVisit`, `purpose`, `idType`, `idNumber`, `badgeNumber`, `vehicleMode`, `vehicleDetails`, `date`, `timeIn`, `timeOut`, `appointmentRequest`) VALUES
(1, 'Arben', 'Toyota', 'Sir James', 'Inquire', 'PhilHealth ID', 'adasd', '13', 'On Foot', '', '2025-12-09', '11:21 AM', '11:21 AM', 0),
(2, 'Arben', 'Toyota', 'Sir James Bautista', 'Inquire', 'Driver\'s License', '12313', NULL, 'On Foot', NULL, '2025-12-09', '12:00', '10:31 AM', 0),
(3, 'JC', 'Nipon', 'Sir James Bautista', 'Inquire', 'TIN ID', 'ASDAD', NULL, 'On Foot', NULL, '2025-12-10', '12:18', '10:37 AM', 0),
(4, 'jeper', 'asdad', 'adad', 'dasad', 'SSS ID', 'adada', '1', 'On Foot', NULL, '2025-12-08', '16:00', '10:44 AM', 0),
(5, 'Arben', 'Toyota', 'Sir James Bautista', 'Inquire', 'PhilHealth ID', 'ada', NULL, 'On Foot', NULL, '2025-12-10', '10:51 AM', '10:54 AM', 0),
(9, 'Owen', 'adasd', 'das', 'dsdqa', 'Driver\'s License', 'qasads', '12', 'On Foot', '', '2025-12-09', '11:11 AM', '11:31 AM', 0),
(10, 'Luis', 'asda', 'das', 'sad', 'PhilHealth ID', 'ada', '13', 'On Foot', '', '2025-12-09', '11:11 AM', '11:31 AM', 0),
(16, 'Arben', 'Toyota', 'Sir James Bautista', 'Inquire', NULL, NULL, NULL, 'On Foot', NULL, '2025-12-10', '11:09 AM', '11:10 AM', 0),
(17, 'Arben', 'Rebisco', 'Sir James Bautista', 'Inquire', 'Other', '123456', '1', 'On Foot', '', '2025-12-11', '11:19 AM', '', 0),
(18, 'JC ', 'Toyota', 'Sir James Bautista', 'Inquire', NULL, NULL, NULL, 'On Foot', NULL, '2025-12-12', '11:23 AM', NULL, 0),
(19, 'MARK', 'Toyota', 'Sir James Bautista', 'Inquire', NULL, NULL, NULL, 'On Foot', NULL, '2025-12-11', '11:49 AM', NULL, 0),
(20, 'JC', 'Nipon', 'Sir James Bautista', 'Inquire', 'PhilHealth ID', '65456', '1', 'Motorcycle', 'ADAD', '2025-12-11', '11:49 AM', '', 0);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `clients`
--
ALTER TABLE `clients`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `plateNumber` (`plateNumber`);

--
-- Indexes for table `trucks`
--
ALTER TABLE `trucks`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `truck_types`
--
ALTER TABLE `truck_types`
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
-- AUTO_INCREMENT for table `clients`
--
ALTER TABLE `clients`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `trucks`
--
ALTER TABLE `trucks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `truck_types`
--
ALTER TABLE `truck_types`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `visitors`
--
ALTER TABLE `visitors`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
