<?php

// ini_set('display_errors', 1);
// error_reporting(E_ALL);


require_once 'config.php'; 
require 'mailer.php';


$query = $conn->query("SELECT DISTINCT google_id, email FROM users");

while ($user = $query->fetch_assoc()) {
    $email = $user['email'];
    $name = explode('@', $email)[0]; 

    $subject = "Daily Expense Tracker Reminder";
    $body = "
        <p>Hi <strong>$name</strong>,</p>
        <p>This is your daily reminder to record your expenses or check your calendar!</p>
        <p>Keep tracking your finances 📊</p>
        <p><a href='http://localhost/exp_trial_2/index.php'>Open Expense Tracker</a></p>
        <br>
        <p>– Your Expense Tracker Bot</p>
    ";

    $result = sendMail($email, $subject, $body);

    if ($result) {
        echo "✅ Mail sent to $email<br>";
    } else {
        echo "❌ Failed to send mail to $email<br>";
    }
}