<?php

// ini_set ('display_errors', 1);
// error_reporting (E_ALL);

header('Content-Type: application/json');
require_once 'config.php';

session_start();

// Add error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Check if user is logged in
if (!isset($_SESSION['google_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit();
}

$google_id = $_SESSION['google_id'];

// GET: Fetch transactions
if ($_SERVER['REQUEST_METHOD'] === 'GET') {

    error_log("GET request received");    
    

    $stmt = $conn->prepare("SELECT id, google_id, type, category, CAST(amount AS DECIMAL(10,2)) as amount, transaction_date FROM transactions WHERE google_id = ? ORDER BY transaction_date DESC");
    $stmt->bind_param("s", $google_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $transactions = $result->fetch_all(MYSQLI_ASSOC);

    if (!$transactions) {
        echo json_encode([]);
        exit();
    }

    // Properly format date and amount
    $transactions = array_map(function($transaction) {
        $transaction['amount'] = floatval($transaction['amount']);
        $transaction['date'] = date(DATE_ISO8601, strtotime($transaction['transaction_date']));
        unset($transaction['transaction_date']);
        return $transaction;
    }, $transactions);

    echo json_encode($transactions);
    exit();
}

// POST: Create transaction
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (!$data) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON data']);
        exit();
    }

    if (!isset($data['type'], $data['category'], $data['amount'], $data['date'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields']);
        exit();
    }

    $amount = filter_var($data['amount'], FILTER_VALIDATE_FLOAT);
    if ($amount === false) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid amount']);
        exit();
    }

    try {
        $stmt = $conn->prepare("INSERT INTO transactions (google_id, type, category, amount, transaction_date) VALUES (?, ?, ?, ?, ?)");
        if (!$stmt) {
            throw new Exception($conn->error);
        }

        $stmt->bind_param("sssis",
            $google_id,
            $data['type'],
            $data['category'],
            $amount,
            $data['date']
        );

        if (!$stmt->execute()) {
            throw new Exception($stmt->error);
        }

        $data['id'] = $stmt->insert_id;
        $data['amount'] = floatval($amount);
        echo json_encode($data);

    } catch (Exception $e) {
        error_log('Database error: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
    exit();
}

// DELETE: Remove transaction
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'Transaction ID required']);
        exit();
    }

    $stmt = $conn->prepare("DELETE FROM transactions WHERE id = ? AND google_id = ?");
    $stmt->bind_param("is", $id, $google_id);

    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to delete transaction']);
    }
    exit();
}
?>