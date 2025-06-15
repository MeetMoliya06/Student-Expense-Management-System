<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

$host = 'localhost';
$db_user = 'root';
$db_pass = ''; // Empty password for XAMPP by default
$db_name = 'exp_test';

$conn = new mysqli($host, $db_user, $db_pass, $db_name);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
} else {
    echo "Connected successfully!";
}
?>