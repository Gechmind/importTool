CREATE TABLE `mp` (
  `CODE` varchar(200) DEFAULT NULL,
  `NAME` varchar(1000) DEFAULT NULL,
  `title` varchar(1000) DEFAULT NULL,
  `catecode` bigint(20) DEFAULT NULL,
  `catename` varchar(200) DEFAULT NULL,
  `brandname` varchar(200) DEFAULT NULL,
  `attr` text,
  `price` float(12,2) DEFAULT NULL,
  `mkprice` float(12,2) DEFAULT NULL,
  `urls` text,
  `content` longtext,
  `id` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;




CREATE TABLE `category` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` bigint(20) DEFAULT '0',
  `parentCode` bigint(20) DEFAULT NULL,
  `name` varchar(200) DEFAULT NULL,
  `url` varchar(1000) DEFAULT NULL,
  `LEAF` int(11) DEFAULT NULL,
  `level` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

