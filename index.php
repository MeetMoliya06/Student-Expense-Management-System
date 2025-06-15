<?php
session_start();

// Check if user is logged in
if(!isset($_SESSION['user_email_address'])) {
    header('Location: login.php');
    exit();
}

$user_name = $_SESSION['user_first_name'] . ' ' . $_SESSION['user_last_name'];
$user_email = $_SESSION['user_email_address'];
$user_image = $_SESSION['user_image'];

// echo $user_image;

?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Expense Tracker</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <!-- User Profile Section -->
        <div class="user-profile">
            <img src="<?php echo htmlspecialchars($user_image); ?>" alt="Profile" class="profile-image">
            <div class="user-info">
                <h2><?php echo htmlspecialchars($user_name); ?></h2>
                <p><?php echo htmlspecialchars($user_email); ?></p>
            </div>
            <a href="logout.php" class="logout-btn">Logout</a>
        </div>

        <!-- Header Section -->
        <header class="header animate-fade-in">
            <h1>Expense Tracker</h1>
            <select id="dateFilter" class="date-filter">
                <option value="thisMonth">This Month</option>
                <option value="lastMonth">Last Month</option>
                <option value="thisYear">This Year</option>
            </select>
        </header>

        <!-- Summary Cards -->
        <div class="summary-cards animate-slide-in">
            <div class="card expense-card">
                <div class="card-icon">💰</div>
                <div class="card-content">
                    <h3>Expenses</h3>
                    <p id="totalExpense">₹0.00</p>
                </div>
            </div>
            <div class="card income-card">
                <div class="card-icon">📈</div>
                <div class="card-content">
                    <h3>Income</h3>
                    <p id="totalIncome">₹0.00</p>
                </div>
            </div>
            <div class="card balance-card">
                <div class="card-icon">⚖️</div>
                <div class="card-content">
                    <h3>Balance</h3>
                    <p id="totalBalance">₹0.00</p>
                </div>
            </div>
        </div>

        <!-- Transaction Type Toggle -->
        <div class="transaction-toggle animate-fade-in">
            <button class="toggle-btn active" data-type="expense">Expense</button>
            <button class="toggle-btn" data-type="income">Income</button>
        </div>

        <!-- Category Grid -->
        <div class="category-grid animate-fade-in">
            <!-- Categories will be dynamically populated -->
        </div>

        <!-- Transaction Form -->
        <form id="transactionForm" class="transaction-form animate-slide-in">
            <div class="form-group">
                <label for="amount">Amount (₹)</label>
                <input type="number" id="amount" required min="0" step="0.01">
            </div>
            <div class="form-group">
                <label for="date">Date</label>
                <input type="date" id="date" required>
            </div>
            <button type="submit" class="submit-btn">Add Transaction</button>
        </form>

        <!-- Transaction List -->
        <div class="transaction-list animate-fade-in">
            <h2>Recent Transactions</h2>
            <div id="transactionContainer"></div>
        </div>

        <!-- Pie Chart Container -->
<div class="pie-chart-container" style="display: none;">
    <!-- Add the new chart-header div right here, at the start of pie-chart-container -->
    <div class="chart-header">
        <h2>Expense Analysis</h2>
        <button id="downloadCSV" class="download-btn">
            <span>📥</span> Download CSV
        </button>
    </div>
    <div class="chart-wrapper">
        <canvas id="pieChart"></canvas>
    </div>
</div>
<div class="calendar-view-container" style="display: none;">
    <div class="calendar-header">
        <h2>Calendar View</h2>
        <div class="month-selector">
            <button id="prevMonth" class="month-btn">←</button>
            <h3 id="currentMonth">January 2025</h3>
            <button id="nextMonth" class="month-btn">→</button>
        </div>
    </div>
    <div id="calendarGrid"></div>
</div>

        <!-- Navigation -->
        <nav class="nav-bar">
            <button class="nav-item active" data-tab="input">
                <span class="nav-icon">➕</span>
                <span>Input</span>
            </button>
            <button class="nav-item" data-tab="analysis">
                <span class="nav-icon">📊</span>
                <span>Analysis</span>
            </button>
            <button class="nav-item" data-tab="calendar">
                <span class="nav-icon">📅</span>
                <span>Calendar</span>
            </button>
            <button class="nav-item" data-tab="settings">
                <span class="nav-icon">⚙️</span>
                <span>Settings</span>
            </button>
        </nav>
    </div>
    <script src="test.js"> </script>
</body>
</html>
